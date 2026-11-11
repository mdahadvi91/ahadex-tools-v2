/**
 * Performance monitor that wires web-vitals and resource budget
 * into a single lifecycle.
 */

import { logger } from '../observability/logger';
import { isWithinBudget, measureUsage } from './resource-budget';
import { observeWebVitals, type Metric } from './web-vitals';

export interface MonitorOptions {
  onMetric?: (metric: Metric) => void;
}

export interface MonitorHandle {
  stop(): void;
}

export function startPerformanceMonitor(options: MonitorOptions = {}): MonitorHandle {
  const stopVitals = observeWebVitals((metric) => {
    logger.debug('web-vital', { name: metric.name, value: metric.value, rating: metric.rating });
    options.onMetric?.(metric);
  });

  const onLoad = (): void => {
    const usage = measureUsage();
    if (!isWithinBudget(usage)) {
      logger.warn('resource-budget-exceeded', {
        scriptBytes: usage.scriptBytes,
        totalBytes: usage.totalBytes,
      });
    }
  };

  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }
  }

  return {
    stop(): void {
      stopVitals();
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', onLoad);
      }
    },
  };
}
