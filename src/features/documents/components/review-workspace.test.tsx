// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ApiSchema } from '@/shared/types/index';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewWorkspace from '@/features/documents/components/review-workspace';

const dynamicMocks = vi.hoisted(() => ({
  viewerProps: null as Record<string, unknown> | null,
}));
const animationFrames: FrameRequestCallback[] = [];
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');

vi.mock('next/dynamic', async () => {
  const { useEffect } = await import('react');
  return {
    default: () => function MockPdfDocumentViewer(props: Record<string, unknown>) {
      dynamicMocks.viewerProps = props;
      useEffect(() => {
        (props.onLoadChange as ((loading: boolean) => void) | undefined)?.(false);
      }, [props.onLoadChange]);
      return (
      <div>
        Source PDF viewer
        {[0, 1, 2].map((blockIndex) => (
          <span key={blockIndex}>
            <button
              type="button"
              onClick={() => (props.onSelectBlock as (index: number) => void)(blockIndex)}
            >
              Mock select block {blockIndex}
            </button>
            <button
              type="button"
              onMouseEnter={() => (props.onHoverBlockChange as (index: number) => void)(blockIndex)}
              onMouseLeave={() => (props.onHoverBlockChange as (index: number | null) => void)(null)}
            >
              Mock hover block {blockIndex}
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => (props.onPageChange as (index: number) => void)(1)}
        >
          Mock page 2
        </button>
      </div>
    );
    },
  };
});

type ExtractionReview = ApiSchema<'ExtractionReviewResponse'>;

const review: ExtractionReview = {
  document_id: 'doc-1',
  extraction_id: 'extraction-1',
  status: 'AWAITING_REVIEW',
  file_name: 'Deed.pdf',
  storage_url: '/deed.pdf',
  engine: 'LexChain OCR',
  page_count: 2,
  confidence_avg: 0.88,
  blocks: [
    {
      index: 0,
      editable: true,
      type: 'text',
      text: 'DEED OF ABSOLUTE SALE',
      original_text: 'DEED OF ABSOLUTE SALE',
      bbox: [80, 90, 920, 180],
      page_idx: 0,
      text_level: 1,
      score: 0.97,
      is_html: false,
      edited: false,
    },
    {
      index: 1,
      editable: true,
      type: 'text',
      text: 'Original body',
      original_text: 'Original OCR body',
      bbox: [80, 200, 920, 500],
      page_idx: 1,
      text_level: null,
      score: 0.72,
      is_html: false,
      edited: false,
    },
    {
      index: 2,
      editable: false,
      type: 'image',
      text: '',
      original_text: '',
      bbox: [650, 700, 900, 900],
      page_idx: 1,
      text_level: null,
      score: null,
      is_html: false,
      edited: false,
    },
  ],
  flags: [],
  flag_count: 0,
  high_severity_count: 0,
  edited_block_count: 0,
  is_reviewed: false,
  reviewed_by: null,
  reviewed_at: null,
};

const flaggedReview: ExtractionReview = {
  ...review,
  blocks: [
    ...review.blocks,
    {
      ...review.blocks[1],
      index: 3,
      text: 'Text without a box',
      original_text: 'Text without a box',
      bbox: null,
      page_idx: 0,
    },
  ],
  flags: [
    { block_index: 0, kind: 'wording', severity: 'LoW', message: 'Check title wording', excerpt: 'DEED' },
    { block_index: 1, kind: 'amount_mismatch', severity: 'high', message: 'Check the sale amount', excerpt: 'Original body' },
    { block_index: 3, kind: 'missing_bbox', severity: 'high', message: 'Check unlocated text', excerpt: 'Text without a box' },
    { block_index: null, kind: 'document', severity: 'medium', message: 'Check the whole document', excerpt: '' },
  ],
  flag_count: 4,
  high_severity_count: 2,
  edited_block_count: 1,
};

function renderWorkspace(overrides: Partial<React.ComponentProps<typeof ReviewWorkspace>> = {}) {
  const props: React.ComponentProps<typeof ReviewWorkspace> = {
    review,
    actionError: null,
    isSaving: false,
    isAnalyzing: false,
    isApproving: false,
    onSave: vi.fn().mockResolvedValue(review),
    onAnalyze: vi.fn().mockResolvedValue(review),
    onApprove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return { ...props, ...render(<ReviewWorkspace {...props} />) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

function flushAnimationFrames() {
  act(() => {
    animationFrames.splice(0).forEach((callback) => callback(0));
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  dynamicMocks.viewerProps = null;
  animationFrames.length = 0;
  if (originalScrollIntoView) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
});

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    animationFrames.push(callback);
    return animationFrames.length;
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

describe('ReviewWorkspace', () => {
  it('starts in Compare and preserves the original-versus-reviewed Raw cards', () => {
    renderWorkspace();

    expect(screen.getByRole('tab', { name: 'Compare' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText('Reviewed text for block 0')).toBeTruthy();
    expect(screen.queryByLabelText('Reviewed text for block 1')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));

    expect(screen.queryByLabelText('Reviewed text for block 0')).toBeNull();
    expect(screen.getByLabelText('Reviewed text for block 1')).toBeTruthy();
    expect(screen.getByText('image region — shown on the source PDF and not editable.')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Raw' }));
    expect(screen.getByRole('tab', { name: 'Raw' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Compare' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('heading', { name: 'Block 0' })).toBeTruthy();
    expect(screen.getAllByText('Original OCR text')).toHaveLength(3);
  });

  it('exposes labeled desktop panes and pressed mobile pane controls', () => {
    renderWorkspace();

    expect(screen.getByText('Source PDF viewer')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Source document' }).className).toContain('md:flex');
    expect(screen.getByRole('region', { name: 'Source document' }).className).not.toContain('md:overflow-y-auto');
    expect(screen.getByRole('region', { name: 'Reviewed document' }).className).toContain('md:overflow-y-auto');
    expect(dynamicMocks.viewerProps).toMatchObject({
      sourceUrl: '/deed.pdf',
      pageCount: 2,
      currentPage: 0,
      selectedBlockIndex: null,
    });
    const sourcePane = screen.getByRole('button', { name: 'Source pane' });
    const reviewPane = screen.getByRole('button', { name: 'Review pane' });
    expect(reviewPane.getAttribute('aria-pressed')).toBe('true');
    expect(sourcePane.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(sourcePane);
    expect(sourcePane.getAttribute('aria-pressed')).toBe('true');
    expect(reviewPane.getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps Raw content independently scrollable on desktop', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('tab', { name: 'Raw' }));

    expect(screen.getByRole('tabpanel').firstElementChild?.className).toContain('md:min-h-0');
    expect(screen.getByRole('tabpanel').firstElementChild?.className).toContain('md:overflow-y-auto');
  });

  it('preserves the draft and selected block when switching mobile panes', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), {
      target: { value: 'Corrected body' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mock select block 1' }));
    flushAnimationFrames();
    fireEvent.click(screen.getByRole('button', { name: 'Source pane' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review pane' }));

    expect((screen.getByLabelText('Reviewed text for block 1') as HTMLTextAreaElement).value).toBe('Corrected body');
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 1, selectedBlockIndex: 1 });
  });

  it('uses block identity to synchronize a flag with its page and editor', () => {
    renderWorkspace({ review: flaggedReview });

    fireEvent.click(screen.getByRole('button', { name: 'Issues (4)' }));
    fireEvent.click(screen.getByRole('button', { name: /High priority.*block 1/i }));
    flushAnimationFrames();
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 1, selectedBlockIndex: 1 });
    expect(document.activeElement).toBe(screen.getByLabelText('Reviewed text for block 1'));
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('switches from Source to Review before focusing an issue block on mobile', () => {
    renderWorkspace({ review: flaggedReview });

    const sourcePane = screen.getByRole('button', { name: 'Source pane' });
    const reviewPane = screen.getByRole('button', { name: 'Review pane' });
    fireEvent.click(sourcePane);
    expect(sourcePane.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Issues (4)' }));
    fireEvent.click(screen.getByRole('button', { name: /High priority.*block 1/i }));
    flushAnimationFrames();

    expect(reviewPane.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(screen.getByLabelText('Reviewed text for block 1'));
  });

  it('returns focus to the Issues trigger after a normal drawer close', async () => {
    renderWorkspace({ review: flaggedReview });

    const issuesButton = screen.getByRole('button', { name: 'Issues (4)' });
    issuesButton.focus();
    fireEvent.click(issuesButton);
    fireEvent.click(screen.getByRole('button', { name: 'Close issues' }));

    await waitFor(() => expect(document.activeElement).toBe(issuesButton));
  });

  it('uses the same selection path for overlays, page controls, Compare, and Raw', () => {
    renderWorkspace({ review: flaggedReview });

    fireEvent.click(screen.getByRole('button', { name: 'Mock select block 0' }));
    flushAnimationFrames();
    expect(screen.getByLabelText('Reviewed text for block 0').getAttribute('data-selected')).toBe('true');
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 0, selectedBlockIndex: 0 });

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 1, selectedBlockIndex: 0 });

    fireEvent.click(screen.getByRole('button', { name: 'Mock select block 0' }));
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 0, selectedBlockIndex: 0 });

    fireEvent.click(screen.getByRole('tab', { name: 'Raw' }));
    fireEvent.focus(screen.getByLabelText('Reviewed text for block 1'));
    fireEvent.click(screen.getByRole('tab', { name: 'Compare' }));
    expect(screen.getByRole('tab', { name: 'Compare' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Raw' }).getAttribute('aria-selected')).toBe('false');
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 1, selectedBlockIndex: 1 });
  });

  it('cross-highlights Compare blocks and source overlays only while hovered', () => {
    renderWorkspace();

    const reviewedPane = screen.getByRole('region', { name: 'Reviewed document' });
    const scrollTo = vi.fn();
    Object.assign(reviewedPane, { scrollTo });

    const compareBlock = document.getElementById('review-block-0')!;
    fireEvent.mouseEnter(compareBlock);
    expect(dynamicMocks.viewerProps).toMatchObject({ hoveredBlockIndex: 0 });
    expect(compareBlock.className).toContain('border-[#98C9F3]');
    expect(scrollTo).not.toHaveBeenCalled();

    fireEvent.mouseLeave(compareBlock);
    expect(dynamicMocks.viewerProps).toMatchObject({ hoveredBlockIndex: null });

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Mock hover block 0' }));
    expect(document.getElementById('review-block-0')!.className).toContain('border-[#98C9F3]');
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Mock hover block 0' }));
    expect(document.getElementById('review-block-0')!.className).not.toContain('border-[#98C9F3]');
  });

  it('clears a PDF hover when the compared page changes', () => {
    renderWorkspace();

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Mock hover block 0' }));
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 0, hoveredBlockIndex: 0 });

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 1, hoveredBlockIndex: null });
  });

  it('scrolls the reviewed pane and keeps the matching block selected when a PDF overlay is clicked', () => {
    renderWorkspace();

    const reviewedPane = screen.getByRole('region', { name: 'Reviewed document' });
    const scrollTo = vi.fn();
    Object.assign(reviewedPane, { scrollTo });
    Object.defineProperty(reviewedPane, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(reviewedPane, 'scrollTop', { configurable: true, writable: true, value: 50 });
    vi.spyOn(reviewedPane, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 300, height: 200 } as DOMRect);
    vi.spyOn(document.getElementById('review-block-0')!, 'getBoundingClientRect').mockReturnValue({ top: 360, bottom: 400, height: 40 } as DOMRect);

    fireEvent.click(screen.getByRole('button', { name: 'Mock select block 0' }));
    flushAnimationFrames();

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 230 });
    expect(dynamicMocks.viewerProps).toMatchObject({ selectedBlockIndex: 0 });
    expect(document.activeElement).toBe(screen.getByLabelText('Reviewed text for block 0'));
  });

  it('scrolls the reviewed pane when a PDF overlay is hovered', () => {
    renderWorkspace();

    const reviewedPane = screen.getByRole('region', { name: 'Reviewed document' });
    const scrollTo = vi.fn();
    Object.assign(reviewedPane, { scrollTo });
    Object.defineProperty(reviewedPane, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(reviewedPane, 'scrollTop', { configurable: true, writable: true, value: 50 });
    vi.spyOn(reviewedPane, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 300, height: 200 } as DOMRect);
    vi.spyOn(document.getElementById('review-block-0')!, 'getBoundingClientRect').mockReturnValue({ top: 360, bottom: 400, height: 40 } as DOMRect);

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Mock hover block 0' }));

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 230 });
    expect(dynamicMocks.viewerProps).toMatchObject({ hoveredBlockIndex: 0 });
  });

  it('uses one card outline and labels the Compare block type', () => {
    renderWorkspace();

    const card = document.getElementById('review-block-0')!;
    const editor = screen.getByLabelText('Reviewed text for block 0');
    expect(card.className).toContain('border');
    expect(screen.getByText('text')).toBeTruthy();
    expect(editor.className).toContain('border-0');
  });

  it('uses non-resizable, content-sized editors in Compare', () => {
    renderWorkspace();

    const editor = screen.getByLabelText('Reviewed text for block 0');
    expect(editor.className).toContain('field-sizing-content');
    expect(editor.className).toContain('resize-none');
    expect(editor.className).toContain('overflow-hidden');
  });

  it('cross-highlights Compare editors while focused without clearing selection', () => {
    renderWorkspace();

    const editor = screen.getByLabelText('Reviewed text for block 0');
    fireEvent.focus(editor);
    expect(dynamicMocks.viewerProps).toMatchObject({ hoveredBlockIndex: 0, selectedBlockIndex: 0 });

    fireEvent.blur(editor);
    expect(dynamicMocks.viewerProps).toMatchObject({ hoveredBlockIndex: null, selectedBlockIndex: 0 });
  });

  it('grows Compare editors to their content on render and text changes', async () => {
    let scrollHeight = 64;
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'scrollHeight');
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight,
    });

    try {
      renderWorkspace();
      const editor = screen.getByLabelText('Reviewed text for block 0') as HTMLTextAreaElement;
      await waitFor(() => expect(editor.style.height).toBe('64px'));

      scrollHeight = 112;
      fireEvent.change(editor, { target: { value: 'A longer reviewed title' } });
      expect(editor.style.height).toBe('112px');

      scrollHeight = 176;
      fireEvent.click(screen.getByRole('button', { name: 'Source pane' }));
      fireEvent.click(screen.getByRole('button', { name: 'Review pane' }));
      expect(editor.style.height).toBe('176px');
    } finally {
      if (originalScrollHeight) {
        Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', originalScrollHeight);
      } else {
        Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight');
      }
    }
  });

  it('keeps document-wide flags stationary and focuses editable blocks without boxes', () => {
    renderWorkspace({ review: flaggedReview });
    fireEvent.click(screen.getByRole('button', { name: 'Mock select block 1' }));
    flushAnimationFrames();
    fireEvent.click(screen.getByRole('button', { name: 'Issues (4)' }));

    fireEvent.click(screen.getByRole('button', { name: /Medium priority.*document-wide/i }));
    expect(screen.getByText('Check the whole document')).toBeTruthy();
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 1, selectedBlockIndex: 1 });

    fireEvent.click(screen.getByRole('button', { name: /High priority.*block 3/i }));
    flushAnimationFrames();
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 0, selectedBlockIndex: 3 });
    expect(document.activeElement).toBe(screen.getByLabelText('Reviewed text for block 3'));
  });

  it('selects a non-editable block without focusing or exposing an editor', () => {
    renderWorkspace({ review: flaggedReview });

    fireEvent.click(screen.getByRole('button', { name: 'Mock select block 2' }));
    expect(dynamicMocks.viewerProps).toMatchObject({ currentPage: 1, selectedBlockIndex: 2 });
    expect(screen.queryByLabelText('Reviewed text for block 2')).toBeNull();
    expect(animationFrames).toHaveLength(0);
  });

  it('orders issues stably by case-insensitive severity', () => {
    renderWorkspace({ review: flaggedReview });

    fireEvent.click(screen.getByRole('button', { name: 'Issues (4)' }));
    expect(screen.getByText('4 issues')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /priority/i }).map((button) => button.getAttribute('aria-label'))).toEqual([
      'High priority, block 1: Check the sale amount',
      'High priority, block 3: Check unlocated text',
      'Medium priority, document-wide: Check the whole document',
      'Low priority, block 0: Check title wording',
    ]);
    expect(screen.getByRole('complementary', { name: 'Issues' }).textContent).toContain('Original body');
  });

  it('exposes extraction-level facts in a drawer', () => {
    renderWorkspace({ review: flaggedReview });

    fireEvent.click(screen.getByRole('button', { name: 'Extraction info' }));
    expect(screen.getByRole('heading', { name: 'Extraction info' })).toBeTruthy();
    expect(screen.getByText('LexChain OCR')).toBeTruthy();
    expect(screen.getByText('2 pages')).toBeTruthy();
    expect(screen.getByText('88%')).toBeTruthy();
    expect(screen.getByText('1 edited block')).toBeTruthy();
    expect(screen.getByText('Ready for review')).toBeTruthy();
  });

  it('keeps confidence out of Compare while retaining the Raw legacy label', () => {
    renderWorkspace();

    expect(screen.queryByText('97% confidence')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Raw' }));
    expect(screen.getByText(/97% confidence/)).toBeTruthy();
  });

  it('keeps drafts across tabs and saves only changed editable blocks', async () => {
    const { onSave } = renderWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), {
      target: { value: 'Corrected body' },
    });
    expect((screen.getByRole('button', { name: 'Analyze semantic issues' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Approve reviewed text' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Raw' }));
    expect((screen.getByLabelText('Reviewed text for block 1') as HTMLTextAreaElement).value).toBe('Corrected body');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith([{ index: 1, text: 'Corrected body' }]));
  });

  it('retains failed drafts and clears them only after a successful save', async () => {
    const acceptedSave = deferred<ExtractionReview>();
    const onSave = vi.fn()
      .mockRejectedValueOnce(new Error('save failed'))
      .mockReturnValueOnce(acceptedSave.promise);
    renderWorkspace({ onSave });

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), {
      target: { value: 'Corrected body' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Save changes before analysis or approval.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Save changes before analysis or approval.')).toBeTruthy();

    await act(async () => acceptedSave.resolve(review));
    await waitFor(() => expect(screen.queryByText('Save changes before analysis or approval.')).toBeNull());
  });

  it('keeps newer text dirty when an earlier save resolves', async () => {
    const pendingSave = deferred<ExtractionReview>();
    const onSave = vi.fn().mockReturnValue(pendingSave.promise);
    renderWorkspace({ onSave });

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), {
      target: { value: 'First correction' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalledWith([{ index: 1, text: 'First correction' }]);
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), {
      target: { value: 'Newer correction' },
    });

    await act(async () => pendingSave.resolve(review));

    expect((screen.getByLabelText('Reviewed text for block 1') as HTMLTextAreaElement).value).toBe('Newer correction');
    expect(screen.getByText('Save changes before analysis or approval.')).toBeTruthy();
  });

  it('treats pre-save text as dirty after the server accepts a different value', async () => {
    const pendingSave = deferred<ExtractionReview>();
    const acceptedReview: ExtractionReview = {
      ...review,
      blocks: review.blocks.map((block) => block.index === 1
        ? { ...block, text: 'First correction' }
        : block),
    };
    renderWorkspace({ onSave: vi.fn().mockReturnValue(pendingSave.promise) });

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), {
      target: { value: 'First correction' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), {
      target: { value: 'Original body' },
    });

    await act(async () => pendingSave.resolve(acceptedReview));

    expect((screen.getByLabelText('Reviewed text for block 1') as HTMLTextAreaElement).value).toBe('Original body');
    expect(screen.getByText('Save changes before analysis or approval.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('sanitizes tables in Compare and keeps their source editable in Raw', async () => {
    const tableSource = '<table><tbody><tr><td onclick="alert(1)">Amount</td></tr></tbody></table><script>alert(1)</script>';
    const tableBlock: ApiSchema<'ExtractionBlock'> = {
      ...review.blocks[1],
      index: 3,
      text: tableSource,
      original_text: tableSource,
      is_html: true,
    };
    const { container } = renderWorkspace({
      review: { ...review, blocks: [...review.blocks, tableBlock] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    expect(await screen.findByText('Amount')).toBeTruthy();
    expect(container.querySelectorAll('table')).toHaveLength(1);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('td')?.getAttribute('onclick')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Edit table in Raw view' }));
    expect(screen.getByRole('tab', { name: 'Raw' }).getAttribute('aria-selected')).toBe('true');
    expect((screen.getByLabelText('Reviewed text for block 3') as HTMLTextAreaElement).value).toBe(tableSource);
  });

  it('blocks every mutation while one is pending and freezes approved text', () => {
    const { rerender, ...props } = renderWorkspace({ isAnalyzing: true });

    expect((screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Analyzing semantic issues…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Approve reviewed text' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    rerender(<ReviewWorkspace {...props} isAnalyzing={false} review={{ ...review, is_reviewed: true }} />);
    expect((screen.getByLabelText('Reviewed text for block 1') as HTMLTextAreaElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Analyze semantic issues' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Reviewed text is approved and frozen.')).toBeTruthy();
  });

  it('requires an issue-aware confirmation before approving reviewed text', () => {
    const { onApprove } = renderWorkspace({ review: flaggedReview });

    fireEvent.click(screen.getByRole('button', { name: 'Approve reviewed text' }));

    expect(screen.getByRole('dialog', { name: 'Approve reviewed text?' })).toBeTruthy();
    expect(screen.getByText('2 unresolved high-priority issues remain.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Approve anyway' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('uses the ordinary approval copy when no high-priority issues remain', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Approve reviewed text' }));

    expect(screen.getByRole('dialog', { name: 'Approve reviewed text?' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy();
  });

  it('cancels approval without calling the route action', async () => {
    const { onApprove } = renderWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Approve reviewed text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Approve reviewed text?' })).toBeNull());
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('keeps the approval dialog closed while edits are unsaved', () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), { target: { value: 'Corrected body' } });

    const approveButton = screen.getByRole('button', { name: 'Approve reviewed text' }) as HTMLButtonElement;
    expect(approveButton.disabled).toBe(true);
    fireEvent.click(approveButton);
    expect(screen.queryByRole('dialog', { name: 'Approve reviewed text?' })).toBeNull();
  });

  it('locks an open approval dialog while approval is pending', () => {
    const { rerender, ...props } = renderWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'Approve reviewed text' }));

    rerender(<ReviewWorkspace {...props} isApproving />);

    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Approve' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('freezes Compare, Raw, and table editing while approval is pending', () => {
    const tableBlock: ApiSchema<'ExtractionBlock'> = {
      ...review.blocks[1],
      index: 3,
      text: '<table><tbody><tr><td>Amount</td></tr></tbody></table>',
      original_text: '<table><tbody><tr><td>Amount</td></tr></tbody></table>',
      is_html: true,
    };
    const { rerender, ...props } = renderWorkspace({ review: { ...review, blocks: [...review.blocks, tableBlock] } });
    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), { target: { value: 'Corrected body' } });

    rerender(<ReviewWorkspace {...props} isApproving />);

    expect((screen.getByLabelText('Reviewed text for block 1') as HTMLTextAreaElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Edit table in Raw view' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Analyze semantic issues' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Approving reviewed text…' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('tab', { name: 'Raw' }));
    expect((screen.getByLabelText('Reviewed text for block 1') as HTMLTextAreaElement).disabled).toBe(true);
    expect((screen.getByLabelText('Reviewed text for block 3') as HTMLTextAreaElement).disabled).toBe(true);
  });

  it('shows the dirty block count beside save', () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'Mock page 2' }));
    fireEvent.change(screen.getByLabelText('Reviewed text for block 1'), { target: { value: 'Corrected body' } });

    expect(screen.getByText('1 block changed')).toBeTruthy();
  });
});
