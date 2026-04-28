import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createServer } from "http";
import "dotenv/config";
import admin from "firebase-admin";
import { createApiRouter } from "./src/api/routes.ts";

// Initialize Firebase Admin lazily/conditionally
let adminApp: admin.app.App | null = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.warn("Failed to initialize Firebase Admin (check FIREBASE_SERVICE_ACCOUNT):", error.message);
  }
}

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
    socket.on("join-chat", (chatId) => socket.join(chatId));
    socket.on("send-message", (msg) => io.to(msg.chatId).emit("receive-message", msg));
  });

  // Performance/API logging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API Request] ${new Date().toISOString()} ${req.method} ${req.path} (x-user-id: ${req.headers['x-user-id']})`);
    }
    next();
  });

  app.use(express.json());

  // Test route on main app
  app.get("/api-test", (req, res) => {
    res.json({ message: "API server is healthy", supabaseConfigured: !!process.env.VITE_SUPABASE_URL });
  });

  // Mount API router
  app.use("/api", createApiRouter(adminApp ? adminApp.firestore() : null));

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
