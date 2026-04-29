import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

/**
 * Unified Data Service for Hospital Management System
 * Handles data persistence using Firestore.
 */

class DataService {
  private static instance: DataService;
  private _useFirebase: boolean = true;
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
    const itemWithMeta = { ...item, createdAt: new Date().toISOString() };
    const docId = item.id;
    
    try {
      if (docId) {
        await setDoc(doc(db, key, docId), itemWithMeta);
      } else {
        await addDoc(collection(db, key), itemWithMeta);
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.CREATE, `${key}/${docId || '(auto)'}`);
      }
      console.warn(`Firebase Add Error for ${key}:`, error);
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

  public isCloudEnabled(): boolean {
    return this._useFirebase;
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
      if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
        console.warn('[DataService] Seeding skipped: Missing permissions. Please sign in as admin to initialize the database.');
        // Don't throw here to avoid crashing the app on startup if the user isn't logged in yet
      } else if (error.message?.includes('Could not reach Cloud Firestore backend') || error.code === 'unavailable') {
         console.error('[DataService] Firestore unreachable during seeding:', error.message);
      } else {
        console.error('[DataService] Auto-seed unexpected error:', error);
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
