'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

async function fetchNotifications(): Promise<{ notifications: Notification[]; total: number }> {
  const res = await fetch('/api/portal/proxy?path=%2Fnotifications%2F', { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

async function markAllRead() {
  const res = await fetch('/api/portal/proxy-post?path=%2Fnotifications%2Fread-all', {
    method: 'PATCH',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error('Failed');
}

async function markOneRead(id: string) {
  const res = await fetch(`/api/portal/proxy-post?path=${encodeURIComponent(`/notifications/${id}/read`)}`, {
    method: 'PATCH',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error('Failed');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['portal-notifications'],
    queryFn: fetchNotifications,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: markOneRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-notifications'] }),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#0C2B49]">Notifications</h1>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">Updates from your document workspace.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#D5E5F3] bg-white px-4 py-2 text-sm font-semibold text-[#076BB9] transition hover:bg-[#EEF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0985E7] disabled:opacity-50"
          >
            <DoneAllIcon sx={{ fontSize: 16 }} />
            Mark all as read
          </button>
        )}
      </div>

      <section aria-label="Notification inbox" className="overflow-hidden rounded-[20px] border border-[#DFE9F2] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#E8F0F8] px-5 py-4 sm:px-6">
          <NotificationsNoneIcon className="text-[#0985E7]" sx={{ fontSize: 22 }} />
          <h2 className="text-sm font-bold text-[#0C2B49]">Your inbox</h2>
          {!isLoading && <span className="ml-auto rounded-full bg-[#EEF6FF] px-3 py-1 text-xs font-semibold text-[#076BB9]">{unreadCount} unread</span>}
        </div>
        {isLoading ? (
          <div role="status" className="divide-y divide-[#E8F0F8]">
            <span className="sr-only">Loading notifications</span>
            {[1, 2, 3].map(i => <div key={i} aria-hidden="true" className="space-y-3 px-5 py-6 motion-safe:animate-pulse sm:px-6">
              <div className="h-4 w-40 rounded bg-[#E8F0F8]" />
              <div className="h-3 w-3/4 rounded bg-[#F0F5FA]" />
              <div className="h-3 w-24 rounded bg-[#F0F5FA]" />
            </div>)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF6FF] text-[#0985E7]">
              <NotificationsNoneIcon sx={{ fontSize: 28 }} />
            </div>
            <p className="text-base font-bold text-[#0C2B49]">No notifications yet</p>
            <p className="mt-2 text-sm text-[#64748B]">New document updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8F0F8]">
            {notifications.map((n) => {
              const content = <>
                <div aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-[#CBD5E1]' : 'bg-[#0985E7]'}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-base font-semibold leading-6 text-[#0C2B49]">{n.title}</span>
                  <p className="mt-1 break-words text-sm leading-6 text-[#526579]">{n.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
                    <time dateTime={n.created_at}>{formatDate(n.created_at)}</time>
                    <span className={n.is_read ? '' : 'font-semibold text-[#076BB9]'}>{n.is_read ? 'Marked as read' : 'Unread · Click to mark as read'}</span>
                  </div>
                </div>
              </>;

              return n.is_read ? (
                <article key={n.id} className="flex items-start gap-3 border-l-[3px] border-transparent px-5 py-5 sm:px-6">
                  {content}
                </article>
              ) : (
                <button key={n.id} onClick={() => markOneMutation.mutate(n.id)} aria-label={`Mark ${n.title} as read`} className="flex w-full items-start gap-3 border-l-[3px] border-l-[#0985E7] bg-[#F5FAFF] px-5 py-5 text-left transition hover:bg-[#EEF6FF] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0985E7] sm:px-6">
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
