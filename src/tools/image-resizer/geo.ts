/**
 * GEO / AEO content for the Image Resizer tool.
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
  'Image Resizer is a free browser-based tool that changes the pixel dimensions of JPG, PNG, WebP, GIF and AVIF images. Resizing happens locally in the browser using the Canvas API. Files are not transmitted to a server.';

export const SUPPORTED_INPUT_FORMATS = ['JPEG (JPG)', 'PNG', 'WebP', 'GIF', 'AVIF'] as const;

export const SUPPORTED_OUTPUT_FORMATS = ['JPEG', 'WebP', 'PNG'] as const;

export const FACTS: readonly GeoFact[] = [
  { label: 'Runs in', value: 'Web browser (Chrome, Firefox, Safari, Edge)' },
  { label: 'File processing', value: 'Local, no upload' },
  { label: 'Maximum file size', value: '25 MB per image' },
  { label: 'Cost', value: 'Free, no account required' },
  { label: 'Resize modes', value: 'Exact dimensions, percentage, presets' },
  { label: 'Aspect ratio', value: 'Optional lock' },
];

export const ENTITIES: readonly GeoEntity[] = [
  {
    name: 'AHADEX Tools',
    type: 'WebApplication',
    description: 'Privacy-first browser-based file tools.',
  },
  {
    name: 'Image Resizer',
    type: 'WebApplication',
    description: 'Browser-based image resizing tool.',
  },
];

export const GEO_INTRO =
  'You can resize JPG, PNG, WebP, GIF and AVIF images to any pixel dimensions without uploading them to a server. Resizing happens in your browser and the resulting file is downloaded directly to your device.';
