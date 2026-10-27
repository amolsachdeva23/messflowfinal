import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils';

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-brand">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[13px] w-[13px] text-white">
          <path d="M3.4 13.4h13.2" strokeLinecap="round" />
          <path d="M5.2 13.4a4.8 4.8 0 0 1 9.6 0" />
          <path d="M10 5.2v1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.015em] text-ink">MessFlow</span>
    </div>
  );
}

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-md py-[7px] pl-3.5 pr-2.5 text-[13px] transition-colors',
          isActive ? 'bg-brand-soft font-medium text-brand' : 'text-ink-muted hover:bg-sunken hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute left-1.5 top-1/2 h-[15px] w-[2px] -translate-y-1/2 rounded-full bg-brand" />
          ) : null}
          <Icon className={cn('h-[16px] w-[16px] shrink-0', isActive ? 'text-brand' : 'text-ink-muted')} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({
  messName = 'Sahyadri Hostel Mess',
  messOptions = ['Sahyadri Hostel Mess'],
  onMessChange,
  staff = { name: 'Riya Nair', role: 'Mess Supervisor', initials: 'RN' },
  onNavigate,
}) {
  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-line bg-white">
      <div className="px-5 pb-4 pt-5">
        <Wordmark />
      </div>

      <p className="px-5 pb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        Hostel Operations
      </p>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <div className="my-2.5 border-t border-line" />
        {SECONDARY_NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <label className="px-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
          Mess location
        </label>
        <div className="relative mt-1.5">
          <select
            value={messName}
            onChange={(event) => onMessChange && onMessChange(event.target.value)}
            className="w-full appearance-none rounded-md border border-line bg-white py-2 pl-2.5 pr-8 text-[12.5px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          >
            {(messOptions || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
          {staff.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-ink">{staff.name}</p>
          <p className="truncate text-[11px] text-ink-muted">{staff.role}</p>
        </div>
      </div>
    </aside>
  );
}