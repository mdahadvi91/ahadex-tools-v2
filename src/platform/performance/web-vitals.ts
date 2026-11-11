/**
 * Web Vitals collection via PerformanceObserver. No dependency on
 * web-vitals package; observes LCP, CLS, FID/INP where available.
 */

export type MetricName = 'LCP' | 'CLS' | 'FID' | 'INP' | 'TTFB';

export interface Metric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const THRESHOLDS: Record<MetricName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
};

function rate(name: MetricName, value: number): Metric['rating'] {
  const t = THRESHOLDS[name];
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
}

type ReportHandler = (metric: Metric) => void;

export function observeWebVitals(onReport: ReportHandler): () => void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return () => {};
  }

  const observers: PerformanceObserver[] = [];

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          onReport({ name: 'LCP', value: entry.startTime, rating: rate('LCP', entry.startTime) });
        } else if (entry.entryType === 'layout-shift') {
          const shift = (entry as PerformanceEntry & { value: number }).value;
          onReport({ name: 'CLS', value: shift, rating: rate('CLS', shift) });
        } else if (entry.entryType === 'first-input') {
          const delay = (entry as PerformanceEntry & { processingStart: number }).processingStart - entry.startTime;
          onReport({ name: 'FID', value: delay, rating: rate('FID', delay) });
        }
      }
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    po.observe({ type: 'layout-shift', buffered: true });
    po.observe({ type: 'first-input', buffered: true });
    observers.push(po);
  } catch {
    // Browser may not support some entry types; continue.
  }

  return () => {
    for (const o of observers) o.disconnect();
  };
}
