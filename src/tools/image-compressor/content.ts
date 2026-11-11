/**
 * Content constants for the Image Compressor tool. Kept separate
 * from JSX so validators can inspect the content structurally.
 *
 * All claims here must be verifiable from the engine code:
 *   - formats supported: enforced by file-policy + engine
 *   - no upload: confirmed by validate-sensitive-data-leaks
 *   - offline after first load: PWA cache (future)
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContentSection {
  heading: string;
  paragraphs: readonly string[];
}

export const HERO = {
  h1: 'Image Compressor',
  tagline:
    'Compress JPG, PNG, WebP, GIF and AVIF images in your browser without uploading them.',
  subtitle:
    'Your files stay on your device. No signup, no accounts, no tracking of file contents.',
} as const;

export const INTRO_SECTIONS: readonly ContentSection[] = [
  {
    heading: 'What this tool does',
    paragraphs: [
      'This tool reduces the file size of JPG, PNG, WebP, GIF and AVIF images by re-encoding them at a lower quality or smaller resolution. Everything runs in your browser using the Canvas API and a Web Worker. Your original file is never uploaded to any server.',
      'You can choose an output format (JPEG, WebP or PNG) and adjust the compression quality. PNG output is lossless and typically larger; JPEG and WebP are lossy and much smaller at the same visual quality.',
    ],
  },
  {
    heading: 'How compression works',
    paragraphs: [
      'When you drop a file, the browser reads it into memory. A Web Worker decodes the image, optionally resizes it, and re-encodes it using the chosen output format and quality. The compressed bytes are then offered as a download.',
      'Because processing happens locally, the speed depends on your device and the size of the file. A typical 3 MB photo compresses in under a second on a modern laptop.',
    ],
  },
  {
    heading: 'When to use this tool',
    paragraphs: [
      'Use this tool when you need to reduce image size before uploading to a website, attaching to an email, or sharing on a platform with a file size limit. It is also useful when you want to convert a screenshot PNG to a smaller JPEG without leaving your browser.',
      'If you need lossless compression, choose PNG output and keep the quality high. For the smallest files, choose WebP at moderate quality.',
    ],
  },
  {
    heading: 'Privacy and limits',
    paragraphs: [
      'Files stay in browser memory only. When you close the tab, the file is gone. There is no server, no database and no account.',
      'The maximum file size is 25 MB per image. Larger files may fail because browsers limit how much memory a single tab can use. If a file does not compress, try splitting large images or using a desktop tool.',
    ],
  },
];

export const FAQ: readonly FAQItem[] = [
  {
    question: 'Is my image uploaded to a server?',
    answer:
      'No. The image is read into browser memory and compressed using a Web Worker. No network request contains the file data.',
  },
  {
    question: 'What file size can I compress?',
    answer:
      'Up to 25 MB per image. This limit is enforced before any processing begins to protect browser memory.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'Input: JPG, JPEG, PNG, WebP, GIF and AVIF. Output: JPEG, WebP and PNG. GIF animation is not preserved on output.',
  },
  {
    question: 'Does compression reduce image quality?',
    answer:
      'JPEG and WebP use lossy compression, so some quality is lost at low quality settings. PNG output is lossless. You can adjust the quality slider before compressing.',
  },
  {
    question: 'Does this tool work offline?',
    answer:
      'After the first load, the tool can run without a network connection on browsers that support service workers. The first visit requires a network to download the app.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Select or drop multiple files, and each is compressed independently. You can download them one by one or all at once when finished.',
  },
  {
    question: 'Is there a watermark or signup?',
    answer:
      'No watermark and no signup. The tool is free to use and does not require an account.',
  },
  {
    question: 'Why is my PNG larger after compression?',
    answer:
      'PNG is lossless, so re-encoding may occasionally increase file size. Choose WebP or JPEG output for smaller files when transparency is not required.',
  },
];

export const OUTPUT_FORMATS = [
  { value: 'jpeg' as const, label: 'JPEG', note: 'Smallest, no transparency' },
  { value: 'webp' as const, label: 'WebP', note: 'Best size for modern browsers' },
  { value: 'png' as const, label: 'PNG', note: 'Lossless, larger files' },
] as const;
