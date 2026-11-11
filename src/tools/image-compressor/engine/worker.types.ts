/**
 * Worker message types for the Image Compressor engine. Shared
 * between the main thread (client) and the Web Worker (handler).
 *
 * Messages are plain objects so they cross the structured-clone
 * boundary without special handling.
 */

import type {
  CompressionInput,
  CompressionResult,
  WorkerErrorCode,
} from '../types';

/** Request from the main thread to the worker. */
export type WorkerInbound =
  | { kind: 'compress'; id: number; input: CompressionInput }
  | { kind: 'ping'; id: number };

/** Response from the worker to the main thread. */
export type WorkerOutbound =
  | { kind: 'result'; id: number; result: CompressionResult }
  | { kind: 'error'; id: number; code: WorkerErrorCode; message: string }
  | { kind: 'pong'; id: number };

/**
 * Narrowing helpers to keep handlers readable and strictly typed.
 */
export function isCompressRequest(
  msg: WorkerInbound,
): msg is Extract<WorkerInbound, { kind: 'compress' }> {
  return msg.kind === 'compress';
}

export function isPingRequest(
  msg: WorkerInbound,
): msg is Extract<WorkerInbound, { kind: 'ping' }> {
  return msg.kind === 'ping';
}
