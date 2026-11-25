/**
 * Interactive Split PDF workspace with automatic page count detection,
 * range extraction, and single-page burst downloads.
 */

import { useCallback, useState } from 'react';
import Button from '../../components/ui/Button';
import Dropzone from '../../components/ui/Dropzone';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import { showToast } from '../../components/ui/Toast';
import { triggerBlobDownload, triggerStaggeredDownloads } from '../../lib/download-blob';
import { formatBytes } from '../../lib/format-bytes';
import { validateSingleFile } from '../../platform/security/file-policy';
import { inspectPdfPageCount, splitPdfBuffer } from './engine';
import type { SplitMode } from './types';

interface OutputPdfChunk {
  id: string;
  label: string;
  outputName: string;
  pageCount: number;
  outputSize: number;
  blob: Blob;
}

function normalizePdfFile(file: File): File {
  if (file.type === 'application/pdf') return file;
  if (file.name.toLowerCase().endsWith('.pdf') && file.type === '') {
    return new File([file], file.name, {
      type: 'application/pdf',
      lastModified: file.lastModified,
    });
  }
  return file;
}

export default function Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<SplitMode>('extract-range');
  const [rangeInput, setRangeInput] = useState('1');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<OutputPdfChunk[]>([]);

  const handleFiles = useCallback(async (incoming: File[]) => {
    setError(null);
    setChunks([]);
    const raw = incoming[0];
    if (!raw) return;

    const candidate = normalizePdfFile(raw);
    const check = validateSingleFile(candidate, 'pdf');
    if (!check.ok) {
      setError(check.violations.map((v) => v.message).join(' '));
      return;
    }

    try {
      const bytes = await candidate.arrayBuffer();
      const count = await inspectPdfPageCount(bytes, candidate.name);
      setFile(candidate);
      setPageCount(count);
      setRangeInput(count > 1 ? `1-${Math.min(2, count)}` : '1');
    } catch (err) {
      setFile(null);
      setPageCount(null);
      setError(err instanceof Error ? err.message : `Could not inspect ${candidate.name}.`);
    }
  }, []);

  const clearAll = useCallback(() => {
    setFile(null);
    setPageCount(null);
    setChunks([]);
    setError(null);
    setProgress(0);
  }, []);

  const runSplit = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setProgress(25);
    setChunks([]);

    try {
      const bytes = await file.arrayBuffer();
      setProgress(60);

      const result = await splitPdfBuffer({
        bytes,
        fileName: file.name,
        mode,
        pageRangeInput: rangeInput,
      });

      const items: OutputPdfChunk[] = result.chunks.map((chunk, idx) => ({
        id: `chunk-${idx}-${chunk.outputName}`,
        label: chunk.label,
        outputName: chunk.outputName,
        pageCount: chunk.pageCount,
        outputSize: chunk.outputSize,
        blob: new Blob([chunk.bytes.slice().buffer], { type: 'application/pdf' }),
      }));

      setChunks(items);
      setProgress(100);
      showToast(`Created ${items.length} PDF file${items.length === 1 ? '' : 's'}.`, 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not split this PDF.');
    } finally {
      setProcessing(false);
    }
  }, [file, mode, rangeInput]);

  const downloadOne = useCallback((chunk: OutputPdfChunk) => {
    triggerBlobDownload(chunk.blob, chunk.outputName);
  }, []);

  const downloadAll = useCallback(() => {
    triggerStaggeredDownloads(
      chunks.map((chunk) => ({ blob: chunk.blob, fileName: chunk.outputName })),
    );
  }, [chunks]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Dropzone
          accept="application/pdf,.pdf"
          multiple={false}
          onChange={handleFiles}
          disabled={processing}
          hint="Select one PDF file up to 50 MB"
        />

        {error && (
          <div className="mt-4">
            <ErrorMessage title="Could not process PDF">{error}</ErrorMessage>
          </div>
        )}

        {file && pageCount !== null && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-600">
                  {pageCount} page{pageCount === 1 ? '' : 's'} · {formatBytes(file.size)}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={clearAll} disabled={processing}>
                Remove
              </Button>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-900">Split mode</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setMode('extract-range');
                    setChunks([]);
                    setError(null);
                  }}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    mode === 'extract-range'
                      ? 'border-brand-600 bg-brand-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">
                    Extract custom page range
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    Save selected pages (e.g. 1-3, 5) into one clean PDF.
                  </span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setMode('every-page');
                    setChunks([]);
                    setError(null);
                  }}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    mode === 'every-page'
                      ? 'border-brand-600 bg-brand-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">
                    Split every page
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    Generate {pageCount} standalone 1-page PDF files.
                  </span>
                </button>
              </div>
            </div>

            {mode === 'extract-range' && (
              <div>
                <label
                  htmlFor="split-page-range"
                  className="block text-sm font-medium text-slate-900"
                >
                  Pages to extract (1 to {pageCount})
                </label>
                <input
                  id="split-page-range"
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  disabled={processing}
                  placeholder={`1-${pageCount}`}
                  className="mt-1.5 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Separate individual pages or ranges with commas (example: 1-3, 5).
                </p>
              </div>
            )}

            {processing && (
              <div>
                <ProgressBar value={progress} label="Splitting PDF" />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={runSplit} disabled={processing}>
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" /> Splitting PDF...
                  </span>
                ) : mode === 'extract-range' ? (
                  'Extract Selected Pages'
                ) : (
                  `Split Into ${pageCount} PDF${pageCount === 1 ? '' : 's'}`
                )}
              </Button>
              {chunks.length > 1 && (
                <Button variant="secondary" onClick={downloadAll}>
                  Download all ({chunks.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {chunks.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Output files ({chunks.length})
            </h2>
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {chunks.map((chunk) => (
                <li
                  key={chunk.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {chunk.outputName}
                    </p>
                    <p className="text-xs text-slate-600">
                      {chunk.label} · {chunk.pageCount} page{chunk.pageCount === 1 ? '' : 's'} ·{' '}
                      {formatBytes(chunk.outputSize)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => downloadOne(chunk)}>
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
