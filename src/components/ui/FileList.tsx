import type { ReactNode } from 'react';
import { formatBytes } from '../../lib/format-bytes';

export interface FileListItem {
  id: string;
  name: string;
  size: number;
  status?: 'pending' | 'processing' | 'done' | 'error';
  meta?: string;
}

interface FileListProps {
  files: FileListItem[];
  onRemove?: (id: string) => void;
  renderExtra?: (item: FileListItem) => ReactNode;
}

export default function FileList({ files, onRemove, renderExtra }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {files.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">
              {formatBytes(item.size)}
              {item.meta ? ` · ${item.meta}` : ''}
              {item.status ? ` · ${item.status}` : ''}
            </p>
          </div>
          {renderExtra ? renderExtra(item) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
