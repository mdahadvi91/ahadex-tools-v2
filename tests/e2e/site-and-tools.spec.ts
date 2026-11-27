/**
 * Functional Playwright E2E tests for AHADEX Tools (Phase 9).
 *
 * Verifies real browser rendering, search filtering, mobile layout hygiene,
 * local browser file processing across all 5 live tools (Image Compressor,
 * Image Resizer, PDF Compressor, Merge PDF, Split PDF), valid output file
 * downloads, and zero external upload requests during processing.
 */

import fs from 'node:fs';
import zlib from 'node:zlib';
import { expect, test, type Download } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 1) !== 0 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createSamplePngBuffer(width = 64, height = 64): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = 1 + width * 4;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 4;
      raw[px] = (x * 4) % 256;
      raw[px + 1] = (y * 4) % 256;
      raw[px + 2] = 210;
      raw[px + 3] = 255;
    }
  }

  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', zlib.deflateSync(raw)),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function createSamplePdfBuffer(pagesCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pagesCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`AHADEX E2E Page ${i + 1}`, { x: 40, y: 340, size: 16 });
  }
  const saved = await doc.save({ useObjectStreams: false });
  return Buffer.from(saved);
}

async function readDownloadBuffer(download: Download): Promise<Buffer> {
  const filePath = await download.path();
  if (!filePath) {
    throw new Error('Playwright download path was null.');
  }
  return fs.readFileSync(filePath);
}

test.describe('Homepage, search, and mobile responsiveness', () => {
  test('renders homepage, filters tools via search, and navigates cleanly', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Fast, Privacy-First Online File Tools');

    const searchInput = page.getByLabel('Search tools');
    await searchInput.fill('split');
    await expect(page.getByRole('link', { name: /Split PDF/i }).first()).toBeVisible();
    await expect(page.locator('#tools a', { hasText: 'Image Compressor' })).toHaveCount(0);

    await page
      .getByRole('link', { name: /Split PDF/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/split-pdf\/?$/);
    await expect(page.locator('h1')).toContainText('Split PDF');
    expect(pageErrors).toEqual([]);
  });

  test('has zero horizontal overflow on mobile viewport and toggles mobile drawer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    const menuButton = page.getByRole('button', { name: /Toggle navigation menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await expect(page.locator('#mobile-menu a', { hasText: 'About' })).toBeVisible();
  });

  test('privacy consent banner customizes preferences, persists across reload, and reopens from footer', async ({
    page,
  }) => {
    await page.goto('/');

    const consentRegion = page.getByRole('region', { name: 'Privacy and cookie preferences' });
    await expect(consentRegion).toBeVisible();
    await expect(page.locator('script[data-ahadex-clarity]')).toHaveCount(0);

    // Clicking Customize reveals toggles without dismissing or writing preferences
    await consentRegion.getByRole('button', { name: 'Customize' }).click();
    const analyticsToggle = consentRegion.getByLabel(/Optional Analytics/i);
    const adsToggle = consentRegion.getByLabel(/Optional Advertising/i);

    await expect(analyticsToggle).not.toBeChecked();
    await expect(adsToggle).not.toBeChecked();

    await analyticsToggle.check();
    await consentRegion.getByRole('button', { name: 'Save Preferences' }).click();
    await expect(consentRegion).toBeHidden();
    await expect(page.locator('script[data-ahadex-clarity="zkc26mkuvb"]')).toHaveCount(1);
    await expect(page.locator('script[data-ahadex-clarity="zkc26mkuvb"]')).toHaveAttribute(
      'src',
      'https://www.clarity.ms/tag/zkc26mkuvb?ref=bwt',
    );

    // Persists after reload
    await page.reload();
    await expect(consentRegion).toBeHidden();
    await expect(page.locator('script[data-ahadex-clarity="zkc26mkuvb"]')).toHaveCount(1);

    // Footer button reopens customize panel with saved values intact
    await page.getByRole('button', { name: 'Privacy & Cookie Settings' }).click();
    await expect(consentRegion).toBeVisible();
    await expect(consentRegion.getByLabel(/Optional Analytics/i)).toBeChecked();
    await expect(consentRegion.getByLabel(/Optional Advertising/i)).not.toBeChecked();

    await consentRegion.getByRole('button', { name: 'Reject All' }).click();
    await expect(consentRegion).toBeHidden();
  });
});

