/**
 * Centralized Error Handling Service
 * Provides consistent error handling and logging across the application
 */

export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorLog {
  timestamp: string;
  level: ErrorLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class ErrorService {
  private static instance: ErrorService;
  private logs: ErrorLog[] = [];
  private maxLogs = 1000;

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Log an error message with context
   */
  public log(level: ErrorLevel, message: string, context?: Record<string, any>, error?: Error) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === ErrorLevel.CRITICAL ? 'error' : level;
      console[consoleMethod as any](`[${level.toUpperCase()}] ${message}`, context);
    }

    return log;
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: Record<string, any>) {
    return this.log(ErrorLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context?: Record<string, any>) {
    return this.log(ErrorLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: Record<string, any>, error?: Error) {
    return this.log(ErrorLevel.WARN, message, context, error);
  }

  /**
   * Log error message
   */
  public error(message: string, context?: Record<string, any>, error?: Error) {
    return this.log(ErrorLevel.ERROR, message, context, error);
  }

  /**
   * Log critical error
   */
  public critical(message: string, context?: Record<string, any>, error?: Error) {
    return this.log(ErrorLevel.CRITICAL, message, context, error);
  }

  /**
   * Get all logs
   */
  public getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  public getLogsByLevel(level: ErrorLevel): ErrorLog[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  public clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const errorService = ErrorService.getInstance();
