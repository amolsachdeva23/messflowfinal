import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function AlertItem({ alert, onDismiss }) {
  const dotClass =
    alert.severity === 'critical'
      ? 'bg-danger'
      : alert.severity === 'warning'
        ? 'bg-warn'
        : 'bg-info';

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-line bg-white px-4 py-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-snug text-ink">{alert.title}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{alert.detail}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          to={alert.to}
          className="rounded-md border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-sunken"
        >
          {alert.action}
        </Link>
        {onDismiss ? (
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}