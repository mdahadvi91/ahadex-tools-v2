/**
 * Resource cleanup helpers to prevent leaks: object URLs, timers,
 * pending async work.
 */

/**
 * Revokes a single object URL. Safe to call with null or undefined.
 */
export function disposeObjectUrl(url: string | null | undefined): void {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Revokes several object URLs, skipping invalid entries.
 */
export function disposeAll(...urls: Array<string | null | undefined>): void {
  for (const url of urls) disposeObjectUrl(url);
}

/**
 * Tracks timers for later disposal. Useful in React effects where the
 * effect may unmount before a timer fires.
 */
export class TimerRegistry {
  private ids = new Set<ReturnType<typeof setTimeout>>();

  setTimeout(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.ids.delete(id);
      fn();
    }, ms);
    this.ids.add(id);
    return id;
  }

  clear(id: ReturnType<typeof setTimeout>): void {
    if (this.ids.delete(id)) clearTimeout(id);
  }

  dispose(): void {
    for (const id of this.ids) clearTimeout(id);
    this.ids.clear();
  }
}

/**
 * Runs `fn` and guarantees `cleanup` is called afterwards, even if
 * `fn` throws. Returns whatever `fn` returns.
 */
export function withCleanup<T>(fn: () => T, cleanup: () => void): T {
  try {
    return fn();
  } finally {
    cleanup();
  }
}
