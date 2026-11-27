/**
 * Pure browser-side A4 vector PDF synthesis engine for CV Maker built on pdf-lib.
 * Supports all 10 template structural archetypes, multi-page automatic continuation,
 * optional PNG/JPEG portrait embedding, and crisp vector typography.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib';
import type { CvPdfBuildInput, CvPdfBuildResult, CvTemplate } from '../types';
import { extractInitials, sanitizePdfText, validateCvFormData, wrapTextLines } from './validation';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN_X = 40;
const PAGE_MARGIN_TOP = 42;
const PAGE_MARGIN_BOTTOM = 42;

interface FontPack {
  regular: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
      : clean;
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num)) {
    return rgb(0.1, 0.14, 0.2);
  }
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '').trim();
  const num = Number.parseInt(clean, 16);
  if (!Number.isFinite(num)) return false;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 140;
}

class PdfFlowCursor {
  readonly doc: PDFDocument;
  readonly fonts: FontPack;
  readonly template: CvTemplate;
  page: PDFPage;
  y: number;
  pageCount = 1;

  constructor(doc: PDFDocument, fonts: FontPack, template: CvTemplate, firstPage: PDFPage) {
    this.doc = doc;
    this.fonts = fonts;
    this.template = template;
    this.page = firstPage;
    this.y = A4_HEIGHT - PAGE_MARGIN_TOP;
  }

  ensureSpace(neededHeight: number, onNewPage?: (page: PDFPage) => void): void {
    if (this.y - neededHeight >= PAGE_MARGIN_BOTTOM) {
      return;
    }
    const nextPage = this.doc.addPage([A4_WIDTH, A4_HEIGHT]);
    this.page = nextPage;
    this.pageCount++;
    this.y = A4_HEIGHT - PAGE_MARGIN_TOP;
    if (onNewPage) {
      onNewPage(nextPage);
    }
  }

  drawWrapped(
    text: string,
    x: number,
    maxWidth: number,
    size: number,
    font: PDFFont,
    color: ReturnType<typeof rgb>,
    lineHeight = size * 1.42,
    onNewPage?: (page: PDFPage) => void,
  ): void {
    const lines = wrapTextLines(text, maxWidth, (c) => font.widthOfTextAtSize(c, size));
    for (const line of lines) {
      this.ensureSpace(lineHeight, onNewPage);
      this.page.drawText(line, { x, y: this.y, size, font, color });
      this.y -= lineHeight;
    }
  }
}

function drawSidebarColumnContent(
  page: PDFPage,
  x: number,
  width: number,
  startY: number,
  fonts: FontPack,
  template: CvTemplate,
  input: CvPdfBuildInput,
  photoImage: PDFImage | null,
): void {
  const { data } = input;
  const textColor = hexToRgb(template.sidebarTextColor);
  const darkSidebar = isDarkHex(template.sidebarColor);
  const mutedColor = darkSidebar ? rgb(0.84, 0.88, 0.94) : rgb(0.28, 0.34, 0.42);
  const accentColor = hexToRgb(template.accentColor);
  let y = startY;

  if (photoImage) {
    const photoSize = 68;
    const photoX = x + Math.max(0, (width - photoSize) / 2);
    page.drawRectangle({
      x: photoX - 2,
      y: y - photoSize - 2,
      width: photoSize + 4,
      height: photoSize + 4,
      color: accentColor,
    });
    page.drawImage(photoImage, {
      x: photoX,
      y: y - photoSize,
      width: photoSize,
      height: photoSize,
    });
    y -= photoSize + 18;
  }

  const drawSidebarHeading = (title: string) => {
    page.drawText(title.toUpperCase(), {
      x,
      y,
      size: 8.5,
      font: fonts.bold,
      color: darkSidebar ? accentColor : hexToRgb(template.primaryColor),
    });
    y -= 5;
    page.drawLine({
      start: { x, y },
      end: { x: x + width, y },
      thickness: 0.9,
      color: darkSidebar ? rgb(1, 1, 1) : hexToRgb(template.primaryColor),
      opacity: darkSidebar ? 0.22 : 0.25,
    });
    y -= 13;
  };

  drawSidebarHeading('Contact');
  const contactItems = [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.website,
  ]
    .map(sanitizePdfText)
    .filter(Boolean);

  for (const item of contactItems) {
    const lines = wrapTextLines(item, width, (c) => fonts.regular.widthOfTextAtSize(c, 8.5));
    for (const line of lines) {
      if (y < 40) break;
      page.drawText(line, { x, y, size: 8.5, font: fonts.regular, color: textColor });
      y -= 12;
    }
    y -= 2;
  }

  if (data.skills.length > 0) {
    y -= 10;
    drawSidebarHeading('Core Skills');
    for (const skill of data.skills.slice(0, 18)) {
      const clean = sanitizePdfText(skill);
      if (!clean || y < 44) continue;
      const lines = wrapTextLines(`* ${clean}`, width, (c) =>
        fonts.regular.widthOfTextAtSize(c, 8.5),
      );
      for (const line of lines) {
        page.drawText(line, { x, y, size: 8.5, font: fonts.regular, color: mutedColor });
        y -= 11.5;
      }
    }
  }

  if (data.languages.length > 0 && y > 80) {
    y -= 10;
    drawSidebarHeading('Languages');
    for (const lang of data.languages.slice(0, 6)) {
      const clean = sanitizePdfText(lang);
      if (!clean || y < 44) continue;
      page.drawText(clean, { x, y, size: 8.5, font: fonts.regular, color: mutedColor });
      y -= 12;
    }
  }

  if (data.certifications.length > 0 && y > 80) {
    y -= 10;
    drawSidebarHeading('Certifications');
    for (const cert of data.certifications.slice(0, 5)) {
      const clean = sanitizePdfText(cert);
      if (!clean || y < 44) continue;
      const lines = wrapTextLines(clean, width, (c) => fonts.regular.widthOfTextAtSize(c, 8.2));
      for (const line of lines) {
        page.drawText(line, { x, y, size: 8.2, font: fonts.regular, color: mutedColor });
        y -= 11;
      }
      y -= 2;
    }
  }
}

function drawSectionHeading(
  cursor: PdfFlowCursor,
  title: string,
  x: number,
  width: number,
  onNewPage?: (page: PDFPage) => void,
): void {
  const { template, fonts } = cursor;
  const primary = hexToRgb(template.primaryColor);
  const accent = hexToRgb(template.accentColor);

  cursor.ensureSpace(34, onNewPage);
  if (template.sectionStyle === 'bar') {
    cursor.page.drawRectangle({
      x,
      y: cursor.y - 2,
      width: 4,
      height: 12,
      color: accent,
    });
    cursor.page.drawText(title.toUpperCase(), {
      x: x + 9,
      y: cursor.y,
      size: 10,
      font: fonts.bold,
      color: primary,
    });
    cursor.y -= 15;
  } else if (template.sectionStyle === 'pill') {
    const label = title.toUpperCase();
    const labelW = fonts.bold.widthOfTextAtSize(label, 9);
    cursor.page.drawRectangle({
      x,
      y: cursor.y - 4,
      width: labelW + 14,
      height: 16,
      color: accent,
      opacity: 0.14,
    });
    cursor.page.drawText(label, {
      x: x + 7,
      y: cursor.y,
      size: 9,
      font: fonts.bold,
      color: primary,
    });
    cursor.y -= 18;
  } else {
    cursor.page.drawText(title.toUpperCase(), {
      x,
      y: cursor.y,
      size: 10,
      font: fonts.bold,
      color: primary,
    });
    cursor.y -= 5;
    cursor.page.drawLine({
      start: { x, y: cursor.y },
      end: { x: x + width, y: cursor.y },
      thickness: 0.9,
      color: accent,
      opacity: 0.55,
    });
    cursor.y -= 14;
  }
}

function drawExperienceAndEducationBlocks(
  cursor: PdfFlowCursor,
  x: number,
  width: number,
  input: CvPdfBuildInput,
  includeTimelineSpine: boolean,
  onNewPage?: (page: PDFPage) => void,
): void {
  const { data, template } = input;
  const { fonts } = cursor;
  const ink = rgb(0.08, 0.11, 0.16);
  const slate = rgb(0.32, 0.38, 0.46);
  const accent = hexToRgb(template.accentColor);
  const isSwiss = template.layout === 'minimal-swiss';
  const dateColWidth = isSwiss ? 96 : 0;
  const contentX = isSwiss ? x + dateColWidth + 12 : includeTimelineSpine ? x + 16 : x;
  const contentW = isSwiss ? width - dateColWidth - 12 : includeTimelineSpine ? width - 16 : width;

  if (sanitizePdfText(data.summary)) {
    drawSectionHeading(cursor, 'Professional Summary', x, width, onNewPage);
    cursor.drawWrapped(data.summary, x, width, 9.6, fonts.regular, ink, 14, onNewPage);
    cursor.y -= 10;
  }

  if (data.experiences.length > 0) {
    drawSectionHeading(cursor, 'Work Experience', x, width, onNewPage);

    for (const exp of data.experiences) {
      cursor.ensureSpace(46, onNewPage);
      const dates = [exp.startDate, exp.endDate].map(sanitizePdfText).filter(Boolean).join(' - ');
      const role = sanitizePdfText(exp.role) || 'Role';
      const companyLine = [exp.company, exp.location]
        .map(sanitizePdfText)
        .filter(Boolean)
        .join(' | ');

      if (includeTimelineSpine) {
        cursor.page.drawCircle({
          x: x + 5,
          y: cursor.y + 3,
          size: 3.2,
          color: accent,
        });
        cursor.page.drawLine({
          start: { x: x + 5, y: cursor.y - 2 },
          end: { x: x + 5, y: Math.max(PAGE_MARGIN_BOTTOM, cursor.y - 44) },
          thickness: 0.9,
          color: accent,
          opacity: 0.35,
        });
      }

      if (isSwiss && dates) {
        cursor.page.drawText(dates.slice(0, 20), {
          x,
          y: cursor.y,
          size: 8.3,
          font: fonts.mono,
          color: slate,
        });
      }

      cursor.page.drawText(role, {
        x: contentX,
        y: cursor.y,
        size: 10.5,
        font: fonts.bold,
        color: ink,
      });

      if (!isSwiss && dates) {
        const dateW = fonts.mono.widthOfTextAtSize(dates, 8.2);
        cursor.page.drawText(dates, {
          x: contentX + contentW - dateW,
          y: cursor.y,
          size: 8.2,
          font: fonts.mono,
          color: slate,
        });
      }

      cursor.y -= 13;
      if (companyLine) {
        cursor.drawWrapped(
          companyLine,
          contentX,
          contentW,
          9.1,
          fonts.regular,
          slate,
          12.5,
          onNewPage,
        );
      }

      for (const bullet of exp.highlights) {
        const cleanBullet = sanitizePdfText(bullet);
        if (!cleanBullet) continue;
        cursor.drawWrapped(
          `* ${cleanBullet}`,
          contentX + 6,
          contentW - 6,
          9.1,
          fonts.regular,
          ink,
          13,
          onNewPage,
        );
      }
      cursor.y -= 8;
    }
  }

  if (data.educations.length > 0) {
    drawSectionHeading(cursor, 'Education', x, width, onNewPage);
    for (const edu of data.educations) {
      cursor.ensureSpace(38, onNewPage);
      const degree = sanitizePdfText(edu.degree) || 'Degree';
      const schoolLine = [edu.school, edu.location]
        .map(sanitizePdfText)
        .filter(Boolean)
        .join(' | ');
      const year = sanitizePdfText(edu.graduationYear);

      if (isSwiss && year) {
        cursor.page.drawText(year, {
          x,
          y: cursor.y,
          size: 8.5,
          font: fonts.mono,
          color: slate,
        });
      }

      cursor.page.drawText(degree, {
        x: contentX,
        y: cursor.y,
        size: 10.2,
        font: fonts.bold,
        color: ink,
      });

      if (!isSwiss && year) {
        const yearW = fonts.mono.widthOfTextAtSize(year, 8.5);
        cursor.page.drawText(year, {
          x: contentX + contentW - yearW,
          y: cursor.y,
          size: 8.5,
          font: fonts.mono,
          color: slate,
        });
      }

      cursor.y -= 13;
      if (schoolLine) {
        cursor.drawWrapped(
          schoolLine,
          contentX,
          contentW,
          9.1,
          fonts.regular,
          slate,
          12.5,
          onNewPage,
        );
      }
      if (sanitizePdfText(edu.details)) {
        cursor.drawWrapped(
          edu.details,
          contentX,
          contentW,
          8.8,
          fonts.regular,
          ink,
          12.2,
          onNewPage,
        );
      }
      cursor.y -= 7;
    }
  }
}

export async function generateCvPdf(input: CvPdfBuildInput): Promise<CvPdfBuildResult> {
  const start = performance.now();
  const validation = validateCvFormData(input.data);
  if (!validation.valid) {
    throw new Error(validation.reason ?? 'Invalid CV data.');
  }

  const doc = await PDFDocument.create();
  doc.setTitle(`${sanitizePdfText(input.data.personal.fullName)} - Curriculum Vitae`);
  doc.setCreator('AHADEX CV Maker (ahadex.online)');

  const isSerif = input.template.fontStyle === 'serif';
  const regular = await doc.embedFont(isSerif ? StandardFonts.TimesRoman : StandardFonts.Helvetica);
  const bold = await doc.embedFont(
    isSerif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold,
  );
  const mono = await doc.embedFont(
    input.template.fontStyle === 'mono-accent' ? StandardFonts.Courier : StandardFonts.Helvetica,
  );
  const fonts: FontPack = { regular, bold, mono };

  let photoImage: PDFImage | null = null;
  if (input.photoBytes && input.photoBytes.byteLength > 0) {
    photoImage =
      input.photoMime === 'image/png'
        ? await doc.embedPng(input.photoBytes)
        : await doc.embedJpg(input.photoBytes);
  }

  const firstPage = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const { template, data } = input;
  const surfaceRgb = hexToRgb(template.surfaceColor);
  if (template.surfaceColor.toLowerCase() !== '#ffffff') {
    firstPage.drawRectangle({
      x: 0,
      y: 0,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      color: surfaceRgb,
    });
  }

  const primary = hexToRgb(template.primaryColor);
  const accent = hexToRgb(template.accentColor);
  const ink = rgb(0.08, 0.11, 0.16);
  const slate = rgb(0.32, 0.38, 0.46);
  const fullName = sanitizePdfText(data.personal.fullName);
  const headline = sanitizePdfText(data.personal.headline);

  const cursor = new PdfFlowCursor(doc, fonts, template, firstPage);

  if (template.layout === 'left-sidebar' || template.layout === 'right-sidebar') {
    const isLeft = template.layout === 'left-sidebar';
    const sideWidth = 178;
    const sideX = isLeft ? 0 : A4_WIDTH - sideWidth;
    const mainX = isLeft ? sideWidth + 24 : 34;
    const mainWidth = A4_WIDTH - sideWidth - 58;

    const paintSidebarBackground = (targetPage: PDFPage) => {
      targetPage.drawRectangle({
        x: sideX,
        y: 0,
        width: sideWidth,
        height: A4_HEIGHT,
        color: hexToRgb(template.sidebarColor),
      });
    };

    paintSidebarBackground(firstPage);
    drawSidebarColumnContent(
      firstPage,
      sideX + 18,
      sideWidth - 36,
      A4_HEIGHT - 44,
      fonts,
      template,
      input,
      photoImage,
    );

    cursor.y = A4_HEIGHT - 46;
    cursor.drawWrapped(fullName, mainX, mainWidth, 21, bold, primary, 24, paintSidebarBackground);
    if (headline) {
      cursor.drawWrapped(
        headline,
        mainX,
        mainWidth,
        11.2,
        regular,
        accent,
        15,
        paintSidebarBackground,
      );
    }
    cursor.y -= 12;

    drawExperienceAndEducationBlocks(
      cursor,
      mainX,
      mainWidth,
      input,
      false,
      paintSidebarBackground,
    );
  } else if (template.layout === 'split-banner') {
    const bannerHeight = 114;
    firstPage.drawRectangle({
      x: 0,
      y: A4_HEIGHT - bannerHeight,
      width: A4_WIDTH,
      height: bannerHeight,
      color: hexToRgb(template.sidebarColor),
    });

    const headerTextWidth = photoImage ? A4_WIDTH - 160 : A4_WIDTH - 80;
    firstPage.drawText(fullName, {
      x: PAGE_MARGIN_X,
      y: A4_HEIGHT - 44,
      size: 22,
      font: bold,
      color: hexToRgb(template.sidebarTextColor),
    });
    if (headline) {
      firstPage.drawText(headline.slice(0, 72), {
        x: PAGE_MARGIN_X,
        y: A4_HEIGHT - 64,
        size: 11,
        font: regular,
        color: hexToRgb(template.sidebarTextColor),
        opacity: 0.9,
      });
    }
    const contactBar = [
      data.personal.email,
      data.personal.phone,
      data.personal.location,
      data.personal.website,
    ]
      .map(sanitizePdfText)
      .filter(Boolean)
      .join('  |  ');
    if (contactBar) {
      const lines = wrapTextLines(contactBar, headerTextWidth, (c) =>
        regular.widthOfTextAtSize(c, 8.5),
      );
      let cy = A4_HEIGHT - 84;
      for (const line of lines.slice(0, 2)) {
        firstPage.drawText(line, {
          x: PAGE_MARGIN_X,
          y: cy,
          size: 8.5,
          font: regular,
          color: hexToRgb(template.sidebarTextColor),
          opacity: 0.85,
        });
        cy -= 11;
      }
    }
    if (photoImage) {
      firstPage.drawImage(photoImage, {
        x: A4_WIDTH - 98,
        y: A4_HEIGHT - 92,
        width: 64,
        height: 64,
      });
    }

    cursor.y = A4_HEIGHT - bannerHeight - 28;
    const bodyWidth = A4_WIDTH - PAGE_MARGIN_X * 2;
    drawExperienceAndEducationBlocks(cursor, PAGE_MARGIN_X, bodyWidth, input, false);
    if (data.skills.length > 0) {
      drawSectionHeading(cursor, 'Skills & Qualifications', PAGE_MARGIN_X, bodyWidth);
      cursor.drawWrapped(
        data.skills.join('  |  '),
        PAGE_MARGIN_X,
        bodyWidth,
        9.4,
        regular,
        ink,
        13.5,
      );
      if (data.languages.length > 0 || data.certifications.length > 0) {
        cursor.y -= 6;
        const extras = [...data.languages, ...data.certifications]
          .map(sanitizePdfText)
          .filter(Boolean)
          .join('  |  ');
        if (extras) {
          cursor.drawWrapped(extras, PAGE_MARGIN_X, bodyWidth, 9, regular, slate, 13);
        }
      }
    }
  } else {
    // Classic Top, Timeline, Minimal Swiss, Boxed Grid, Compact Dense, Editorial Serif, Monogram Corner
    const isMonogram = template.layout === 'monogram-corner';
    const isTimeline = template.layout === 'timeline';
    const marginX = isMonogram ? 52 : PAGE_MARGIN_X;
    const bodyWidth = A4_WIDTH - marginX - PAGE_MARGIN_X;

    const decoratePage = (targetPage: PDFPage) => {
      if (template.surfaceColor.toLowerCase() !== '#ffffff') {
        targetPage.drawRectangle({
          x: 0,
          y: 0,
          width: A4_WIDTH,
          height: A4_HEIGHT,
          color: surfaceRgb,
        });
      }
      if (isMonogram) {
        targetPage.drawRectangle({
          x: 0,
          y: 0,
          width: 16,
          height: A4_HEIGHT,
          color: accent,
        });
      }
    };

    decoratePage(firstPage);

    let titleX = marginX;
    if (isMonogram) {
      const initials = extractInitials(fullName);
      firstPage.drawRectangle({
        x: marginX,
        y: A4_HEIGHT - 84,
        width: 44,
        height: 44,
        color: primary,
      });
      const initW = bold.widthOfTextAtSize(initials, 16);
      firstPage.drawText(initials, {
        x: marginX + (44 - initW) / 2,
        y: A4_HEIGHT - 68,
        size: 16,
        font: bold,
        color: rgb(1, 1, 1),
      });
      titleX = marginX + 56;
    }

    if (photoImage) {
      firstPage.drawImage(photoImage, {
        x: A4_WIDTH - PAGE_MARGIN_X - 58,
        y: A4_HEIGHT - 94,
        width: 58,
        height: 58,
      });
    }

    const nameMaxW = photoImage ? A4_WIDTH - titleX - 110 : A4_WIDTH - titleX - PAGE_MARGIN_X;
    cursor.y = A4_HEIGHT - 46;
    cursor.drawWrapped(fullName, titleX, nameMaxW, 21, bold, primary, 24, decoratePage);
    if (headline) {
      cursor.drawWrapped(headline, titleX, nameMaxW, 11, regular, accent, 14.5, decoratePage);
    }

    const contactLine = [
      data.personal.email,
      data.personal.phone,
      data.personal.location,
      data.personal.website,
    ]
      .map(sanitizePdfText)
      .filter(Boolean)
      .join('  |  ');
    if (contactLine) {
      cursor.drawWrapped(contactLine, titleX, nameMaxW, 8.7, regular, slate, 12, decoratePage);
    }

    cursor.y = Math.min(cursor.y, isMonogram || photoImage ? A4_HEIGHT - 102 : cursor.y) - 6;
    firstPage.drawLine({
      start: { x: marginX, y: cursor.y },
      end: { x: A4_WIDTH - PAGE_MARGIN_X, y: cursor.y },
      thickness: 1.2,
      color: primary,
      opacity: 0.25,
    });
    cursor.y -= 18;

    drawExperienceAndEducationBlocks(cursor, marginX, bodyWidth, input, isTimeline, decoratePage);

    if (data.skills.length > 0) {
      drawSectionHeading(cursor, 'Core Skills', marginX, bodyWidth, decoratePage);
      cursor.drawWrapped(
        data.skills.join('  |  '),
        marginX,
        bodyWidth,
        9.2,
        regular,
        ink,
        13.5,
        decoratePage,
      );
      cursor.y -= 8;
    }

    const extras = [
      data.languages.length > 0 ? `Languages: ${data.languages.join(', ')}` : '',
      data.certifications.length > 0 ? `Certifications: ${data.certifications.join(', ')}` : '',
    ].filter(Boolean);

    if (extras.length > 0) {
      drawSectionHeading(cursor, 'Languages & Certifications', marginX, bodyWidth, decoratePage);
      for (const extraLine of extras) {
        cursor.drawWrapped(extraLine, marginX, bodyWidth, 9.1, regular, ink, 13, decoratePage);
      }
    }
  }

  const bytes = await doc.save({ useObjectStreams: true });
  const durationMs = Math.max(1, Math.round(performance.now() - start));

  return {
    bytes,
    pageCount: cursor.pageCount,
    outputSize: bytes.byteLength,
    durationMs,
  };
}
