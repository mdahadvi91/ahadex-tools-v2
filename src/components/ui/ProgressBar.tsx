/**
 * Determinate progress bar. Uses ARIA progressbar role.
 */

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  className = '',
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.max(0, Math.min(value, safeMax));
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
          {label && <span>{label}</span>}
          {showPercent && <span>{percent}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        aria-label={label ?? 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className="h-full bg-blue-600 transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
