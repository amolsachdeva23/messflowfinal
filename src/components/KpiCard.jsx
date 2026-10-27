import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import DataTag from '@/components/DataTag';
import { cn } from '@/lib/utils';

export default function KpiCard({
  label,
  value,
  unit,
  support,
  delta,
  deltaTone = 'neutral',
  progress,
  sourceKind,
  sourceLabel,
}) {
  const DeltaIcon = deltaTone === 'up' ? ArrowUpRight : deltaTone === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="rounded-lg border border-line bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</p>
        {sourceKind ? <DataTag kind={sourceKind} label={sourceLabel} /> : null}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="tnum text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">{value}</span>
        {unit ? <span className="text-[13px] font-medium text-ink-muted">{unit}</span> : null}
      </div>
      {support ? <p className="mt-2 text-[12px] leading-snug text-ink-muted">{support}</p> : null}
      {typeof progress === 'number' ? (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#EDEEE9]">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      ) : null}
      {delta ? (
        <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
          <DeltaIcon
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              deltaTone === 'up' ? 'text-brand' : deltaTone === 'down' ? 'text-warn' : 'text-ink-muted',
            )}
          />
          <span>{delta}</span>
        </div>
      ) : null}
    </div>
  );
}