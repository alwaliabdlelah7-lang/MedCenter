import express from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for server-side (legacy/option)
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export function createApiRouter(db: any) {
  const router = express.Router();

  // RBAC Middleware
  const checkAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const publicPaths = ['/health', '/api-test', '/login', '/auth/login', '/auth0/url', '/auth0/callback'];
    if (publicPaths.includes(req.path)) return next();

    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ error: "Missing x-user-id" });

    // Fallback for admin u-1
    if (userId === 'u-1') {
      (req as any).user = { id: 'u-1', role: 'admin', permissions: ['all'] };
      return next();
    }

    if (db) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          (req as any).user = { id: userDoc.id, ...userDoc.data() };
          return next();
        }
      } catch (err) {
        console.error("Firestore Auth Error:", err);
      }
    }

    if (supabase) {
      try {
        const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!error && user) {
          (req as any).user = user;
          return next();
        }
      } catch (err) {}
    }

    res.status(403).json({ error: "Forbidden: User not found" });
  };

  const hasPermission = (permissions: string[]) => {
    return (req: any, res: any, next: any) => {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      if (user.role === 'admin') return next();
      
      const hasReq = permissions.some(p => user.permissions.includes(p));
      if (hasReq) return next();

      res.status(403).json({ error: `Forbidden: Requires ${permissions.join(' or ')}` });
    };
  };

  // Login
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (db) {
      try {
        const snapshot = await db.collection('users').where('username', '==', username).limit(1).get();
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

    if (supabase) {
      try {
        const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();
        if (!error && user) {
          if (!user.password || user.password === password) return res.json(user);
        }
      } catch (err) {}
    }

    // Fallback admin
    if (username === 'admin' && (!password || password === '123')) {
      return res.json({ id: 'u-1', username: 'admin', role: 'admin', permissions: ['all'] });
    }
    
    return res.status(401).json({ error: "Invalid credentials" });
  });

  router.use(checkAuth);

  // Generic Get All
  router.get("/:collection", async (req, res) => {
    const { collection } = req.params;
    if (db) {
      try {
        const snapshot = await db.collection(collection).get();
        return res.json(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    if (supabase) {
      try {
        const { data, error } = await supabase.from(collection).select('*').order('id', { ascending: true });
        if (error) throw error;
        return res.json(data);
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    res.json([]);
  });

  // Generic Post
  router.post("/:collection", async (req, res) => {
    const { collection } = req.params;
    if (db) {
      try {
        const docRef = await db.collection(collection).add({
          ...req.body,
          createdAt: new Date().toISOString(),
        });
        const newDoc = await docRef.get();
        return res.json({ id: docRef.id, ...newDoc.data() });
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    if (supabase) {
      try {
        const { data, error } = await supabase.from(collection).insert(req.body).select().single();
        if (error) throw error;
        return res.json(data);
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    res.status(503).json({ error: "Cloud not configured" });
  });

  // Generic Put
  router.put("/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    if (db) {
      try {
        await db.collection(collection).doc(id).update({
          ...req.body,
          updatedAt: new Date().toISOString(),
        });
        return res.json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    if (supabase) {
      try {
        const { error } = await supabase.from(collection).update(req.body).eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    res.status(503).json({ error: "Cloud not configured" });
  });

  // Generic Delete
  router.delete("/:collection/:id", hasPermission(['all']), async (req, res) => {
    const { collection, id } = req.params;
    if (db) {
      try {
        await db.collection(collection).doc(id).delete();
        return res.json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    if (supabase) {
      try {
        const { error } = await supabase.from(collection).delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    }
    res.status(503).json({ error: "Cloud not configured" });
  });

  return router;
}
