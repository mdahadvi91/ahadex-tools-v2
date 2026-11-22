type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  label?: string;
  size?: SpinnerSize;
  className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-3.5 w-3.5 border-2',
  md: 'h-4 w-4 border-2',
  lg: 'h-6 w-6 border-2',
};

export default function Spinner({ label, size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 text-sm text-slate-600 ${className}`}
    >
      <span
        className={`${SIZE_CLASSES[size]} animate-spin rounded-full border-slate-300 border-t-blue-600`}
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
