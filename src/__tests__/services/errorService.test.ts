import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorService } from '../../services/errorService';

describe('ErrorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      errorService.debug('Test debug message', { test: true });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      errorService.info('Test info message', { test: true });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      errorService.warn('Test warning message', { test: true });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages with error object', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const testError = new Error('Test error');
      errorService.error('Test error message', { test: true }, testError);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('critical', () => {
    it('should log critical messages', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const testError = new Error('Critical error');
      errorService.critical('Critical error message', { test: true }, testError);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
