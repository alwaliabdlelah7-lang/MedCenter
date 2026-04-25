import express from "express";
import admin from "firebase-admin";
import { performSeeding } from "./seeding.ts";

export function createApiRouter(db: any) {
  const router = express.Router();

  // RBAC Middleware
  const checkAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    
    // For health check or if user hits test routes, we might allow it
    if (req.path === '/health') return next();

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing X-User-Id header" });
    }

    if (!db) return res.status(503).json({ error: "Firebase not initialized" });

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(403).json({ error: "Forbidden: User record not found" });
      }

      const userData = userDoc.data();
      (req as any).user = userData;
      next();
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
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

  router.use(checkAuth);

  // Health check
  router.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      firebase: !!db, 
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
