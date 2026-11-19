/**
 * Worker message types for the Image Resizer engine.
 */

import type { ResizeInput, ResizeResult, WorkerErrorCode } from '../types';

export type WorkerInbound =
  { kind: 'resize'; id: number; input: ResizeInput } | { kind: 'ping'; id: number };

export type WorkerOutbound =
  | { kind: 'result'; id: number; result: ResizeResult }
  | { kind: 'error'; id: number; code: WorkerErrorCode; message: string }
  | { kind: 'pong'; id: number };

export function isResizeRequest(
  msg: WorkerInbound,
): msg is Extract<WorkerInbound, { kind: 'resize' }> {
  return msg.kind === 'resize';
}

export function isPingRequest(msg: WorkerInbound): msg is Extract<WorkerInbound, { kind: 'ping' }> {
  return msg.kind === 'ping';
}