test.describe('Local browser-only tool workflows', () => {
  test('Image Compressor compresses an uploaded PNG locally and downloads valid output', async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1') &&
        !url.startsWith('blob:') &&
        !url.startsWith('data:')
      ) {
        if (!url.startsWith('https://fonts.')) {
          externalRequests.push(url);
        }
      }
    });

    await page.goto('/image-compressor/');
    const pngBuffer = createSamplePngBuffer(80, 80);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'sample-e2e.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    await expect(page.getByText('Selected files (1)')).toBeVisible();
    await page.getByRole('button', { name: 'Compress 1 file' }).click();

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByText('sample-e2e.webp')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-e2e.webp');
    const outputBytes = await readDownloadBuffer(download);
    expect(outputBytes.byteLength).toBeGreaterThan(20);
    expect(externalRequests).toEqual([]);
  });

  test('Image Resizer resizes dimensions locally and downloads valid output', async ({ page }) => {
    await page.goto('/image-resizer/');
    const pngBuffer = createSamplePngBuffer(64, 64);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'square-e2e.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    await page.getByLabel('Width (px)').fill('32');
    await page.getByRole('button', { name: 'Resize 1 file' }).click();

    await expect(page.getByText('64x64 to 32x32')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('square-e2e-resized.webp');
    const outputBytes = await readDownloadBuffer(download);
    expect(outputBytes.byteLength).toBeGreaterThan(20);
  });

  test('Image Resizer handles aspect-ratio lock/unlock and preset dimensions accurately', async ({
    page,
  }) => {
    await page.goto('/image-resizer/');
    const rectPng = createSamplePngBuffer(120, 60);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'wide-e2e.png',
      mimeType: 'image/png',
      buffer: rectPng,
    });

    // 1) Aspect ratio locked (2:1 input -> width 60 produces 60x30)
    const aspectCheckbox = page.getByLabel('Maintain aspect ratio');
    await expect(aspectCheckbox).toBeChecked();
    await expect(page.getByLabel('Height (px)')).toBeDisabled();
    await page.getByLabel('Width (px)').fill('60');
    await page.getByRole('button', { name: 'Resize 1 file' }).click();
    await expect(page.getByText('120x60 to 60x30')).toBeVisible();

    // 2) Preset mode syncs dimensions cleanly and outputs exact preset target (1200x675)
    await page.getByRole('button', { name: 'Preset', exact: true }).click();
    const presetSelect = page.getByLabel('Preset');
    await expect(presetSelect).toHaveValue('150x150');
    await presetSelect.selectOption('1200x675');
    await page.getByRole('button', { name: 'Resize 1 file' }).click();
    await expect(page.getByText('120x60 to 1200x675')).toBeVisible();

    // 3) Aspect ratio unlocked allows independent width & height (80x50)
    await page.getByRole('button', { name: 'Dimensions', exact: true }).click();
    await aspectCheckbox.uncheck();
    await expect(page.getByLabel('Height (px)')).toBeEnabled();
    await page.getByLabel('Width (px)').fill('80');
    await page.getByLabel('Height (px)').fill('50');
    await page.getByRole('button', { name: 'Resize 1 file' }).click();
    await expect(page.getByText('120x60 to 80x50')).toBeVisible();
  });

  test('PDF Compressor optimizes a multi-page PDF locally with zero outbound uploads', async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1') &&
        !url.startsWith('blob:') &&
        !url.startsWith('data:')
      ) {
        if (!url.startsWith('https://fonts.')) {
          externalRequests.push(url);
        }
      }
    });

    await page.goto('/pdf-compressor/');
    const pdfBuffer = await createSamplePdfBuffer(2);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'contract-e2e.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    await page.getByRole('button', { name: 'Compress 1 PDF' }).click();
    await expect(page.getByRole('heading', { name: 'Optimized PDFs' })).toBeVisible();
    await expect(page.getByText('contract-e2e-optimized.pdf')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('contract-e2e-optimized.pdf');

    const outputBytes = await readDownloadBuffer(download);
    expect(outputBytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    const loaded = await PDFDocument.load(outputBytes);
    expect(loaded.getPageCount()).toBe(2);
    expect(externalRequests).toEqual([]);
  });

  test('Merge PDF combines two PDFs locally in custom filename order', async ({ page }) => {
    await page.goto('/merge-pdf/');
    const pdfA = await createSamplePdfBuffer(1);
    const pdfB = await createSamplePdfBuffer(2);

    await page.locator('input[type="file"]').setInputFiles([
      { name: 'part-one.pdf', mimeType: 'application/pdf', buffer: pdfA },
      { name: 'part-two.pdf', mimeType: 'application/pdf', buffer: pdfB },
    ]);

    await expect(page.getByText('Merge order (2 files)')).toBeVisible();
    await page.getByLabel('Output filename').fill('combined-e2e.pdf');
    await page.getByRole('button', { name: 'Merge 2 PDFs' }).click();

    await expect(page.getByText(/3 pages from 2 documents/i)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Merged PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('combined-e2e.pdf');

    const outputBytes = await readDownloadBuffer(download);
    const loaded = await PDFDocument.load(outputBytes);
    expect(loaded.getPageCount()).toBe(3);
  });

  test('Split PDF inspects 3 pages and extracts custom range 1-2 cleanly', async ({ page }) => {
    await page.goto('/split-pdf/');
    const pdf3 = await createSamplePdfBuffer(3);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'manual-e2e.pdf',
      mimeType: 'application/pdf',
      buffer: pdf3,
    });

    await expect(page.getByText(/3 pages ·/i)).toBeVisible();
    await page.getByRole('button', { name: 'Extract Selected Pages' }).click();

    await expect(page.getByRole('heading', { name: 'Output files (1)' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('manual-e2e');

    const outputBytes = await readDownloadBuffer(download);
    const loaded = await PDFDocument.load(outputBytes);
    expect(loaded.getPageCount()).toBe(2);
  });

  test('CV Maker selects from 30 templates, auto-fills profession data, edits schools, and exports PDF locally', async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1') &&
        !url.startsWith('blob:') &&
        !url.startsWith('data:')
      ) {
        if (!url.startsWith('https://fonts.')) {
          externalRequests.push(url);
        }
      }
    });

    await page.goto('/cv-maker/');
    await expect(page.locator('h1')).toContainText('CV Maker');
    await expect(page.getByTestId('cv-template-card')).toHaveCount(30);

    // Step 1: Select Zurich Timeline template
    await page.getByTestId('cv-template-card').filter({ hasText: 'Zurich Timeline' }).click();
    await page
      .getByRole('button', { name: /Next: Choose Profession/i })
      .first()
      .click();

    // Step 2: Select Data Analyst profession to verify auto-fill
    await page
      .getByTestId('cv-profession-card')
      .filter({ hasText: 'Data Analyst & BI Specialist' })
      .click();
    await page.getByRole('button', { name: /Next: Personal/i }).click();

    // Step 3: Edit full name
    await page.getByLabel('Full Name').fill('Samir Hasan');
    await page.getByRole('button', { name: /Next: Summary/i }).click();

    // Step 4: Verify profession auto-filled summary is present
    const summaryBox = page.getByLabel('Summary Statement');
    await expect(summaryBox).toHaveValue(/SQL|Python|statistical/i);
    await page.getByRole('button', { name: /Next: Experience/i }).click();

    // Step 5 -> Step 6: Education step, add second school/degree
    await page.getByRole('button', { name: /Next: Education/i }).click();
    await expect(page.getByTestId('cv-education-card')).toHaveCount(1);
    await page.getByRole('button', { name: '+ Add School / Degree' }).click();
    await expect(page.getByTestId('cv-education-card')).toHaveCount(2);

    // Step 6 -> Step 7 -> Step 8: Preview & Download PDF
    await page.getByRole('button', { name: /Next: Skills/i }).click();
    await page.getByRole('button', { name: /Next: Preview & PDF/i }).click();
    await expect(page.getByTestId('cv-live-preview')).toContainText('Samir Hasan');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CV as PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('samir-hasan-cv.pdf');

    const outputBytes = await readDownloadBuffer(download);
    expect(outputBytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    const loaded = await PDFDocument.load(outputBytes);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(externalRequests).toEqual([]);
  });
});
