/**
 * Pluggable error reporter. Default is a no-op; a real provider
 * (Sentry, custom endpoint) can be injected later.
 */

import { normalizeError } from './error-handler';
import { logger } from './logger';

export interface ErrorReport {
  message: string;
  name: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface ErrorReporter {
  report(report: ErrorReport): void;
}

class NoopReporter implements ErrorReporter {
  report(): void {
    // intentionally empty
  }
}

let reporter: ErrorReporter = new NoopReporter();

export function setErrorReporter(next: ErrorReporter): void {
  reporter = next;
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const normalized = normalizeError(error);
  const report: ErrorReport = {
    message: normalized.message,
    name: normalized.name,
    stack: normalized.stack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
    context,
  };
  try {
    reporter.report(report);
  } catch (reportingError) {
    logger.error('Error reporter threw', { reportingError });
  }
}
