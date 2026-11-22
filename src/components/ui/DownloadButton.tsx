interface DownloadButtonProps {
  url: string;
  filename: string;
  label?: string;
  disabled?: boolean;
}

export default function DownloadButton({
  url,
  filename,
  label = 'Download',
  disabled = false,
}: DownloadButtonProps) {
  return (
    <a
      href={url}
      download={filename}
      aria-disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
        disabled
          ? 'cursor-not-allowed bg-slate-400'
          : 'bg-slate-900 hover:bg-slate-700'
      }`}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
      </svg>
      {label}
    </a>
  );
}
