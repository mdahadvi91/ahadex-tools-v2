/**
 * Interactive Merge PDF tool UI with file reordering, custom output naming,
 * and client-side pdf-lib merging.
 */

import { useCallback, useState } from 'react';
import Button from '../../components/ui/Button';
import Dropzone from '../../components/ui/Dropzone';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import { showToast } from '../../components/ui/Toast';
import { triggerBlobDownload } from '../../lib/download-blob';
import { formatBytes } from '../../lib/format-bytes';
import { validateBatch, validateSingleFile } from '../../platform/security/file-policy';
import { mergePdfBuffers } from './engine';

interface QueuedPdf {
  id: string;
  file: File;
}

interface MergedOutput {
  outputName: string;
  totalPages: number;
  sourceCount: number;
  inputTotalBytes: number;
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

function sanitizeOutputFilename(raw: string): string {
  const trimmed = raw.trim().replace(/[/\\?%*:|"<>]/g, '-');
  const withoutExt = trimmed
    .replace(/\.pdf$/i, '')
    .replace(/^\.+/, '')
    .trim();
  const base = withoutExt || 'merged-document';
  return `${base}.pdf`;
}

export default function Tool() {
  const [queue, setQueue] = useState<QueuedPdf[]>([]);
  const [outputName, setOutputName] = useState('merged-document.pdf');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState<MergedOutput | null>(null);

  const handleFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const validFiles: File[] = [];

      for (const raw of incoming) {
        const candidate = normalizePdfFile(raw);
        const check = validateSingleFile(candidate, 'pdf');
        if (!check.ok) {
          setError(check.violations.map((v) => v.message).join(' '));
          continue;
        }
        validFiles.push(candidate);
      }

      if (validFiles.length === 0) return;

      const combinedFiles = [...queue.map((q) => q.file), ...validFiles];
      const batchCheck = validateBatch(combinedFiles, 'pdf');
      if (!batchCheck.ok) {
        setError(batchCheck.violations.map((v) => v.message).join(' '));
        return;
      }

      const timestamp = Date.now();
      setQueue((prev) => [
        ...prev,
        ...validFiles.map((file, idx) => ({
          id: `${timestamp}-${prev.length + idx}-${file.name}`,
          file,
        })),
      ]);
      setMerged(null);
    },
    [queue],
  );

  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    setQueue((prev) => {
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setMerged(null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setMerged(null);
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
    setMerged(null);
    setError(null);
    setProgress(0);
  }, []);

  const mergeAll = useCallback(async () => {
    if (queue.length < 2) {
      setError('Please add at least 2 PDF files to combine.');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(15);
    setMerged(null);

    try {
      const sources: Array<{ fileName: string; bytes: ArrayBuffer }> = [];
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        sources.push({
          fileName: item.file.name,
          bytes: await item.file.arrayBuffer(),
        });
        setProgress(Math.round(((i + 1) / queue.length) * 55));
      }
      setProgress(70);

      const result = await mergePdfBuffers(sources);
      setProgress(100);

      const blob = new Blob([result.bytes.slice().buffer], { type: 'application/pdf' });
      setMerged({
        outputName: sanitizeOutputFilename(outputName),
        totalPages: result.totalPages,
        sourceCount: result.sourceCount,
        inputTotalBytes: result.inputTotalBytes,
        outputSize: result.outputSize,
        blob,
      });

      showToast(
        `Combined ${result.sourceCount} PDFs (${result.totalPages} pages total).`,
        'success',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not merge the selected PDF files.');
    } finally {
      setProcessing(false);
    }
  }, [outputName, queue]);

  const downloadMerged = useCallback(() => {
    if (!merged) return;
    triggerBlobDownload(merged.blob, merged.outputName);
  }, [merged]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-[#e6e2d8] bg-white p-6 shadow-xs">
        <Dropzone
          accept="application/pdf,.pdf"
          multiple
          onChange={handleFiles}
          disabled={processing}
          hint="Select 2 to 20 PDF files (up to 50 MB each, 200 MB batch max)"
        />

        {error && (
          <div className="mt-4">
            <ErrorMessage title="Could not merge PDFs">{error}</ErrorMessage>
          </div>
        )}

        {queue.length > 0 && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-900">
                Merge order ({queue.length} file{queue.length === 1 ? '' : 's'})
              </h2>
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                {queue.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        <span className="mr-2 font-mono text-xs text-slate-600">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        {item.file.name}
                      </p>
                      <p className="text-xs text-slate-600">{formatBytes(item.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processing || idx === 0}
                        onClick={() => moveItem(idx, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processing || idx === queue.length - 1}
                        onClick={() => moveItem(idx, 1)}
                      >
                        Down
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processing}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label
                htmlFor="merge-output-name"
                className="block text-sm font-medium text-slate-900"
              >
                Output filename
              </label>
              <input
                id="merge-output-name"
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                disabled={processing}
                placeholder="merged-document.pdf"
                className="mt-1.5 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {processing && (
              <div>
                <ProgressBar value={progress} label="Combining PDFs" />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={mergeAll} disabled={processing || queue.length < 2}>
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" /> Merging PDFs...
                  </span>
                ) : (
                  `Merge ${queue.length} PDF${queue.length === 1 ? '' : 's'}`
                )}
              </Button>
              <Button variant="secondary" onClick={clearAll} disabled={processing}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {merged && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{merged.outputName}</h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  {merged.totalPages} pages from {merged.sourceCount} documents · Combined size:{' '}
                  {formatBytes(merged.outputSize)} (sources: {formatBytes(merged.inputTotalBytes)})
                </p>
              </div>
              <Button size="sm" onClick={downloadMerged}>
                Download Merged PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
