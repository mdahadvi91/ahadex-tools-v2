/**
 * Interactive PDF Compressor workspace. Runs structural optimization and
 * metadata cleanup locally in the browser using pdf-lib.
 */

import { useCallback, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Dropzone from '../../components/ui/Dropzone';
import ErrorMessage from '../../components/ui/ErrorMessage';
import FileList, { type FileListItem } from '../../components/ui/FileList';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import { showToast } from '../../components/ui/Toast';
import { triggerBlobDownload, triggerStaggeredDownloads } from '../../lib/download-blob';
import { formatBytes } from '../../lib/format-bytes';
import { validateBatch, validateSingleFile } from '../../platform/security/file-policy';
import { compressPdfBuffer } from './engine';
import { pdfSavingsPercent } from './types';

interface CompressedPdfItem {
  id: string;
  outputName: string;
  inputSize: number;
  outputSize: number;
  pageCount: number;
  blob: Blob;
}

function makeCompressedFilename(name: string): string {
  const base = name.replace(/\.pdf$/i, '');
  return `${base}-optimized.pdf`;
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
  const [files, setFiles] = useState<File[]>([]);
  const [useObjectStreams, setUseObjectStreams] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompressedPdfItem[]>([]);

  const handleFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const valid: File[] = [];
      for (const raw of incoming) {
        const candidate = normalizePdfFile(raw);
        const check = validateSingleFile(candidate, 'pdf');
        if (!check.ok) {
          setError(check.violations.map((v) => v.message).join(' '));
          continue;
        }
        valid.push(candidate);
      }
      if (valid.length === 0) return;

      const combined = [...files, ...valid];
      const batchCheck = validateBatch(combined, 'pdf');
      if (!batchCheck.ok) {
        setError(batchCheck.violations.map((v) => v.message).join(' '));
        return;
      }

      setFiles(combined);
      setResults([]);
    },
    [files],
  );

  const removeFile = useCallback((id: string) => {
    const idx = parseInt(id.replace('pdf-', ''), 10);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setResults([]);
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const optimizeAll = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    setProgress(0);
    setResults([]);

    const nextResults: CompressedPdfItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const bytes = await file.arrayBuffer();
        const result = await compressPdfBuffer({
          bytes,
          fileName: file.name,
          options: {
            useObjectStreams,
            stripMetadata,
          },
        });
        const blob = new Blob([result.bytes.slice().buffer], { type: 'application/pdf' });
        nextResults.push({
          id: `res-${i}`,
          outputName: makeCompressedFilename(file.name),
          inputSize: result.inputSize,
          outputSize: result.outputSize,
          pageCount: result.pageCount,
          blob,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : `Could not optimize ${file.name}.`);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
      if (i + 1 < files.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    setResults(nextResults);
    setProcessing(false);
    if (nextResults.length > 0) {
      showToast(
        `Optimized ${nextResults.length} PDF file${nextResults.length === 1 ? '' : 's'}.`,
        'success',
      );
    }
  }, [files, stripMetadata, useObjectStreams]);

  const downloadOne = useCallback((item: CompressedPdfItem) => {
    triggerBlobDownload(item.blob, item.outputName);
  }, []);

  const downloadAll = useCallback(() => {
    triggerStaggeredDownloads(
      results.map((item) => ({ blob: item.blob, fileName: item.outputName })),
    );
  }, [results]);

  const fileItems: FileListItem[] = useMemo(
    () => files.map((file, i) => ({ id: `pdf-${i}`, name: file.name, size: file.size })),
    [files],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Dropzone
          accept="application/pdf,.pdf"
          multiple
          onChange={handleFiles}
          disabled={processing}
          hint="PDF files up to 50 MB each (max 20 files)"
        />

        {error && (
          <div className="mt-4">
            <ErrorMessage title="Could not optimize PDF">{error}</ErrorMessage>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-900">
                Selected PDFs ({files.length})
              </h2>
              <FileList files={fileItems} onRemove={removeFile} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={useObjectStreams}
                  onChange={(e) => setUseObjectStreams(e.target.checked)}
                  disabled={processing}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Compress object streams
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    Packs PDF objects and cross-reference tables using compressed PDF 1.5 streams.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={stripMetadata}
                  onChange={(e) => setStripMetadata(e.target.checked)}
                  disabled={processing}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Strip document metadata
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    Clears Author, Title, Creator, Producer, and Keyword fields for privacy and
                    size.
                  </span>
                </span>
              </label>
            </div>

            {processing && (
              <div>
                <ProgressBar value={progress} label="Optimizing PDF structure" />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={optimizeAll} disabled={processing || files.length === 0}>
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" /> Optimizing...
                  </span>
                ) : (
                  `Compress ${files.length} PDF${files.length === 1 ? '' : 's'}`
                )}
              </Button>
              <Button variant="secondary" onClick={clearAll} disabled={processing}>
                Clear
              </Button>
              {results.length > 1 && (
                <Button variant="secondary" onClick={downloadAll}>
                  Download all ({results.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Optimized PDFs</h2>
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {results.map((item) => {
                const delta = pdfSavingsPercent(item.inputSize, item.outputSize);
                const statusLabel =
                  delta > 0
                    ? `${delta}% smaller`
                    : delta === 0
                      ? 'Already compact (0% change)'
                      : `${Math.abs(delta)}% larger (already tightly packed)`;
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.outputName}
                      </p>
                      <p className="text-xs text-slate-600">
                        {item.pageCount} page{item.pageCount === 1 ? '' : 's'} ·{' '}
                        {formatBytes(item.inputSize)} → {formatBytes(item.outputSize)} ·{' '}
                        {statusLabel}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => downloadOne(item)}>
                      Download
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
