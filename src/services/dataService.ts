/**
 * Unified Data Service for Hospital Management System
 * Handles data persistence using LocalStorage with hooks for future Firebase integration.
 */

class DataService {
  private static instance: DataService;
  
  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Generic Get All
  public getAll<T>(key: string): T[] {
    const data = localStorage.getItem(`hospital_${key}`);
    return data ? JSON.parse(data) : [];
  }

  // Generic Save All
  public saveAll<T>(key: string, data: T[]): void {
    localStorage.setItem(`hospital_${key}`, JSON.stringify(data));
  }

  // Generic Add Item
  public addItem<T>(key: string, item: T): void {
    const current = this.getAll<T>(key);
    this.saveAll(key, [...current, item]);
  }

  // Generic Delete Item by ID
  public deleteItem<T extends { id: string }>(key: string, id: string): void {
    const current = this.getAll<T>(key);
    this.saveAll(key, current.filter(item => item.id !== id));
  }

  // Generic Update Item
  public updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): void {
    const current = this.getAll<T>(key);
    this.saveAll(key, current.map(item => item.id === id ? { ...item, ...updates } : item));
  }
}

export const dataStore = DataService.getInstance();
