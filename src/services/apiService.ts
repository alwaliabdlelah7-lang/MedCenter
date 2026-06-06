/**
 * Centralized API Service Factory
 * Provides a unified interface for API operations with error handling and caching
 */

import { errorService, ErrorLevel } from './errorService';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheDuration?: number; // in milliseconds
}

class ApiService {
  private static instance: ApiService;
  private baseURL: string = '';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 3;

  private constructor(baseURL?: string) {
    this.baseURL = baseURL || '';
  }

  public static getInstance(baseURL?: string): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService(baseURL);
    }
    return ApiService.instance;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      cache = true,
      cacheDuration = 5 * 60 * 1000 // 5 minutes default
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${url}`;

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        errorService.debug('API cache hit', { endpoint, cacheKey });
        return {
          success: true,
          data: cached.data,
          timestamp: new Date().toISOString()
        };
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful GET responses
        if (method === 'GET' && cache) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const errorMessage = `API request failed: ${lastError?.message || 'Unknown error'}`;
    errorService.error(errorMessage, { endpoint, method }, lastError || undefined);

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  public async post<T>(
    endpoint: string,
    body?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  public async put<T>(
    endpoint: string,
    body?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  public async delete<T>(
    endpoint: string,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Clear cache
   */
  public clearCache() {
    this.cache.clear();
    errorService.debug('API cache cleared');
  }

  /**
   * Clear specific cache entry
   */
  public clearCacheEntry(endpoint: string, method: string = 'GET') {
    const cacheKey = `${method}:${this.baseURL}${endpoint}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const apiService = ApiService.getInstance();
