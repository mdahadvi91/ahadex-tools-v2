/**
 * Timing-safe browser Blob download helper.
 *
 * Defers URL.revokeObjectURL() until after the browser has had time to read
 * the object URL (preventing truncated/failed downloads in Safari and mobile
 * browsers) while tracking timers for clean pagehide cleanup.
 */

const activeRevokeTimers = new Set<number>();

export const DEFAULT_REVOKE_DELAY_MS = 10_000;

export function triggerBlobDownload(
  blob: Blob,
  fileName: string,
  revokeDelayMs: number = DEFAULT_REVOKE_DELAY_MS,
): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  const timer = window.setTimeout(() => {
    activeRevokeTimers.delete(timer);
    URL.revokeObjectURL(url);
  }, revokeDelayMs);
  activeRevokeTimers.add(timer);
}

export function triggerStaggeredDownloads(
  items: ReadonlyArray<{ readonly blob: Blob; readonly fileName: string }>,
  intervalMs = 150,
): void {
  items.forEach((item, index) => {
    if (index === 0) {
      triggerBlobDownload(item.blob, item.fileName);
      return;
    }
    window.setTimeout(() => {
      triggerBlobDownload(item.blob, item.fileName);
    }, index * intervalMs);
  });
}
