/**
 * Unified Data Service for Hospital Management System
 * Handles data persistence using Backend APIs with Firestore.
 */

class DataService {
  private static instance: DataService;
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  private _useCloud: boolean = localStorage.getItem('hospital_storage_source') === 'cloud';
  
  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public isCloudEnabled(): boolean {
    return this._useCloud;
  }

  public setStorageSource(source: 'local' | 'cloud') {
    this._useCloud = source === 'cloud';
    localStorage.setItem('hospital_storage_source', source);
  }

  // Generic Get All
  public async getAll<T>(key: string): Promise<T[]> {
    if (this._useCloud) {
      try {
        const response = await fetch(`${this.baseUrl}/api/${key}`);
        if (!response.ok) throw new Error('Cloud API unavailable');
        return await response.json();
      } catch (error) {
        console.warn(`Cloud error for ${key}:`, error);
        return this.getLocalAll<T>(key);
      }
    } else {
      return this.getLocalAll<T>(key);
    }
  }

  // Generic Add Item
  public async addItem<T>(key: string, item: any): Promise<void> {
    if (this._useCloud) {
       try {
        const response = await fetch(`${this.baseUrl}/api/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to save to cloud');
      } catch (error) {
        console.error('Cloud Save Error:', error);
        const current = this.getLocalAll<T>(key);
        this.saveLocalAll(key, [...current, item]);
      }
    } else {
      const current = this.getLocalAll<T>(key);
      this.saveLocalAll(key, [...current, item]);
    }
  }

  // Generic Update Item
  public async updateItem<T extends { id?: string }>(key: string, id: string, updates: Partial<T>): Promise<void> {
    if (this._useCloud) {
      try {
        const response = await fetch(`${this.baseUrl}/api/${key}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Update failed');
      } catch (error) {
        console.error('Cloud Update Error:', error);
         const current = this.getLocalAll<T>(key);
         this.saveLocalAll(key, current.map(item => item.id === id ? { ...item, ...updates } : item));
      }
    } else {
      const current = this.getLocalAll<T>(key);
      this.saveLocalAll(key, current.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  }

  // Generic Delete Item
  public async deleteItem<T extends { id?: string }>(key: string, id: string): Promise<void> {
    if (this._useCloud) {
      try {
        const response = await fetch(`${this.baseUrl}/api/${key}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
      } catch (error) {
        console.error('Cloud Delete Error:', error);
        const current = this.getLocalAll<T>(key);
        this.saveLocalAll(key, current.filter(item => item.id !== id));
      }
    } else {
      const current = this.getLocalAll<T>(key);
      this.saveLocalAll(key, current.filter(item => item.id !== id));
    }
  }

  // Migration logic
  public async migrateLocalToCloud(collections: string[]): Promise<{success: boolean, migrated: Record<string, number>}> {
    const results: Record<string, number> = {};
    try {
      for (const col of collections) {
        const localData = this.getLocalAll<any>(col);
        if (localData.length === 0) continue;

        let count = 0;
        for (const item of localData) {
          try {
            await fetch(`${this.baseUrl}/api/${col}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
            count++;
          } catch (e) {
            console.error(`Migration error for ${col} item:`, e);
          }
        }
        results[col] = count;
      }
      return { success: true, migrated: results };
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, migrated: results };
    }
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

  public async importAllLocalData(backup: Record<string, string>): Promise<void> {
    Object.entries(backup).forEach(([key, value]) => {
      if (key.startsWith('hospital_')) {
        localStorage.setItem(key, value);
      }
    });
  }
}

export const dataStore = DataService.getInstance();
