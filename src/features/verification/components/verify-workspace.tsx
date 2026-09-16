'use client';

import type { ApiSchema } from '@/shared/types/index';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import dynamic from 'next/dynamic';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

const PdfDocumentViewer = dynamic(() => import('@/features/documents/components/pdf-document-viewer'), {
  ssr: false,
  loading: () => <p>Loading source PDF…</p>,
});

type VerificationResult = ApiSchema<'DocumentVerificationResponse'>;
type TamperedSegment = ApiSchema<'TamperedSegment'>;

function looksLikeHtml(text: string) {
  return text.includes('<') && text.includes('>') && /<\/?[a-z][a-z0-9]*[\s>]/i.test(text);
}

function statusHeading(result: VerificationResult) {
  if (result.status === 'AUTHENTIC' && result.is_authentic) return 'Document is authentic';
  if (result.status === 'VERIFICATION_UNAVAILABLE') return 'Integrity status unavailable';
  if (result.status === 'NOT_ANCHORED') return 'Document is not anchored';
  if (result.status === 'SNAPSHOT_COMPROMISED') return 'Trusted snapshot is compromised';
  if (result.status === 'TAMPERED') return 'Document was tampered with';
  return 'Document integrity requires attention';
}

function severityClass(severity: string) {
  if (severity === 'critical') return 'text-[#B42318]';
  if (severity === 'major') return 'text-[#B77900]';
  return 'text-[#64748b]';
}

function SegmentDiff({ segment }: { segment: TamperedSegment }) {
  if (!segment.word_diff?.length) return <p className="mt-2 text-sm text-[#0C2B49]">{segment.current_text}</p>;

  return <p className="mt-2 text-sm text-[#0C2B49]">
    {segment.word_diff.map((part, index) => (
      <span key={index} className={part.op === 'removed' ? 'bg-red-100 text-[#B42318] line-through' : part.op === 'added' ? 'bg-green-100 text-[#067647]' : ''}>{part.text}</span>
    ))}
  </p>;
}

