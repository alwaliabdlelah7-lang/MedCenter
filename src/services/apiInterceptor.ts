/**
 * API Interceptor Middleware
 * Provides request and response interceptor chains for API operations
 */

import { errorService } from './errorService';

export interface InterceptorContext {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

export type RequestInterceptor = (context: InterceptorContext) => InterceptorContext | Promise<InterceptorContext>;
export interface ResponseContext extends InterceptorContext {
  response: Response;
}
export type ResponseInterceptor = (context: ResponseContext) => ResponseContext | Promise<ResponseContext>;
export interface ErrorContext extends InterceptorContext {
  error: Error;
}
export type ErrorInterceptor = (context: ErrorContext) => void | Promise<void>;

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  private constructor() {}

  public static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
      ApiInterceptor.instance.setupDefaultInterceptors();
    }
    return ApiInterceptor.instance;
  }

  /**
   * Add a request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor
   */
  public addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Execute request interceptors
   */
  public async executeRequestInterceptors(context: InterceptorContext): Promise<InterceptorContext> {
    let result = context;
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Execute response interceptors
   */
  public async executeResponseInterceptors(
    context: ResponseContext
  ): Promise<ResponseContext> {
    let result = context;
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Execute error interceptors
   */
  public async executeErrorInterceptors(
    context: ErrorContext
  ): Promise<void> {
    for (const interceptor of this.errorInterceptors) {
      try {
        await interceptor(context);
      } catch (error) {
        errorService.error('Error in error interceptor', {}, error as Error);
      }
    }
  }

  /**
   * Setup default interceptors
   */
  private setupDefaultInterceptors() {
    // Default request interceptor: Add auth headers
    this.addRequestInterceptor(async (context) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        context.headers = {
          ...context.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return context;
    });

    // Default response interceptor: Log successful requests
    this.addResponseInterceptor(async (context: ResponseContext) => {
      errorService.debug('API request successful', {
        method: context.method,
        url: context.url,
        status: context.response.status
      });
      return context;
    });

    // Default error interceptor: Log errors
    this.addErrorInterceptor(async (context) => {
      errorService.error('API request failed', {
        method: context.method,
        url: context.url
      }, context.error);
    });
  }

  /**
   * Clear all interceptors
   */
  public clearAll() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    this.setupDefaultInterceptors();
  }
}

export const apiInterceptor = ApiInterceptor.getInstance();
