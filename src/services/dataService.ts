/**
 * Unified Data Service for Hospital Management System
 * Handles data persistence using Backend APIs with Firestore.
 */

class DataService {
  private static instance: DataService;
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  private _useCloud: boolean = localStorage.getItem('hospital_storage_source') === 'cloud';
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

  public isCloudEnabled(): boolean {
    return this._useCloud;
  }

  public setStorageSource(source: 'local' | 'cloud') {
    this._useCloud = source === 'cloud';
    localStorage.setItem('hospital_storage_source', source);
    this.notify();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const savedUser = localStorage.getItem('hospital_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.id) {
          headers['x-user-id'] = user.id;
        }
      } catch (e) {
        console.error("Error parsing user for headers", e);
      }
    }
    return headers;
  }

  // Generic Get All
  public async getItems<T>(key: string): Promise<T[]> {
    return this.getAll<T>(key);
  }

  public async getAll<T>(key: string): Promise<T[]> {
    if (this._useCloud) {
      try {
        const url = `${this.baseUrl}/api/${key}`;
        const response = await fetch(url, {
          headers: this.getHeaders()
        });
        if (!response.ok) {
           const text = await response.text();
           console.error(`Cloud API error for ${key} (${response.status}):`, text);
           throw new Error(`Cloud API unavailable: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error(`Invalid content type for ${key}: ${contentType}. Content:`, text.substring(0, 500));
          throw new Error('Expected JSON response but received something else');
        }

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
          headers: this.getHeaders(),
          body: JSON.stringify(item),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error(`Cloud Add Error for ${key} (${response.status}):`, text);
          throw new Error('Failed to save to cloud');
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error(`Invalid content type for POST ${key}: ${contentType}. Content:`, text.substring(0, 500));
          throw new Error('Expected JSON response');
        }
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
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error(`Cloud Update Error for ${key}/${id} (${response.status}):`, text);
          throw new Error('Update failed');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error(`Invalid content type for PUT ${key}: ${contentType}. Content:`, text.substring(0, 500));
          throw new Error('Expected JSON response');
        }
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
        const response = await fetch(`${this.baseUrl}/api/${key}/${id}`, { 
          method: 'DELETE',
          headers: this.getHeaders()
        });
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
