export type PolicyViolationCode =
  'empty' | 'too-large' | 'invalid-type' | 'batch-too-large' | 'batch-empty';

export interface PolicyViolation {
  readonly code: PolicyViolationCode;
  readonly message: string;
}

export interface PolicyCheckResult {
  readonly ok: boolean;
  readonly valid: boolean;
  readonly violations: readonly PolicyViolation[];
}

export interface SingleFilePolicy {
  readonly maxBytes: number;
  readonly allowedMimeTypes: readonly string[];
}

export interface BatchFilePolicy extends SingleFilePolicy {
  readonly maxFiles: number;
  readonly maxTotalBytes?: number;
}

export type FilePolicyKindOrConfig = 'image' | 'pdf' | SingleFilePolicy;
export type BatchPolicyKindOrConfig = 'image' | 'pdf' | BatchFilePolicy;

const IMAGE_SINGLE_POLICY: SingleFilePolicy = {
  maxBytes: 25 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
};

const PDF_SINGLE_POLICY: SingleFilePolicy = {
  maxBytes: 50 * 1024 * 1024,
  allowedMimeTypes: ['application/pdf'],
};

const IMAGE_BATCH_POLICY: BatchFilePolicy = {
  ...IMAGE_SINGLE_POLICY,
  maxFiles: 20,
  maxTotalBytes: 150 * 1024 * 1024,
};

const PDF_BATCH_POLICY: BatchFilePolicy = {
  ...PDF_SINGLE_POLICY,
  maxFiles: 20,
  maxTotalBytes: 200 * 1024 * 1024,
};

function resolveSinglePolicy(policy: FilePolicyKindOrConfig): SingleFilePolicy {
  if (policy === 'image') return IMAGE_SINGLE_POLICY;
  if (policy === 'pdf') return PDF_SINGLE_POLICY;
  return policy;
}

function resolveBatchPolicy(policy: BatchPolicyKindOrConfig): BatchFilePolicy {
  if (policy === 'image') return IMAGE_BATCH_POLICY;
  if (policy === 'pdf') return PDF_BATCH_POLICY;
  return {
    ...policy,
    maxFiles: 'maxFiles' in policy ? policy.maxFiles : 20,
  };
}

export function validateSingleFile(
  file: File,
  policyInput: FilePolicyKindOrConfig = 'image',
): PolicyCheckResult {
  const policy = resolveSinglePolicy(policyInput);
  const violations: PolicyViolation[] = [];

  if (file.size <= 0) {
    violations.push({ code: 'empty', message: `${file.name} is empty.` });
  }
  if (file.size > policy.maxBytes) {
    violations.push({
      code: 'too-large',
      message: `${file.name} exceeds the maximum allowed file size.`,
    });
  }
  if (policy.allowedMimeTypes.length > 0 && !policy.allowedMimeTypes.includes(file.type)) {
    violations.push({
      code: 'invalid-type',
      message: `${file.name} has an unsupported file format.`,
    });
  }

  const valid = violations.length === 0;
  return { ok: valid, valid, violations };
}

export function validateBatch(
  files: readonly File[],
  policyInput: BatchPolicyKindOrConfig = 'image',
): PolicyCheckResult {
  const policy = resolveBatchPolicy(policyInput);
  const violations: PolicyViolation[] = [];

  if (files.length === 0) {
    violations.push({ code: 'batch-empty', message: 'No files selected.' });
  }
  if (files.length > policy.maxFiles) {
    violations.push({
      code: 'batch-too-large',
      message: `You can process at most ${policy.maxFiles} files at a time.`,
    });
  }

  let totalBytes = 0;
  for (const file of files) {
    totalBytes += file.size;
    const single = validateSingleFile(file, policy);
    for (const v of single.violations) {
      if (
        !violations.some((existing) => existing.code === v.code && existing.message === v.message)
      ) {
        violations.push(v);
      }
    }
  }

  if (policy.maxTotalBytes !== undefined && totalBytes > policy.maxTotalBytes) {
    violations.push({
      code: 'batch-too-large',
      message: 'Total batch size exceeds the allowed limit.',
    });
  }

  const valid = violations.length === 0;
  return { ok: valid, valid, violations };
}
