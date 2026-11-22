/**
 * Public engine API for the Image Compressor tool.
 */

import type { WorkerInbound, WorkerOutbound } from './worker.types';
import type { CompressionInput, CompressionResult } from '../types';

// Vite native worker import — browser-only chunk
import CompressionWorkerClass from './worker?worker';

// SSR-safe worker factory
let CompressionWorker: new () => Worker;

if (typeof window === 'undefined' || typeof Worker === 'undefined') {
  // SSR / Node: dummy worker
  CompressionWorker = class DummyWorker implements Worker {
    onerror = null;
    onmessage = null;
    onmessageerror = null;
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
    terminate() {}
    dispatchEvent() {
      return true;
    }
  } as unknown as new () => Worker;
} else {
  // Browser: real worker
  CompressionWorker = CompressionWorkerClass as unknown as new () => Worker;
}

export class ImageCompressorEngine {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (r: CompressionResult) => void; reject: (e: Error) => void }
  >();

  constructor() {
    this.worker = new CompressionWorker();
    this.worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
      this.handleMessage(event.data);
    });
    this.worker.addEventListener('error', (event) => {
      for (const { reject } of this.pending.values()) {
        reject(new Error(`Worker error: ${event.message}`));
      }
      this.pending.clear();
    });
  }

  private handleMessage(msg: WorkerOutbound): void {
    if (msg.kind === 'pong') return;
    const pending = this.pending.get(msg.id);
    if (!pending) return;
    this.pending.delete(msg.id);

    if (msg.kind === 'result') {
      pending.resolve(msg.result);
    } else {
      pending.reject(new Error(`${msg.code}: ${msg.message}`));
    }
  }

  async compress(input: CompressionInput): Promise<CompressionResult> {
    const id = this.nextId++;
    const message: WorkerInbound = { kind: 'compress', id, input };

    return new Promise<CompressionResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        this.worker.postMessage(message);
      } catch (err) {
        this.pending.delete(id);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  async ping(): Promise<boolean> {
    const id = this.nextId++;
    const message: WorkerInbound = { kind: 'ping', id };
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 3000);
      const handler = (event: MessageEvent<WorkerOutbound>) => {
        if (event.data.kind === 'pong' && event.data.id === id) {
          clearTimeout(timer);
          this.worker.removeEventListener('message', handler);
          resolve(true);
        }
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage(message);
    });
  }

  dispose(): void {
    for (const { reject } of this.pending.values()) {
      reject(new Error('Engine disposed before completion.'));
    }
    this.pending.clear();
    this.worker.terminate();
  }
}

export function createEngine(): ImageCompressorEngine {
  return new ImageCompressorEngine();
}

export type { CompressionInput, CompressionResult } from '../types';
