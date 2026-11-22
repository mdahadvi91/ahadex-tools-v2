/**
 * Formats byte counts into human-readable binary (1024-based) strings.
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError(`Expected a non-negative finite byte count, received: ${String(bytes)}`);
  }

  if (bytes === 0) {
    return '0 B';
  }

  const safeDecimals = Math.max(0, Math.min(4, Math.floor(decimals)));
  const exponent = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  const formatted = exponent === 0 ? String(Math.round(value)) : value.toFixed(safeDecimals);

  return `${formatted} ${UNITS[exponent]}`;
}
