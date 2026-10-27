import DataTag from '@/components/DataTag';
import PageSkeleton from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { useMessData } from '@/lib/MessDataContext';
import { MEAL_LABELS, MEAL_PERIODS } from '@/lib/types';
import { formatLongDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

export default function StudentMenu() {
  const { isLoading, studentView } = useMessData();

  if (isLoading) return <PageSkeleton />;

  const { today, dayMenu, current } = studentView;

  if (!dayMenu) {
    return (
      <EmptyState
        title="Menu not published"
        description="The mess has not published a menu for today yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Mess menu</h1>
          <p className="text-[12px] text-ink-muted">{formatLongDate(today)}</p>
        </div>
        <DataTag kind="staff-entered" />
      </div>

      {MEAL_PERIODS.map((meal) => {
        const entry = dayMenu[meal];
        if (!entry) return null;
        const isCurrent = meal === current.meal;
        return (
          <div
            key={meal}
            className={cn(
              'rounded-lg border bg-white',
              isCurrent ? 'border-brand/30' : 'border-line',
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-ink">{MEAL_LABELS[meal]}</p>
                {isCurrent ? (
                  <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-brand">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="tnum text-[12px] text-ink-muted">
                {entry.start}–{entry.end}
              </p>
            </div>
            <ul className="divide-y divide-line">
              {entry.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[13px] text-ink">{item.name}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em]',
                      item.veg ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn',
                    )}
                  >
                    {item.veg ? 'Veg' : 'Non-veg'}
                  </span>
                </li>
              ))}
            </ul>
            {entry.notice ? (
              <p className="mx-4 mb-3 mt-1 rounded border border-line bg-sunken px-3 py-2 text-[12px] leading-relaxed text-ink-muted">
                {entry.notice}
              </p>
            ) : null}
          </div>
        );
      })}

      <p className="px-1 text-[11.5px] leading-relaxed text-ink-muted">
        Menu changes made by mess staff appear here immediately. Timings are as published by the mess.
      </p>
    </div>
  );
}