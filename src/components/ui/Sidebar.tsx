/**
 * Slide-in sidebar from left or right. Closes on Escape or backdrop click.
 */

import { useEffect, type ReactNode } from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  title: string;
  children: ReactNode;
}

export default function Sidebar({ open, onClose, side, title, children }: SidebarProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <aside
        className={`absolute top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transition-transform ${
          side === 'left' ? 'left-0' : 'right-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </aside>
    </div>
  );
}
