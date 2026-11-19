/**
 * Web Worker entry for image resizing.
 */

/// <reference lib="webworker" />

import { resizeImage } from './resizer';
import type { WorkerInbound, WorkerOutbound } from './worker.types';
import { isPingRequest, isResizeRequest } from './worker.types';

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

  if (!isResizeRequest(message)) {
    post({
      kind: 'error',
      id: -1,
      code: 'internal',
      message: 'Unknown worker message kind.',
    });
    return;
  }

  try {
    const result = await resizeImage(message.input);
    post({ kind: 'result', id: message.id, result });
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? ((err as { code: WorkerOutbound extends { code: infer C } ? C : string }).code as
            | 'decode-failed'
            | 'encode-failed'
            | 'canvas-unavailable'
            | 'unsupported-format'
            | 'invalid-dimensions'
            | 'internal')
        : 'internal';
    post({
      kind: 'error',
      id: message.id,
      code,
      message: err instanceof Error ? err.message : 'Unknown error during resize.',
    });
  }
});
