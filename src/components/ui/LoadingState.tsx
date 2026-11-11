/**
 * Full-area loading indicator with optional message.
 */

import Spinner from './Spinner';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({
  message = 'Loading...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}
    >
      <Spinner size="lg" label={message} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
