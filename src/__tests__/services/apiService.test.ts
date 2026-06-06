import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../../services/apiService';

describe('APIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = apiClient.getInstance();
      const instance2 = apiClient.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('setBaseURL', () => {
    it('should set the base URL', () => {
      const client = apiClient.getInstance();
      client.setBaseURL('https://api.example.com');
      expect(client.baseURL).toBe('https://api.example.com');
    });
  });

  describe('setDefaultHeader', () => {
    it('should set default headers', () => {
      const client = apiClient.getInstance();
      client.setDefaultHeader('Authorization', 'Bearer token');
      expect(client.getDefaultHeaders()['Authorization']).toBe('Bearer token');
    });
  });

  describe('request', () => {
    it('should handle network requests', async () => {
      const client = apiClient.getInstance();
      // Mock fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        } as Response)
      );

      const response = await client.request('GET', '/test');
      expect(response.data).toEqual({ data: 'test' });
    });

    it('should retry on network failure', async () => {
      const client = apiClient.getInstance();
      let attempts = 0;
      
      global.fetch = vi.fn(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
        } as Response);
      });

      const response = await client.request('GET', '/test', {}, 2);
      expect(attempts).toBe(2);
    });
  });
});
