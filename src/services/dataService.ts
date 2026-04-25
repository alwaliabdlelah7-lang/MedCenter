import { supabase } from '../lib/supabase';

/**
 * Unified Data Service for Hospital Management System
 * Handles data persistence using Supabase.
 */

class DataService {
  private static instance: DataService;
  private _useCloud: boolean = true;
  private listeners: (() => void)[] = [];
  
  private constructor() {
    this._useCloud = !!import.meta.env.VITE_SUPABASE_URL;
  }

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

  public isCloudEnabled(): boolean {
    return this._useCloud;
  }

  // Generic Get All
  public async getAll<T>(key: string): Promise<T[]> {
    if (this._useCloud && supabase) {
      try {
        const { data, error } = await supabase
          .from(key)
          .select('*')
          .order('id', { ascending: true });
        
        if (error) {
          console.warn(`Supabase Fetch Error for ${key}:`, error);
          return this.getLocalAll<T>(key);
        }
        
        const items = (data as T[]) || [];
        this.saveLocalAll(key, items);
        return items;
      } catch (error) {
        console.warn(`Cloud error for ${key}:`, error);
        return this.getLocalAll<T>(key);
      }
    } else {
      return this.getLocalAll<T>(key);
    }
  }

  // Generic Search
  public async find<T>(key: string, query: Partial<Record<keyof T, any>>): Promise<T[]> {
    if (this._useCloud && supabase) {
      try {
        let supabaseQuery = supabase.from(key).select('*');
        
        Object.entries(query).forEach(([field, value]) => {
          supabaseQuery = supabaseQuery.eq(field, value);
        });

        const { data, error } = await supabaseQuery;
        if (error) throw error;
        return (data as T[]) || [];
      } catch (error) {
        console.error(`Supabase Find Error for ${key}:`, error);
        return [];
      }
    }
    return [];
  }

  // Generic Add Item
  public async addItem<T>(key: string, item: any): Promise<void> {
    if (this._useCloud && supabase) {
       try {
        const { error } = await supabase
          .from(key)
          .insert(item);
        
        if (error) {
           console.warn(`[DataService] Supabase Add failed for ${key}:`, error);
        }
      } catch (error) {
        console.warn(`[DataService] Cloud Save Error for ${key}:`, error);
      }
    }
    const current = this.getLocalAll<T>(key);
    this.saveLocalAll(key, [...current, item]);
    this.notify();
  }

  // Generic Update Item
  public async updateItem<T>(key: string, id: string, updates: Partial<T>): Promise<void> {
    if (this._useCloud && supabase) {
       try {
        const { error } = await supabase
          .from(key)
          .update(updates)
          .eq('id', id);
        
        if (error) {
           console.warn(`[DataService] Supabase Update failed for ${key}/${id}:`, error);
        }
      } catch (error) {
        console.warn(`[DataService] Cloud Update Error for ${key}/${id}:`, error);
      }
    }
    const current = this.getLocalAll<any>(key);
    this.saveLocalAll(key, current.map((item: any) => 
      (item.id === id) ? { ...item, ...updates } : item
    ));
    this.notify();
  }

  // Generic Delete Item
  public async deleteItem<T>(key: string, id: string): Promise<void> {
    if (this._useCloud && supabase) {
      try {
        const { error } = await supabase
          .from(key)
          .delete()
          .eq('id', id);
        
        if (error) {
           console.warn(`[DataService] Supabase Delete failed for ${key}/${id}:`, error);
        }
      } catch (error) {
        console.warn(`[DataService] Cloud Delete Error for ${key}/${id}:`, error);
      }
    }
    const current = this.getLocalAll<any>(key);
    this.saveLocalAll(key, current.filter(item => item.id !== id));
    this.notify();
  }

  // Helpers for local fallback
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
          backup[key] = localStorage.getItem(key);
        }
    }
    return backup;
  }
}

export const dataStore = DataService.getInstance();
