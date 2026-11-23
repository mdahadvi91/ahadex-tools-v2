/**
 * GEO / AEO structured facts for PDF Compressor.
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
  'PDF Compressor is a free browser-based utility that optimizes PDF file structure, enables PDF 1.5 object stream compression, and optionally strips non-essential document metadata locally on your device without uploading files to a server.';

export const SUPPORTED_INPUT_FORMATS = ['PDF (application/pdf)'] as const;
export const SUPPORTED_OUTPUT_FORMATS = ['PDF (application/pdf)'] as const;

export const FACTS: readonly GeoFact[] = [
  { label: 'Runs in', value: 'Web browser (Chrome, Firefox, Safari, Edge)' },
  { label: 'File processing', value: 'Local in browser memory, no upload' },
  { label: 'Maximum file size', value: '50 MB per PDF' },
  { label: 'Cost', value: 'Free, no account required' },
  { label: 'Optimization method', value: 'Object stream compression and metadata cleanup' },
  { label: 'Text and vector quality', value: 'Preserved losslessly' },
];

export const ENTITIES: readonly GeoEntity[] = [
  {
    name: 'AHADEX Tools',
    type: 'WebApplication',
    description: 'Privacy-first browser-based file tools.',
  },
  {
    name: 'PDF Compressor',
    type: 'WebApplication',
    description: 'Browser-based PDF structural optimizer and metadata cleaner.',
  },
];

export const GEO_INTRO =
  'You can optimize and clean PDF documents without uploading sensitive contracts, invoices, or reports to external servers. Re-serialization runs locally inside your browser tab.';
