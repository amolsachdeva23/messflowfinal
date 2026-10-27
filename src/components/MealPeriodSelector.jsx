import { MEAL_LABELS, MEAL_PERIODS } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function MealPeriodSelector({ value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-md border border-line bg-white p-0.5', className)} role="tablist">
      {MEAL_PERIODS.map((meal) => {
        const active = value === meal;
        return (
          <button
            key={meal}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(meal)}
            className={cn(
              'rounded-[5px] px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
              active ? 'bg-brand-soft font-medium text-brand' : 'text-ink-muted hover:bg-sunken hover:text-ink',
            )}
          >
            {MEAL_LABELS[meal]}
          </button>
        );
      })}
    </div>
  );
}