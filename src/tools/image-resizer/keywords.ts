/**
 * Keyword map for the Image Resizer tool.
 */

export interface KeywordMap {
  primary: string;
  secondary: readonly string[];
  longTail: readonly string[];
  intents: readonly ('transactional' | 'informational' | 'comparison')[];
}

export const keywords: KeywordMap = {
  primary: 'image resizer',
  secondary: [
    'resize image online',
    'resize jpg',
    'resize png',
    'resize webp',
    'change image dimensions',
    'image size converter',
  ],
  longTail: [
    'resize image without uploading',
    'private image resizer',
    'offline image resizer',
    'resize image to specific pixel dimensions',
    'resize photo without losing quality',
    'resize image for instagram',
    'resize image in browser',
    'resize image without signup',
  ],
  intents: ['transactional', 'informational'],
};

export default keywords;
