/**
 * Inline error message with accessible alert role.
 */

import type { ReactNode } from 'react';

interface ErrorMessageProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function ErrorMessage({
  title = 'Something went wrong',
  children,
  className = '',
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 ${className}`}
    >
      <p className="font-semibold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
