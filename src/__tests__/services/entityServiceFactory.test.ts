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

  describe('find', () => {
    it('should find items by criteria', async () => {
      const mockItems: TestEntity[] = [
        { id: '1', name: 'Test' },
      ];

      (dataStore.find as any).mockResolvedValue(mockItems);

      const result = await service.find({ name: 'Test' });
      expect(result).toEqual(mockItems);
      expect(dataStore.find).toHaveBeenCalled();
    });
  });

  describe('add', () => {
    it('should add a new item', async () => {
      const newItem: TestEntity = { id: '1', name: 'New Item' };
      (dataStore.addItem as any).mockResolvedValue('1');

      const result = await service.add(newItem);
      expect(result).toBe('1');
      expect(dataStore.addItem).toHaveBeenCalledWith('test-collection', expect.any(Object));
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
