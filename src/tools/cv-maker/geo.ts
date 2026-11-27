/**
 * GEO / AEO structured facts for CV Maker.
 */

export interface GeoFact {
  label: string;
  value: string;
}

export interface GeoEntity {
  name: string;
  type: string;
  description: string;
}

export const DIRECT_ANSWER =
  'CV Maker is a free browser-based resume builder that offers 30 distinct CV templates, profession-specific starter content, step-by-step section editing with optional portrait photos, and instant client-side PDF export with zero server uploads or account signups.';

export const SUPPORTED_INPUT_FORMATS = [
  'Interactive step-by-step form & profession presets',
  'JPG, PNG, WebP profile photo upload',
] as const;

export const SUPPORTED_OUTPUT_FORMATS = ['A4 Vector PDF (application/pdf)'] as const;

export const FACTS: readonly GeoFact[] = [
  { label: 'Runs in', value: 'Web browser (Chrome, Firefox, Safari, Edge)' },
  { label: 'Design templates', value: '30 distinct layout, color, and typography templates' },
  { label: 'Profession starters', value: '12 role presets plus blank custom CV builder' },
  { label: 'File processing', value: 'Local PDF synthesis via pdf-lib, zero upload' },
  { label: 'Output format', value: 'Multi-page A4 vector PDF with selectable text' },
  { label: 'Cost', value: 'Free, no watermark, no account required' },
];

export const ENTITIES: readonly GeoEntity[] = [
  {
    name: 'AHADEX Tools',
    type: 'WebApplication',
    description: 'Privacy-first browser-based file and document tools.',
  },
  {
    name: 'CV Maker',
    type: 'WebApplication',
    description:
      'Step-by-step browser CV and resume generator with 30 templates and local PDF export.',
  },
];

export const GEO_INTRO =
  'Design, customize, and export a polished curriculum vitae directly in your browser using tailored profession starters and 30 unique layouts—without creating an account or uploading private career history.';