export default function VerifyWorkspace({ result, onRetry }: { result: VerificationResult; onRetry: () => void }) {
  const report = result.tamper_report;
  const segments = useMemo(() => report?.segments ?? [], [report]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sanitized, setSanitized] = useState<Record<string, string | null>>({});
  const localized = report?.localized !== false;
  const blocks = result.blocks ?? [];
  const hasPdf = Boolean(result.storage_url);
  const tamperedBlockIndexes = useMemo(() => new Set(
    segments.flatMap((s) => s.block_index == null ? [] : [s.block_index]),
  ), [segments]);
  const authentic = result.status === 'AUTHENTIC' && result.is_authentic;
  const unavailable = result.status === 'VERIFICATION_UNAVAILABLE';
  const neutral = unavailable || result.status === 'NOT_ANCHORED';

  useEffect(() => {
    let cancelled = false;
    void import('dompurify')
      .then(({ default: DOMPurify }) => {
        if (cancelled) return;
        const map: Record<string, string | null> = {};
        segments.forEach((seg, i) => {
          const origKey = `o-${i}`;
          if (seg.original_text && looksLikeHtml(seg.original_text)) map[origKey] = DOMPurify.sanitize(seg.original_text);
          const currKey = `c-${i}`;
          if (seg.current_text && looksLikeHtml(seg.current_text)) map[currKey] = DOMPurify.sanitize(seg.current_text);
        });
        setSanitized(map);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [segments]);

  function selectSegment(segment: TamperedSegment) {
    if (segment.block_index == null) return;
    setSelectedBlockIndex(segment.block_index);
    if (segment.page_idx != null) setCurrentPage(segment.page_idx);
  }

  function sanitizedHtml(text: string, key: string): ReactNode {
    const html = sanitized[key];
    if (html === undefined) return text;
    if (html === null) return text;
    return <div className="[&_table]:w-full [&_td]:border [&_td]:border-[#D7E4F2] [&_td]:p-2 [&_th]:border [&_th]:border-[#D7E4F2] [&_th]:p-2" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return <section className="flex flex-col gap-5 md:min-h-0 md:flex-1">
    <div className={`rounded-[18px] border p-5 ${authentic ? 'border-green-200 bg-green-50' : neutral ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start gap-3">
        {authentic ? <CheckCircleIcon className="text-[#12A150]" sx={{ fontSize: 38 }} /> : <ErrorIcon className={neutral ? 'text-[#B77900]' : 'text-[#D94B66]'} sx={{ fontSize: 38 }} />}
        <div><h2 className={`text-xl font-extrabold ${authentic ? 'text-[#12A150]' : neutral ? 'text-[#B77900]' : 'text-[#D94B66]'}`}>{statusHeading(result)}</h2><p className="mt-1 text-sm text-[#475467]">{result.message}</p></div>
      </div>
      {(unavailable || result.status === 'NOT_ANCHORED') && <button type="button" onClick={onRetry} className="mt-4 rounded-full border border-[#0985E7] bg-white px-4 py-2 text-sm font-black text-[#0985E7]">Retry verification</button>}
    </div>

    {result.status === 'TAMPERED' && report && <div className="flex flex-col gap-4 md:min-h-0 md:flex-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-black text-[#0C2B49]">{report.total_changes} change{report.total_changes === 1 ? '' : 's'} found</h2><p className="text-sm text-[#64748b]">{report.critical_changes} critical · {(report.similarity * 100).toFixed(1)}% unchanged</p></div>
      <div className="grid min-w-0 gap-5 md:min-h-0 md:flex-1 md:grid-cols-2">
        {hasPdf && <section aria-label="Current document" className="min-w-0 rounded-[18px] border border-[#E8F0F8] bg-white p-4 md:min-h-0 md:overflow-y-auto">
          <PdfDocumentViewer sourceUrl={result.storage_url!} pageCount={result.page_count ?? 1} currentPage={currentPage} blocks={blocks} selectedBlockIndex={selectedBlockIndex} hoveredBlockIndex={hoveredBlockIndex} tamperedBlockIndexes={tamperedBlockIndexes} onPageChange={setCurrentPage} onSelectBlock={setSelectedBlockIndex} onHoverBlockChange={setHoveredBlockIndex} />
        </section>}
        <SegmentList segments={segments} selectedBlockIndex={selectedBlockIndex} localized={localized} onSelect={selectSegment} onHover={setHoveredBlockIndex} sanitizedHtml={sanitizedHtml} />
      </div>
    </div>}

    {result.status !== 'TAMPERED' && (
      <div className="grid min-w-0 gap-5 md:min-h-0 md:flex-1 md:grid-cols-2">
        {hasPdf && <section aria-label="Current document" className="min-w-0 rounded-[18px] border border-[#E8F0F8] bg-white p-4 md:min-h-0 md:overflow-y-auto">
          <PdfDocumentViewer sourceUrl={result.storage_url!} pageCount={result.page_count ?? 1} currentPage={currentPage} blocks={blocks} selectedBlockIndex={selectedBlockIndex} hoveredBlockIndex={hoveredBlockIndex} tamperedBlockIndexes={tamperedBlockIndexes} onPageChange={setCurrentPage} onSelectBlock={setSelectedBlockIndex} onHoverBlockChange={setHoveredBlockIndex} />
        </section>}
        <section aria-label="Verification result" className="min-w-0 rounded-[18px] border border-[#E8F0F8] bg-white p-5 md:min-h-0 md:overflow-y-auto">
          <div className="space-y-3">
            {result.onchain_hash && <HashRow label="On-chain" hash={result.onchain_hash} />}
            {result.current_hash && <HashRow label="Current" hash={result.current_hash} />}
            {result.tx_hash && <HashRow label="Transaction" hash={result.tx_hash} />}
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#F8FBFF] p-3 text-sm text-[#0C2B49]"><CheckCircleIcon className="text-[#12A150]" sx={{ fontSize: 20 }} /><span>{result.message}</span></div>
          </div>
        </section>
      </div>
    )}

    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#E8F0F8] bg-white p-3 text-xs text-[#64748b]">
      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#12A150]" />Green = authentic — the document matches its anchored on-chain record.</span>
      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#D94B66]" />Red = tampered — the document differs from the anchored original.</span>
    </div>
  </section>;
}

function HashRow({ label, hash }: { label: string; hash: string }) {
  const [copied, setCopied] = useState(false);
  const shortened = hash.length > 18 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;

  async function copyHash() {
    await navigator.clipboard?.writeText(hash);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E8F0F8] bg-[#F8FBFF] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wide text-[#64748b]">{label}</p>
        <p className="mt-0.5 truncate font-mono text-xs font-semibold text-[#0C2B49]" title={hash}>{shortened}</p>
      </div>
      <button type="button" onClick={() => void copyHash()} className="shrink-0 rounded-full border border-[#D7E4F2] bg-white px-3 py-1 text-[11px] font-black text-[#0985E7] transition hover:bg-[#EAF4FF]">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function SegmentList({ segments, selectedBlockIndex, localized, onSelect, onHover, sanitizedHtml }: { segments: TamperedSegment[]; selectedBlockIndex: number | null; localized: boolean; onSelect: (segment: TamperedSegment) => void; onHover: (blockIndex: number | null) => void; sanitizedHtml: (text: string, key: string) => ReactNode }) {
  return <section aria-label="Changed sections" className="min-w-0 space-y-3 rounded-[18px] border border-[#E8F0F8] bg-white p-5 md:min-h-0 md:overflow-y-auto">
    {!localized && <p className="text-sm text-[#64748b]">This older document has no stored layout, so changes are shown as text only.</p>}
    {segments.map((segment, i) => <button key={`${segment.type}-${i}`} type="button" disabled={segment.block_index == null} onClick={() => onSelect(segment)} onMouseEnter={() => onHover(segment.block_index ?? null)} onMouseLeave={() => onHover(null)} className={`block w-full rounded-xl border p-4 text-left disabled:cursor-default ${selectedBlockIndex === segment.block_index ? 'border-[#D94B66] bg-red-50' : 'border-[#E8F0F8] hover:border-[#F3A6B5]'}`}>
      <p className={`text-xs font-black uppercase tracking-wide ${severityClass(segment.severity)}`}>{segment.severity} · {segment.page_idx == null ? 'Text diff' : `Page ${segment.page_idx + 1}`}</p>
      <p className="mt-1 font-bold text-[#0C2B49]">{segment.reason}</p>
      <SegmentDiff segment={segment} />
      {segment.original_text != null && <div className="mt-3 grid gap-2 text-sm"><div className="rounded bg-red-50 p-2 text-[#B42318]"><span className="font-bold">Original: </span>{sanitizedHtml(segment.original_text, `o-${i}`)}</div></div>}
      {segment.current_text != null && <div className="mt-3 grid gap-2 text-sm"><div className="rounded bg-green-50 p-2 text-[#067647]"><span className="font-bold">Current: </span>{sanitizedHtml(segment.current_text, `c-${i}`)}</div></div>}
    </button>)}
  </section>;
}
