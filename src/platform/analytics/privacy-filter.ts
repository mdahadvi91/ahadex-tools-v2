/**
 * Privacy gate for analytics payloads. Runs every event through
 * data-minimization before it leaves the app, AND strips PII keys
 * at the top level (including filename, which users may set to
 * personal info).
 */

import { minimize } from '../privacy/data-minimization';

/**
 * Keys stripped at the top level before minimization.
 * Includes file-related keys that users may set to personal info.
 */
const FORBIDDEN_TOP_LEVEL_KEYS = new Set([
  'email',
  'phone',
  'name',
  'ip',
  'ipaddress',
  'userid',
  'username',
  'sessionid',
  'token',
  'password',
  'filename',
  'file.name',
  'filecontent',
  'filedata',
  'content',
]);

function hasForbiddenKey(payload: Record<string, unknown>): boolean {
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_TOP_LEVEL_KEYS.has(key.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Filters an analytics payload:
 *   1. If any top-level key is forbidden (email, filename, etc.),
 *      the ENTIRE payload is dropped (returned as {}).
 *   2. Otherwise, the payload is minimized (strip nested PII,
 *      truncate strings).
 *
 * This conservative behavior means a single mistake in the tool
 * code cannot leak PII to analytics. Better to lose the event than
 * leak user data.
 */
export function filterPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (hasForbiddenKey(payload)) {
    return {};
  }
  return minimize(payload) as Record<string, unknown>;
}
