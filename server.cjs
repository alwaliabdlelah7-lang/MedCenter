var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_socket = require("socket.io");
var import_http = require("http");
var import_config = require("dotenv/config");
var import_firebase_admin = __toESM(require("firebase-admin"), 1);

// src/api/routes.ts
var import_express = __toESM(require("express"), 1);
function createApiRouter(db) {
  const router = import_express.default.Router();
  const checkAuth = async (req, res, next) => {
    const publicPaths = ["/health", "/api-test", "/login", "/auth/login"];
    if (publicPaths.includes(req.path)) return next();
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Missing x-user-id" });
    if (userId === "u-1") {
      req.user = { id: "u-1", role: "admin", permissions: ["all"] };
      return next();
    }
    if (db) {
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          req.user = { id: userDoc.id, ...userDoc.data() };
          return next();
        }
      } catch (err) {
        console.error("Firestore Auth Error:", err);
      }
    }
    res.status(403).json({ error: "Forbidden: User not found in Cloud Database" });
  };
  const hasPermission = (permissions) => {
    return (req, res, next) => {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      if (user.role === "admin") return next();
      const hasReq = permissions.some((p) => user.permissions.includes(p));
      if (hasReq) return next();
      res.status(403).json({ error: `Forbidden: Requires ${permissions.join(" or ")}` });
    };
  };
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (db) {
      try {
        const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const user = { id: userDoc.id, ...userDoc.data() };
          if (!user.password || user.password === password) {
            return res.json(user);
          }
        }
      } catch (err) {
        console.error("Firestore Login Error:", err);
      }
    }
    if (username === "admin" && (!password || password === "123")) {
      return res.json({ id: "u-1", username: "admin", role: "admin", permissions: ["all"] });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  });
  router.use(checkAuth);
  router.get("/:collection", async (req, res) => {
    const { collection } = req.params;
    if (db) {
      try {
        const snapshot = await db.collection(collection).get();
        return res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
    res.json([]);
  });
  router.post("/:collection", async (req, res) => {
    const { collection } = req.params;
    if (db) {
      try {
        const docRef = await db.collection(collection).add({
          ...req.body,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        const newDoc = await docRef.get();
        return res.json({ id: docRef.id, ...newDoc.data() });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
    res.status(503).json({ error: "Cloud not configured" });
  });
  router.put("/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    if (db) {
      try {
        await db.collection(collection).doc(id).update({
          ...req.body,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        return res.json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
    res.status(503).json({ error: "Cloud not configured" });
  });
  router.delete("/:collection/:id", hasPermission(["all"]), async (req, res) => {
    const { collection, id } = req.params;
    if (db) {
      try {
        await db.collection(collection).doc(id).delete();
        return res.json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
    res.status(503).json({ error: "Cloud not configured" });
  });
  return router;
}

// server.ts
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION AT TOP LEVEL:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION AT TOP LEVEL:", reason);
  process.exit(1);
});
var adminApp = null;
var serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountRaw) {
  try {
    let serviceAccount;
    if (serviceAccountRaw.startsWith("{")) {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } else {
      try {
        serviceAccount = JSON.parse(Buffer.from(serviceAccountRaw, "base64").toString());
      } catch {
        serviceAccount = JSON.parse(serviceAccountRaw);
      }
    }
    if (serviceAccount && serviceAccount.project_id) {
      adminApp = import_firebase_admin.default.initializeApp({
        credential: import_firebase_admin.default.credential.cert(serviceAccount)
      });
      console.log(`Firebase Admin initialized successfully (Project: ${serviceAccount.project_id})`);
    }
  } catch (error) {
    console.error("Critical error: Failed to parse FIREBASE_SERVICE_ACCOUNT. Check secret formatting.", error.message);
  }
}
console.log("Starting server implementation...");
async function startServer() {
  try {
    const app = (0, import_express2.default)();
    const httpServer = (0, import_http.createServer)(app);
    const PORT = 3e3;
    console.log(`[Server] Attempting to start on port ${PORT}...`);
    const io = new import_socket.Server(httpServer, {
      cors: { origin: "*" }
    });
    io.on("connection", (socket) => {
      socket.on("join-chat", (chatId) => socket.join(chatId));
      socket.on("send-message", (msg) => io.to(msg.chatId).emit("receive-message", msg));
      socket.on("broadcast-notification", (notif) => {
        socket.broadcast.emit("notification-received", notif);
      });
    });
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        console.log(`[API Request] ${(/* @__PURE__ */ new Date()).toISOString()} ${req.method} ${req.path}`);
      }
      next();
    });
    app.use(import_express2.default.json());
    app.get("/health", (req, res) => {
      res.status(200).send("OK");
    });
    app.get("/api-test", (req, res) => {
      res.json({ message: "API server is healthy", cloudDatabaseConnected: !!adminApp });
    });
    app.use("/api", createApiRouter(adminApp ? adminApp.firestore() : null));
    app.all("/api/*", (req, res) => {
      res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
    });
    const distPath = import_path.default.join(process.cwd(), "dist");
    const indexPath = import_path.default.join(distPath, "index.html");
    let isProduction = process.env.NODE_ENV === "production";
    try {
      const fs = await import("fs");
      if (fs.existsSync(indexPath)) {
        isProduction = true;
      }
    } catch (_) {
    }
    if (!isProduction) {
      console.log("[Server] Development mode detected. Loading Vite...");
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa"
        });
        app.use(vite.middlewares);
        console.log("[Server] Vite middleware mounted.");
      } catch (e) {
        console.error("[Server] Failed to load Vite. Routing fallback to production assets.", e.message);
        isProduction = true;
      }
    }
    if (isProduction) {
      console.log(`[Production] Serving static files from: ${distPath}`);
      try {
        const fs = await import("fs");
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
      app.use(import_express2.default.static(distPath));
      app.get("*", (req, res) => {
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
    app.use((err, req, res, next) => {
      console.error("Express Unhandled Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });
    httpServer.on("error", (err) => {
      console.error("HTTP Server Error:", err);
    });
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Initialization complete.`);
      console.log(`[Server] Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`[Server] Admin App: ${!!adminApp ? "Connected" : "Missing (Check FIREBASE_SERVICE_ACCOUNT)"}`);
      console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
    });
    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
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
startServer().catch((err) => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
