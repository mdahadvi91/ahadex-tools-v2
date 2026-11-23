import { formatBytes } from '../../lib/format-bytes';

interface FilePreviewProps {
  name: string;
  size: number;
  mimeType: string;
  previewUrl?: string;
  onRemove?: () => void;
}

export default function FilePreview({
  name,
  size,
  mimeType,
  previewUrl,
  onRemove,
}: FilePreviewProps) {
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={`Preview of ${name}`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-slate-500 uppercase">
            {isPdf ? 'PDF' : (mimeType.split('/')[1]?.slice(0, 4) ?? 'FILE')}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{formatBytes(size)}</p>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
