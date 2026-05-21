import { db, auth, isFirebaseReady, lastFirebaseError } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, addDoc, getCountFromServer, writeBatch, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { getSupabaseClient } from '../lib/supabase';

export type StorageProvider = 'local' | 'firebase' | 'supabase';

/**
 * Unified Data Service for Hospital Management System
 * Supports multiple backend providers: LocalStorage, Firebase Firestore, and Supabase.
 */

class DataService {
  private static instance: DataService;
  private provider: StorageProvider = (localStorage.getItem('db_provider') as StorageProvider) || 'firebase';
  private listeners: (() => void)[] = [];
  
  private constructor() {
    // Detect fatal cloud errors and downgrade or upgrade back when connection is restored
    const checkAndDowngrade = () => {
      const isSuspended = lastFirebaseError?.includes('suspended') || lastFirebaseError?.includes('permission-denied') || lastFirebaseError?.includes('api-key');
      if (this.provider === 'firebase' && isSuspended) {
        console.warn('[DataService] Detected suspended Firebase project. Falling back to local storage.');
        this.setProvider('local');
      }
    };

    const checkAndUpgrade = () => {
      const isSuspended = lastFirebaseError?.includes('suspended') || lastFirebaseError?.includes('permission-denied') || lastFirebaseError?.includes('api-key');
      const hasLocalUser = !!localStorage.getItem('hospital_current_user');
      const isFirebaseAuthReady = !!auth.currentUser;

      // If there is an active local user session but Firebase Auth isn't ready/signed in yet,
      // keep local provider to prevent unauthenticated operations on Firebase.
      if (hasLocalUser && !isFirebaseAuthReady) {
        return;
      }

      if (isFirebaseReady && this.provider === 'local' && !isSuspended) {
        console.log('[DataService] Firebase connected successfully. Restoring cloud data provider.');
        this.setProvider('firebase');
      }
    };
    
    // Check immediately in case it was pre-detected on load
    checkAndDowngrade();
    checkAndUpgrade();
    // Re-check after a brief timeout to allow connection tests to complete
    setTimeout(() => {
      checkAndDowngrade();
      checkAndUpgrade();
    }, 2000);
    setTimeout(checkAndUpgrade, 5000);
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private getSupabase() {
    return getSupabaseClient();
  }

  public setProvider(newProvider: StorageProvider) {
    this.provider = newProvider;
    localStorage.setItem('db_provider', newProvider);
    this.notify();
  }

  public getProvider(): StorageProvider {
    return this.provider;
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Real-time subscription to a collection
   */
  public subscribeToCollection<T>(key: string, callback: (items: T[]) => void) {
    if (this.provider === 'firebase') {
      if (!auth.currentUser) {
        console.warn(`[DataService] Subscribing to ${key} in Firebase mode, but user is not authenticated. Using local/cached polling fallback.`);
        const fetchAndNotify = async () => {
          const items = await this.getAll<T>(key);
          callback(items);
        };
        fetchAndNotify();
        const interval = setInterval(fetchAndNotify, 3000);
        return () => clearInterval(interval);
      }

      const q = query(collection(db, key));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
        this.saveLocalAll(key, items);
        callback(items);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, key);
      });
    }

    // Polling fallback for other providers
    const fetchAndNotify = async () => {
      const items = await this.getAll<T>(key);
      callback(items);
    };
    
    fetchAndNotify();
    const interval = setInterval(fetchAndNotify, 3000);
    return () => clearInterval(interval);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public isCloudEnabled(): boolean {
    return this.provider !== 'local';
  }

