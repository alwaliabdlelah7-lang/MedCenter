import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { Server } from "socket.io";
import { createServer } from "http";

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

  app.use(express.json());

  // Initialize Firebase Admin
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountVar) {
    console.warn("FIREBASE_SERVICE_ACCOUNT is not defined. Firebase features will be disabled.");
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
    }
  }

  const db = admin.apps.length ? admin.firestore() : null;

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
        YEMEN_SERVICES,
        YEMEN_LAB_TESTS,
        YEMEN_MEDICINES
      } = await import("./src/data/seedData.ts");

      const seedTask = async (collection: string, data: any[]) => {
        const colRef = db.collection(collection);
        const snapshot = await colRef.limit(1).get();
        if (snapshot.empty) {
          console.log(`Seeding ${collection}...`);
          const batch = db.batch();
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
  app.post("/api/admin/seed", async (req, res) => {
    const result = await performSeeding();
    if (result.success) {
      res.json({ success: true, message: "Database seeded with initial clinical data" });
    } else {
      res.status(500).json({ error: result.error });
    }
  });

  // Generic API routes for the Healthcare System
  app.get("/api/:collection", async (req, res) => {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const { collection } = req.params;
      const snapshot = await db.collection(collection).get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/:collection", async (req, res) => {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const { collection } = req.params;
      const docRef = await db.collection(collection).add({
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ id: docRef.id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/:collection/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const { collection, id } = req.params;
      await db.collection(collection).doc(id).update({
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/:collection/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const { collection, id } = req.params;
      await db.collection(collection).doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebase: !!db });
  });

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
