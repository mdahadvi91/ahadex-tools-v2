/**
 * Minimal cookie read/write/delete helper.
 * Does not interact with consent; consent gating lives in
 * consent-manager.ts.
 */

export interface CookieOptions {
  /** Days until expiry. Omit for a session cookie. */
  maxAgeDays?: number;
  /** Cookie path. Default "/". */
  path?: string;
  /** SameSite attribute. Default "Lax". */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** Sets Secure. Default true in production-like URLs. */
  secure?: boolean;
}

function isHttps(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return null;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  const parts: string[] = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? '/'}`,
    `SameSite=${options.sameSite ?? 'Lax'}`,
  ];
  if (options.maxAgeDays !== undefined) {
    const seconds = Math.max(0, Math.floor(options.maxAgeDays * 86400));
    parts.push(`Max-Age=${seconds}`);
  }
  const secure = options.secure ?? isHttps();
  if (secure) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Max-Age=0; SameSite=Lax`;
}
