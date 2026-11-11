/**
 * Centralized error normalization and handling.
 */

import { logger } from './logger';

export interface NormalizedError {
  message: string;
  name: string;
  stack?: string;
  cause?: unknown;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause,
    };
  }
  if (typeof error === 'string') {
    return { message: error, name: 'Error' };
  }
  return {
    message: 'Unknown error',
    name: 'UnknownError',
    cause: error,
  };
}

/**
 * Logs a normalized error and returns it.
 */
export function handleError(error: unknown, context?: Record<string, unknown>): NormalizedError {
  const normalized = normalizeError(error);
  logger.error(normalized.message, {
    name: normalized.name,
    stack: normalized.stack,
    ...context,
  });
  return normalized;
}

/**
 * Runs `fn` and returns its result, or null on error (after logging).
 * Useful for optional operations that must not break the caller.
 */
export function safeRun<T>(fn: () => T, context?: Record<string, unknown>): T | null {
  try {
    return fn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}
