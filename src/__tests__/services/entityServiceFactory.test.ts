import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEntityService } from '../../services/entityServiceFactory';
import { dataStore } from '../../services/dataService';

// Mock dataStore
vi.mock('../../services/dataService', () => ({
  dataStore: {
    getAll: vi.fn(),
    find: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    subscribe: vi.fn(),
  },
}));

interface TestEntity {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

describe('EntityServiceFactory', () => {
  let service: ReturnType<typeof createEntityService<TestEntity>>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createEntityService<TestEntity>('test-collection');
  });

  describe('getAll', () => {
    it('should return all items', async () => {
      const mockItems: TestEntity[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      (dataStore.getAll as any).mockResolvedValue(mockItems);

      const result = await service.getAll();
      expect(result).toEqual(mockItems);
      expect(dataStore.getAll).toHaveBeenCalledWith('test-collection');
    });
  });

  describe('getById', () => {
    it('should get an item by id', async () => {
      const mockItem: TestEntity = { id: '1', name: 'Test' };

      (dataStore.find as any).mockResolvedValue([mockItem]);

      const result = await service.getById('1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'New Item' };
      (dataStore.addItem as any).mockResolvedValue('1');

      const result = await service.create(newItem as any);
      expect(result).toBeDefined();
      expect(dataStore.addItem).toHaveBeenCalledWith('test-collection', expect.any(Object));
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updates: Partial<TestEntity> = { name: 'Updated Name' };
      (dataStore.updateItem as any).mockResolvedValue(undefined);
      (dataStore.find as any).mockResolvedValue([{ id: '1', name: 'Updated Name' }]);

      const result = await service.update('1', updates);
      expect(result.name).toBe('Updated Name');
      expect(dataStore.updateItem).toHaveBeenCalledWith('test-collection', '1', expect.any(Object));
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      (dataStore.deleteItem as any).mockResolvedValue(undefined);

      await service.delete('1');
      expect(dataStore.deleteItem).toHaveBeenCalledWith('test-collection', '1');
    });
  });
});
