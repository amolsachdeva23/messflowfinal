import { Link } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import DataTag from '@/components/DataTag';
import StatusIndicator from '@/components/StatusIndicator';
import PageSkeleton from '@/components/PageSkeleton';
import { useMessData } from '@/lib/MessDataContext';
import { CROWD_META, MEAL_LABELS, MEAL_PERIODS, NOTICE_TYPE_LABELS } from '@/lib/types';
import { formatLongDate, relativeTimeLabel } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

export default function StudentHome() {
  const { isLoading, studentView } = useMessData();

  if (isLoading) return <PageSkeleton />;

  const { today, dayMenu, current, queue, nextMeal } = studentView;
  const window = dayMenu?.[current.meal];
  const crowd = CROWD_META[queue.level];
  const showWait = current.state === 'in-service' && !queue.stale && queue.hasData;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Current meal period
            </p>
            <p className="mt-1 text-[20px] font-semibold leading-tight text-ink">
              {MEAL_LABELS[current.meal]}
            </p>
            {window ? (
              <p className="tnum mt-0.5 text-[12.5px] text-ink-muted">
                {window.start}–{window.end}
              </p>
            ) : null}
          </div>
          <DataTag kind="simulated" />
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <StatusIndicator
            tone={
              current.state === 'in-service' ? 'ok' : current.state === 'upcoming' ? 'info' : 'neutral'
            }
            label={
              current.state === 'in-service'
                ? 'Service in progress'
                : current.state === 'upcoming'
                  ? `Starts at ${window?.start}`
                  : 'Service ended'
            }
          />
        </div>
      </div>

      <div
        className={cn(
          'rounded-lg border px-4 py-4',
          showWait
            ? crowd.tone === 'ok'
              ? 'border-brand/25 bg-brand-soft'
              : crowd.tone === 'warn'
                ? 'border-warn-border bg-warn-soft'
                : 'border-danger-border bg-danger-soft'
            : 'border-line bg-white',
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Dining hall right now
        </p>

        {showWait ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  crowd.tone === 'ok' ? 'bg-brand' : crowd.tone === 'warn' ? 'bg-warn' : 'bg-danger',
                )}
              />
              <p className="text-[17px] font-semibold text-ink">{crowd.label}</p>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
              {crowd.description} Estimated wait about{' '}
              <span className="font-semibold">{queue.waitMinutes} minutes</span>.
            </p>
            <p className="tnum mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
              <Clock className="h-3.5 w-3.5" />
              Last updated {queue.observedAtTime} · {queue.availableSeats} seats free (estimate)
            </p>
          </>
        ) : (
          <>
            <div className="mt-2 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <p className="text-[14px] font-medium text-ink">Waiting time unavailable</p>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
              No current reading is available for {MEAL_LABELS[current.meal].toLowerCase()}.
              {queue.observedAtTime
                ? ` Last recorded at ${queue.observedAtTime}: about ${queue.waitMinutes} minutes.`
                : ''}
            </p>
            {nextMeal ? (
              <p className="mt-1.5 text-[12.5px] text-ink-muted">
                Next service: {MEAL_LABELS[nextMeal.meal]} at {nextMeal.start}
                {nextMeal.tomorrow ? ' tomorrow' : ''}.
              </p>
            ) : null}
          </>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
          <p className="text-[11.5px] text-ink-muted">
            Simulated demo readings — no camera is connected.
          </p>
          <Link to="/student/queue" className="text-[12px] font-medium text-brand">
            View queue
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold text-ink">Today's menu</p>
            <p className="text-[11.5px] text-ink-muted">{formatLongDate(today)}</p>
          </div>
          <Link to="/student/menu" className="text-[12px] font-medium text-brand">
            Full menu
          </Link>
        </div>
        <div className="divide-y divide-line">
          {MEAL_PERIODS.map((meal) => {
            const entry = dayMenu?.[meal];
            if (!entry) return null;
            return (
              <div key={meal} className="px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] font-medium text-ink">{MEAL_LABELS[meal]}</p>
                  <p className="tnum text-[11.5px] text-ink-muted">
                    {entry.start}–{entry.end}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.items.map((item) => (
                    <span
                      key={item.id}
                      className={cn(
                        'rounded border px-1.5 py-0.5 text-[11.5px]',
                        item.veg ? 'border-line text-ink' : 'border-warn-border bg-warn-soft text-warn',
                      )}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
                {entry.notice ? (
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">{entry.notice}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <StudentNoticesPreview />
    </div>
  );
}

function StudentNoticesPreview() {
  const { state } = useMessData();
  const notices = (state.notices || []).slice(0, 2);
  if (!notices.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-[14px] font-semibold text-ink">Dining notices</p>
        <Link to="/student/notices" className="text-[12px] font-medium text-brand">
          All notices
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {notices.map((notice) => (
          <li key={notice.id} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-sunken px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                {NOTICE_TYPE_LABELS[notice.type]}
              </span>
              <span className="text-[11px] text-ink-muted">{relativeTimeLabel(notice.postedAt)}</span>
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-ink">{notice.title}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{notice.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}