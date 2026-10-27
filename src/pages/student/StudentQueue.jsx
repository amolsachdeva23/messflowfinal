import { useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import DataTag from '@/components/DataTag';
import PageSkeleton from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { useMessData } from '@/lib/MessDataContext';
import { CROWD_LEVELS, CROWD_META, MEAL_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function StudentQueue() {
  const { isLoading, studentView, nowMinutes } = useMessData();
  const [checkedAt, setCheckedAt] = useState(() => new Date());

  const quietest = useMemo(() => {
    const points = studentView?.queue?.series || [];
    if (points.length < 3) return null;
    const best = points.reduce((min, point) => (point.waitMinutes < min.waitMinutes ? point : min), points[0]);
    return best.time;
  }, [studentView]);

  if (isLoading) return <PageSkeleton />;

  const { current, queue } = studentView;
  const crowd = CROWD_META[queue.level];
  const showWait = current.state === 'in-service' && !queue.stale && queue.hasData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Dining queue</h1>
          <p className="text-[12px] text-ink-muted">
            {MEAL_LABELS[current.meal]} · {current.state === 'in-service' ? 'in service' : current.state}
          </p>
        </div>
        <DataTag kind="simulated" />
      </div>

      <div
        className={cn(
          'rounded-lg border px-4 py-5 text-center',
          showWait
            ? crowd.tone === 'ok'
              ? 'border-brand/25 bg-brand-soft'
              : crowd.tone === 'warn'
                ? 'border-warn-border bg-warn-soft'
                : 'border-danger-border bg-danger-soft'
            : 'border-line bg-white',
        )}
      >
        {showWait ? (
          <>
            <span
              className={cn(
                'mx-auto block h-3 w-3 rounded-full',
                crowd.tone === 'ok' ? 'bg-brand' : crowd.tone === 'warn' ? 'bg-warn' : 'bg-danger',
              )}
            />
            <p className="mt-3 text-[19px] font-semibold text-ink">{crowd.label}</p>
            <p className="mt-2 text-[14px] text-ink">
              Estimated wait <span className="font-semibold">{queue.waitMinutes} minutes</span>
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{crowd.description}</p>
            <p className="tnum mt-3 text-[11.5px] text-ink-muted">
              Reading from {queue.observedAtTime} · {queue.queueLength} people waiting ·{' '}
              {queue.availableSeats} seats free (estimate)
            </p>
          </>
        ) : (
          <>
            <AlertTriangle className="mx-auto h-5 w-5 text-warn" />
            <p className="mt-3 text-[16px] font-semibold text-ink">Waiting time unavailable</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
              No current reading is available.
              {queue.observedAtTime
                ? ` The last reading was recorded at ${queue.observedAtTime}.`
                : ' No reading was recorded for this meal.'}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3">
        <p className="text-[11.5px] text-ink-muted">
          Checked {checkedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ·
          demo clock {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:
          {String(nowMinutes % 60).padStart(2, '0')}
        </p>
        <Button size="sm" variant="outline" onClick={() => setCheckedAt(new Date())}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {quietest ? (
        <div className="rounded-lg border border-line bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Usually quietest around
          </p>
          <p className="tnum mt-1 text-[15px] font-medium text-ink">{quietest}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
            Based on the shortest recorded queue in this meal period today (demo estimate).
          </p>
        </div>
      ) : null}

      <div className="rounded-lg border border-line bg-white">
        <p className="border-b border-line px-4 py-3 text-[13.5px] font-semibold text-ink">
          What the levels mean
        </p>
        <ul className="divide-y divide-line">
          {CROWD_LEVELS.map((level) => (
            <li key={level} className="flex items-start gap-2.5 px-4 py-3">
              <span
                className={cn(
                  'mt-[6px] h-2 w-2 shrink-0 rounded-full',
                  CROWD_META[level].tone === 'ok'
                    ? 'bg-brand'
                    : CROWD_META[level].tone === 'warn'
                      ? 'bg-warn'
                      : 'bg-danger',
                )}
              />
              <div>
                <p className="text-[12.5px] font-medium text-ink">{CROWD_META[level].label}</p>
                <p className="text-[11.5px] leading-relaxed text-ink-muted">
                  {CROWD_META[level].description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="px-1 text-[11.5px] leading-relaxed text-ink-muted">
        Waiting times are estimates derived from counter readings in this demo. No camera or sensor is
        connected.
      </p>
    </div>
  );
}