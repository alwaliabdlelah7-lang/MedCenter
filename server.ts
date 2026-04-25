import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { Server } from "socket.io";
import { createServer } from "http";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = 3000;

  // Socket.io initialization
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("send-message", (msg) => {
      io.to(msg.chatId).emit("receive-message", msg);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Performance/API logging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });

  app.use(express.json());

  // Define API Router
  const apiRouter = express.Router();

  // Health check
  apiRouter.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      firebase: !!db, 
      timestamp: new Date().toISOString(),
      dbType: db ? "initialized" : "null"
    });
  });

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountVar) {
    console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT environment variable is NOT defined.");
    console.error("Please set up Firebase using the 'set_up_firebase' tool to enable cloud features.");
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully.");
      }
    } catch (error) {
      console.error("Failed to parse or initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT:", error);
    }
  }

  let db: admin.firestore.Firestore | null = null;
  if (admin.apps.length > 0) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.firestoreDatabaseId) {
          db = admin.firestore(config.firestoreDatabaseId);
          console.log(`Using dedicated Firestore database ID: ${config.firestoreDatabaseId}`);
        } else {
          db = admin.firestore();
          console.log("Using default Firestore database.");
        }
      } else {
        db = admin.firestore();
        console.log("firebase-applet-config.json not found, using default Firestore database.");
      }
    } catch (error) {
      console.error("Error setting up Firestore DB instance:", error);
      // Fallback to default if dedicated fails
      try {
        db = admin.firestore();
      } catch (e) {
        console.error("Total failure to initialize Firestore:", e);
      }
    }
  }

  // Seeding logic extracted for automatic and manual use
  async function performSeeding() {
    if (!db) return { success: false, error: "Firebase not initialized" };
    try {
      const { 
        INITIAL_DEPARTMENTS, 
        INITIAL_CLINICS, 
        INITIAL_DOCTORS, 
        INITIAL_PATIENTS,
        INITIAL_USERS,
        INITIAL_NURSES,
        INITIAL_OPERATIONS,
        YEMEN_SERVICES,
        YEMEN_LAB_TESTS,
        YEMEN_MEDICINES
      } = await import("./src/data/seedData.ts");

      const seedTask = async (collection: string, data: any[]) => {
        const colRef = db!.collection(collection);
        const snapshot = await colRef.limit(1).get();
        if (snapshot.empty) {
          console.log(`Seeding ${collection}...`);
          const batch = db!.batch();
          data.forEach(item => {
            const docRef = item.id ? colRef.doc(item.id) : colRef.doc();
            batch.set(docRef, { ...item, createdAt: admin.firestore.FieldValue.serverTimestamp() });
          });
          await batch.commit();
        }
      };

      await Promise.all([
        seedTask("departments", INITIAL_DEPARTMENTS),
        seedTask("clinics", INITIAL_CLINICS),
        seedTask("doctors", INITIAL_DOCTORS),
        seedTask("patients", INITIAL_PATIENTS),
        seedTask("users", INITIAL_USERS),
        seedTask("nurses", INITIAL_NURSES),
        seedTask("operations", INITIAL_OPERATIONS),
        seedTask("services", YEMEN_SERVICES),
        seedTask("master_lab_tests", YEMEN_LAB_TESTS),
        seedTask("master_medicines", YEMEN_MEDICINES),
      ]);
      return { success: true };
    } catch (error) {
      console.error("Seeding error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Auto-seed on startup
  if (db) {
    performSeeding().then(res => {
      if (res.success) console.log("Automatic database seeding/checking completed.");
    });
  }

  // Admin Seed Route (keeping for manual trigger)
  apiRouter.post("/admin/seed", async (req, res) => {
    const result = await performSeeding();
    if (result.success) {
      res.json({ success: true, message: "Database seeded with initial clinical data" });
    } else {
      res.status(500).json({ error: result.error });
    }
  });

  // Generic API routes for the Healthcare System
  apiRouter.post("/admin/import/:collection", async (req, res) => {
    const { collection } = req.params;
    const items = req.body;
    
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    if (!Array.isArray(items)) return res.status(400).json({ error: "Body must be an array of objects" });

    console.log(`[API] Bulk importing ${items.length} items into ${collection}`);
    
    try {
      const batch = db.batch();
      const colRef = db.collection(collection);
      
      items.forEach(item => {
        const docRef = item.id ? colRef.doc(item.id) : colRef.doc();
        batch.set(docRef, {
          ...item,
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      res.json({ success: true, count: items.length });
    } catch (error) {
      console.error(`Error importing to ${collection}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  apiRouter.get("/:collection", async (req, res) => {
    const { collection } = req.params;
    console.log(`[API] GET collection: ${collection}`);
    if (!db) {
      return res.status(503).json({ error: "Firebase not initialized" });
    }
    try {
      const snapshot = await db.collection(collection).get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${collection}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  apiRouter.post("/:collection", async (req, res) => {
    const { collection } = req.params;
    console.log(`[API] POST collection: ${collection}`);
    if (!db) {
      return res.status(503).json({ error: "Firebase not initialized" });
    }
    try {
      const docRef = await db.collection(collection).add({
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ id: docRef.id });
    } catch (error) {
      console.error(`Error creating in ${collection}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  apiRouter.put("/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    console.log(`[API] PUT ${collection}/${id}`);
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const data = { ...req.body };
      delete data.id;
      delete data.createdAt;
      
      await db.collection(collection).doc(id).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error) {
      console.error(`Error updating ${collection}/${id}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  apiRouter.delete("/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    console.log(`[API] DELETE ${collection}/${id}`);
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      await db.collection(collection).doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting ${collection}/${id}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // API Catch-all to prevent falling through to Vite/SPA index.html
  apiRouter.all("*", (req, res) => {
    console.warn(`[API] Unhandled route inside router: ${req.method} ${req.path}`);
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
  });

  // Mount API router
  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
