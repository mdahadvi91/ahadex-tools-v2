/**
 * Content constants for the Image Compressor tool. All factual
 * claims must be verifiable from the engine code (compressor.ts,
 * validation.ts, file-policy.ts).
 *
 * Structure:
 *   - HERO: title, tagline, trust signals
 *   - DIRECT_ANSWER: one-sentence answer for AEO / LLM citation
 *   - SECTIONS: substantive prose organized by heading
 *   - HOW_IT_WORKS: step-by-step explanation
 *   - USE_CASES: real scenarios
 *   - FORMATS: supported input/output with accurate notes
 *   - PRIVACY: what actually happens
 *   - LIMITATIONS: honest disclosure
 *   - FAQ: 10 real questions with factual answers
 *   - REFERENCES: authoritative external sources
 *   - INTERNAL_LINKS: cross-tool navigation
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContentSection {
  heading: string;
  paragraphs: readonly string[];
  list?: readonly string[];
}

export interface FormatInfo {
  name: string;
  mime: string;
  lossy: boolean;
  transparency: boolean;
  note: string;
}

export interface UseCase {
  title: string;
  body: string;
}

export interface Reference {
  label: string;
  url: string;
  note: string;
}

export interface InternalLink {
  label: string;
  path: string;
}

export const HERO = {
  h1: 'Image Compressor',
  tagline:
    'Compress JPG, PNG, WebP, GIF and AVIF images in your browser without uploading them.',
  subtitle:
    'Files stay on your device. No accounts, no signup, no tracking of file contents.',
  trustSignals: [
    'Files stay on your device',
    '0 KB sent to a server',
    'Works offline after first load',
  ],
} as const;

export const DIRECT_ANSWER =
  'Image Compressor is a free browser-based tool that reduces the file size of JPG, PNG, WebP, GIF and AVIF images by re-encoding them locally in your browser. Files are never uploaded to any server, and no account is required.';

export const SECTIONS: readonly ContentSection[] = [
  {
    heading: 'What this tool does',
    paragraphs: [
      'This tool reduces the file size of image files by re-encoding them at a lower quality or smaller resolution. All processing happens locally in your browser using the Canvas API and a Web Worker, so your original file never leaves your device.',
      'You can select an output format (JPEG, WebP or PNG), adjust the compression quality, and optionally cap the maximum dimension. The compressed file is offered as a download with a suggested name.',
    ],
    list: [
      'Input formats: JPG, PNG, WebP, GIF, AVIF',
      'Output formats: JPEG, WebP, PNG',
      'Adjustable quality from 10% to 100%',
      'Optional resize to a maximum width or height',
      'Batch: compress multiple images in one session',
      'No watermark, no account, no file upload',
    ],
  },
  {
    heading: 'How compression works',
    paragraphs: [
      'When you drop a file, your browser reads it into memory as a Blob and passes it to a Web Worker. The worker decodes the image into pixels, draws it onto an offscreen canvas at the requested output size, and re-encodes it at the chosen quality. The result is passed back to the main page as a downloadable Blob.',
      'Because everything runs on your CPU, the speed depends on your device and the image size. A typical 3 MB photo compresses in under a second on a modern laptop. Very large images (over 10 MB) may take a few seconds on mobile devices.',
      'The quality slider controls how aggressively pixels are sampled. Lower quality produces a smaller file but more visible artifacts. Higher quality preserves fine detail at the cost of file size. The setting you choose applies to every file in the current session.',
    ],
  },
  {
    heading: 'Which format should I choose?',
    paragraphs: [
      'The best format depends on the content and whether transparency matters.',
    ],
    list: [
      'JPEG: smallest files for photographs and gradients. No transparency. Best when file size matters more than perfect edges.',
      'WebP: best balance of quality and size for modern browsers. Supports transparency. Roughly 25-35% smaller than JPEG at the same visual quality.',
      'PNG: lossless, supports transparency. Files are larger but no quality is lost. Use for screenshots, text, line art, and images with sharp edges.',
      'GIF: supported as input for simple animations. Output is a single-frame image. Not recommended for photos.',
      'AVIF: supported as input. Offers very small files at high quality. Output is not currently supported because browser encoder support varies.',
    ],
  },
  {
    heading: 'When to use this tool',
    paragraphs: [
      'Use this tool when you need to reduce image size before uploading to a website, attaching to an email, or sharing on a platform with a file size limit. It is also useful when you want to convert a screenshot PNG to a smaller JPEG or WebP without opening a desktop application.',
      'Common cases include preparing images for a blog post, shrinking a photo attachment below an email provider limit, or reducing the size of screenshots before including them in a report. If you need to change the pixel dimensions rather than the file size, use the Image Resizer tool instead.',
    ],
  },
  {
    heading: 'Privacy: what actually happens',
    paragraphs: [
      'Your image is read into your browser memory, processed locally, and offered back as a download. No network request contains the file bytes, file name, or any part of the image content. There is no account, no database, and no server that receives the file.',
      'When you close the tab or reload the page, any reference to the file in memory is released. Refreshing the browser discards the file. If you keep the tab open, the file remains in memory until you clear it or close the tab.',
      'The site collects no analytics without your consent. If you grant analytics consent, we record aggregate usage events such as "a tool was opened" or "an image was compressed" with an approximate file size bucket. File names, contents and exact sizes are never sent.',
    ],
  },
  {
    heading: 'Limitations you should know',
    paragraphs: [
      'Compression cannot recover quality that was lost when the original image was created or previously compressed. Re-compressing an already-compressed JPEG may produce visible artifacts or, in rare cases, a larger file.',
      'PNG is lossless. Re-encoding a PNG does not reduce visual quality, but the file may grow if the original was already well compressed. For smaller PNG output, switch to WebP when transparency is required, or JPEG when it is not.',
      'The maximum input size is 25 MB per image, and the maximum decoded pixel count is 80 megapixels. These limits protect browser memory. Files above these limits fail before processing begins.',
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Drop or select images',
    body: 'Drag one or more images into the drop zone, or click to open your file browser. Each file is validated against the supported formats and the 25 MB size limit before any processing begins.',
  },
  {
    step: 2,
    title: 'Pick your settings',
    body: 'Choose the output format and quality. Optionally cap the maximum dimension to resize large photos. The preset buttons set sensible defaults for common cases.',
  },
  {
    step: 3,
    title: 'Compress and download',
    body: 'The browser decodes, resizes and re-encodes each file locally. When complete, you can download the result. Files are held in memory only; nothing is transmitted.',
  },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'Website images',
    body: 'Reduce hero images, thumbnails, and blog images before uploading to a CMS. Smaller images improve page load speed and reduce bandwidth cost.',
  },
  {
    title: 'Email attachments',
    body: 'Many providers cap attachments at 10 MB or 25 MB. Compressing photos to 1-2 MB each keeps the email deliverable without a cloud link.',
  },
  {
    title: 'Marketplace listings',
    body: 'Photo uploads on marketplaces are often capped in size and dimension. Compress and resize in one step.',
  },
  {
    title: 'Documentation and reports',
    body: 'Screenshots saved as PNG can be converted to JPEG or WebP when the file must fit a specific size limit.',
  },
];

export const SUPPORTED_INPUT_FORMATS: readonly FormatInfo[] = [
  { name: 'JPEG', mime: 'image/jpeg', lossy: true, transparency: false, note: 'Standard for photos.' },
  { name: 'PNG', mime: 'image/png', lossy: false, transparency: true, note: 'Lossless, supports alpha.' },
  { name: 'WebP', mime: 'image/webp', lossy: true, transparency: true, note: 'Modern format, small files.' },
  { name: 'GIF', mime: 'image/gif', lossy: false, transparency: true, note: 'Single-frame output only.' },
  { name: 'AVIF', mime: 'image/avif', lossy: true, transparency: true, note: 'Input only; output pending.' },
];

export const PRIVACY = {
  heading: 'Privacy and data handling',
  paragraphs: [
    'Files are loaded into browser memory and processed by a Web Worker running on your device. At no point is the file transmitted over the network.',
    'Analytics is off by default. If you grant analytics consent, we record aggregate usage events (tool open, file size bucket, processing duration) with no file names or content.',
    'Consent is stored in a single first-party cookie and can be changed at any time from the settings panel.',
  ],
} as const;

export const LIMITATIONS = {
  heading: 'Limitations',
  list: [
    'Maximum input size: 25 MB per image.',
    'Maximum decoded pixels: 80 million (e.g. 8,944 x 8,944).',
    'GIF output is not supported; only the first frame is extracted.',
    'AVIF output is not supported yet; use WebP or JPEG.',
    'Compression is lossy for JPEG and WebP. Visual quality decreases as the quality slider moves lower.',
    'PNG output is lossless and may not reduce file size for already-optimized PNGs.',
  ],
} as const;

export const FAQ: readonly FAQItem[] = [
  {
    question: 'Is my image uploaded to a server?',
    answer:
      'No. The image is read into browser memory and compressed by a Web Worker. No network request contains the file data.',
  },
  {
    question: 'What file size can I compress?',
    answer:
      'Up to 25 MB per image. This limit is enforced before any processing to protect browser memory.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'Input: JPG, JPEG, PNG, WebP, GIF and AVIF. Output: JPEG, WebP and PNG. GIF animations are not preserved; only a single frame is output.',
  },
  {
    question: 'Does compression reduce image quality?',
    answer:
      'JPEG and WebP use lossy compression, so some quality is lost at lower settings. PNG output is lossless. Adjust the quality slider before compressing to balance size against visual quality.',
  },
  {
    question: 'Does this tool work offline?',
    answer:
      'After the first page load, compression works without a network connection. The first visit requires a network to download the application.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Drop or select multiple files. Each file is processed independently and can be downloaded individually or together.',
  },
  {
    question: 'Is there a watermark or signup?',
    answer:
      'No watermark and no signup. The tool is free to use and does not require an account.',
  },
  {
    question: 'Why is my PNG larger after compression?',
    answer:
      'PNG is lossless. Re-encoding may occasionally increase the file size. Choose WebP or JPEG output for a smaller file when transparency is not required.',
  },
  {
    question: 'What is the difference between JPEG and WebP?',
    answer:
      'WebP typically produces smaller files at the same visual quality, and it supports transparency. JPEG is more widely supported by older software and has no transparency.',
  },
  {
    question: 'Does compressing the same image twice reduce quality again?',
    answer:
      'Yes, for lossy formats. Each time a JPEG or WebP image is re-encoded, some quality is lost. Start from the original file whenever possible.',
  },
];

export const REFERENCES: readonly Reference[] = [
  {
    label: 'MDN: Using the Canvas API',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',
    note: 'The browser API used for image re-encoding.',
  },
  {
    label: 'MDN: Web Workers',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API',
    note: 'The mechanism that keeps processing off the main thread.',
  },
  {
    label: 'WebP compression study',
    url: 'https://developers.google.com/speed/webp/docs/webp_study',
    note: 'Google Study showing WebP vs JPEG size reductions.',
  },
];

export const INTERNAL_LINKS: readonly InternalLink[] = [
  { label: 'Image Resizer', path: '/tools/image-resizer' },
  { label: 'Merge PDF', path: '/tools/merge-pdf' },
  { label: 'About AHADEX Tools', path: '/about' },
  { label: 'Privacy Policy', path: '/privacy' },
];

/** Output format options for the UI select. */
export const OUTPUT_FORMATS = [
  { value: 'jpeg' as const, label: 'JPEG', note: 'Smallest, no transparency' },
  { value: 'webp' as const, label: 'WebP', note: 'Best size for modern browsers' },
  { value: 'png' as const, label: 'PNG', note: 'Lossless, larger files' },
] as const;
