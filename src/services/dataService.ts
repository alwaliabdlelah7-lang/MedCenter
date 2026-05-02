import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, addDoc, getCountFromServer, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { getSupabaseClient } from '../lib/supabase';

export type StorageProvider = 'local' | 'firebase' | 'supabase';

/**
 * Unified Data Service for Hospital Management System
 * Supports multiple backend providers: LocalStorage, Firebase Firestore, and Supabase.
 */

class DataService {
  private static instance: DataService;
  private provider: StorageProvider = (localStorage.getItem('db_provider') as StorageProvider) || 'local';
  private listeners: (() => void)[] = [];
  
  private constructor() {}

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
   * Wipes a specific collection (Careful!)
   */
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
    
    if (this.provider === 'local') {
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
    
    if (this.provider === 'local') {
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
    if (this.provider === 'local') {
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
   * Works for both cloud (Firebase/Supabase) and local (localStorage) providers.
   */
  public async autoSeed(): Promise<void> {
    try {
      console.log(`[DataService] Starting auto-seed for ${this.provider}...`);
      const seedData = await import('../data/seedData');
      
      const seedMap: Record<string, any[]> = {
        users: seedData.INITIAL_USERS || [],
        departments: seedData.INITIAL_DEPARTMENTS || [],
        clinics: seedData.INITIAL_CLINICS || [],
        doctors: seedData.INITIAL_DOCTORS || [],
        patients: seedData.INITIAL_PATIENTS || [],
        appointments: seedData.INITIAL_APPOINTMENTS || [],
        receipts: seedData.INITIAL_RECEIPTS || [],
        lab_tests: seedData.INITIAL_LAB_TESTS || [],
        radiology_scans: seedData.INITIAL_RADIOLOGY_SCANS || [],
        clinical_visits: seedData.INITIAL_CLINICAL_VISITS || [],
        prescriptions: seedData.INITIAL_PRESCRIPTIONS || [],
        inpatients: seedData.INITIAL_INPATIENTS || [],
        nurses: seedData.INITIAL_NURSES || [],
        operations: seedData.INITIAL_OPERATIONS || [],
        services: (seedData.YEMEN_SERVICES || []).map((s: any) => ({ departmentId: 'dept-1', revenueAccountId: 'rev-1', ...s })),
        pharmacy_items: (seedData.YEMEN_MEDICINES || []).map((m: any, i: number) => ({ id: `pi-${i}`, stock: 100, expiryDate: '2027-12-31', ...m })),
        master_lab_tests: (seedData.YEMEN_LAB_TESTS || []),
        master_medicines: (seedData.YEMEN_MEDICINES || []),
      };

      for (const [col, items] of Object.entries(seedMap)) {
        // For local: only seed if collection is empty
        if (this.provider === 'local') {
          const existing = this.getLocalAll(col);
          if (existing.length > 0) continue;
          this.saveLocalAll(col, items);
          console.log(`[DataService] Local seeded ${col} (${items.length} items)`);
        } else {
          console.log(`[DataService] Cloud seeding ${col} (${items.length} items)...`);
          for (const item of items) {
            await this.addItem(col, item);
          }
        }
      }

      localStorage.setItem('hospital_seeded', 'true');
      console.log(`[DataService] Auto-seed completed successfully for ${this.provider}.`);
    } catch (error: any) {
      console.error('[DataService] Auto-seed unexpected error:', error);
    }
  }

  /**
   * Seeds local storage once on first run. Call this at app startup.
   */
  public seedLocalIfEmpty(): void {
    if (this.provider !== 'local') return;
    const alreadySeeded = localStorage.getItem('hospital_seeded');
    if (alreadySeeded) return;
    // Trigger async seed without blocking
    this.autoSeed().catch(console.error);
  }

  private getLocalAll<T>(key: string): T[] {
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
