/**
 * Provider adapter interface. Concrete providers (GA4, no-op)
 * implement this. The analytics.ts entry point delegates here.
 */

export interface AnalyticsProvider {
  readonly name: string;
  /** Called when consent for analytics is granted or on init. */
  init(): void;
  /** Track an event with sanitized payload. */
  track(eventName: string, payload: Record<string, unknown>): void;
  /** Track a page view. */
  pageView(path: string, title: string): void;
}

class NoopProvider implements AnalyticsProvider {
  readonly name = 'noop';
  init(): void {
    // intentionally empty
  }
  track(): void {
    // intentionally empty
  }
  pageView(): void {
    // intentionally empty
  }
}

let provider: AnalyticsProvider = new NoopProvider();

export function setAnalyticsProvider(next: AnalyticsProvider): void {
  provider = next;
  provider.init();
}

export function getAnalyticsProvider(): AnalyticsProvider {
  return provider;
}
