'use client';

import type { ApiSchema } from '@/shared/types/index';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getDocumentStatusLabel } from '@/features/documents/document-ui';
import type { ExtractionReview } from '@/features/documents/extraction-api';

const PdfDocumentViewer = dynamic(() => import('@/features/documents/components/pdf-document-viewer'), {
  ssr: false,
  loading: () => <p>Loading source PDF…</p>,
});

export type ReviewWorkspaceProps = {
  review: ExtractionReview;
  actionError: string | null;
  isSaving: boolean;
  isAnalyzing: boolean;
  isApproving: boolean;
  onSave: (edits: ApiSchema<'BlockEdit'>[]) => Promise<ExtractionReview>;
  onAnalyze: () => Promise<ExtractionReview>;
  onApprove: () => Promise<unknown>;
};

function fitCompareEditor(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export default function ReviewWorkspace({
  review,
  actionError,
  isSaving,
  isAnalyzing,
  isApproving,
  onSave,
  onAnalyze,
  onApprove,
}: ReviewWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'compare' | 'raw'>('compare');
  const [mobilePane, setMobilePane] = useState<'source' | 'review'>('review');
  const [pdfLoading, setPdfLoading] = useState(true);
  const handlePdfLoadChange = useCallback((loading: boolean) => {
    if (loading) {
      setPdfLoading(true);
      return;
    }
    if (process.env.NODE_ENV === 'test') {
      setPdfLoading(false);
      return;
    }
    window.setTimeout(() => setPdfLoading(false), 2000);
  }, []);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [openDrawer, setOpenDrawer] = useState<'issues' | 'info' | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [suppressIssuesRestoreFocus, setSuppressIssuesRestoreFocus] = useState(false);
  const [sanitizedTables, setSanitizedTables] = useState<Record<number, string | null>>({});
  const [savedBaseline, setSavedBaseline] = useState<{
    sourceBlocks: ExtractionReview['blocks'];
    texts: Record<number, string>;
  } | null>(null);
  const comparePaneRef = useRef<HTMLElement>(null);
  const acceptedTexts = savedBaseline?.sourceBlocks === review.blocks ? savedBaseline.texts : undefined;
  const edits = review.blocks.flatMap<ApiSchema<'BlockEdit'>>((block) => {
    if (block.editable === false) return [];
    const draft = drafts[block.index];
    return draft === undefined || draft === (acceptedTexts?.[block.index] ?? block.text)
      ? []
      : [{ index: block.index, text: draft }];
  });
  const mutationPending = isSaving || isAnalyzing || isApproving;
  const highSeverityCount = review.high_severity_count;
  const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const orderedFlags = review.flags
    .map((flag, position) => ({ flag, position }))
    .sort((a, b) => (
      (severityRank[a.flag.severity.toLowerCase()] ?? 3)
      - (severityRank[b.flag.severity.toLowerCase()] ?? 3)
      || a.position - b.position
    ))
    .map(({ flag }) => flag);

  useEffect(() => {
    let cancelled = false;
    void import('dompurify')
      .then(({ default: DOMPurify }) => {
        if (cancelled) return;
        setSanitizedTables(Object.fromEntries(
          review.blocks
            .filter((block) => block.is_html)
            .map((block) => [
              block.index,
              DOMPurify.sanitize(drafts[block.index] ?? acceptedTexts?.[block.index] ?? block.text),
            ]),
        ));
      })
      .catch(() => {
        if (cancelled) return;
        setSanitizedTables(Object.fromEntries(
          review.blocks.filter((block) => block.is_html).map((block) => [block.index, null]),
        ));
      });
    return () => {
      cancelled = true;
    };
  }, [acceptedTexts, drafts, review.blocks]);

  useEffect(() => {
    if (activeTab !== 'compare') return;
    comparePaneRef.current?.querySelectorAll<HTMLTextAreaElement>('[data-compare-editor]').forEach(fitCompareEditor);
  }, [activeTab, currentPage, drafts, mobilePane, pdfLoading, review.blocks]);

  function scrollCompareBlockIntoView(blockIndex: number) {
    const pane = comparePaneRef.current;
    const block = pane?.querySelector<HTMLElement>(`[data-block-index="${blockIndex}"]`);
    if (!pane || !block || typeof pane.scrollTo !== 'function') return;

    const paneRect = pane.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    const paneHeight = pane.clientHeight || paneRect.height;
    if (paneHeight <= 0) return;

    pane.scrollTo({
      behavior: 'smooth',
      top: Math.max(0, blockRect.top - paneRect.top + pane.scrollTop + blockRect.height / 2 - paneHeight / 2),
    });
  }

  function hoverBlock(blockIndex: number | null) {
    setHoveredBlockIndex(blockIndex);
  }

  function hoverSourceBlock(blockIndex: number | null) {
    hoverBlock(blockIndex);
    if (blockIndex !== null) scrollCompareBlockIntoView(blockIndex);
  }

  function changeActiveTab(tab: 'compare' | 'raw') {
    if (tab === activeTab) return;
    setHoveredBlockIndex(null);
    setActiveTab(tab);
  }

  function changeMobilePane(pane: 'source' | 'review') {
    if (pane === mobilePane) return;
    setHoveredBlockIndex(null);
    setMobilePane(pane);
  }

  function changeCurrentPage(page: number) {
    if (page === currentPage) return;
    setHoveredBlockIndex(null);
    setCurrentPage(page);
  }

  async function saveChanges() {
    if (edits.length === 0) return;
    const savedEdits = edits;
    try {
      const acceptedReview = await onSave(savedEdits);
      setSavedBaseline({
        sourceBlocks: review.blocks,
        texts: Object.fromEntries(acceptedReview.blocks.map((block) => [block.index, block.text])),
      });
      setDrafts((current) => {
        const remaining = { ...current };
        savedEdits.forEach((edit) => {
          if (current[edit.index] === edit.text) delete remaining[edit.index];
        });
        return remaining;
      });
    } catch {
      // The route exposes the mutation error; retain drafts for correction or retry.
    }
  }

  function selectBlock(blockIndex: number, focusEditor = true) {
    const block = review.blocks.find((candidate) => candidate.index === blockIndex);
    if (!block) return;

    setSelectedBlockIndex(block.index);
    if (block.page_idx !== null && block.page_idx !== undefined) changeCurrentPage(block.page_idx);
    if (focusEditor && block.editable !== false) {
      if (activeTab === 'compare' && mobilePane === 'source') changeMobilePane('review');
      requestAnimationFrame(() => {
        if (activeTab === 'compare') scrollCompareBlockIntoView(block.index);
        document.getElementById(`review-block-input-${block.index}`)?.focus();
      });
    }
  }

  function closeIssues(suppressRestoreFocus = false) {
    setSuppressIssuesRestoreFocus(suppressRestoreFocus);
    setOpenDrawer(null);
  }

  const compareBlocks = review.blocks.filter((block) => block.page_idx === currentPage);

  return (
    <section className="min-w-0 md:flex md:min-h-0 md:flex-1 md:flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8F0F8]">
        <div role="tablist" aria-label="Extraction review view" className="flex">
          {(['compare', 'raw'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="review-workspace-panel"
              onClick={() => changeActiveTab(tab)}
              className={`border-b-2 px-5 py-3 text-sm font-black ${activeTab === tab ? 'border-[#0985E7] text-[#0985E7]' : 'border-transparent text-[#64748b]'}`}
            >
              {tab === 'compare' ? 'Compare' : 'Raw'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pb-2 sm:pb-0">
          <button
            type="button"
            onClick={() => {
              setSuppressIssuesRestoreFocus(false);
              setOpenDrawer('issues');
            }}
            className="rounded-full border border-[#D7E4F2] px-3 py-2 text-sm font-black text-[#0C2B49]"
          >
            Issues ({review.flag_count})
          </button>
          <button
            type="button"
            onClick={() => setOpenDrawer('info')}
            className="rounded-full border border-[#D7E4F2] px-3 py-2 text-sm font-black text-[#0C2B49]"
          >
            Extraction info
          </button>
        </div>
      </div>

      <div id="review-workspace-panel" role="tabpanel" className="pt-5 md:flex md:min-h-0 md:flex-1 md:flex-col">
        {activeTab === 'compare' ? (
          <div className="md:flex md:min-h-0 md:flex-1 md:flex-col">
            <div aria-label="Mobile review pane" className="mb-3 grid grid-cols-2 gap-2 md:hidden">
              {(['source', 'review'] as const).map((pane) => (
                <button
                  key={pane}
                  type="button"
                  aria-label={`${pane === 'source' ? 'Source' : 'Review'} pane`}
                  aria-pressed={mobilePane === pane}
                  onClick={() => changeMobilePane(pane)}
                  className={`rounded-full px-4 py-2 text-sm font-black ${mobilePane === pane ? 'bg-[#0985E7] text-white' : 'border border-[#D7E4F2] text-[#64748b]'}`}
                >
                  {pane === 'source' ? 'Source' : 'Review'}
                </button>
              ))}
            </div>

            <div className="grid min-w-0 gap-5 md:min-h-0 md:flex-1 md:grid-cols-2">
              <section aria-label="Source document" className={`relative ${mobilePane === 'source' ? 'min-w-0 rounded-[18px] border border-[#E8F0F8] bg-white p-4 md:flex md:min-h-0 md:flex-col' : 'hidden min-w-0 rounded-[18px] border border-[#E8F0F8] bg-white p-4 md:flex md:min-h-0 md:flex-col'}`}>
                <PdfDocumentViewer
                  sourceUrl={review.storage_url}
                  pageCount={review.page_count}
                  currentPage={currentPage}
                  blocks={review.blocks}
                  selectedBlockIndex={selectedBlockIndex}
                  hoveredBlockIndex={hoveredBlockIndex}
                  onPageChange={changeCurrentPage}
                  onSelectBlock={selectBlock}
                  onHoverBlockChange={hoverSourceBlock}
                  onLoadChange={handlePdfLoadChange}
                />
                {pdfLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[18px] bg-white">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#D7E4F2] border-t-[#0985E7]" />
                      <p className="text-xs font-semibold text-[#94A3B8]">Loading document…</p>
                    </div>
                  </div>
                )}
              </section>

              <section ref={comparePaneRef} aria-label="Reviewed document" className={mobilePane === 'review' ? 'min-w-0 rounded-[18px] border border-[#E8F0F8] bg-white p-5 shadow-[0_4px_12px_rgba(19,59,115,0.05)] md:min-h-0 md:overflow-y-auto' : 'hidden min-w-0 rounded-[18px] border border-[#E8F0F8] bg-white p-5 shadow-[0_4px_12px_rgba(19,59,115,0.05)] md:block md:min-h-0 md:overflow-y-auto'}>
                {pdfLoading ? (
                  <div aria-label="Loading extracted text" className="flex flex-col gap-3">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div key={index} className="animate-pulse rounded-lg border border-[#E8F0F8] px-2 py-1.5">
                        <div className="mb-2 h-2.5 w-16 rounded bg-[#E8F0F8]" />
                        <div className="h-3 w-full rounded bg-[#EEF4FB]" />
                        <div className="mt-1.5 h-3 w-11/12 rounded bg-[#EEF4FB]" />
                        <div className="mt-1.5 h-3 w-4/5 rounded bg-[#EEF4FB]" />
                      </div>
                    ))}
                  </div>
                ) : compareBlocks.map((block) => {
                  const acceptedText = acceptedTexts?.[block.index] ?? block.text;
                  const text = drafts[block.index] ?? acceptedText;
                  const selected = selectedBlockIndex === block.index;
                  const hovered = hoveredBlockIndex === block.index;
                  const sanitizedTable = sanitizedTables[block.index];
                  return (
                    <section
                      key={block.index}
                      id={`review-block-${block.index}`}
                      data-block-index={block.index}
                      onMouseEnter={() => hoverBlock(block.index)}
                      onMouseLeave={() => hoverBlock(null)}
                      className={`group rounded-lg border px-2 py-1.5 transition-colors ${selected ? 'border-[#0985E7] bg-[#F5FAFF]' : hovered ? 'border-[#98C9F3] bg-[#F8FBFF]' : 'border-[#E8F0F8]'}`}
                    >
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-[#64748b]">
                        {block.type.replace(/[_-]/g, ' ')}
                      </span>
                      {block.is_html ? (
                        <>
                          {sanitizedTable === undefined && <p className="text-sm text-[#64748b]">Loading table…</p>}
                          {sanitizedTable === null && <p className="text-sm text-[#B42318]">Table preview unavailable. Edit it in Raw view.</p>}
                          {typeof sanitizedTable === 'string' && (
                            <div
                              className="overflow-x-auto text-sm text-[#0C2B49] [&_table]:w-full [&_td]:border [&_td]:border-[#D7E4F2] [&_td]:p-2 [&_th]:border [&_th]:border-[#D7E4F2] [&_th]:p-2"
                              dangerouslySetInnerHTML={{ __html: sanitizedTable }}
                            />
                          )}
                          <button
                            type="button"
                            disabled={review.is_reviewed || isApproving || block.editable === false}
                            onClick={() => {
                              changeActiveTab('raw');
                              selectBlock(block.index);
                            }}
                            className="mt-2 text-xs font-black text-[#0985E7] disabled:opacity-40"
                          >
                            Edit table in Raw view
                          </button>
                        </>
                      ) : block.editable !== false ? (
                        <textarea
                          id={`review-block-input-${block.index}`}
                          aria-label={`Reviewed text for block ${block.index}`}
                          data-selected={selected}
                          data-compare-editor
                          value={text}
                          rows={block.text_level === 1 ? 1 : Math.max(2, text.split('\n').length)}
                          disabled={review.is_reviewed || isApproving}
                          onFocus={() => {
                            selectBlock(block.index, false);
                            hoverBlock(block.index);
                          }}
                          onBlur={() => hoverBlock(null)}
                          onChange={(event) => {
                            setDrafts((current) => ({ ...current, [block.index]: event.target.value }));
                            fitCompareEditor(event.currentTarget);
                          }}
                          className={`field-sizing-content w-full resize-none overflow-hidden rounded-lg border-0 bg-transparent px-2 py-1.5 leading-7 text-[#0C2B49] outline-none ${block.text_level === 1 ? 'text-xl font-black' : 'text-sm'}`}
                        />
                      ) : (
                        <p className="rounded-lg border border-dashed border-[#F5D7A1] bg-[#FFF9EC] px-3 py-2 text-sm text-[#64748b]">
                          {block.type} region — shown on the source PDF and not editable.
                        </p>
                      )}
                    </section>
                  );
                })}
                {compareBlocks.length === 0 && <p className="text-sm text-[#64748b]">No extracted text is available for this page.</p>}
              </section>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
            {review.blocks.map((block) => {
              const text = drafts[block.index] ?? acceptedTexts?.[block.index] ?? block.text;
              return (
                <section
                  key={block.index}
                  id={`review-block-${block.index}`}
                  data-block-index={block.index}
                  className={`rounded-[18px] border bg-white p-5 ${selectedBlockIndex === block.index ? 'border-[#0985E7]' : 'border-[#E8F0F8]'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-black text-[#0C2B49]">Block {block.index}</h2>
                    <p className="text-xs font-bold text-[#64748b]">
                      {block.page_idx === null || block.page_idx === undefined ? 'Page not reported' : `Page ${block.page_idx + 1}`}
                      {' · '}
                      {block.score === null || block.score === undefined ? 'Confidence not reported' : `${Math.round(block.score * 100)}% confidence`}
                    </p>
                  </div>
                  <div className="mt-4 rounded-xl bg-[#F8FBFF] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-[#64748b]">Original OCR text</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#475569]">{block.original_text}</p>
                  </div>
                  {block.editable !== false ? (
                    <>
                      <label htmlFor={`review-block-input-${block.index}`} className="mt-4 block text-sm font-bold text-[#0C2B49]">Reviewed text</label>
                      <textarea
                        id={`review-block-input-${block.index}`}
                        aria-label={`Reviewed text for block ${block.index}`}
                        value={text}
                        rows={Math.max(3, text.split('\n').length + 1)}
                        disabled={review.is_reviewed || isApproving}
                        onFocus={() => selectBlock(block.index, false)}
                        onChange={(event) => setDrafts((current) => ({ ...current, [block.index]: event.target.value }))}
                        className="mt-1.5 w-full resize-y rounded-xl border border-[#D7E4F2] px-3 py-2.5 font-mono text-sm leading-6 text-[#0C2B49] outline-none focus:border-[#0985E7] disabled:bg-[#F8FBFF]"
                      />
                    </>
                  ) : <p className="mt-4 text-sm font-bold text-[#B77900]">This {block.type} region is not editable.</p>}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {actionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{actionError}</p>}
      <div className="sticky bottom-20 z-10 mt-5 flex flex-wrap items-center gap-2 rounded-[18px] border border-[#E8F0F8] bg-white p-4 shadow-[0_-4px_12px_rgba(19,59,115,0.05)] md:bottom-0">
        <button
          type="button"
          disabled={edits.length === 0 || mutationPending || review.is_reviewed}
          onClick={() => void saveChanges()}
          className="rounded-full bg-[#0985E7] px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
        >
          {isSaving ? 'Saving changes…' : 'Save changes'}
        </button>
        {edits.length > 0 && <span className="text-xs font-bold text-[#B77900]">{edits.length} {edits.length === 1 ? 'block' : 'blocks'} changed</span>}
        <button
          type="button"
          disabled={edits.length > 0 || mutationPending || review.is_reviewed}
          onClick={() => void onAnalyze().catch(() => undefined)}
          className="rounded-full border border-[#0985E7] px-4 py-2.5 text-sm font-black text-[#0985E7] disabled:opacity-40"
        >
          {isAnalyzing ? 'Analyzing semantic issues…' : 'Analyze semantic issues'}
        </button>
        <button
          type="button"
          disabled={edits.length > 0 || mutationPending || review.is_reviewed}
          onClick={() => setApprovalOpen(true)}
          className="rounded-full bg-[#0C2B49] px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
        >
          {isApproving ? 'Approving reviewed text…' : 'Approve reviewed text'}
        </button>
      </div>
      {edits.length > 0 && <p className="mt-3 text-xs font-semibold text-[#B77900]">Save changes before analysis or approval.</p>}
      {review.is_reviewed && <p className="mt-3 text-xs font-semibold text-[#12A150]">Reviewed text is approved and frozen.</p>}

      <Dialog open={approvalOpen} onClose={() => !isApproving && setApprovalOpen(false)} aria-labelledby="approval-dialog-title">
        <DialogTitle id="approval-dialog-title">Approve reviewed text?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Approval freezes reviewed text and starts processing. You will not be able to edit it afterward.
          </DialogContentText>
          {highSeverityCount > 0 && (
            <DialogContentText className="mt-3 font-bold text-[#B42318]">
              {highSeverityCount} unresolved high-priority {highSeverityCount === 1 ? 'issue remains.' : 'issues remain.'}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <button type="button" disabled={isApproving} onClick={() => setApprovalOpen(false)} className="rounded-full px-4 py-2 text-sm font-black text-[#64748b] disabled:opacity-40">Cancel</button>
          <button
            type="button"
            disabled={isApproving}
            onClick={() => {
              setApprovalOpen(false);
              void onApprove().catch(() => undefined);
            }}
            className="rounded-full bg-[#0C2B49] px-4 py-2 text-sm font-black text-white disabled:opacity-40"
          >
            {highSeverityCount > 0 ? 'Approve anyway' : 'Approve'}
          </button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={openDrawer === 'issues'}
        onClose={() => closeIssues()}
        ModalProps={{ disableRestoreFocus: suppressIssuesRestoreFocus }}
      >
        <aside aria-label="Issues" className="w-[min(24rem,100vw)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#0C2B49]">Issues</h2>
              <p className="text-sm font-bold text-[#64748b]">{review.flag_count} {review.flag_count === 1 ? 'issue' : 'issues'}</p>
            </div>
            <button type="button" aria-label="Close issues" onClick={() => closeIssues()} className="px-2 py-1 text-xl text-[#64748b]">×</button>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {orderedFlags.map((flag, position) => {
              const severity = flag.severity.toLowerCase();
              const priority = severity === 'high' ? 'High priority' : severity === 'medium' ? 'Medium priority' : severity === 'low' ? 'Low priority' : `${flag.severity} priority`;
              const target = flag.block_index === null || flag.block_index === undefined ? 'document-wide' : `block ${flag.block_index}`;
              return (
                <button
                  key={`${flag.kind}-${flag.block_index ?? 'document'}-${position}`}
                  type="button"
                  aria-label={`${priority}, ${target}: ${flag.message}`}
                  onClick={() => {
                    if (flag.block_index === null || flag.block_index === undefined) return;
                    const block = review.blocks.find((candidate) => candidate.index === flag.block_index);
                    if (!block) return;
                    closeIssues(block.editable !== false);
                    selectBlock(block.index);
                  }}
                  className={`rounded-xl border p-3 text-left ${severity === 'high' ? 'border-red-200 bg-red-50' : severity === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-[#D7E4F2] bg-white'}`}
                >
                  <span className="block text-xs font-black uppercase tracking-wide text-[#64748b]">{priority} · {target}</span>
                  <span className="mt-1 block text-sm font-bold text-[#0C2B49]">{flag.message}</span>
                  {flag.excerpt && <span className="mt-1 block text-xs text-[#64748b]">{flag.excerpt}</span>}
                </button>
              );
            })}
            {orderedFlags.length === 0 && <p className="text-sm text-[#64748b]">No issues reported.</p>}
          </div>
        </aside>
      </Drawer>

      <Drawer
        anchor="right"
        open={openDrawer === 'info'}
        onClose={() => setOpenDrawer(null)}
      >
        <aside aria-label="Extraction info" className="w-[min(24rem,100vw)] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-[#0C2B49]">Extraction info</h2>
            <button type="button" aria-label="Close extraction info" onClick={() => setOpenDrawer(null)} className="px-2 py-1 text-xl text-[#64748b]">×</button>
          </div>
          <dl className="mt-5 grid gap-4 text-sm">
            <div><dt className="font-bold text-[#64748b]">Engine</dt><dd className="text-[#0C2B49]">{review.engine}</dd></div>
            <div><dt className="font-bold text-[#64748b]">Pages</dt><dd className="text-[#0C2B49]">{review.page_count} {review.page_count === 1 ? 'page' : 'pages'}</dd></div>
            <div><dt className="font-bold text-[#64748b]">Average confidence</dt><dd className="text-[#0C2B49]">{review.confidence_avg === null || review.confidence_avg === undefined ? 'Not reported' : `${Math.round(review.confidence_avg * 100)}%`}</dd></div>
            <div><dt className="font-bold text-[#64748b]">Edited blocks</dt><dd className="text-[#0C2B49]">{review.edited_block_count} edited {review.edited_block_count === 1 ? 'block' : 'blocks'}</dd></div>
            <div><dt className="font-bold text-[#64748b]">Review status</dt><dd className="text-[#0C2B49]">{getDocumentStatusLabel(review.status)}</dd></div>
          </dl>
        </aside>
      </Drawer>
    </section>
  );
}
