/**
 * Helpers that enforce data minimization in analytics events and
 * logs: strip PII, cap string lengths, and reduce objects to allow
 * lists.
 */

const PII_KEY_PATTERN = /^(email|phone|name|fullname|firstname|lastname|address|ip|userid|sessionid|token|password|ssn|dob)$/i;
const MAX_STRING_LENGTH = 200;

export function isPiiKey(key: string): boolean {
  return PII_KEY_PATTERN.test(key);
}

/**
 * Truncates a string to a safe max length and appends an ellipsis
 * character indicator if it was truncated.
 */
export function truncateString(value: string, max = MAX_STRING_LENGTH): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

/**
 * Recursively strips PII-looking keys and truncates long strings.
 * Returns a new object; the input is not mutated.
 */
export function minimize<T>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(walk);
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(source)) {
      if (isPiiKey(key)) continue;
      out[key] = walk(child);
    }
    return out;
  }
  return undefined;
}
