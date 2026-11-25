/**
 * Public engine API for the Image Resizer tool.
 */

import type { WorkerInbound, WorkerOutbound } from './worker.types';
import type { ResizeInput, ResizeResult } from '../types';

// Vite native worker import — browser-only chunk
import ResizeWorkerClass from './worker?worker';

// SSR-safe worker factory
let ResizeWorker: new () => Worker;

if (typeof window === 'undefined' || typeof Worker === 'undefined') {
  // SSR / Node: dummy worker
  ResizeWorker = class DummyWorker implements Worker {
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
  ResizeWorker = ResizeWorkerClass as unknown as new () => Worker;
}

export class ImageResizerEngine {
  private worker: Worker;
  private nextId = 1;
  private disposed = false;
  private pending = new Map<
    number,
    { resolve: (r: ResizeResult) => void; reject: (e: Error) => void }
  >();

  private readonly onMessage = (event: MessageEvent<WorkerOutbound>): void => {
    this.handleMessage(event.data);
  };

  private readonly onError = (event: ErrorEvent): void => {
    this.rejectAllPending(new Error(`Worker error: ${event.message || 'Unknown worker error'}`));
  };

  private readonly onMessageError = (): void => {
    this.rejectAllPending(new Error('Worker messageerror: could not deserialize worker payload.'));
  };

  constructor(workerInstance?: Worker) {
    this.worker = workerInstance ?? new ResizeWorker();
    this.worker.addEventListener('message', this.onMessage as EventListener);
    this.worker.addEventListener('error', this.onError as EventListener);
    this.worker.addEventListener('messageerror', this.onMessageError as EventListener);
  }

  private rejectAllPending(error: Error): void {
    for (const { reject } of this.pending.values()) {
      reject(error);
    }
    this.pending.clear();
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
    if (this.disposed) {
      throw new Error('ImageResizerEngine has already been disposed.');
    }

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

  async ping(timeoutMs = 3000): Promise<boolean> {
    if (this.disposed) return false;

    const id = this.nextId++;
    const message: WorkerInbound = { kind: 'ping', id };
    return new Promise<boolean>((resolve) => {
      let settled = false;

      const finish = (ok: boolean): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.worker.removeEventListener('message', onPong as EventListener);
        this.worker.removeEventListener('error', onFailure as EventListener);
        this.worker.removeEventListener('messageerror', onFailure as EventListener);
        resolve(ok);
      };

      const onPong = (event: MessageEvent<WorkerOutbound>): void => {
        if (event.data?.kind === 'pong' && event.data.id === id) {
          finish(true);
        }
      };

      const onFailure = (): void => {
        finish(false);
      };

      const timer = setTimeout(() => finish(false), timeoutMs);
      this.worker.addEventListener('message', onPong as EventListener);
      this.worker.addEventListener('error', onFailure as EventListener);
      this.worker.addEventListener('messageerror', onFailure as EventListener);

      try {
        this.worker.postMessage(message);
      } catch {
        finish(false);
      }
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.rejectAllPending(new Error('Engine disposed before completion.'));
    this.worker.removeEventListener('message', this.onMessage as EventListener);
    this.worker.removeEventListener('error', this.onError as EventListener);
    this.worker.removeEventListener('messageerror', this.onMessageError as EventListener);
    this.worker.terminate();
  }
}

export function createEngine(): ImageResizerEngine {
  return new ImageResizerEngine();
}

export type { ResizeInput, ResizeResult } from '../types';
