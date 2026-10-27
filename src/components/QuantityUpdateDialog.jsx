import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import FormField from '@/components/FormField';
import { useMessData } from '@/lib/MessDataContext';
import { MEAL_LABELS } from '@/lib/types';

/** Edit prepared / remaining quantities for the selected meal. */
export default function QuantityUpdateDialog({ open, onOpenChange }) {
  const { foodRows, selectedDate, selectedMeal, saveFoodRows } = useMessData();
  const { toast } = useToast();
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (open) {
      const next = {};
      foodRows.forEach((row) => {
        next[row.dish] = { prepared: row.prepared, remaining: row.remaining, unit: row.unit };
      });
      setDraft(next);
    }
  }, [open, foodRows]);

  const setField = (dish, field, value) =>
    setDraft((prev) => ({ ...prev, [dish]: { ...prev[dish], [field]: value } }));

  const handleSave = () => {
    const rows = foodRows
      .map((row) => {
        const entry = draft[row.dish] || {};
        const prepared = Number(entry.prepared) || 0;
        const remaining = Number(entry.remaining) || 0;
        return {
          ...row,
          prepared,
          remaining,
          served: Math.max(0, prepared - remaining),
        };
      })
      .filter((row) => row.recorded || row.prepared > 0 || row.remaining > 0);

    saveFoodRows(selectedDate, selectedMeal, rows);
    toast({
      title: 'Quantities updated',
      description: `${MEAL_LABELS[selectedMeal]} quantities for ${selectedDate} were saved locally.`,
      duration: 4000,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold text-ink">Update quantities</DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed text-ink-muted">
            Enter the kitchen's latest figures for {MEAL_LABELS[selectedMeal].toLowerCase()} on{' '}
            {selectedDate}. Remaining quantities are staff estimates, not measured weights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {foodRows.map((row) => (
            <div
              key={row.dish}
              className="grid grid-cols-[1fr_96px_96px] items-end gap-3 rounded-md border border-line px-3 py-2.5"
            >
              <div>
                <p className="text-[12.5px] font-medium text-ink">{row.dish}</p>
                <p className="text-[11px] text-ink-muted">Planned {row.planned} {row.unit}</p>
              </div>
              <FormField label={`Prepared (${row.unit})`} htmlFor={`prepared-${row.dish}`}>
                <Input
                  id={`prepared-${row.dish}`}
                  type="number"
                  min="0"
                  value={draft[row.dish]?.prepared ?? ''}
                  onChange={(e) => setField(row.dish, 'prepared', e.target.value)}
                  className="h-8 bg-white text-[12.5px]"
                />
              </FormField>
              <FormField label={`Remaining (${row.unit})`} htmlFor={`remaining-${row.dish}`}>
                <Input
                  id={`remaining-${row.dish}`}
                  type="number"
                  min="0"
                  value={draft[row.dish]?.remaining ?? ''}
                  onChange={(e) => setField(row.dish, 'remaining', e.target.value)}
                  className="h-8 bg-white text-[12.5px]"
                />
              </FormField>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Label className="mr-auto text-[11.5px] font-normal text-ink-muted">
            Saved to this browser only (demo data).
          </Label>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save quantities
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}