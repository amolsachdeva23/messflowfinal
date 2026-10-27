import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import FormField from '@/components/FormField';
import { useMessData } from '@/lib/MessDataContext';
import { MEAL_LABELS } from '@/lib/types';

/** Change the expected diner count and recalculate demand proportionally. */
export default function AdjustForecastDialog({ open, onOpenChange }) {
  const { expectedDiners, selectedDate, selectedMeal, adjustExpectedDiners, forecast } = useMessData();
  const { toast } = useToast();
  const [value, setValue] = useState('');
  const [applyPlanned, setApplyPlanned] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setValue(String(expectedDiners));
      setError(null);
    }
  }, [open, expectedDiners]);

  const ratio = expectedDiners > 0 ? (Number(value) || 0) / expectedDiners : 0;

  const handleApply = () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 10 || parsed > 2000) {
      setError('Enter an expected diner count between 10 and 2000.');
      return;
    }
    adjustExpectedDiners({ date: selectedDate, meal: selectedMeal, value: Math.round(parsed), applyPlanned });
    toast({
      title: 'Forecast recalculated',
      description: `Expected diners set to ${Math.round(parsed)}. Demand quantities were recalculated proportionally.`,
      duration: 4000,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold text-ink">Adjust forecast</DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed text-ink-muted">
            Change the expected number of diners for {MEAL_LABELS[selectedMeal].toLowerCase()} on{' '}
            {selectedDate}. Demand for every dish is recalculated proportionally.
          </DialogDescription>
        </DialogHeader>

        <FormField label="Expected diners" htmlFor="expected-diners" required error={error}>
          <Input
            id="expected-diners"
            type="number"
            min="10"
            max="2000"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            className="h-9 bg-white text-[13px]"
          />
        </FormField>

        {Number(value) > 0 && Number.isFinite(Number(value)) ? (
          <div className="rounded-md border border-line bg-sunken px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Recalculated demand (estimate)
            </p>
            <ul className="mt-2 space-y-1.5">
              {forecast.slice(0, 5).map((item) => (
                <li key={item.dish} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink">{item.dish}</span>
                  <span className="tnum text-ink-muted">
                    ≈ {Math.round(item.expectedDemand * ratio)} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <label className="flex items-start gap-2.5 text-[12.5px] text-ink">
          <Checkbox
            checked={applyPlanned}
            onCheckedChange={(checked) => setApplyPlanned(checked === true)}
            className="mt-0.5"
          />
          <span className="leading-snug">
            Also update planned quantities to match the new forecast
          </span>
        </label>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}