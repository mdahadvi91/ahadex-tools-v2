/**
 * Image Resizer main widget.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Dropzone from '../../components/ui/Dropzone';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import FileList, { type FileListItem } from '../../components/ui/FileList';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Spinner from '../../components/ui/Spinner';
import { showToast } from '../../components/ui/Toast';
import { triggerBlobDownload, triggerStaggeredDownloads } from '../../lib/download-blob';
import { validateSingleFile } from '../../platform/security/file-policy';
import { createEngine, type ImageResizerEngine } from './engine';
import type { OutputFormat, ResizeMode, ResizeResult, SupportedMime } from './types';
import { formatBytes, PRESETS } from './types';
import { OUTPUT_FORMATS } from './content';

interface ProcessedItem {
  id: string;
  name: string;
  originalSize: number;
  outputSize: number;
  originalDims: { width: number; height: number };
  outputDims: { width: number; height: number };
  blob: Blob;
  outputName: string;
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

function sanitizeName(name: string, format: OutputFormat): string {
  const base = name.replace(/\.[^.]+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `${base}-resized.${ext}`;
}

export default function Tool() {
  const engineRef = useRef<ImageResizerEngine | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<ResizeMode>('dimensions');
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [percentage, setPercentage] = useState<number>(50);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [format, setFormat] = useState<OutputFormat>('webp');
  const [quality, setQuality] = useState<number>(0.85);
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

  const resizeAll = useCallback(async () => {
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

        let targetW: number | null = null;
        let targetH: number | null = null;

        if (mode === 'dimensions') {
          targetW = maintainAspect ? width : width;
          targetH = maintainAspect ? null : height;
        } else if (mode === 'percentage') {
          // Compute from percentage
          const img = await createImageBitmap(new Blob([bytes]));
          targetW = Math.round((img.width * percentage) / 100);
          targetH = Math.round((img.height * percentage) / 100);
          img.close();
        } else if (mode === 'preset') {
          targetW = width;
          targetH = height;
        }

        const result: ResizeResult = await engine.resize({
          bytes,
          inputMime: file.type as SupportedMime,
          fileName: file.name,
          options: {
            format,
            quality,
            width: targetW,
            height: targetH,
            maintainAspectRatio: maintainAspect,
          },
        });

        const blob = new Blob([result.bytes], { type: result.outputMime });
        newResults.push({
          id: `r-${i}`,
          name: file.name,
          originalSize: result.inputSize,
          outputSize: result.outputSize,
          originalDims: result.originalDimensions,
          outputDims: result.outputDimensions,
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
        `Resized ${newResults.length} file${newResults.length === 1 ? '' : 's'}.`,
        'success',
      );
    }
  }, [files, format, quality, mode, width, height, percentage, maintainAspect]);

  const downloadOne = useCallback((item: ProcessedItem) => {
    triggerBlobDownload(item.blob, item.outputName);
  }, []);

  const downloadAll = useCallback(() => {
    triggerStaggeredDownloads(
      results.map((item) => ({ blob: item.blob, fileName: item.outputName })),
    );
  }, [results]);

  const fileItems: FileListItem[] = files.map((f, i) => ({
    id: `f-${i}`,
    name: f.name,
    size: f.size,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-xl border border-[#e6e2d8] bg-white p-6 shadow-xs">
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
              <h2 className="mb-2 text-sm font-semibold text-gray-900">
                Selected files ({files.length})
              </h2>
              <FileList files={fileItems} onRemove={removeFile} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Resize mode</label>
              <div className="mt-2 flex gap-2">
                {(['dimensions', 'percentage', 'preset'] as const).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={mode === m ? 'primary' : 'secondary'}
                    onClick={() => {
                      setMode(m);
                      if (m === 'preset') {
                        const matched = PRESETS.find(
                          (p) => p.width === width && p.height === height,
                        );
                        if (!matched) {
                          setWidth(PRESETS[0].width);
                          setHeight(PRESETS[0].height);
                        }
                      }
                    }}
                    disabled={processing}
                  >
                    {m === 'dimensions'
                      ? 'Dimensions'
                      : m === 'percentage'
                        ? 'Percentage'
                        : 'Preset'}
                  </Button>
                ))}
              </div>
            </div>

            {mode === 'dimensions' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ir-width" className="block text-sm font-medium text-gray-900">
                    Width (px)
                  </label>
                  <input
                    id="ir-width"
                    type="number"
                    min={1}
                    max={8000}
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value, 10) || 1)}
                    disabled={processing}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="ir-height" className="block text-sm font-medium text-gray-900">
                    Height (px)
                  </label>
                  <input
                    id="ir-height"
                    type="number"
                    min={1}
                    max={8000}
                    value={maintainAspect ? '' : height}
                    placeholder={maintainAspect ? 'Auto from width' : ''}
                    onChange={(e) => setHeight(parseInt(e.target.value, 10) || 1)}
                    disabled={processing || maintainAspect}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={maintainAspect}
                      onChange={(e) => setMaintainAspect(e.target.checked)}
                      disabled={processing}
                    />
                    Maintain aspect ratio
                  </label>
                </div>
              </div>
            )}

            {mode === 'percentage' && (
              <div>
                <label htmlFor="ir-scale" className="block text-sm font-medium text-gray-900">
                  Scale: {percentage}%
                </label>
                <input
                  id="ir-scale"
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
                  disabled={processing}
                  className="mt-2 w-full"
                />
              </div>
            )}

            {mode === 'preset' && (
              <div>
                <label htmlFor="ir-preset" className="block text-sm font-medium text-gray-900">
                  Preset
                </label>
                <select
                  id="ir-preset"
                  value={`${width}x${height}`}
                  onChange={(e) => {
                    const [w, h] = e.target.value.split('x').map((s) => parseInt(s, 10));
                    setWidth(w);
                    setHeight(h);
                  }}
                  disabled={processing}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRESETS.map((p) => (
                    <option key={p.label} value={`${p.width}x${p.height}`}>
                      {p.label} - {p.width}x{p.height}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="ir-output-format"
                  className="block text-sm font-medium text-gray-900"
                >
                  Output format
                </label>
                <select
                  id="ir-output-format"
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
                <label htmlFor="ir-quality" className="block text-sm font-medium text-gray-900">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  id="ir-quality"
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10) / 100)}
                  disabled={processing || format === 'png'}
                  className="mt-2 w-full"
                />
              </div>
            </div>

            {processing && (
              <div>
                <ProgressBar value={progress} label="Resizing" />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={resizeAll} disabled={processing || files.length === 0}>
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" /> Resizing...
                  </span>
                ) : (
                  `Resize ${files.length} file${files.length === 1 ? '' : 's'}`
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
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Results</h2>
            <ul className="divide-y divide-[#e6e2d8] rounded-md border border-[#e6e2d8]">
              {results.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{item.outputName}</p>
                    <p className="text-xs text-slate-600">
                      {item.originalDims.width}x{item.originalDims.height} to{' '}
                      {item.outputDims.width}x{item.outputDims.height} -{' '}
                      {formatBytes(item.outputSize)}
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
