import express from "express";
import path from "path";

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION AT TOP LEVEL:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION AT TOP LEVEL:', reason);
  process.exit(1);
});

import { Server } from "socket.io";
import { createServer } from "http";
import "dotenv/config";
import admin from "firebase-admin";
import { createApiRouter } from "./src/api/routes";

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

console.log("Starting server implementation...");

async function startServer() {
  try {
    const app = express();
    const httpServer = createServer(app);
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    
    console.log(`[Server] Attempting to start on port ${PORT}...`);

    // Socket.io initialization
    const io = new Server(httpServer, {
      cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
      socket.on("join-chat", (chatId) => socket.join(chatId));
      socket.on("send-message", (msg) => io.to(msg.chatId).emit("receive-message", msg));
      
      socket.on("broadcast-notification", (notif) => {
        socket.broadcast.emit("notification-received", notif);
      });
    });

    // Performance/API logging
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        console.log(`[API Request] ${new Date().toISOString()} ${req.method} ${req.path}`);
      }
      next();
    });

    app.use(express.json());

    // Simple health check for Cloud Run
    app.get("/health", (req, res) => {
      res.status(200).send("OK");
    });

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

    // Check if we have production assets built in dist directory
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    // Automatically use production static asset serving if index.html is present,
    // or if NODE_ENV is explicitly set to production.
    let isProduction = process.env.NODE_ENV === "production";
    try {
      const fs = await import('fs');
      if (fs.existsSync(indexPath)) {
        isProduction = true;
      }
    } catch (_) {}

    if (!isProduction) {
      console.log("[Server] Development mode detected. Loading Vite...");
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
        console.log("[Server] Vite middleware mounted.");
      } catch (e: any) {
        console.error("[Server] Failed to load Vite. Routing fallback to production assets.", e.message);
        isProduction = true;
      }
    }

    if (isProduction) {
      console.log(`[Production] Serving static files from: ${distPath}`);
      
      // Inline FS check for debugging
      try {
        const fs = await import('fs');
        if (fs.existsSync(indexPath)) {
          console.log(`[Production] index.html confirmed at: ${indexPath}`);
        } else {
          console.error(`[Production] CRITICAL ERROR: index.html missing at ${indexPath}`);
          if (fs.existsSync(distPath)) {
            console.log(`[Production] Contents of ${distPath}:`, fs.readdirSync(distPath));
          } else {
            console.error(`[Production] dist directory itself is missing!`);
          }
        }
      } catch (fsErr) {
        console.error("[Server] Error checking file system:", fsErr);
      }

      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error(`[Server] Error sending index.html:`, err);
            if (!res.headersSent) {
              res.status(500).send("Error loading application assets. Please check server logs.");
            }
          }
        });
      });
    }

    // Error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Express Unhandled Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    httpServer.on("error", (err) => {
      console.error("HTTP Server Error:", err);
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Initialization complete.`);
      console.log(`[Server] Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Admin App: ${!!adminApp ? 'Connected' : 'Missing (Check FIREBASE_SERVICE_ACCOUNT)'}`);
      console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
    });
    
    httpServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Error: Port ${PORT} is already in use.`);
      } else {
        console.error(`[Server] HTTP Server error:`, err);
      }
      process.exit(1);
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
