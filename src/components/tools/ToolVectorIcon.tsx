/**
 * Consistent vector icon renderer for tool cards and featured grids.
 * Uses clean SVG paths instead of emoji characters.
 */

import type { ToolVisualKind } from '../../lib/tool-display';

interface ToolVectorIconProps {
  kind: ToolVisualKind;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

const TONE_CLASSES: Record<ToolVisualKind, string> = {
  compress: 'bg-brand-50 text-brand-600 border-brand-100',
  resize: 'bg-slate-100 text-slate-800 border-slate-200',
  merge: 'bg-amber-50 text-amber-700 border-amber-200',
  split: 'bg-rose-50 text-rose-700 border-rose-200',
  image: 'bg-sky-50 text-sky-700 border-sky-200',
  pdf: 'bg-red-50 text-red-700 border-red-200',
};

export default function ToolVectorIcon({ kind, size = 'md' }: ToolVectorIconProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border ${SIZE_CLASSES[size]} ${TONE_CLASSES[kind]}`}
      aria-hidden="true"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        {kind === 'compress' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7"
          />
        )}
        {kind === 'resize' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
          />
        )}
        {kind === 'merge' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7v10m0 0l-3-3m3 3l3-3m5-7v10m0 0l-3-3m3 3l3-3"
          />
        )}
        {kind === 'split' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m-7-8h4m6 0h4M7 8l-3 4 3 4m10-8l3 4-3 4"
          />
        )}
        {kind === 'image' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        )}
        {kind === 'pdf' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        )}
      </svg>
    </div>
  );
}
