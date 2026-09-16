// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UploadPage from '@/features/documents/pages/upload-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

const { uploadDocumentMock } = vi.hoisted(() => ({ uploadDocumentMock: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@mui/icons-material/UploadFile', () => ({ default: () => null }));
vi.mock('@mui/icons-material/InsertDriveFile', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Close', () => ({ default: () => null }));
vi.mock('@mui/icons-material/CheckCircle', () => ({ default: () => null }));
vi.mock('@/features/documents/portal-upload', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/features/documents/portal-upload')>(),
  uploadDocument: uploadDocumentMock,
}));
vi.mock('@tanstack/react-query', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('@tanstack/react-query')>(),
    useQuery: ({ queryKey }: { queryKey: string[] }) => queryKey[0] === 'portal-profile'
      ? { data: { role: 'document_issuer' }, isPending: false }
      : { data: [{ id: 'book-1', book_number: '42', series_year: 2026, is_full: false }], isLoading: false, isError: false },
  };
});

function renderUploadPage() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><UploadPage /></QueryClientProvider>);
}

function completeUploadForm(container: HTMLElement) {
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(fileInput, { target: { files: [new File(['PDF'], 'deed.pdf', { type: 'application/pdf' })] } });
  fireEvent.click(screen.getByLabelText('Register book'));
  fireEvent.click(screen.getByRole('option', { name: /Register book 42 — Series 2026/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm and process' }));
}

describe('UploadPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the accepted document ID and status returned by the upload service', async () => {
    uploadDocumentMock.mockResolvedValue({ document_id: 'document-202', status: 'QUEUED', message: 'Accepted for processing.' });
    const { container } = renderUploadPage();

    completeUploadForm(container);

    expect(await screen.findByText('document-202')).toBeTruthy();
    expect(screen.getByText('QUEUED')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Upload accepted');
    expect(toast.success).toHaveBeenCalledWith('Upload accepted. Your document has been submitted for processing.');
    expect(uploadDocumentMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'deed', bookId: 'book-1' }));
  });

  it('renders an inline alert when the upload service rejects the document', async () => {
    uploadDocumentMock.mockRejectedValue(new Error('The PDF is too large.'));
    const { container } = renderUploadPage();

    completeUploadForm(container);

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('The PDF is too large.'));
  });

  it('identifies the selected file, office upload limit, and register book field', () => {
    const { container } = renderUploadPage();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [new File([new Uint8Array(4_508_877)], 'Lease Agreement.pdf', { type: 'application/pdf' })] } });

    expect(screen.getByText('Lease Agreement.pdf · 4.3 MB')).toBeTruthy();
    expect(screen.getByText('PDF only · maximum 25 MB')).toBeTruthy();
    expect(screen.getByLabelText('Register book')).toBeTruthy();
  });

  it('announces pending uploads, prevents duplicates, and preserves inputs for a successful retry', async () => {
    const pending = Promise.withResolvers<unknown>();
    uploadDocumentMock.mockReturnValueOnce(pending.promise).mockResolvedValueOnce({
      document_id: 'retry-document', status: 'QUEUED', message: 'Accepted for processing.',
    });
    const { container } = renderUploadPage();
    fireEvent.change(screen.getByLabelText('Document title'), { target: { value: 'Assignment deed' } });
    completeUploadForm(container);

    const submit = await screen.findByRole('button', { name: 'Uploading…' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Uploading…');
    fireEvent.click(submit);
    expect(uploadDocumentMock).toHaveBeenCalledTimes(1);

    pending.reject(new Error('Unable to connect to the upload service.'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Unable to connect to the upload service.');
    expect(alert.textContent).toContain('retry');
    expect((screen.getByLabelText('Document title') as HTMLInputElement).value).toBe('Assignment deed');
    expect(screen.getByText('deed.pdf · 0.0 MB')).toBeTruthy();
    expect(screen.getByLabelText('Register book').textContent).toContain('Register book 42');
    expect((screen.getByRole('button', { name: 'Confirm and process' }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm and process' }));
    expect(await screen.findByText('retry-document')).toBeTruthy();
    expect(uploadDocumentMock).toHaveBeenCalledTimes(2);
    expect(uploadDocumentMock.mock.calls[1][0]).toEqual(uploadDocumentMock.mock.calls[0][0]);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

});
