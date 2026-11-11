/**
 * Loading spinner. Accessible via role="status" and sr-only label.
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export default function Spinner({ size = 'md', label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={`inline-block ${className}`}>
      <span
        className={`block animate-spin rounded-full border-gray-200 border-t-blue-600 ${SIZES[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
