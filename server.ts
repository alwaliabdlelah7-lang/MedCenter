import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createServer } from "http";
import "dotenv/config";
import admin from "firebase-admin";
import { createApiRouter } from "./src/api/routes.ts";
import { auth as auth0 } from "express-openid-connect";
import fs from "fs";

// Error handling for startup
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize Firebase Admin lazily/conditionally
let adminApp: admin.app.App | null = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error: any) {
    console.warn("Failed to initialize Firebase Admin (check FIREBASE_SERVICE_ACCOUNT):", error.message);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  const httpServer = createServer(app);
  const PORT = 3000;

  // Auth0 Configuration
  const auth0Config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET || 'a_very_long_random_string_for_session_secret_1234567890',
    baseURL: process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL || `http://localhost:3000`,
    clientID: process.env.AUTH0_CLIENT_ID || 'H9IuhqXrnWKnebcmnixQkRuGrxzEQoQH',
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN || 'dev-630yylsmfudekk70.us.auth0.com'}`,
    routes: {
      login: false as const, // Handle login manually to provide URL for popup
      logout: '/auth/logout',
      callback: '/auth/callback',
    },
    session: {
      cookie: {
        sameSite: 'none' as const,
        secure: true
      }
    },
    afterCallback: (req: any, res: any, session: any) => {
      // Send success message to parent window and close popup
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
              <h2>تم تسجيل الدخول بنجاح</h2>
              <p>سيتم إغلاق هذه النافذة تلقائياً...</p>
            </div>
          </body>
        </html>
      `);
    }
  };

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
      console.log(`[API Request] ${new Date().toISOString()} ${req.method} ${req.path}`);
    }
    next();
  });

  app.use(express.json());

  // Attach Auth0 middleware if configured
  if (auth0Config.clientID && auth0Config.secret) {
    try {
      app.use(auth0(auth0Config));
      console.log("Auth0 middleware attached successfully");
    } catch (err) {
      console.error("Failed to attach Auth0 middleware:", err);
    }
  } else {
    console.warn("Auth0 Client ID or Secret missing, skipping Auth0 middleware");
  }

  // Endpoint to get Auth0 URL for popup
  app.get('/api/auth/url', (req, res) => {
    const domain = process.env.AUTH0_DOMAIN || 'dev-630yylsmfudekk70.us.auth0.com';
    const clientId = process.env.AUTH0_CLIENT_ID || 'H9IuhqXrnWKnebcmnixQkRuGrxzEQoQH';
    // Use the actual request protocol and host to ensure redirect works across dev/prod
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['host'];
    const redirectUri = `${protocol}://${host}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      audience: process.env.AUTH0_AUDIENCE || `https://${domain}/api/v2/`
    });
    
    const authUrl = `https://${domain}/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // User profile endpoint
  app.get('/auth/profile', (req, res) => {
    res.json(req?.oidc?.user);
  });

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

  // Vite middleware for development or static serving for production
  const distPath = path.join(process.cwd(), 'dist');
  const useStatic = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, 'index.html'));

  if (!useStatic) {
    console.log("Starting in DEVELOPMENT mode with Vite middleware");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode serving from /dist");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("MedCenter HIS: Build artifacts missing. Please run build.");
      }
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
