import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, Home as HomeIcon, Megaphone, Users, Utensils } from 'lucide-react';
import { useMessData } from '@/lib/MessDataContext';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/student', label: 'Home', icon: HomeIcon, end: true },
  { to: '/student/menu', label: 'Menu', icon: Utensils, end: false },
  { to: '/student/queue', label: 'Queue', icon: Users, end: false },
  { to: '/student/notices', label: 'Notices', icon: Megaphone, end: false },
];

export default function StudentLayout() {
  const { settings } = useMessData();

  return (
    <div className="min-h-screen bg-page pb-[76px]">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[560px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-brand">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-[13px] w-[13px] text-white"
              >
                <path d="M3.4 13.4h13.2" strokeLinecap="round" />
                <path d="M5.2 13.4a4.8 4.8 0 0 1 9.6 0" />
                <path d="M10 5.2v1.8" strokeLinecap="round" />
              </svg>
            </span>
            <div className="leading-tight">
              <p className="text-[13.5px] font-semibold text-ink">{settings.activeMess}</p>
              <p className="text-[11px] text-ink-muted">Student view · demo</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" />
            Staff dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-4 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white">
        <div className="mx-auto grid max-w-[560px] grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors',
                    isActive ? 'font-medium text-brand' : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-brand' : 'text-ink-muted')} />
                    {tab.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}