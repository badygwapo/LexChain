// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NotificationsPage from '@/features/portal/pages/notifications-page';

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useQuery: () => ({
    data: {
      notifications: [
        { id: 'anchored', title: 'Document anchored', body: 'Your record is ready.', is_read: false, created_at: '2026-07-20T10:00:00Z' },
        { id: 'reviewed', title: 'Verification reviewed', body: 'A review was completed.', is_read: true, created_at: '2026-07-20T09:00:00Z' },
      ],
      total: 2,
    },
    isLoading: false,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

afterEach(cleanup);

describe('NotificationsPage', () => {
  it('clearly labels unread notification actions and read status', () => {
    render(<NotificationsPage />);

    expect(screen.getByRole('button', { name: 'Mark Document anchored as read' })).toBeTruthy();
    expect(screen.getByText('Marked as read')).toBeTruthy();
  });
});
