import { cn } from '@/lib/utils';

export default function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  footer,
  flush = false,
}) {
  return (
    <section className={cn('rounded-lg border border-line bg-white', className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-[15px] font-semibold leading-tight tracking-[-0.005em] text-ink">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn(flush ? '' : 'px-5 py-4', bodyClassName)}>{children}</div>
      {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
    </section>
  );
}