import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useMessData } from '@/lib/MessDataContext';
import { formatShortDate, minutesToTime } from '@/lib/dateUtils';
import { MEAL_LABELS } from '@/lib/types';

export default function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const {
    settings,
    selectedDate,
    selectedMeal,
    selectedWindow,
    alerts,
    nowMinutes,
    setMessLocation,
    loadError,
    clearLoadError,
  } = useMessData();

  const mealLabel = selectedWindow
    ? `${MEAL_LABELS[selectedMeal]} · ${selectedWindow.start}–${selectedWindow.end}`
    : MEAL_LABELS[selectedMeal];

  const sidebarProps = {
    messName: settings.activeMess,
    messOptions: settings.messOptions,
    onMessChange: setMessLocation,
    staff: settings.staff,
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar {...sidebarProps} />
      </div>

      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/25" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[262px] bg-white shadow-xl">
            <Sidebar {...sidebarProps} onNavigate={() => setNavOpen(false)} />
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-ink-muted"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[240px]">
        <Header
          onOpenNav={() => setNavOpen(true)}
          dateLabel={formatShortDate(selectedDate)}
          mealLabel={mealLabel}
          alerts={alerts}
          clockLabel={minutesToTime(nowMinutes)}
          staff={settings.staff}
        />

        <main className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 lg:px-8">
          {loadError ? (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-warn-border bg-warn-soft px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <p className="flex-1 text-[12.5px] leading-relaxed text-ink">{loadError}</p>
              <button
                type="button"
                onClick={clearLoadError}
                aria-label="Dismiss"
                className="text-ink-muted transition-colors hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}