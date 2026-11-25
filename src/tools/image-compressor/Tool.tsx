/**
 * Image Compressor main widget. Manages file input, options,
 * processing state, and downloads.
 *
 * The engine runs in a Web Worker. Files are validated against the
 * shared file-policy before they reach the worker.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Dropzone from '../../components/ui/Dropzone';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import FileList, { type FileListItem } from '../../components/ui/FileList';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Spinner from '../../components/ui/Spinner';
import { showToast } from '../../components/ui/Toast';
import { triggerBlobDownload, triggerStaggeredDownloads } from '../../lib/download-blob';
import { validateSingleFile } from '../../platform/security/file-policy';
import { createEngine, type ImageCompressorEngine } from './engine';
import type { CompressionPreset, CompressionResult, OutputFormat, SupportedMime } from './types';
import { formatBytes, presetToOptions, savingsPercent } from './types';
import { OUTPUT_FORMATS } from './content';

interface ProcessedItem {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  blob: Blob;
  outputName: string;
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

function sanitizeName(name: string, format: OutputFormat): string {
  const base = name.replace(/\.[^.]+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `${base}.${ext}`;
}

export default function Tool() {
  const engineRef = useRef<ImageCompressorEngine | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const [format, setFormat] = useState<OutputFormat>('webp');
  const [quality, setQuality] = useState(0.75);
  const [resizeMax, setResizeMax] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedItem[]>([]);

  useEffect(() => {
    engineRef.current = createEngine();
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleFiles = useCallback((incoming: File[]) => {
    setError(null);
    const valid: File[] = [];
    for (const file of incoming) {
      const check = validateSingleFile(file, 'image');
      if (!check.ok) {
        setError(check.violations.map((v: { message: string }) => v.message).join(' '));
        continue;
      }
      valid.push(file);
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
      setResults([]);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    const idx = parseInt(id.replace('f-', ''), 10);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const compressAll = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || files.length === 0) return;

    setProcessing(true);
    setError(null);
    setProgress(0);
    setResults([]);

    const newResults: ProcessedItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const bytes = await file.arrayBuffer();
        const result: CompressionResult = await engine.compress({
          bytes,
          inputMime: file.type as SupportedMime,
          fileName: file.name,
          options: {
            format,
            quality,
            resizeToMaxDimension: resizeMax,
          },
        });

        const blob = new Blob([result.bytes], { type: result.outputMime });
        newResults.push({
          id: `r-${i}`,
          name: file.name,
          originalSize: result.inputSize,
          compressedSize: result.outputSize,
          blob,
          outputName: sanitizeName(file.name, format),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : `Could not process ${file.name}.`);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setResults(newResults);
    setProcessing(false);
    if (newResults.length > 0) {
      showToast(
        `Compressed ${newResults.length} file${newResults.length === 1 ? '' : 's'}.`,
        'success',
      );
    }
  }, [files, format, quality, resizeMax]);

  const downloadOne = useCallback((item: ProcessedItem) => {
    triggerBlobDownload(item.blob, item.outputName);
  }, []);

  const downloadAll = useCallback(() => {
    triggerStaggeredDownloads(
      results.map((item) => ({ blob: item.blob, fileName: item.outputName })),
    );
  }, [results]);

  const fileItems: FileListItem[] = useMemo(
    () => files.map((f, i) => ({ id: `f-${i}`, name: f.name, size: f.size })),
    [files],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Dropzone
          accept={ACCEPT}
          multiple
          onChange={handleFiles}
          disabled={processing}
          hint="JPG, PNG, WebP, GIF, AVIF - up to 25 MB each"
        />

        {error && (
          <div className="mt-4">
            <ErrorMessage title="Could not process file">{error}</ErrorMessage>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                Selected files ({files.length})
              </h3>
              <FileList files={fileItems} onRemove={removeFile} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-900">Preset</label>
                <div className="mt-2 flex gap-2">
                  {(['balanced', 'smaller', 'higher-quality'] as const).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={preset === p ? 'primary' : 'secondary'}
                      onClick={() => {
                        setPreset(p);
                        const opts = presetToOptions(p, 0);
                        setFormat(opts.format);
                        setQuality(opts.quality);
                        setResizeMax(opts.resizeToMaxDimension);
                      }}
                      disabled={processing}
                    >
                      {p === 'balanced'
                        ? 'Balanced'
                        : p === 'smaller'
                          ? 'Smaller'
                          : 'Higher quality'}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="ic-output-format"
                  className="block text-sm font-medium text-gray-900"
                >
                  Output format
                </label>
                <select
                  id="ic-output-format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  disabled={processing}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {OUTPUT_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label} - {f.note}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ic-quality" className="block text-sm font-medium text-gray-900">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  id="ic-quality"
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10) / 100)}
                  disabled={processing || format === 'png'}
                  className="mt-2 w-full"
                />
                {format === 'png' && (
                  <p className="mt-1 text-xs text-gray-500">PNG is lossless; quality is ignored.</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="ic-max-dimension"
                  className="block text-sm font-medium text-gray-900"
                >
                  Max dimension (px, optional)
                </label>
                <input
                  id="ic-max-dimension"
                  type="number"
                  min={0}
                  max={8000}
                  step={100}
                  value={resizeMax ?? ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setResizeMax(Number.isFinite(v) && v > 0 ? v : null);
                  }}
                  placeholder="Keep original size"
                  disabled={processing}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {processing && (
              <div>
                <ProgressBar value={progress} label="Compressing" />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={compressAll} disabled={processing || files.length === 0}>
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" /> Compressing...
                  </span>
                ) : (
                  `Compress ${files.length} file${files.length === 1 ? '' : 's'}`
                )}
              </Button>
              <Button variant="secondary" onClick={clearAll} disabled={processing}>
                Clear
              </Button>
              {results.length > 0 && (
                <Button variant="secondary" onClick={downloadAll}>
                  Download all ({results.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Results</h3>
            <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
              {results.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{item.outputName}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(item.originalSize)} to {formatBytes(item.compressedSize)} (
                      {savingsPercent(item.originalSize, item.compressedSize)}% smaller)
                    </p>
                  </div>
                  <Button size="sm" onClick={() => downloadOne(item)}>
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
