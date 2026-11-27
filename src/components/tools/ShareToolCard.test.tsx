import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ShareToolCard from './ShareToolCard';

describe('ShareToolCard organic sharing links and clipboard', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (root) {
      flushSync(() => {
        root?.unmount();
      });
      root = null;
    }
    container?.remove();
    container = null;
    vi.restoreAllMocks();
  });

  it('renders valid direct share links with noopener noreferrer and copies canonical URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    flushSync(() => {
      root?.render(
        <ShareToolCard
          title="PDF Compressor"
          path="/pdf-compressor/"
          summary="Optimize PDFs locally with zero uploads."
        />,
      );
    });

    const links = Array.from(container.querySelectorAll('a'));
    expect(links.length).toBe(4);
    for (const link of links) {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('href')).toContain(
        encodeURIComponent('https://ahadex.online/pdf-compressor/'),
      );
    }

    const copyBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Copy Link'),
    );
    expect(copyBtn).toBeDefined();
    copyBtn?.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(writeText).toHaveBeenCalledWith('https://ahadex.online/pdf-compressor/');
  });
});
