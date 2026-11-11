/**
 * Byte and file-size formatting utilities.
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Formats a byte count into a human-readable string.
 * Uses 1024-based units (KiB convention but labeled KB for readability).
 *
 * @param bytes - Non-negative byte count. Negative values return "0 B".
 * @param decimals - Fraction digits. Default 2, clamped to 0..3.
 * @returns e.g. "0 B", "1.00 KB", "1.5 MB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const d = Math.min(Math.max(Math.floor(decimals), 0), 3);
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), UNITS.length - 1);
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(d)} ${UNITS[i]}`;
}

/**
 * Parses a human-readable size string into bytes.
 * Supports "1.5 MB", "2GB", "512", "100 b" (case-insensitive).
 * Returns null for invalid input.
 */
export function parseBytes(input: string): number | null {
  const match = input.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) return null;

  const unit = (match[2] ?? 'B').toUpperCase();
  const index = UNITS.indexOf(unit as (typeof UNITS)[number]);
  if (index === -1) return null;

  return Math.round(value * Math.pow(1024, index));
}

/**
 * Returns true if `bytes` is a reasonable non-negative number.
 */
export function isValidByteCount(bytes: unknown): bytes is number {
  return typeof bytes === 'number' && Number.isFinite(bytes) && bytes >= 0;
}
