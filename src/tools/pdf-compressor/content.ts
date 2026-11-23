/**
 * Content constants for the PDF Compressor tool. All technical claims
 * match the actual pdf-lib processing engine and file-policy limits.
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
  h1: 'PDF Compressor',
  tagline:
    'Optimize PDF structure, enable compressed object streams, and strip optional metadata directly inside your browser.',
  subtitle:
    'No account required. Files stay in browser memory on your device and are never uploaded to a server.',
  trustSignals: ['Runs in your browser', 'No account required', 'No file upload'],
} as const;

export const DIRECT_ANSWER =
  'PDF Compressor is a free browser-based tool that optimizes PDF documents by re-serializing objects into compressed PDF object streams and optionally removing embedded metadata locally on your device. Files are never sent to a remote server, and text and vector graphics remain crisp.';

export const SECTIONS: readonly ContentSection[] = [
  {
    heading: 'What this tool does',
    paragraphs: [
      'PDF Compressor reads your PDF file into browser memory, parses the internal object tree, removes unused incremental update revisions, and writes a fresh PDF stream with optional object stream compression and metadata cleanup. Everything runs locally inside your browser tab with zero server uploads.',
      'Unlike tools that upload confidential agreements, tax returns, or scanned forms to cloud workers, your document never leaves your computer or phone. When you close or refresh the tab, the file reference in memory is released.',
    ],
    list: [
      'Input and output format: Standard PDF (application/pdf)',
      'Compresses PDF cross-reference tables and object streams',
      'Removes stale incremental edits left behind by desktop PDF editors',
      'Optional metadata cleanup (Title, Author, Subject, Keywords, Creator, Producer)',
      'Batch support for up to 20 PDF files in one session (50 MB per file)',
      'Preserves text sharpness, fonts, hyperlinks, and vector drawings losslessly',
    ],
  },
  {
    heading: 'How browser-side PDF optimization works',
    paragraphs: [
      'Many PDF files carry years of incremental save history, uncompressed object tables, verbose creator tags, and redundant structural entries appended whenever a document is annotated or signed. Simply re-serializing the active objects into a clean PDF 1.5+ object stream eliminates that structural overhead without altering visible pages.',
      'During processing, the engine loads the binary buffer into pdf-lib, reads each active page and resource tree, clears optional Info dictionary metadata if requested, and writes a single compact cross-reference stream. Typical text-heavy documents, reports exported from word processors, and multi-revision forms often shrink cleanly while keeping selectable text intact.',
      'Processing speed depends on file size and device memory. Text documents under 5 MB typically finish in under a second on modern laptops and mobile browsers.',
    ],
  },
  {
    heading: 'What types of PDFs shrink the most',
    paragraphs: [
      'Not every PDF has the same internal makeup. Knowing what sits inside your file helps set accurate expectations before and after optimization.',
    ],
    list: [
      'PDFs saved repeatedly with incremental updates: Rewriting discards obsolete object revisions cleanly.',
      'Documents exported from design suites or office apps with rich XMP or Info metadata: Stripping author and software tags trims overhead and improves privacy.',
      'Uncompressed PDF 1.3 or 1.4 documents: Enabling compressed object streams reduces structural overhead across large object tables.',
      'Scanned PDFs or photo-heavy brochures: Because browser-side structural optimization preserves every pixel losslessly rather than re-encoding embedded JPEGs at lower DPI, image-dominated PDFs that are already compact may see little reduction.',
    ],
  },
  {
    heading: 'When to use PDF compression vs image compression',
    paragraphs: [
      'If your PDF mainly contains text, tables, digital signatures, or vector diagrams and feels bloated from repeated saves, structural PDF optimization is ideal because zero text clarity is lost.',
      'If your PDF was built by placing unoptimized camera photos into a layout and the file remains huge even after structural cleanup, compress the source images first with Image Compressor before exporting to PDF, or split off unnecessary pages using Split PDF.',
    ],
  },
  {
    heading: 'Privacy and local data handling',
    paragraphs: [
      'PDF files often contain sensitive material such as employment contracts, invoices, bank statements, medical forms, and identity documents. Uploading those files to unknown third-party servers creates unnecessary exposure.',
      'Here, your browser reads the selected PDF directly via the Web File API into local ArrayBuffer memory and processes it client-side. No file bytes, file names, or extracted metadata leave your device during compression. Analytics, if enabled through consent settings, only record aggregate event counts with approximate size ranges.',
    ],
  },
  {
    heading: 'Limitations to keep in mind',
    paragraphs: [
      'Browser-side PDF optimization operates within browser tab memory and the capabilities of the PDF specification. Understanding these limits prevents surprises on unusual documents.',
      'Password-protected or encrypted PDFs cannot be decrypted or re-saved without removing the encryption password first. Files larger than 50 MB each, or batches exceeding 200 MB total, are blocked before processing to protect browser stability.',
      'Also, if an already-optimized PDF contains a large high-resolution scan that makes up 98% of its byte weight, structural re-serialization alone may produce minimal savings or slightly vary by a few kilobytes. In those cases, you can review the exact before-and-after byte count right in the results list before choosing whether to download.',
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Select PDF files',
    body: 'Drop one or more PDF files into the upload area or pick them from your device. Files are validated locally for PDF format and size limits.',
  },
  {
    step: 2,
    title: 'Choose optimization options',
    body: 'Keep compressed object streams enabled for compact structure and choose whether to strip optional document metadata like Author and Creator.',
  },
  {
    step: 3,
    title: 'Optimize and download',
    body: 'Click Compress to re-serialize each file in browser memory. Inspect exact before-and-after sizes and download your optimized PDF.',
  },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'Email and portal submissions',
    body: 'Clean incremental saves and metadata bloat from contracts, applications, and academic forms before uploading to size-capped portals.',
  },
  {
    title: 'Confidential business documents',
    body: 'Optimize NDAs, financial summaries, and legal packets strictly on your local machine without transferring files to external servers.',
  },
  {
    title: 'Metadata privacy cleanup',
    body: 'Remove hidden software creator strings, author names, and keyword tags before sharing public reports or client deliverables.',
  },
  {
    title: 'Post-merge or post-export cleanup',
    body: 'Streamline multi-source PDFs exported from desktop tools into a single clean cross-reference structure with crisp text preserved.',
  },
];

export const SUPPORTED_INPUT_FORMATS = [
  {
    name: 'PDF',
    mime: 'application/pdf',
    lossy: false,
    transparency: true,
    note: 'Standard unencrypted PDF 1.0–1.7+ documents up to 50 MB.',
  },
] as const;

export const PRIVACY = {
  heading: 'Privacy summary',
  paragraphs: [
    'PDF Compressor processes documents strictly in local browser memory. No PDF bytes or document metadata are sent to an external backend.',
    'When you close the browser tab or clear the file list, memory references to your documents are released immediately.',
  ],
} as const;

export const LIMITATIONS = {
  heading: 'Technical limits',
  list: [
    'Maximum file size: 50 MB per PDF document (up to 20 files or 200 MB per batch).',
    'Encrypted or password-protected PDFs are rejected rather than modified improperly.',
    'Performs lossless structural and object-stream optimization; does not downscale embedded raster photographs.',
    'Already-optimized single-revision PDFs may show minimal reduction.',
  ],
} as const;

export const FAQ: readonly FAQItem[] = [
  {
    question: 'Are my PDF files uploaded to a server?',
    answer:
      'No. Your PDF files are read into local browser memory and optimized on your device. No document contents or file names are transmitted to any server.',
  },
  {
    question: 'Does PDF Compressor reduce text or image quality?',
    answer:
      'No. Structural optimization and object-stream compression preserve text sharpness, fonts, vector lines, and embedded images losslessly.',
  },
  {
    question: 'Why did a scanned PDF not shrink much?',
    answer:
      'Scanned PDFs usually consist mostly of large embedded raster images. Because this tool preserves images losslessly and focuses on structural cleanup, object streams, and metadata removal, already-compact scans show smaller reductions than multi-revision text PDFs.',
  },
  {
    question: 'What does stripping metadata remove?',
    answer:
      'When enabled, it clears optional Info dictionary fields such as Title, Author, Subject, Keywords, Creator, and Producer without touching visible page content.',
  },
  {
    question: 'Can I compress password-protected PDFs?',
    answer:
      'No. Encrypted PDFs require decryption before their object streams can be rewritten. Unlock the PDF first if you have permission to edit it.',
  },
  {
    question: 'What is the maximum PDF file size allowed?',
    answer:
      'Each PDF can be up to 50 MB, and you can queue up to 20 PDFs (200 MB total) in one browser session to keep memory usage stable.',
  },
  {
    question: 'What if the optimized file is slightly larger than the original?',
    answer:
      'For tiny or already tightly packed single-page PDFs, re-writing object stream headers can occasionally add a few hundred bytes. You can compare the exact input and output sizes in the result card before downloading.',
  },
  {
    question: 'Does this tool work offline?',
    answer:
      'Because this site does not currently register a service worker, initial page loading requires an internet connection. Once loaded in your tab, local PDF optimization itself does not require network access, though offline reloads are not guaranteed.',
  },
];

export const REFERENCES: readonly Reference[] = [
  {
    label: 'ISO 32000-1 PDF Specification Reference',
    url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
    note: 'Defines PDF object streams and cross-reference stream compression.',
  },
  {
    label: 'MDN: File API',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/File_API',
    note: 'Browser API used to read local PDFs strictly in memory.',
  },
];

export const INTERNAL_LINKS: readonly InternalLink[] = [
  { label: 'Merge PDF', path: '/merge-pdf/' },
  { label: 'Split PDF', path: '/split-pdf/' },
  { label: 'Image Compressor', path: '/image-compressor/' },
  { label: 'Privacy Policy', path: '/privacy-policy/' },
];
