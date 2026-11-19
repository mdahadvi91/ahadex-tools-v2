/**
 * Toast container and API. Toasts auto-dismiss and announce via
 * aria-live. This module owns a small event bus.
 */

import { useEffect, useState } from 'react';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l([...items]);
}

export function showToast(message: string, kind: ToastKind = 'info'): number {
  const id = nextId++;
  items = [...items, { id, message, kind }];
  emit();
  setTimeout(() => dismissToast(id), 4000);
  return id;
}

export function dismissToast(id: number): void {
  items = items.filter((t) => t.id !== id);
  emit();
}

const KIND_STYLES: Record<ToastKind, string> = {
  info: 'bg-gray-900 text-white',
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
};

export default function ToastContainer() {
  const [list, setList] = useState<ToastItem[]>(items);

  useEffect(() => {
    const listener: Listener = (next) => setList(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto rounded-md px-4 py-2 text-sm shadow-lg ${KIND_STYLES[t.kind]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
