import express from "express";
import admin from "firebase-admin";
import { performSeeding } from "./seeding.ts";

export function createApiRouter(db: any) {
  const router = express.Router();

  // RBAC Middleware
  const checkAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Skip auth for specific routes
    const publicPaths = ['/health', '/api-test', '/login', '/auth/login'];
    if (publicPaths.includes(req.path)) return next();

    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      console.warn(`[Auth] Missing x-user-id header for ${req.path}`);
      return res.status(401).json({ error: "Unauthorized: Missing X-User-Id header" });
    }

    if (!db) {
      console.error(`[Auth] Database not initialized for ${req.path}`);
      return res.status(503).json({ error: "Firebase not initialized" });
    }

    try {
      console.log(`[Auth] Checking userId: ${userId} for path: ${req.path}`);
      let userDoc = await db.collection('users').doc(userId).get();
      
      // Fallback: If u-1 and database is empty, allow it and potentially create it
      if (!userDoc.exists && userId === 'u-1') {
        const allUsers = await db.collection('users').limit(1).get();
        if (allUsers.empty) {
          console.info("[Auth] Empty database detected, allowing u-1 access");
          (req as any).user = {
            id: 'u-1',
            username: 'admin',
            role: 'admin',
            permissions: ['all'],
            status: 'active'
          };
          return next();
        } else {
           console.log(`[Auth] Database not empty, but u-1 not found. First user exists? ${!allUsers.empty}`);
        }
      }

      if (!userDoc.exists) {
        console.warn(`[Auth] User ${userId} not found in database for path ${req.path}`);
        return res.status(403).json({ error: "Forbidden: User record not found" });
      }

      const userData = userDoc.data();
      (req as any).user = userData;
      next();
    } catch (error) {
      console.error(`[Auth] Error checking user ${userId}:`, error);
      res.status(500).json({ error: "Internal server error during auth check" });
    }
  };

  const hasPermission = (permissions: string[]) => {
    return (req: any, res: any, next: any) => {
      const user = req.user;
      if (user.role === 'admin') return next();
      
      const hasReq = permissions.some(p => user.permissions.includes(p));
      if (hasReq) return next();

      res.status(403).json({ error: `Forbidden: Requires permission ${permissions.join(' or ')}` });
    };
  };

  // Login Route
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    
    try {
      const usersSnapshot = await db.collection('users')
        .where('username', '==', username)
        .where('status', '==', 'active')
        .limit(1)
        .get();
        
      if (usersSnapshot.empty) {
        // Fallback for initial admin
        if (username === 'admin') {
          const allUsers = await db.collection('users').limit(1).get();
          if (allUsers.empty && (!password || password === '123')) {
            const adminData = {
               username: 'admin',
               name: 'مدير النظام',
               role: 'admin',
               permissions: ['all'],
               status: 'active'
            };
            // Create user in DB so checkAuth succeeds later
            await db.collection('users').doc('u-1').set({
              ...adminData,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return res.json({
               id: 'u-1',
               ...adminData
            });
          }
        }
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userData = usersSnapshot.docs[0].data();
      const user = { id: usersSnapshot.docs[0].id, ...userData };

      if (user.password && user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json(user);
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.use(checkAuth);

  // Health check
  router.get("/health", async (req, res) => {
    let userCount = 0;
    if (db) {
      const users = await db.collection('users').get();
      userCount = users.size;
    }
    res.json({ 
      status: "ok", 
      firebase: !!db, 
      userCount,
      timestamp: new Date().toISOString(),
      dbType: db ? "initialized" : "null"
    });
  });

  // Admin Seed Route
  router.post("/admin/seed", hasPermission(['all']), async (req, res) => {
    const result = await performSeeding(db);
    if (result.success) {
      res.json({ success: true, message: "Database seeded" });
    } else {
      res.status(500).json({ error: result.error });
    }
  });

  // Bulk Import
  router.post("/admin/import/:collection", hasPermission(['all']), async (req, res) => {
    const { collection } = req.params;
    const items = req.body;
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    if (!Array.isArray(items)) return res.status(400).json({ error: "Array required" });
    try {
      const batch = db.batch();
      const colRef = db.collection(collection);
      items.forEach(item => {
        const docRef = item.id ? colRef.doc(item.id) : colRef.doc();
        batch.set(docRef, {
          ...item,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
      res.json({ success: true, count: items.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Generic Get
  router.get("/:collection", async (req, res) => {
    const { collection } = req.params;
    const user = (req as any).user;

    // Specific logic for collections
    if (collection === 'users' && user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Only admins can list users" });
    }

    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const snapshot = await db.collection(collection).get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Generic Post
  router.post("/:collection", async (req, res) => {
    const { collection } = req.params;
    const user = (req as any).user;

    // Check permissions based on collection
    const clinicalCollections = ['clinical_visits', 'prescriptions', 'lab_tests', 'radiology_scans'];
    if (clinicalCollections.includes(collection) && user.role !== 'admin' && user.role !== 'doctor' && user.role !== 'nurse') {
      return res.status(403).json({ error: "Forbidden: Clinical access required" });
    }

    if (collection === 'patients' && !['admin', 'receptionist', 'doctor', 'nurse'].includes(user.role)) {
       return res.status(403).json({ error: "Forbidden: Patient registration access required" });
    }

    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const docRef = await db.collection(collection).add({
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ id: docRef.id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Generic Put
  router.put("/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const user = (req as any).user;

    // Example of field-level protection or action-based protection can be added here
    if (collection === 'users' && user.id !== id && user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Cannot update other user profiles" });
    }

    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      const data = { ...req.body };
      delete data.id;
      await db.collection(collection).doc(id).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Generic Delete
  router.delete("/:collection/:id", hasPermission(['all']), async (req, res) => {
    const { collection, id } = req.params;
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    try {
      await db.collection(collection).doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Catch-all
  router.all("*", (req, res) => {
    res.status(404).json({ error: `Not Found: ${req.method} ${req.path}` });
  });

  return router;
}
