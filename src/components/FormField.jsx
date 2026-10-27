import { AlertCircle } from 'lucide-react';

export default function FormField({ label, htmlFor, hint, error, required, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] leading-snug text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}