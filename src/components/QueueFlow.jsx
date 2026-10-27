import { cn } from '@/lib/utils';

const STAGES = [
  { key: 'queue', label: 'Waiting to be served', caption: 'In the serving queue', tone: 'bg-warn' },
  { key: 'served', label: 'Currently being served', caption: 'At the counter', tone: 'bg-info' },
  { key: 'dining', label: 'Dining area', caption: 'Seated and eating', tone: 'bg-brand' },
];

/**
 * Service flow: queue length, people at the counter and people seated are
 * three separate measurements — never one number.
 */
export default function QueueFlow({ queue }) {
  const values = {
    queue: queue.queueLength,
    served: queue.beingServed,
    dining: queue.diningCount,
  };
  const max = Math.max(values.queue, values.served, values.dining, 1);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STAGES.map((stage, index) => (
        <div key={stage.key} className="rounded-md border border-line bg-sunken px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {index + 1}. {stage.label}
            </span>
            <span className="tnum text-[20px] font-semibold leading-none text-ink">
              {values[stage.key]}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className={cn('h-full rounded-full transition-[width] duration-500', stage.tone)}
              style={{ width: `${Math.min(100, (values[stage.key] / max) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11.5px] text-ink-muted">
            {stage.caption}
            {stage.key === 'dining' && queue.availableSeats != null
              ? ` · ${queue.availableSeats} seats free`
              : ''}
          </p>
        </div>
      ))}
    </div>
  );
}