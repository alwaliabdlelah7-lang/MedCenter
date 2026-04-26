import { supabase } from '../lib/supabase';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, addDoc } from 'firebase/firestore';

/**
 * Unified Data Service for Hospital Management System
 * Handles data persistence using Firestore (Primary) or Supabase (Secondary).
 */

class DataService {
  private static instance: DataService;
  private _useFirebase: boolean = true;
  private _useSupabase: boolean = !!import.meta.env.VITE_SUPABASE_URL;
  private listeners: (() => void)[] = [];
  
  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
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

  // Generic Get All
  public async getAll<T>(key: string): Promise<T[]> {
    try {
      const snapshot = await getDocs(collection(db, key));
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
        this.saveLocalAll(key, items);
        return items;
      }
    } catch (error) {
      console.warn(`Firebase Fetch Error for ${key}:`, error);
    }

    if (this._useSupabase && supabase) {
      try {
        const { data, error } = await supabase.from(key).select('*').order('id', { ascending: true });
        if (!error && data) {
          const items = data as T[];
          this.saveLocalAll(key, items);
          return items;
        }
      } catch (error) {
        console.warn(`Supabase Fetch Error for ${key}:`, error);
      }
    }

    return this.getLocalAll<T>(key);
  }

  // Generic Search
  public async find<T>(key: string, queryFilters: Partial<Record<keyof T, any>>): Promise<T[]> {
    try {
      let q = query(collection(db, key));
      Object.entries(queryFilters).forEach(([field, value]) => {
        q = query(q, where(field, '==', value));
      });
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } catch (error) {
      console.error(`Firebase Find Error for ${key}:`, error);
    }

    if (this._useSupabase && supabase) {
      try {
        let supabaseQuery = supabase.from(key).select('*');
        Object.entries(queryFilters).forEach(([field, value]) => {
          supabaseQuery = supabaseQuery.eq(field, value);
        });
        const { data, error } = await supabaseQuery;
        if (!error) return (data as T[]) || [];
      } catch (error) {}
    }

    return [];
  }

  // Generic Add Item
  public async addItem<T>(key: string, item: any): Promise<void> {
    const itemWithMeta = { ...item, createdAt: new Date().toISOString() };
    
    try {
      if (item.id) {
        await setDoc(doc(db, key, item.id), itemWithMeta);
      } else {
        await addDoc(collection(db, key), itemWithMeta);
      }
    } catch (error) {
      console.warn(`Firebase Add Error for ${key}:`, error);
    }

    if (this._useSupabase && supabase) {
      try {
        await supabase.from(key).insert(item);
      } catch (error) {}
    }

    const current = this.getLocalAll<T>(key);
    this.saveLocalAll(key, [...current, item]);
    this.notify();
  }

  // Generic Update Item
  public async updateItem<T>(key: string, id: string, updates: Partial<T>): Promise<void> {
    const updatesWithMeta = { ...updates, updatedAt: new Date().toISOString() };
    
    try {
      await updateDoc(doc(db, key, id), updatesWithMeta as any);
    } catch (error) {
      console.warn(`Firebase Update Error for ${key}:`, error);
    }

    if (this._useSupabase && supabase) {
      try {
        await supabase.from(key).update(updates as any).eq('id', id);
      } catch (error) {}
    }

    const current = this.getLocalAll<any>(key);
    this.saveLocalAll(key, current.map((item: any) => 
      (item.id === id) ? { ...item, ...updates } : item
    ));
    this.notify();
  }

  // Generic Delete Item
  public async deleteItem<T>(key: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, key, id));
    } catch (error) {
      console.warn(`Firebase Delete Error for ${key}:`, error);
    }

    if (this._useSupabase && supabase) {
      try {
        await supabase.from(key).delete().eq('id', id);
      } catch (error) {}
    }

    const current = this.getLocalAll<any>(key);
    this.saveLocalAll(key, current.filter(item => item.id !== id));
    this.notify();
  }

  public isCloudEnabled(): boolean {
    return this._useFirebase || this._useSupabase;
  }

  /**
   * Automatically seeds the database if it's empty.
   */
  public async autoSeedIfNeeded(): Promise<void> {
    if (!this.isCloudEnabled()) return;

    try {
      // Check if users exist in Firebase
      const snapshot = await getDocs(collection(db, 'users'));
      if (snapshot.empty) {
        console.log('[DataService] Firebase appears empty. Starting auto-seed...');
        const { INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_CLINICS, INITIAL_DOCTORS, YEMEN_LAB_TESTS, YEMEN_MEDICINES } = await import('../data/seedData');
        
        const bulkAdd = async (key: string, items: any[]) => {
          for (const item of items) {
            await this.addItem(key, item);
          }
        };

        await bulkAdd('users', INITIAL_USERS);
        await bulkAdd('departments', INITIAL_DEPARTMENTS);
        await bulkAdd('clinics', INITIAL_CLINICS);
        await bulkAdd('doctors', INITIAL_DOCTORS);
        
        if (YEMEN_LAB_TESTS) {
           await bulkAdd('lab_tests', YEMEN_LAB_TESTS.map((t, i) => ({ id: `lt-${i}`, ...t })));
        }
        if (YEMEN_MEDICINES) {
           await bulkAdd('pharmacy_items', YEMEN_MEDICINES.map((m, i) => ({ id: `pi-${i}`, ...m })));
        }

        console.log('[DataService] Auto-seed completed successfully.');
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn('[DataService] Seeding skipped: Missing permissions. Please sign in as admin to initialize the database.');
      } else {
        console.error('[DataService] Auto-seed failed:', error);
      }
    }
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
