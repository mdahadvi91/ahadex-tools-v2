/**
 * Privacy gate for analytics payloads. Runs every event through
 * data-minimization before it leaves the app.
 */

import { minimize } from '../privacy/data-minimization';

const FORBIDDEN_KEYS = new Set([
  'email',
  'phone',
  'name',
  'ip',
  'userid',
  'token',
  'password',
]);

export function filterPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      return {};
    }
  }
  return minimize(payload) as Record<string, unknown>;
}
