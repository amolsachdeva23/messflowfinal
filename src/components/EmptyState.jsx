export default function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={compact ? 'px-4 py-8' : 'px-4 py-14'}>
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
            <Icon className="h-5 w-5 text-brand" />
          </span>
        ) : null}
        <p className="mt-3 text-[13.5px] font-medium text-ink">{title}</p>
        {description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{description}</p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}