/**
 * File dropzone: click to browse, drag to drop. Reports accepted files
 * via onChange. Does not enforce file limits itself; the caller
 * validates with platform/security/file-policy.
 */

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface DropzoneProps {
  accept?: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  disabled?: boolean;
  hint?: string;
  className?: string;
}

export default function Dropzone({
  accept,
  multiple = false,
  onChange,
  disabled = false,
  hint,
  className = '',
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null): void => {
    if (!list || list.length === 0) return;
    onChange(Array.from(list));
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const openBrowser = (): void => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={openBrowser}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openBrowser();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 16V4m0 0L7 9m5-5l5 5M4 20h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm font-medium text-gray-900">
        Drop {multiple ? 'files' : 'a file'} here, or click to browse
      </p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onInputChange}
        className="hidden"
      />
    </div>
  );
}
