/**
 * Unified Data Service for Hospital Management System
 * Handles data persistence using Backend APIs with Firestore.
 */

class DataService {
  private static instance: DataService;
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Generic Get All
  public async getAll<T>(key: string): Promise<T[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${key}`);
      if (!response.ok) throw new Error('API unavailable');
      return await response.json();
    } catch (error) {
      console.warn(`Falling back to localStorage for ${key}`);
      const data = localStorage.getItem(`hospital_${key}`);
      return data ? JSON.parse(data) : [];
    }
  }

  // Generic Add Item
  public async addItem<T>(key: string, item: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to save to cloud');
    } catch (error) {
      console.error(error);
      const current = this.getLocalAll<T>(key);
      this.saveLocalAll(key, [...current, item]);
    }
  }

  // Generic Update Item
  public async updateItem<T extends { id?: string }>(key: string, id: string, updates: Partial<T>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${key}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Update failed');
    } catch (error) {
       // Local fallback
       const current = this.getLocalAll<T>(key);
       this.saveLocalAll(key, current.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  }

  // Generic Delete Item
  public async deleteItem<T extends { id?: string }>(key: string, id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${key}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
    } catch (error) {
      const current = this.getLocalAll<T>(key);
      this.saveLocalAll(key, current.filter(item => item.id !== id));
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
}

export const dataStore = DataService.getInstance();
