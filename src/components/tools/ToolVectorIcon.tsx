/**
 * Consistent vector icon renderer for tool cards, sidebar, mobile menu, and grids.
 * Dual-tone geometric SVG paths with distinct per-tool color identities.
 */

import type { ToolVisualKind } from '../../lib/tool-display';

interface ToolVectorIconProps {
  kind: ToolVisualKind;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'h-7 w-7 rounded-md',
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-12 w-12 rounded-xl',
};

const ICON_SVG_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-6 w-6',
};

const TONE_CLASSES: Record<ToolVisualKind, string> = {
  compress: 'bg-blue-600/10 text-blue-600 border-blue-200/80',
  resize: 'bg-indigo-600/10 text-indigo-600 border-indigo-200/80',
  merge: 'bg-orange-500/10 text-orange-600 border-orange-200/80',
  split: 'bg-rose-500/10 text-rose-600 border-rose-200/80',
  image: 'bg-sky-500/10 text-sky-600 border-sky-200/80',
  pdf: 'bg-emerald-600/10 text-emerald-600 border-emerald-200/80',
};

export default function ToolVectorIcon({ kind, size = 'md' }: ToolVectorIconProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center border transition-transform duration-200 ease-out group-hover:scale-105 ${SIZE_CLASSES[size]} ${TONE_CLASSES[kind]}`}
      aria-hidden="true"
    >
      <svg
        className={ICON_SVG_CLASSES[size]}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        {kind === 'compress' && (
          <>
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="4"
              fill="currentColor"
              fillOpacity="0.14"
              stroke="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7"
            />
          </>
        )}
        {kind === 'resize' && (
          <>
            <rect
              x="5"
              y="5"
              width="14"
              height="14"
              rx="3"
              fill="currentColor"
              fillOpacity="0.14"
              stroke="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
            />
          </>
        )}
        {kind === 'merge' && (
          <>
            <rect
              x="3"
              y="4"
              width="8"
              height="11"
              rx="2"
              fill="currentColor"
              fillOpacity="0.18"
              stroke="none"
            />
            <rect
              x="13"
              y="9"
              width="8"
              height="11"
              rx="2"
              fill="currentColor"
              fillOpacity="0.28"
              stroke="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7v10m0 0l-3-3m3 3l3-3m5-7v10m0 0l-3-3m3 3l3-3"
            />
          </>
        )}
        {kind === 'split' && (
          <>
            <rect
              x="3"
              y="6"
              width="7"
              height="12"
              rx="2"
              fill="currentColor"
              fillOpacity="0.18"
              stroke="none"
            />
            <rect
              x="14"
              y="6"
              width="7"
              height="12"
              rx="2"
              fill="currentColor"
              fillOpacity="0.18"
              stroke="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m-7-8h4m6 0h4M7 8l-3 4 3 4m10-8l3 4-3 4"
            />
          </>
        )}
        {kind === 'image' && (
          <>
            <rect
              x="3"
              y="4"
              width="18"
              height="16"
              rx="3"
              fill="currentColor"
              fillOpacity="0.14"
              stroke="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </>
        )}
        {kind === 'pdf' && (
          <>
            <rect
              x="3"
              y="3"
              width="8"
              height="8"
              rx="2"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="none"
            />
            <rect
              x="13"
              y="3"
              width="8"
              height="8"
              rx="2"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="none"
            />
            <rect
              x="3"
              y="13"
              width="8"
              height="8"
              rx="2"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="none"
            />
            <rect
              x="13"
              y="13"
              width="8"
              height="8"
              rx="2"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5v4H5m14 0h-4V5M5 15h4v4m10-4h-4v4"
            />
          </>
        )}
      </svg>
    </div>
  );
}
