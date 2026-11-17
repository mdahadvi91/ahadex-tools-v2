/**
 * Public engine API for the Image Resizer tool.
 */

// Safe import for SSR (Node.js) and Browser (Vite)
let ResizeWorker: any;
if (typeof window === 'undefined') {
  ResizeWorker = class DummyWorker {
    constructor() {}
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
    terminate() {}
  };
} else {
  // @ts-ignore - Vite specific
  ResizeWorker = (await import('./worker?worker')).default;
}
import type { WorkerInbound, WorkerOutbound } from './worker.types';
import type { ResizeInput, ResizeResult } from '../types';

export class ImageResizerEngine {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (r: ResizeResult) => void; reject: (e: Error) => void }
  >();

  constructor() {
    this.worker = new ResizeWorker();
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

  async resize(input: ResizeInput): Promise<ResizeResult> {
    const id = this.nextId++;
    const message: WorkerInbound = { kind: 'resize', id, input };

    return new Promise<ResizeResult>((resolve, reject) => {
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

export function createEngine(): ImageResizerEngine {
  return new ImageResizerEngine();
}

export type { ResizeInput, ResizeResult } from '../types';
