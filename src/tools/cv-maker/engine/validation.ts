/**
 * Validation and WinAnsi PDF text sanitization helpers for CV Maker.
 */

import type { CvFormData, CvValidationResult } from '../types';

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_EXPERIENCE_ITEMS = 15;
export const MAX_EDUCATION_ITEMS = 15;
export const MAX_SKILLS_COUNT = 40;
export const ALLOWED_PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Normalizes typography and strips characters outside WinAnsi encoding
 * so pdf-lib standard fonts never throw encoding errors.
 */
export function sanitizePdfText(raw: string): string {
  if (!raw) return '';
  const replaced = raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\u2014|\u2013|\u2212/g, '-')
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u25CF\u25E6]/g, '*')
    .replace(/\u00B7/g, '|')
    .replace(/\u00A0/g, ' ');

  // Strip combining diacritics after NFKD decomposition if outside Latin-1, while keeping readable ASCII/WinAnsi
  let out = '';
  for (const ch of replaced) {
    const code = ch.charCodeAt(0);
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) {
      out += ch;
    } else {
      const decomposed = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      for (const d of decomposed) {
        const dc = d.charCodeAt(0);
        if (dc >= 0x20 && dc <= 0x7e) {
          out += d;
        }
      }
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Wraps sanitized text into lines that fit comfortably within maxWidth points,
 * using an injected measure function (from pdf-lib font or approximate test width).
 */
export function wrapTextLines(
  text: string,
  maxWidth: number,
  measureWidth: (candidate: string) => number,
): string[] {
  const clean = sanitizePdfText(text);
  if (!clean) return [];
  const safeMax = Math.max(40, maxWidth);
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureWidth(candidate) <= safeMax) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      // Handle overly long unbroken tokens (URLs, emails) cleanly
      if (measureWidth(word) > safeMax) {
        let chunk = '';
        for (const ch of word) {
          const nextChunk = chunk + ch;
          if (measureWidth(nextChunk) <= safeMax) {
            chunk = nextChunk;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }

  if (current) {
    lines.push(current);
  }
  return lines;
}

export function extractInitials(fullName: string): string {
  const clean = sanitizePdfText(fullName);
  if (!clean) return 'CV';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function buildSafePdfFilename(fullName: string): string {
  const clean = sanitizePdfText(fullName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${clean || 'curriculum-vitae'}-cv.pdf`;
}

export function validateProfilePhotoFile(file: {
  name: string;
  size: number;
  type: string;
}): CvValidationResult {
  if (!file || file.size <= 0) {
    return { valid: false, reason: 'Selected photo file is empty.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { valid: false, reason: 'Profile photo must be 10 MB or smaller.' };
  }
  const mime = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const validByExt = ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp';
  if (!ALLOWED_PHOTO_MIME_TYPES.has(mime) && !validByExt) {
    return { valid: false, reason: 'Please choose a JPG, PNG, or WebP portrait image.' };
  }
  return { valid: true };
}

export function validateCvFormData(data: CvFormData): CvValidationResult {
  const name = sanitizePdfText(data.personal.fullName);
  if (!name) {
    return { valid: false, reason: 'Please enter your full name before exporting your CV PDF.' };
  }
  if (name.length > 120) {
    return { valid: false, reason: 'Full name must be 120 characters or fewer.' };
  }
  if (data.experiences.length > MAX_EXPERIENCE_ITEMS) {
    return {
      valid: false,
      reason: `Please keep work experience entries to ${MAX_EXPERIENCE_ITEMS} or fewer.`,
    };
  }
  if (data.educations.length > MAX_EDUCATION_ITEMS) {
    return {
      valid: false,
      reason: `Please keep education entries to ${MAX_EDUCATION_ITEMS} or fewer.`,
    };
  }
  if (data.skills.length > MAX_SKILLS_COUNT) {
    return { valid: false, reason: `Please keep skills to ${MAX_SKILLS_COUNT} or fewer.` };
  }
  return { valid: true };
}
