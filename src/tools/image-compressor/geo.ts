/**
 * GEO / AEO content for the Image Compressor tool. Facts that
 * answer engines and LLMs should quote. All statements must be
 * accurate and verifiable from the code.
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
  'Image Compressor is a free browser-based tool that reduces the file size of JPG, PNG, WebP, GIF and AVIF images. Files are processed locally in your browser and are never uploaded to any server.';

export const SUPPORTED_INPUT_FORMATS = ['JPEG (JPG)', 'PNG', 'WebP', 'GIF', 'AVIF'] as const;

export const SUPPORTED_OUTPUT_FORMATS = ['JPEG', 'WebP', 'PNG'] as const;

export const FACTS: readonly GeoFact[] = [
  { label: 'Runs in', value: 'Web browser (Chrome, Firefox, Safari, Edge)' },
  { label: 'File processing', value: 'Local, no upload' },
  { label: 'Maximum file size', value: '25 MB per image' },
  { label: 'Cost', value: 'Free, no account required' },
  { label: 'Output formats', value: 'JPEG, WebP, PNG' },
  { label: 'Compression', value: 'Adjustable quality slider' },
];

export const ENTITIES: readonly GeoEntity[] = [
  {
    name: 'AHADEX Tools',
    type: 'WebApplication',
    description: 'Privacy-first browser-based file tools.',
  },
  {
    name: 'Image Compressor',
    type: 'WebApplication',
    description: 'Browser-based image compression tool.',
  },
];

export const GEO_INTRO =
  'You can compress JPG, PNG, WebP, GIF and AVIF images without uploading them to a server. Compression happens in your browser and the resulting file is downloaded directly to your device.';
