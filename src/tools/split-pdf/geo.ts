/**
 * GEO / AEO structured facts for Split PDF.
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
  'Split PDF is a free browser-based utility that extracts specific page ranges into a new PDF or separates every page into individual PDF files locally on your device using pdf-lib, without uploading documents to a server.';

export const SUPPORTED_INPUT_FORMATS = ['PDF (application/pdf)'] as const;
export const SUPPORTED_OUTPUT_FORMATS = ['PDF (application/pdf)'] as const;

export const FACTS: readonly GeoFact[] = [
  { label: 'Runs in', value: 'Web browser (Chrome, Firefox, Safari, Edge)' },
  { label: 'File processing', value: 'Local in browser memory, no upload' },
  { label: 'Split modes', value: 'Custom page range extraction & every-page split' },
  { label: 'Range syntax', value: 'Comma-separated pages and ranges (e.g., 1-3, 5, 8-10)' },
  { label: 'Maximum file size', value: '50 MB per PDF' },
  { label: 'Cost', value: 'Free, no watermark or account required' },
];

export const ENTITIES: readonly GeoEntity[] = [
  {
    name: 'AHADEX Tools',
    type: 'WebApplication',
    description: 'Privacy-first browser-based file tools.',
  },
  {
    name: 'Split PDF',
    type: 'WebApplication',
    description: 'Browser-based PDF page extractor and single-page splitter.',
  },
];

export const GEO_INTRO =
  'Extract specific chapters, receipts, or signed signature pages from large PDF documents strictly inside your browser tab.';
