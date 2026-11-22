/**
 * Client-side browser capability checks for local image and PDF processing.
 */

export interface BrowserCapabilities {
  readonly fileApi: boolean;
  readonly blobUrl: boolean;
  readonly webWorker: boolean;
  readonly canvas2d: boolean;
  readonly offscreenCanvas: boolean;
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  const hasWindow = typeof window !== 'undefined';
  const hasDocument = typeof document !== 'undefined';

  const fileApi =
    hasWindow && typeof File !== 'undefined' && typeof Blob !== 'undefined' && typeof FileReader !== 'undefined';

  const blobUrl =
    hasWindow &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' &&
    typeof URL.revokeObjectURL === 'function';

  const webWorker = typeof Worker !== 'undefined';

  let canvas2d = false;
  if (hasDocument && typeof HTMLCanvasElement !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas2d = typeof canvas.getContext === 'function' && canvas.getContext('2d') !== null;
    } catch {
      canvas2d = false;
    }
  }

  const offscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  return Object.freeze({
    fileApi,
    blobUrl,
    webWorker,
    canvas2d,
    offscreenCanvas,
  });
}

export function hasCoreProcessingSupport(
  caps: BrowserCapabilities = detectBrowserCapabilities(),
): boolean {
  return caps.fileApi && caps.blobUrl && (caps.canvas2d || caps.offscreenCanvas);
}
