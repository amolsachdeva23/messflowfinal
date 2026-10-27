export default function PageHeader({ title, subtitle, actions, meta }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted">{subtitle}</p>
        ) : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}