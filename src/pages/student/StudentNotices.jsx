import DataTag from '@/components/DataTag';
import PageSkeleton from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { useMessData } from '@/lib/MessDataContext';
import { NOTICE_TYPE_LABELS } from '@/lib/types';
import { formatShortDate, relativeTimeLabel } from '@/lib/dateUtils';

export default function StudentNotices() {
  const { isLoading, state } = useMessData();

  if (isLoading) return <PageSkeleton />;

  const notices = state.notices || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Dining notices</h1>
          <p className="text-[12px] text-ink-muted">Timing changes, menu updates and service delays</p>
        </div>
        <DataTag kind="staff-entered" />
      </div>

      {notices.length === 0 ? (
        <EmptyState
          title="No notices right now"
          description="Notices about timing changes, menu updates or service delays will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li key={notice.id} className="rounded-lg border border-line bg-white px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-sunken px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                  {NOTICE_TYPE_LABELS[notice.type]}
                </span>
                <span className="text-[11px] text-ink-muted">
                  {formatShortDate(notice.date)} · {relativeTimeLabel(notice.postedAt)}
                </span>
              </div>
              <p className="mt-2 text-[14px] font-medium text-ink">{notice.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{notice.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}