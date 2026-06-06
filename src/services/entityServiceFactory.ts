/**
 * Entity Service Factory
 * Provides a factory pattern for creating entity-specific services with CRUD operations
 */

import { dataStore } from './dataService';
import { errorService } from './errorService';

export interface BaseEntity {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EntityService<T extends BaseEntity> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  subscribe(callback: (items: T[]) => void): () => void;
}

/**
 * Create an entity service with standard CRUD operations
 */
export function createEntityService<T extends BaseEntity>(
  collectionName: string
): EntityService<T> {
  return {
    async getAll(): Promise<T[]> {
      try {
        const items = await dataStore.getAll<T>(collectionName);
        errorService.debug(`Retrieved ${items.length} items from ${collectionName}`);
        return items;
      } catch (error) {
        errorService.error(
          `Failed to fetch ${collectionName}`,
          { collection: collectionName },
          error as Error
        );
        throw error;
      }
    },

    async getById(id: string): Promise<T | null> {
      try {
        const items = await dataStore.find<T>(collectionName, { id } as any);
        if (items.length === 0) {
          errorService.warn(`Item ${id} not found in ${collectionName}`);
          return null;
        }
        return items[0];
      } catch (error) {
        errorService.error(
          `Failed to fetch ${collectionName} item ${id}`,
          { collection: collectionName, id },
          error as Error
        );
        throw error;
      }
    },

    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      try {
        const now = new Date().toISOString();
        const itemWithMetadata = {
          ...data,
          createdAt: now,
          updatedAt: now
        } as T;

        const id = await dataStore.addItem<T>(collectionName, itemWithMetadata);
        const newItem = { ...itemWithMetadata, id } as T;

        errorService.info(
          `Created new ${collectionName} item`,
          { collection: collectionName, id }
        );

        return newItem;
      } catch (error) {
        errorService.error(
          `Failed to create ${collectionName} item`,
          { collection: collectionName },
          error as Error
        );
        throw error;
      }
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      try {
        const now = new Date().toISOString();
        const updateData = {
          ...data,
          updatedAt: now
        };

        await dataStore.updateItem(collectionName, id, updateData);
        const items = await dataStore.find<T>(collectionName, { id } as any);

        if (items.length === 0) {
          throw new Error(`Item ${id} not found after update`);
        }

        errorService.info(
          `Updated ${collectionName} item`,
          { collection: collectionName, id }
        );

        return items[0];
      } catch (error) {
        errorService.error(
          `Failed to update ${collectionName} item ${id}`,
          { collection: collectionName, id },
          error as Error
        );
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await dataStore.deleteItem(collectionName, id);
        errorService.info(
          `Deleted ${collectionName} item`,
          { collection: collectionName, id }
        );
      } catch (error) {
        errorService.error(
          `Failed to delete ${collectionName} item ${id}`,
          { collection: collectionName, id },
          error as Error
        );
        throw error;
      }
    },

    subscribe(callback: (items: T[]) => void): () => void {
      try {
        return dataStore.subscribeToCollection<T>(collectionName, callback);
      } catch (error) {
        errorService.error(
          `Failed to subscribe to ${collectionName}`,
          { collection: collectionName },
          error as Error
        );
        return () => {}; // Return no-op unsubscribe
      }
    }
  };
}

/**
 * Create specialized entity services for common entities
 */

// Patients Service
export const patientsService = createEntityService<any>('patients');

// Doctors Service
export const doctorsService = createEntityService<any>('doctors');

// Appointments Service
export const appointmentsService = createEntityService<any>('appointments');

// Clinical Visits Service
export const clinicalVisitsService = createEntityService<any>('clinicalVisits');

// Pharmacy Items Service
export const pharmacyService = createEntityService<any>('pharmacy');

// Laboratory Service
export const labService = createEntityService<any>('laboratory');

// Radiology Service
export const radiologyService = createEntityService<any>('radiology');

// Transactions Service
export const transactionsService = createEntityService<any>('transactions');

// Users Service
export const usersService = createEntityService<any>('users');

// Nurses Service
export const nursesService = createEntityService<any>('nurses');

// Departments Service
export const departmentsService = createEntityService<any>('departments');

// Clinics Service
export const clinicsService = createEntityService<any>('clinics');
