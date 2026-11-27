import { describe, expect, it } from 'vitest';
import zlib from 'node:zlib';
import { PDFDocument } from 'pdf-lib';
import {
  BLANK_PROFESSION_PRESET,
  PROFESSION_PRESETS,
  createCvFormFromPreset,
} from '../data/professions';
import { CV_TEMPLATES, getTemplateById } from '../data/templates';
import {
  buildSafePdfFilename,
  extractInitials,
  generateCvPdf,
  sanitizePdfText,
  validateCvFormData,
  validateProfilePhotoFile,
  wrapTextLines,
} from '../engine';

function createMinimalPngBytes(): Uint8Array {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const makeChunk = (type: string, data: Buffer) => {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    const input = Buffer.concat([typeBuf, data]);
    let crc = 0xffffffff;
    for (const byte of input) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) {
        crc = (crc & 1) !== 0 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
      }
    }
    crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(4, 0);
  ihdr.writeUInt32BE(4, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((1 + 4 * 4) * 4);
  return new Uint8Array(
    Buffer.concat([
      signature,
      makeChunk('IHDR', ihdr),
      makeChunk('IDAT', zlib.deflateSync(raw)),
      makeChunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

describe('cv-maker templates and profession presets', () => {
  it('provides 30 unique CV templates spanning all 10 layout archetypes', () => {
    expect(CV_TEMPLATES.length).toBe(30);
    const ids = new Set(CV_TEMPLATES.map((t) => t.id));
    const names = new Set(CV_TEMPLATES.map((t) => t.name));
    const layouts = new Set(CV_TEMPLATES.map((t) => t.layout));
    expect(ids.size).toBe(30);
    expect(names.size).toBe(30);
    expect(layouts.size).toBe(10);
  });

  it('provides 12 curated profession presets plus custom starter and populates form cleanly', () => {
    expect(PROFESSION_PRESETS.length).toBe(12);
    expect(BLANK_PROFESSION_PRESET.id).toBe('custom-blank');

    for (const preset of PROFESSION_PRESETS) {
      const form = createCvFormFromPreset(preset.id);
      expect(form.professionId).toBe(preset.id);
      expect(form.summary.length).toBeGreaterThan(50);
      expect(form.experiences.length).toBeGreaterThanOrEqual(1);
      expect(form.educations.length).toBeGreaterThanOrEqual(1);
      expect(form.skills.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('cv-maker validation and text helpers', () => {
  it('normalizes WinAnsi punctuation, initials, and safe filenames', () => {
    expect(sanitizePdfText('Senior Lead — Q4 🚀 Summary')).toBe('Senior Lead - Q4 Summary');
    expect(extractInitials('Maria Elena Vance')).toBe('MV');
    expect(extractInitials('Samir')).toBe('SA');
    expect(buildSafePdfFilename('Dr. Elena Rostova!')).toBe('dr-elena-rostova-cv.pdf');
    expect(buildSafePdfFilename('')).toBe('curriculum-vitae-cv.pdf');
  });

  it('wraps long text cleanly without infinite loops on unbroken tokens', () => {
    const lines = wrapTextLines(
      'Built https://very-long-portfolio-domain.example.com/engineering/architecture',
      120,
      (s) => s.length * 6,
    );
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.every((line) => line.length * 6 <= 120)).toBe(true);
  });

  it('validates form data and portrait photo files accurately', () => {
    const data = createCvFormFromPreset('software-engineer');
    expect(validateCvFormData(data).valid).toBe(true);
    expect(
      validateCvFormData({ ...data, personal: { ...data.personal, fullName: '  ' } }).valid,
    ).toBe(false);
    expect(
      validateProfilePhotoFile({ name: 'portrait.jpg', size: 4096, type: 'image/jpeg' }).valid,
    ).toBe(true);
    expect(
      validateProfilePhotoFile({ name: 'vector.svg', size: 1024, type: 'image/svg+xml' }).valid,
    ).toBe(false);
  });
});

describe('cv-maker PDF generation engine', () => {
  it('generates valid A4 PDF documents across diverse template layouts', async () => {
    const layoutSampleIds = [
      'obsidian-rail', // left-sidebar
      'alabaster-margin', // right-sidebar
      'cobalt-banner', // split-banner
      'zurich-timeline', // timeline
      'swiss-grid', // minimal-swiss
      'monogram-studio', // monogram-corner
      'manhattan-ats', // classic-top
    ];

    const data = createCvFormFromPreset('product-designer');
    const pngPhoto = createMinimalPngBytes();

    for (const templateId of layoutSampleIds) {
      const template = getTemplateById(templateId);
      const result = await generateCvPdf({
        data,
        template,
        photoBytes: pngPhoto,
        photoMime: 'image/png',
      });

      expect(result.pageCount).toBeGreaterThanOrEqual(1);
      expect(result.outputSize).toBeGreaterThan(500);
      const loaded = await PDFDocument.load(result.bytes);
      expect(loaded.getPageCount()).toBe(result.pageCount);
      const { width, height } = loaded.getPage(0).getSize();
      expect(Math.round(width)).toBe(595);
      expect(Math.round(height)).toBe(842);
    }
  });

  it('automatically flows long histories onto multiple A4 pages', async () => {
    const base = createCvFormFromPreset('software-engineer');
    const longData = {
      ...base,
      experiences: Array.from({ length: 8 }, (_, idx) => ({
        id: `exp-long-${idx}`,
        role: `Principal Systems Engineer ${idx + 1}`,
        company: `Enterprise Systems Group ${idx + 1}`,
        location: 'London, UK',
        startDate: 'Jan 2020',
        endDate: 'Dec 2023',
        highlights: [
          'Architected resilient distributed event pipelines handling millions of daily messages across global edge nodes.',
          'Led quarterly latency and cost reduction reviews resulting in 35% compute savings without service degradation.',
        ],
      })),
      educations: Array.from({ length: 4 }, (_, idx) => ({
        id: `edu-long-${idx}`,
        degree: `Master Certificate in Distributed Computing ${idx + 1}`,
        school: `Technical Institute ${idx + 1}`,
        location: 'Zurich, Switzerland',
        graduationYear: `${2016 + idx}`,
        details: 'Graduated with Distinction and published systems thesis.',
      })),
    };

    const result = await generateCvPdf({
      data: longData,
      template: getTemplateById('manhattan-ats'),
    });

    expect(result.pageCount).toBeGreaterThanOrEqual(2);
    const loaded = await PDFDocument.load(result.bytes);
    expect(loaded.getPageCount()).toBe(result.pageCount);
  });
});