  /**
   * Returns stats for all collections defined in the system
   */
  public async getDatabaseStats(collections: string[]): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    if (this.provider === 'local') {
      collections.forEach(col => {
        stats[col] = this.getLocalAll(col).length;
      });
      return stats;
    }

    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        const promises = collections.map(async (col) => {
          try {
            const { count, error } = await sb.from(col).select('*', { count: 'exact', head: true });
            stats[col] = error ? -1 : (count || 0);
          } catch (e) {
            stats[col] = -1;
          }
        });
        await Promise.all(promises);
        return stats;
      }
    }

    // Default to Firebase
    const promises = collections.map(async (col) => {
      try {
        const coll = collection(db, col);
        const snapshot = await getCountFromServer(coll);
        stats[col] = snapshot.data().count;
      } catch (e) {
        console.warn(`Could not get count for ${col}:`, e);
        stats[col] = -1;
      }
    });

    await Promise.all(promises);
    return stats;
  }

  /**
   * Wipes all collections to reset the system
   */
  public async resetSystem(): Promise<void> {
    const collectionsToReset = [
      'patients', 'appointments', 'clinical_visits', 'clinical_notes', 
      'prescriptions', 'lab_tests', 'radiology_scans', 'receipts', 'pharmacy_items', 
      'transactions', 'notifications', 'chat_messages', 'inpatients', 'nurses',
      'doctors', 'departments', 'clinics', 'services', 'operations', 'users',
      'settings', 'dynamic_fields', 'audit_logs', 'companions'
    ];

    console.log('[DataService] Resetting system...');
    
    const promises = collectionsToReset.map(col => this.wipeCollection(col));
    await Promise.all(promises);
    
    // Also clear local cache
    collectionsToReset.forEach(col => {
      localStorage.removeItem(`hospital_${col}`);
    });

    console.log('[DataService] System reset complete.');
    this.notify();
  }
  public async wipeCollection(collectionName: string): Promise<void> {
    if (this.provider === 'local') {
      localStorage.removeItem(`hospital_${collectionName}`);
      this.notify();
      return;
    }

    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        await sb.from(collectionName).delete().neq('id', '0');
        this.notify();
        return;
      }
    }

    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    this.notify();
  }

  /**
   * Checks if the current user is correctly linked in the database
   */
  public async verifyUserLink(): Promise<{ linked: boolean; profile: any }> {
    const user = auth.currentUser;
    if (!user) return { linked: false, profile: null };

    if (this.provider === 'firebase') {
      try {
        const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', user.uid)));
        if (!userDoc.empty) {
          return { linked: true, profile: userDoc.docs[0].data() };
        }
      } catch (e) {
        console.error("Link verification failed", e);
      }
    } else if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        const { data } = await sb.from('users').select('*').eq('id', user.uid).single();
        if (data) return { linked: true, profile: data };
      }
    }
    
    return { linked: false, profile: null };
  }

  // Generic Get All
  public async getAll<T>(key: string): Promise<T[]> {
    if (this.provider === 'local') {
      return this.getLocalAll<T>(key);
    }

    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        const { data, error } = await sb.from(key).select('*');
        if (error) throw error;
        return data as T[];
      }
    }

    if (this.provider === 'firebase' && !auth.currentUser) {
      return this.getLocalAll<T>(key);
    }

    try {
      const snapshot = await getDocs(collection(db, key));
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      this.saveLocalAll(key, items);
      return items;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.LIST, key);
      }
      console.warn(`Firebase Fetch Error for ${key}:`, error);
    }

    return this.getLocalAll<T>(key);
  }

  // Generic Search
  public async find<T>(key: string, queryFilters: Partial<Record<keyof T, any>>): Promise<T[]> {
    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        let q = sb.from(key).select('*');
        Object.entries(queryFilters).forEach(([field, value]) => {
          q = q.eq(field, value);
        });
        const { data, error } = await q;
        if (error) throw error;
        return data as T[];
      }
    }

    if (this.provider === 'firebase' && !auth.currentUser) {
      const items = this.getLocalAll<any>(key);
      return items.filter((item: any) => 
        Object.entries(queryFilters).every(([field, val]) => item[field] === val)
      ) as T[];
    }

    try {
      let q = query(collection(db, key));
      Object.entries(queryFilters).forEach(([field, value]) => {
        q = query(q, where(field, '==', value));
      });
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.GET, `${key} (query)`);
      }
      console.error(`Firebase Find Error for ${key}:`, error);
    }

    return [];
  }

  // Generic Add Item
  public async addItem<T>(key: string, item: any): Promise<void> {
    const docId = item.id || `ID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const itemWithMeta = { ...item, id: docId, createdAt: new Date().toISOString() };
    
    if (this.provider === 'local' || (this.provider === 'firebase' && !auth.currentUser)) {
      const current = this.getLocalAll<any>(key);
      // Check if ID already exists to prevent duplicates
      const exists = current.some((i: any) => i.id === docId);
      if (exists) {
        this.saveLocalAll(key, current.map((i: any) => i.id === docId ? itemWithMeta : i));
      } else {
        this.saveLocalAll(key, [...current, itemWithMeta]);
      }
      this.notify();
      return;
    }

    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        const { error } = await sb.from(key).insert(itemWithMeta);
        if (error) throw error;
        this.notify();
        return;
      }
    }

    try {
      await setDoc(doc(db, key, docId), itemWithMeta);
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.CREATE, `${key}/${docId}`);
      }
      console.warn(`Firebase Add Error for ${key}:`, error);
    }

    // Sync to local cache defensively
    const current = this.getLocalAll<any>(key);
    const exists = current.some((i: any) => i.id === docId);
    if (exists) {
      this.saveLocalAll(key, current.map((i: any) => i.id === docId ? itemWithMeta : i));
    } else {
      this.saveLocalAll(key, [...current, itemWithMeta]);
    }
    this.notify();
  }

  // Generic Update Item
  public async updateItem<T>(key: string, id: string, updates: Partial<T>): Promise<void> {
    const updatesWithMeta = { ...updates, updatedAt: new Date().toISOString() };
    
    if (this.provider === 'local' || (this.provider === 'firebase' && !auth.currentUser)) {
      const current = this.getLocalAll<any>(key);
      this.saveLocalAll(key, current.map((item: any) => 
        (item.id === id) ? { ...item, ...updates } : item
      ));
      this.notify();
      return;
    }

    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        const { error } = await sb.from(key).update(updatesWithMeta).eq('id', id);
        if (error) throw error;
        this.notify();
        return;
      }
    }

    try {
      await updateDoc(doc(db, key, id), updatesWithMeta as any);
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.UPDATE, `${key}/${id}`);
      }
      console.warn(`Firebase Update Error for ${key}:`, error);
    }

    const current = this.getLocalAll<any>(key);
    this.saveLocalAll(key, current.map((item: any) => 
      (item.id === id) ? { ...item, ...updates } : item
    ));
    this.notify();
  }

  // Generic Delete Item
  public async deleteItem<T>(key: string, id: string): Promise<void> {
    if (this.provider === 'local' || (this.provider === 'firebase' && !auth.currentUser)) {
      const current = this.getLocalAll<any>(key);
      this.saveLocalAll(key, current.filter(item => item.id !== id));
      this.notify();
      return;
    }

    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        const { error } = await sb.from(key).delete().eq('id', id);
        if (error) throw error;
        this.notify();
        return;
      }
    }

    try {
      await deleteDoc(doc(db, key, id));
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.DELETE, `${key}/${id}`);
      }
      console.warn(`Firebase Delete Error for ${key}:`, error);
    }

    const current = this.getLocalAll<any>(key);
    this.saveLocalAll(key, current.filter(item => item.id !== id));
    this.notify();
  }

  /**
   * Automatically seeds the database with initial reference data.
   */
  public async autoSeed(): Promise<void> {
    if (!this.isCloudEnabled()) return;

    // Firebase authentication guard
    if (this.provider === 'firebase' && !auth.currentUser) {
      console.log('[DataService] Firebase is unauthenticated. Skipping auto-seed.');
      return;
    }

    // Supabase authentication guard
    if (this.provider === 'supabase') {
      const sb = this.getSupabase();
      if (sb) {
        const { data } = await sb.auth.getSession();
        if (!data.session) {
          console.log('[DataService] Supabase is unauthenticated. Skipping auto-seed.');
          return;
        }
      }
    }

    try {
      // 1. Check if we already have structural data (e.g. departments)
      const existingDepts = await this.getAll('departments');
      if (existingDepts.length > 0) {
        console.log('[DataService] System already contains structural data. Skipping auto-seed.');
        return;
      }

      console.log(`[DataService] Starting auto-seed for ${this.provider}...`);
      const seedData = await import('../data/seedData');
      
      const seedMap: Record<string, any[]> = {
        users: seedData.INITIAL_USERS || [],
        departments: seedData.INITIAL_DEPARTMENTS || [],
        clinics: seedData.INITIAL_CLINICS || [],
        doctors: seedData.INITIAL_DOCTORS || [],
        // patients: seedData.INITIAL_PATIENTS || [], // Skip "fake" patients
        // appointments: seedData.INITIAL_APPOINTMENTS || [], // Skip "fake" appointments
        services: seedData.YEMEN_SERVICES || [],
        master_medicines: (seedData.YEMEN_MEDICINES || []).map((m: any, i: number) => ({ id: `MED-M-${i}`, ...m })),
        master_lab_tests: (seedData.YEMEN_LAB_TESTS || []).map((t: any, i: number) => ({ id: `LAB-M-${i}`, ...t }))
      };

      for (const [col, items] of Object.entries(seedMap)) {
        console.log(`[DataService] Seeding ${col} (${items.length} items)...`);
        for (const item of items) {
          await this.addItem(col, item);
        }
      }

      console.log(`[DataService] Auto-seed completed successfully for ${this.provider}.`);
    } catch (error: any) {
      console.error('[DataService] Auto-seed unexpected error:', error);
      throw error;
    }
  }

  public getLocalAll<T>(key: string): T[] {
    const data = localStorage.getItem(`hospital_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private saveLocalAll<T>(key: string, data: T[]): void {
    localStorage.setItem(`hospital_${key}`, JSON.stringify(data));
  }

  public async exportAllLocalData(): Promise<any> {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('hospital_')) {
          backup[key!] = localStorage.getItem(key!);
        }
    }
    return backup;
  }

  public async importAllLocalData(data: Record<string, any>): Promise<void> {
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('hospital_')) {
        localStorage.setItem(key, value);
      }
    });
    this.notify();
  }
}

export const dataStore = DataService.getInstance();
