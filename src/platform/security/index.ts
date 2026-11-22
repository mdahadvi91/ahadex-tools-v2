/**
 * Client-side file validation helpers for local browser processing.
 */

export interface FilePolicy {
  readonly maxBytes: number;
  readonly allowedMimeTypes: readonly string[];
}

export interface FileValidationResult {
  readonly ok: boolean;
  readonly error?: string;
}

export function validateFileAgainstPolicy(file: File, policy: FilePolicy): FileValidationResult {
  if (file.size <= 0) {
    return { ok: false, error: 'Selected file is empty.' };
  }

  if (file.size > policy.maxBytes) {
    return { ok: false, error: 'Selected file exceeds the maximum allowed size.' };
  }

  if (policy.allowedMimeTypes.length > 0 && !policy.allowedMimeTypes.includes(file.type)) {
    return { ok: false, error: 'Unsupported file format.' };
  }

  return { ok: true };
}
