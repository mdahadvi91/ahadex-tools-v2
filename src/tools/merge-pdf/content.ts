/**
 * Content constants for the Merge PDF tool.
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
  h1: 'Merge PDF',
  tagline:
    'Combine two or more PDF files in the exact sequence you want, directly inside your browser.',
  subtitle:
    'No account required. Documents stay in browser memory on your device and are never uploaded to a server.',
  trustSignals: ['Runs in your browser', 'No account required', 'No file upload'],
} as const;

export const DIRECT_ANSWER =
  'Merge PDF is a free browser-based utility that joins multiple PDF documents into a single PDF file on your device. You can reorder uploaded documents before combining them, preserve original page vectors and selectable text, and download immediately without uploading files to any server.';

export const SECTIONS: readonly ContentSection[] = [
  {
    heading: 'What this tool does',
    paragraphs: [
      'Merge PDF lets you select between 2 and 20 PDF files from your device, inspect each file size and order, arrange them in the sequence you need, and combine all pages into a single unified PDF document.',
      'All binary parsing and page copying occur strictly inside your browser tab using pdf-lib. Your PDF files never travel over the network to an external processing server.',
    ],
    list: [
      'Combine 2 to 20 PDF documents in one click',
      'Reorder queued files up or down before merging',
      'Customizable output filename (defaults to merged-document.pdf)',
      'Preserves fonts, embedded images, page dimensions, and clickable links',
      'Supports up to 50 MB per individual PDF and 200 MB per merge batch',
      'Zero watermarks, zero page limits, zero account barriers',
    ],
  },
  {
    heading: 'How browser-based PDF merging works',
    paragraphs: [
      'When you add PDFs, each file is queued locally in browser memory. Once you press Merge PDFs, the engine initializes a clean destination document with pdf-lib, loads each source buffer sequentially, copies every page object and shared resource stream into the destination container, and writes the combined PDF with compressed object streams.',
      'Because pages are copied structurally at the PDF object level rather than rasterized to bitmaps, your text stays selectable, fonts stay sharp at any zoom level, and page orientations (portrait, landscape, mixed paper sizes) remain intact.',
      'On modern desktop or mobile browsers, merging several multi-page documents usually finishes in under a second.',
    ],
  },
  {
    heading: 'Maintaining clean page order and file sizes',
    paragraphs: [
      'Before running the merge, check the queue order carefully. Use the Move Up and Move Down controls next to each queued document to arrange cover pages, appendices, invoices, or signature sheets in the exact final sequence.',
      'If the merged output feels heavy because of incremental metadata left over inside source exports, you can optionally run the resulting file through our PDF Compressor tool afterward to strip redundant metadata.',
    ],
  },
  {
    heading: 'When to combine vs split PDFs',
    paragraphs: [
      'Merge PDF is ideal when separate forms, tax exhibits, academic assignments, or scanned chapters need to become a single deliverable file for email, HR onboarding, or government submission portals that accept only one attachment.',
      'If you first need to pull out unwanted cover letters or extract specific ranges before merging, process those source files in Split PDF first and then assemble the final packet here.',
    ],
  },
  {
    heading: 'Privacy and local file handling',
    paragraphs: [
      'Combining contracts, payslips, passport scans, or client agreements through cloud websites exposes private records to remote storage and retention policies. With AHADEX Tools, the entire merge runs inside local browser memory.',
      'Your filenames and binary buffers are never uploaded or logged by an API endpoint. Closing or reloading the page immediately clears the queued references from memory.',
    ],
  },
  {
    heading: 'Limitations and compatibility notes',
    paragraphs: [
      'To protect browser tab stability, each source PDF may be up to 50 MB and a batch may contain up to 20 files totaling 200 MB. Documents encrypted with an open password or strict copying restrictions cannot be merged until unlocked.',
      'Digital cryptographic signatures anchored to an individual PDF file become invalid if that document is combined into a new container, because altering the byte stream modifies the document hash. For routine signatures or visual scans, pages copy cleanly.',
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Add your PDF documents',
    body: 'Drop two or more PDF files into the workspace or browse from your device. You can add additional files across multiple selections.',
  },
  {
    step: 2,
    title: 'Arrange the file sequence',
    body: 'Use the Move Up, Move Down, and Remove buttons to place each document in the exact order pages should appear.',
  },
  {
    step: 3,
    title: 'Merge and download',
    body: 'Enter an optional output filename, click Merge PDFs, and download your combined document immediately.',
  },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'Monthly invoice & receipt packets',
    body: 'Combine separate supplier invoices, bank receipts, and expense cover sheets into a single monthly PDF archive.',
  },
  {
    title: 'Job & visa application bundles',
    body: 'Join a resume, portfolio summary, academic transcripts, and reference letters into one upload-ready file.',
  },
  {
    title: 'Legal & real estate closings',
    body: 'Assemble separate signed addenda and disclosure schedules cleanly without uploading client data off your laptop.',
  },
  {
    title: 'Course notes & study readers',
    body: 'Combine weekly lecture handouts and lab sheets into a single searchable workbook for study or printing.',
  },
];

export const SUPPORTED_INPUT_FORMATS = [
  {
    name: 'PDF',
    mime: 'application/pdf',
    lossy: false,
    transparency: true,
    note: '2 to 20 unencrypted PDF documents, up to 50 MB each.',
  },
] as const;

export const PRIVACY = {
  heading: 'Privacy summary',
  paragraphs: [
    'Merge PDF executes entirely inside your browser using local memory. Source PDFs are never sent to a remote server.',
    'If you clear the queue or close the tab, memory held by those files is freed immediately.',
  ],
} as const;

export const LIMITATIONS = {
  heading: 'Technical limits',
  list: [
    'Minimum 2 PDFs and maximum 20 PDFs per merge batch.',
    'Maximum 50 MB per individual file and 200 MB total batch size.',
    'Password-protected or encrypted PDFs must be unlocked before merging.',
    'Cryptographic digital signatures cannot survive cross-document re-packaging intact.',
  ],
} as const;

export const FAQ: readonly FAQItem[] = [
  {
    question: 'Are my PDF files uploaded anywhere when merging?',
    answer:
      'No. All PDF reading, page copying, and file generation run inside your browser tab on your device. No file leaves your computer.',
  },
  {
    question: 'Can I change the order of PDFs before combining them?',
    answer:
      'Yes. Each queued PDF includes Move Up and Move Down controls so you can set the exact order before pressing Merge PDFs.',
  },
  {
    question: 'Does merging PDFs reduce text or image quality?',
    answer:
      'No. Pages and resources are copied structurally at full fidelity. Selectable text, fonts, vector lines, and embedded images remain unchanged.',
  },
  {
    question: 'Can I merge PDFs with different page sizes?',
    answer:
      'Yes. Mixed page sizes and orientations such as A4 portrait, US Letter, and landscape slides retain their individual dimensions in the output PDF.',
  },
  {
    question: 'How many PDF files can I combine at once?',
    answer:
      'You can merge between 2 and 20 PDF files in one batch, up to 50 MB per file and 200 MB combined.',
  },
  {
    question: 'What happens with password-protected PDFs?',
    answer:
      'Encrypted PDFs cannot be copied safely without the password and will display a clear error message. Unlock the file first if permitted.',
  },
  {
    question: 'Is there any watermark or page limit?',
    answer: 'No. AHADEX Tools never adds watermarks and imposes no daily or page-count caps.',
  },
  {
    question: 'Does Merge PDF work offline?',
    answer:
      'Initial page loading requires network access because this site does not register a service worker. After the page loads, the merge engine runs locally without network requests, though offline reloads are not guaranteed.',
  },
];

export const REFERENCES: readonly Reference[] = [
  {
    label: 'ISO 32000-1 PDF Page Tree Architecture',
    url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
    note: 'Standard defining PDF page trees, resources, and cross-reference structures.',
  },
  {
    label: 'MDN: TypedArray & ArrayBuffer',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer',
    note: 'Binary memory buffers used during local browser-side PDF combining.',
  },
];

export const INTERNAL_LINKS: readonly InternalLink[] = [
  { label: 'Split PDF', path: '/split-pdf/' },
  { label: 'PDF Compressor', path: '/pdf-compressor/' },
  { label: 'Image Compressor', path: '/image-compressor/' },
  { label: 'Privacy Policy', path: '/privacy-policy/' },
];
