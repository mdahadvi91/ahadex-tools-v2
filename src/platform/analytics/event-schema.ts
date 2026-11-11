/**
 * Runtime schema validation for analytics events. Ensures the event
 * name is known and required fields are present with the right type.
 */

import { ANALYTICS_EVENTS, type EventPayloadMap } from './events';

type EventName = keyof EventPayloadMap;

const REQUIRED_FIELDS: Record<EventName, readonly string[]> = {
  page_view: ['path', 'title'],
  tool_open: ['toolId'],
  file_selected: ['toolId', 'fileType', 'fileSizeBucket'],
  processing_start: ['toolId', 'fileCount'],
  processing_success: ['toolId', 'durationMs'],
  processing_error: ['toolId', 'reason'],
  download_click: ['toolId'],
  consent_update: ['analytics', 'ads'],
  ad_impression: ['slot'],
};

const KNOWN_EVENTS = new Set<string>(Object.values(ANALYTICS_EVENTS));

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateEvent(
  name: string,
  payload: Record<string, unknown>,
): ValidationResult {
  if (!KNOWN_EVENTS.has(name)) {
    return { ok: false, reason: `Unknown event name: ${name}` };
  }
  const required = REQUIRED_FIELDS[name as EventName];
  for (const field of required) {
    if (!(field in payload)) {
      return { ok: false, reason: `Missing field "${field}" for ${name}` };
    }
  }
  return { ok: true };
}
