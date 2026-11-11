/**
 * Displays a list of files with size and optional remove action.
 */

import { formatBytes } from '../../platform/utilities/format-bytes';

export interface FileListItem {
  id: string;
  name: string;
  size: number;
}

interface FileListProps {
  files: readonly FileListItem[];
  onRemove?: (id: string) => void;
  emptyMessage?: string;
  className?: string;
}

export default function FileList({
  files,
  onRemove,
  emptyMessage = 'No files selected.',
  className = '',
}: FileListProps) {
  if (files.length === 0) {
    return <p className={`text-sm text-gray-500 ${className}`}>{emptyMessage}</p>;
  }

  return (
    <ul
      className={`divide-y divide-gray-200 rounded-md border border-gray-200 bg-white ${className}`}
    >
      {files.map((file) => (
        <li key={file.id} className="flex items-center justify-between px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              aria-label={`Remove ${file.name}`}
              className="ml-3 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
