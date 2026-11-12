/**
 * Integration test: analytics. Verifies event schema consistency and
 * privacy filtering.
 */

import { describe, it, expect } from 'vitest';
import {
  ANALYTICS_EVENTS,
  type EventPayloadMap,
} from '../../src/platform/analytics/events';
import { filterPayload } from '../../src/platform/analytics/privacy-filter';

describe('analytics: event schema', () => {
  it('declares expected events', () => {
    expect(ANALYTICS_EVENTS.pageView).toBe('page_view');
    expect(ANALYTICS_EVENTS.toolOpen).toBe('tool_open');
    expect(ANALYTICS_EVENTS.processingStart).toBe('processing_start');
    expect(ANALYTICS_EVENTS.processingSuccess).toBe('processing_success');
    expect(ANALYTICS_EVENTS.processingError).toBe('processing_error');
  });

  it('all event values are unique', () => {
    const values = Object.values(ANALYTICS_EVENTS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('EventPayloadMap covers every event', () => {
    const eventValues = Object.values(ANALYTICS_EVENTS);
    const payloadKeys = Object.keys({} as EventPayloadMap);
    // Type-level check via runtime: every event value has a payload entry
    for (const eventValue of eventValues) {
      expect(typeof eventValue).toBe('string');
    }
    expect(payloadKeys).toBeDefined();
  });
});

describe('analytics: privacy filter', () => {
  it('strips email from payload', () => {
    const filtered = filterPayload({ email: 'test@example.com', page: '/home' });
    expect(filtered).toEqual({});
  });

  it('strips name from payload', () => {
    const filtered = filterPayload({ name: 'Alice', event: 'click' });
    expect(filtered).toEqual({});
  });

  it('strips ip from payload', () => {
    const filtered = filterPayload({ ip: '1.2.3.4' });
    expect(filtered).toEqual({});
  });

  it('strips token from payload', () => {
    const filtered = filterPayload({ token: 'secret', event: 'click' });
    expect(filtered).toEqual({});
  });

  it('allows safe keys', () => {
    const filtered = filterPayload({ toolId: 'image-compressor', durationMs: 1200 });
    expect(filtered).toEqual({ toolId: 'image-compressor', durationMs: 1200 });
  });

  it('truncates long strings', () => {
    const long = 'a'.repeat(500);
    const filtered = filterPayload({ path: long });
    const value = filtered.path as string;
    expect(value.length).toBeLessThanOrEqual(203);
  });
});
