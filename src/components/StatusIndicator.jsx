import { cn } from '@/lib/utils';

const TONES = {
  ok: { dot: 'bg-brand', text: 'text-brand' },
  warn: { dot: 'bg-warn', text: 'text-warn' },
  danger: { dot: 'bg-danger', text: 'text-danger' },
  info: { dot: 'bg-info', text: 'text-info' },
  neutral: { dot: 'bg-ink-muted/60', text: 'text-ink-muted' },
};

export default function StatusIndicator({ tone = 'neutral', label, detail, className, size = 'md' }) {
  const config = TONES[tone] || TONES.neutral;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('rounded-full', config.dot, size === 'sm' ? 'h-1.5 w-1.5' : 'h-[7px] w-[7px]')} />
      <span
        className={cn(
          'font-medium',
          config.text,
          size === 'sm' ? 'text-[11.5px]' : 'text-[12.5px]',
        )}
      >
        {label}
        {detail ? <span className="font-normal text-ink-muted"> · {detail}</span> : null}
      </span>
    </span>
  );
}