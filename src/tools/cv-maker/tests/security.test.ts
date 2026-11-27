/**
 * Security tests for CV Maker. Verifies photo validation, item caps,
 * WinAnsi text sanitization against control characters/emojis, and safe filenames.
 */

import { describe, expect, it } from 'vitest';
import { createCvFormFromPreset } from '../data/professions';
import { getTemplateById } from '../data/templates';
import {
  MAX_EDUCATION_ITEMS,
  MAX_EXPERIENCE_ITEMS,
  MAX_PHOTO_BYTES,
  MAX_SKILLS_COUNT,
  buildSafePdfFilename,
  generateCvPdf,
  sanitizePdfText,
  validateCvFormData,
  validateProfilePhotoFile,
} from '../engine';

describe('cv-maker security & boundary enforcement', () => {
  it('rejects non-image, empty, and oversized photo uploads', () => {
    expect(validateProfilePhotoFile({ name: 'empty.jpg', size: 0, type: 'image/jpeg' }).valid).toBe(
      false,
    );
    expect(
      validateProfilePhotoFile({ name: 'huge.png', size: MAX_PHOTO_BYTES + 1, type: 'image/png' })
        .valid,
    ).toBe(false);
    expect(
      validateProfilePhotoFile({ name: 'payload.html', size: 512, type: 'text/html' }).valid,
    ).toBe(false);
    expect(
      validateProfilePhotoFile({ name: 'xss.svg', size: 512, type: 'image/svg+xml' }).valid,
    ).toBe(false);
    expect(
      validateProfilePhotoFile({ name: 'avatar.webp', size: 2048, type: 'image/webp' }).valid,
    ).toBe(true);
  });

  it('enforces caps on experience entries, education entries, and skills', () => {
    const base = createCvFormFromPreset('software-engineer');

    const tooManyExps = {
      ...base,
      experiences: Array.from({ length: MAX_EXPERIENCE_ITEMS + 1 }, (_, i) => ({
        ...base.experiences[0],
        id: `exp-${i}`,
      })),
    };
    expect(validateCvFormData(tooManyExps).valid).toBe(false);

    const tooManyEdus = {
      ...base,
      educations: Array.from({ length: MAX_EDUCATION_ITEMS + 1 }, (_, i) => ({
        ...base.educations[0],
        id: `edu-${i}`,
      })),
    };
    expect(validateCvFormData(tooManyEdus).valid).toBe(false);

    const tooManySkills = {
      ...base,
      skills: Array.from({ length: MAX_SKILLS_COUNT + 1 }, (_, i) => `Skill ${i}`),
    };
    expect(validateCvFormData(tooManySkills).valid).toBe(false);
  });

  it('sanitizes path traversal filenames and WinAnsi-incompatible characters cleanly', async () => {
    expect(buildSafePdfFilename('../../etc/passwd')).toBe('etc-passwd-cv.pdf');
    expect(sanitizePdfText('Test\u0000\u0007 — Bold 🏆 Resume')).toBe('Test - Bold Resume');

    const data = createCvFormFromPreset('marketing-manager');
    data.personal.fullName = 'Elena 🚀 Vance\n<script>';
    data.summary = 'Lead marketer — built €2M pipeline 🎯 across EMEA.';
    const result = await generateCvPdf({
      data,
      template: getTemplateById('obsidian-rail'),
    });
    expect(result.bytes.byteLength).toBeGreaterThan(500);
  });
});
