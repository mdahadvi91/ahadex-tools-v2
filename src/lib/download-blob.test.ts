import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_REVOKE_DELAY_MS,
  triggerBlobDownload,
  triggerStaggeredDownloads,
} from './download-blob';

describe('triggerBlobDownload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('defers URL.revokeObjectURL until after click completes to avoid Safari timing races', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url-1');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const blob = new Blob(['test-content'], { type: 'text/plain' });
    triggerBlobDownload(blob, 'sample.txt');

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    // Must NOT revoke synchronously right after click.
    expect(revokeSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(DEFAULT_REVOKE_DELAY_MS - 1);
    expect(revokeSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url-1');
  });

  it('staggers batch downloads across intervals to avoid browser popup throttling', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url-batch');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    triggerStaggeredDownloads(
      [
        { blob: new Blob(['1']), fileName: 'one.pdf' },
        { blob: new Blob(['2']), fileName: 'two.pdf' },
        { blob: new Blob(['3']), fileName: 'three.pdf' },
      ],
      150,
    );

    expect(clickSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(150);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(150);
    expect(clickSpy).toHaveBeenCalledTimes(3);
  });
});
