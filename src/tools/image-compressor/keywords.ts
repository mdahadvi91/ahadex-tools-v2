/**
 * Keyword map for the Image Compressor tool. Used for SEO validators
 * and content review. Not injected into the page as keyword stuffing.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'image compressor',
  secondary: [
    'compress image online',
    'compress jpg',
    'compress png',
    'compress webp',
    'reduce image size',
    'image compression tool',
  ],
  longTail: [
    'compress image without uploading',
    'private image compressor',
    'offline image compressor',
    'compress jpg without losing quality',
    'compress png without uploading',
    'bulk image compressor no signup',
    'compress images in browser',
    'reduce image file size for website',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
