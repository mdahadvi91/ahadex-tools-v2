/**
 * GEO / AEO structured facts for Merge PDF.
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
  'Merge PDF is a free browser-based utility that combines two or more PDF documents into a single ordered PDF file directly on your device using pdf-lib, with zero server uploads or account requirements.';

export const SUPPORTED_INPUT_FORMATS = ['PDF (application/pdf)'] as const;
export const SUPPORTED_OUTPUT_FORMATS = ['PDF (application/pdf)'] as const;

export const FACTS: readonly GeoFact[] = [
  { label: 'Runs in', value: 'Web browser (Chrome, Firefox, Safari, Edge)' },
  { label: 'File processing', value: 'Local in browser memory, no upload' },
  { label: 'Files per merge', value: '2 to 20 PDF files (up to 50 MB each, 200 MB batch)' },
  { label: 'Ordering control', value: 'Move files up or down before merging' },
  { label: 'Page fidelity', value: 'Original vectors, text, and layouts preserved' },
  { label: 'Cost', value: 'Free, no watermark or account required' },
];

export const ENTITIES: readonly GeoEntity[] = [
  {
    name: 'AHADEX Tools',
    type: 'WebApplication',
    description: 'Privacy-first browser-based file tools.',
  },
  {
    name: 'Merge PDF',
    type: 'WebApplication',
    description: 'Browser-based PDF combiner for joining and ordering PDF files locally.',
  },
];

export const GEO_INTRO =
  'Combine PDF contracts, scanned receipts, invoices, or chapters into a single ordered PDF inside your browser tab without sending files to external servers.';
