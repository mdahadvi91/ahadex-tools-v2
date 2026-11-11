/**
 * Web Worker entry for image compression. Receives one request at a
 * time, runs compression, and returns the result or an error.
 *
 * This file is bundled as a separate chunk by Vite when imported
 * with the `?worker` suffix (see engine/index.ts).
 */

/// <reference lib="webworker" />

import { compressImage } from './compressor';
import type { WorkerInbound, WorkerOutbound } from './worker.types';
import { isCompressRequest, isPingRequest } from './worker.types';

declare const self: DedicatedWorkerGlobalScope;

function post(msg: WorkerOutbound): void {
  self.postMessage(msg);
}

self.addEventListener('message', async (event: MessageEvent<WorkerInbound>) => {
  const message = event.data;

  if (isPingRequest(message)) {
    post({ kind: 'pong', id: message.id });
    return;
  }

  if (!isCompressRequest(message)) {
    post({
      kind: 'error',
      id: -1,
      code: 'internal',
      message: 'Unknown worker message kind.',
    });
    return;
  }

  try {
    const result = await compressImage(message.input);
    post({ kind: 'result', id: message.id, result });
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code: WorkerOutbound extends { code: infer C } ? C : string }).code
        : 'internal';
    const message =
      err instanceof Error ? err.message : 'Unknown error during compression.';
    post({
      kind: 'error',
      id: message && typeof message === 'string' ? (event.data as { id: number }).id : -1,
      code: code as 'decode-failed' | 'encode-failed' | 'canvas-unavailable' | 'unsupported-format' | 'internal',
      message: err instanceof Error ? err.message : 'Unknown error during compression.',
    });
  }
});
