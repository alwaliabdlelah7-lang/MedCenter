import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { Server } from "socket.io";
import { createServer } from "http";
import fs from "fs";
import "dotenv/config";
import { createApiRouter } from "./src/api/routes.ts";
import { performSeeding } from "./src/api/seeding.ts";

import { getFirestore } from "firebase-admin/firestore";

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
      console.log(`[API Request] ${new Date().toISOString()} ${req.method} ${req.path}`);
      console.log(`[Headers] x-user-id: ${req.headers['x-user-id']}`);
    }
    next();
  });

  app.use(express.json());

  // Test route on main app
  app.get("/api-test", (req, res) => {
    console.log("[Direct] GET /api-test hit");
    res.json({ message: "Direct API route works", dbInitialized: !!db });
  });

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountVar) {
    console.warn("[Firebase] FIREBASE_SERVICE_ACCOUNT env var missing. Cloud features may be limited.");
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log("[Firebase] Admin initialized.");
      }
    } catch (error) {
      console.error("[Firebase] Initialization error:", error);
    }
  }

  let db: admin.firestore.Firestore | null = null;
  if (admin.apps.length > 0) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.firestoreDatabaseId) {
          db = getFirestore(admin.app(), config.firestoreDatabaseId) as any;
        } else {
          db = getFirestore() as any;
        }
      } else {
        db = getFirestore() as any;
      }
    } catch (error) {
      console.error("[Firebase] Firestore init error:", error);
    }
  }

  // Auto-seed on startup
  if (db) {
    performSeeding(db).then(res => {
      if (res.success) console.log("Automatic database seeding completed.");
    });
  }

  // Mount API router
  app.use("/api", createApiRouter(db));

  // Catch unmatched /api calls before SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
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
