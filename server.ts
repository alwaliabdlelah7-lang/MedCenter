import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createServer } from "http";
import "dotenv/config";
import admin from "firebase-admin";
import { createApiRouter } from "./src/api/routes.ts";

// Initialize Firebase Admin lazily/conditionally
let adminApp: admin.app.App | null = null;
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountRaw) {
  try {
    // Attempt to handle both stringified JSON and potentially escaped strings
    let serviceAccount;
    if (serviceAccountRaw.startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } else {
      // Could be base64 if someone decided to pass it that way for safety
      try {
        serviceAccount = JSON.parse(Buffer.from(serviceAccountRaw, 'base64').toString());
      } catch {
        // Not base64, maybe it's just raw but doesn't start with { (unlikely)
        serviceAccount = JSON.parse(serviceAccountRaw);
      }
    }

    if (serviceAccount && serviceAccount.project_id) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`Firebase Admin initialized successfully (Project: ${serviceAccount.project_id})`);
    }
  } catch (error: any) {
    console.error("Critical error: Failed to parse FIREBASE_SERVICE_ACCOUNT. Check secret formatting.", error.message);
    // We don't exit(1) here to allow the server to start for diagnostics, but API calls requiring Admin will fail.
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting server implementation...");

async function startServer() {
  try {
    const app = express();
    const httpServer = createServer(app);
    const PORT = parseInt(process.env.PORT || '5000', 10);

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
      res.json({ message: "API server is healthy", cloudDatabaseConnected: !!adminApp });
    });

    // Mount API router
    app.use("/api", createApiRouter(adminApp ? adminApp.firestore() : null));

    // Catch unmatched /api calls before SPA fallback
    app.all("/api/*", (req, res) => {
      res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          allowedHosts: true,
          host: '0.0.0.0',
          // Disable HMR WebSocket — Replit's proxy doesn't support WS upgrades reliably
          hmr: false,
        },
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

    httpServer.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`[Server] Port ${PORT} is already in use. Another instance may be running.`);
        process.exit(1);
      } else {
        console.error("[Server] HTTP server error:", err);
        process.exit(1);
      }
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error during server setup:", err);
    throw err;
  }
}

startServer().catch(err => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
