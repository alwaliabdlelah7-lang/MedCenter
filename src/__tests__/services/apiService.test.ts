import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../../services/apiService';

describe('APIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiService', () => {
    it('should be a defined instance', () => {
      expect(apiService).toBeDefined();
      expect(typeof apiService.request).toBe('function');
    });
  });

  describe('ApiService class', () => {
    it('should have required methods', () => {
      expect(typeof apiService.request).toBe('function');
      expect(typeof apiService.get).toBe('function');
      expect(typeof apiService.post).toBe('function');
      expect(typeof apiService.put).toBe('function');
      expect(typeof apiService.delete).toBe('function');
    });
  });

  describe('request method', () => {
    it('should handle different HTTP methods', () => {
      expect(apiService.get).toBeDefined();
      expect(apiService.post).toBeDefined();
      expect(apiService.put).toBeDefined();
      expect(apiService.delete).toBeDefined();
    });
  });
});
