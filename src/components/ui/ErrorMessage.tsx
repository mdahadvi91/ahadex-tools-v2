import type { ReactNode } from 'react';

interface ErrorMessageProps {
  title?: string;
  message?: string | null;
  children?: ReactNode;
}

export default function ErrorMessage({ title, message, children }: ErrorMessageProps) {
  const body = children ?? message;
  if (!body) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{body}</div>
    </div>
  );
}
