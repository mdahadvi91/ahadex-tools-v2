/**
 * Accessible file dropzone.
 *
 * Supports:
 * - Native keyboard-accessible browse button
 * - Screen-reader accessible name
 * - Drag and drop
 * - Optional accessible hint
 *
 * File validation remains the responsibility of the caller.
 */

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

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
  const hintId = useId();
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null): void => {
    if (!list || list.length === 0) return;

    onChange(Array.from(list));
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleFiles(event.currentTarget.files);

    // Allows selecting the same file again.
    event.currentTarget.value = '';
  };

  const onDragOver = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    if (!disabled) {
      event.dataTransfer.dropEffect = 'copy';
      setDragging(true);
    }
  };

  const onDragLeave = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setDragging(false);

    if (disabled) return;

    handleFiles(event.dataTransfer.files);
  };

  const openBrowser = (): void => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        onClick={openBrowser}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${className}`}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M12 16V4m0 0L7 9m5-5l5 5M4 20h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span className="text-sm font-medium text-gray-900">
          Drop {multiple ? 'files' : 'a file'} here, or click to browse
        </span>

        {hint && (
          <span
            id={hintId}
            className="text-xs text-gray-500"
          >
            {hint}
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        aria-label={multiple ? 'Choose files to upload' : 'Choose a file to upload'}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onInputChange}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />
    </div>
  );
}
