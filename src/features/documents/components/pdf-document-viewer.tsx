'use client';

import type { ApiSchema } from '@/shared/types/index';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

export type PdfDocumentViewerProps = {
  sourceUrl: string;
  pageCount: number;
  currentPage: number;
  blocks: ApiSchema<'ExtractionBlock'>[];
  selectedBlockIndex: number | null;
  hoveredBlockIndex: number | null;
  tamperedBlockIndexes?: ReadonlySet<number>;
  onPageChange: (pageIndex: number) => void;
  onSelectBlock: (blockIndex: number) => void;
  onHoverBlockChange: (blockIndex: number | null) => void;
  onLoadChange?: (loading: boolean) => void;
};

const DEFAULT_ZOOM = 0.85;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

export function normalizedBoxStyle(bbox?: number[] | null): CSSProperties | undefined {
  if (
    !bbox
    || bbox.length !== 4
    || bbox.some((value) => !Number.isFinite(value) || value < 0 || value > 1000)
  ) return undefined;

  const [x0, y0, x1, y1] = bbox;
  if (x1 <= x0 || y1 <= y0) return undefined;

  return {
    left: `${x0 / 10}%`,
    top: `${y0 / 10}%`,
    width: `${(x1 - x0) / 10}%`,
    height: `${(y1 - y0) / 10}%`,
  };
}

export default function PdfDocumentViewer({
  sourceUrl,
  pageCount,
  currentPage,
  blocks,
  selectedBlockIndex,
  hoveredBlockIndex,
  tamperedBlockIndexes,
  onPageChange,
  onSelectBlock,
  onHoverBlockChange,
  onLoadChange,
}: PdfDocumentViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [loadResult, setLoadResult] = useState<{
    sourceUrl: string;
    pdf: PDFDocumentProxy | null;
    failed: boolean;
  }>({ sourceUrl, pdf: null, failed: false });
  const renderKey = `${sourceUrl}:${currentPage}:${zoom}`;
  const [failedRenderKey, setFailedRenderKey] = useState<string | null>(null);
  const pdf = loadResult.sourceUrl === sourceUrl ? loadResult.pdf : null;
  const renderFailed = loadResult.sourceUrl === sourceUrl && loadResult.failed
    || failedRenderKey === renderKey;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(([entry]) => {
      setAvailableWidth(entry?.contentRect.width ?? 0);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;

    void (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        loadingTask = pdfjs.getDocument(sourceUrl);
        const loadedPdf = await loadingTask.promise;

        if (disposed) return;
        setLoadResult({ sourceUrl, pdf: loadedPdf, failed: false });
        onLoadChange?.(false);
      } catch {
        if (!disposed) setLoadResult({ sourceUrl, pdf: null, failed: true });
        onLoadChange?.(false);
      }
    })();

    return () => {
      disposed = true;
      void loadingTask?.destroy();
    };
  }, [sourceUrl, onLoadChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pdf || !canvas || availableWidth <= 0) return;

    let disposed = false;
    let renderTask: RenderTask | undefined;

    void (async () => {
      try {
        const page = await pdf.getPage(currentPage + 1);
        if (disposed) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: availableWidth / unscaledViewport.width * zoom });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        renderTask = page.render({
          canvas,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        });
        await renderTask.promise;
      } catch {
        if (!disposed) setFailedRenderKey(renderKey);
      }
    })();

    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [availableWidth, currentPage, pdf, renderKey, zoom]);

  const pageBlocks = blocks.flatMap((block) => {
    if (block.page_idx !== currentPage) return [];
    const style = normalizedBoxStyle(block.bbox);
    return style ? [{ block, style }] : [];
  });

  return (
    <section aria-label="Source PDF" className="flex min-h-0 flex-col md:flex-1">
      <div role="toolbar" aria-label="PDF controls" className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous PDF page"
            disabled={currentPage <= 0}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage + 1} of {pageCount}</span>
          <button
            type="button"
            aria-label="Next PDF page"
            disabled={currentPage >= pageCount - 1}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            className="border px-2 leading-none"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
          >
            −
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            className="border px-2 leading-none"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
          >
            +
          </button>
        </div>
      </div>

      {renderFailed ? (
        <div>
          <p role="alert">The source PDF could not be rendered in this browser.</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer">Open source PDF</a>
        </div>
      ) : null}
      <div
        ref={wrapperRef}
        aria-label="PDF page"
        aria-hidden={renderFailed || undefined}
        className={`min-h-0 flex-1 overflow-auto ${renderFailed ? 'hidden' : ''}`}
      >
        {pdf && pdf.numPages !== pageCount ? (
          <p role="status">
            PDF page count ({pdf.numPages}) differs from the review record ({pageCount}).
          </p>
        ) : null}
        <div className="relative mx-auto w-fit">
          <canvas ref={canvasRef} className="block" />
          {pageBlocks.map(({ block, style }) => block.editable !== false ? (
          <button
            key={block.index}
            type="button"
            aria-label={`Select block ${block.index}`}
            className={`absolute bg-transparent ${
              tamperedBlockIndexes?.has(block.index)
                ? 'border-2 border-[#D94B66] bg-[#D94B66]/20'
                : selectedBlockIndex === block.index
                ? 'border-2 border-blue-700 bg-blue-100/20'
                : hoveredBlockIndex === block.index
                  ? 'border-2 border-sky-500 bg-sky-100/30'
                  : 'border border-blue-400'
            }`}
            style={style}
            onClick={() => onSelectBlock(block.index)}
            onMouseEnter={() => onHoverBlockChange(block.index)}
            onMouseLeave={() => onHoverBlockChange(null)}
            onFocus={() => onHoverBlockChange(block.index)}
            onBlur={() => onHoverBlockChange(null)}
          />
        ) : (
          <div
            key={block.index}
            role="region"
            aria-label={`Non-editable block ${block.index}`}
            className={`absolute border border-dashed ${
              hoveredBlockIndex === block.index
                ? 'border-2 border-amber-600 bg-amber-100/30'
                : 'border-amber-500'
            }`}
            style={style}
            onMouseEnter={() => onHoverBlockChange(block.index)}
            onMouseLeave={() => onHoverBlockChange(null)}
          />
          ))}
        </div>
      </div>
    </section>
  );
}
