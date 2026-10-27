import { cn } from '@/lib/utils';

const KINDS = {
  demo: { label: 'Demo data', dot: 'bg-ink-muted/50' },
  recorded: { label: 'Recorded', dot: 'bg-brand' },
  'staff-entered': { label: 'Staff entered', dot: 'bg-info' },
  simulated: { label: 'Simulated sensor', dot: 'bg-warn' },
  estimated: { label: 'Estimate', dot: 'bg-ink-muted/50' },
};

/**
 * Small provenance label. Every measurement that could be mistaken for live
 * data carries one of these.
 */
export default function DataTag({ kind = 'demo', label, className }) {
  const config = KINDS[kind] || KINDS.demo;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-line bg-sunken px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-muted',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {label || config.label}
    </span>
  );
}