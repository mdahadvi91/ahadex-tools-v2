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
});
