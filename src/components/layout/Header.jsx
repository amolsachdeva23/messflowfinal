import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { crumbForPath } from '@/lib/navigation';

export default function Header({
  dateLabel = 'Mon, 26 Oct 2026',
  mealLabel = 'Lunch · 12:30–14:30',
  alerts = [],
  clockLabel = '13:10',
  staff = { name: 'Riya Nair', initials: 'RN' },
  onOpenNav,
}) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [section, page] = crumbForPath(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-[58px] items-center gap-3 px-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:bg-sunken hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12.5px]">
          <span className="hidden text-ink-muted sm:inline">{section}</span>
          <span className="hidden text-line sm:inline">/</span>
          <span className="truncate font-medium text-ink">{page}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 text-[12px] text-ink-muted md:flex">
            <span>{dateLabel}</span>
            <span className="text-line">|</span>
            <span className="text-ink">{mealLabel}</span>
          </div>

          <span className="hidden items-center gap-1.5 rounded border border-line bg-sunken px-2 py-1 text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-muted lg:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/50" />
            Demo environment · clock {clockLabel}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="relative flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {alerts.length > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warn ring-2 ring-white" />
              ) : null}
            </button>

            {open ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-lg border border-line bg-white shadow-[0_10px_30px_rgba(37,41,35,0.10)]">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-ink">Notifications</p>
                    <span className="text-[11px] text-ink-muted">{alerts.length} open</span>
                  </div>
                  {alerts.length === 0 ? (
                    <p className="px-4 py-5 text-[12.5px] text-ink-muted">
                      No operational alerts for the current meal period.
                    </p>
                  ) : (
                    <ul className="max-h-[320px] overflow-y-auto">
                      {alerts.map((alert) => (
                        <li key={alert.id} className="border-b border-line last:border-b-0">
                          <Link
                            to={alert.to}
                            onClick={() => setOpen(false)}
                            className="block px-4 py-3 transition-colors hover:bg-sunken"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={
                                  alert.severity === 'critical'
                                    ? 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger'
                                    : alert.severity === 'warning'
                                      ? 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn'
                                      : 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-info'
                                }
                              />
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-medium leading-snug text-ink">{alert.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-ink-muted">
                                  {alert.detail}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-l border-line pl-2 sm:pl-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11.5px] font-semibold text-brand">
              {staff.initials}
            </span>
            <span className="hidden text-[12px] font-medium text-ink xl:inline">{staff.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}