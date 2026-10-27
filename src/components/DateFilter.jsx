import { addDaysISO, todayISO } from '@/lib/dateUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DateFilter({ value, onChange, allowFuture = false }) {
  const isToday = value === todayISO();

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-line bg-white p-0.5">
      <button
        type="button"
        onClick={() => onChange(addDaysISO(value, -1))}
        aria-label="Previous day"
        className="flex h-7 w-7 items-center justify-center rounded-[5px] text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <input
        type="date"
        value={value}
        max={allowFuture ? undefined : todayISO()}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        className="tnum bg-transparent px-1 py-1 text-[12.5px] text-ink focus:outline-none"
      />
      <button
        type="button"
        disabled={isToday && !allowFuture}
        onClick={() => onChange(addDaysISO(value, 1))}
        aria-label="Next day"
        className="flex h-7 w-7 items-center justify-center rounded-[5px] text-ink-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(todayISO())}
        className={cn(
          'rounded-[5px] px-2 py-1 text-[12px] font-medium transition-colors',
          isToday ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-sunken hover:text-ink',
        )}
      >
        Today
      </button>
    </div>
  );
}