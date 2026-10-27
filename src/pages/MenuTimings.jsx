import { useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import DataTag from '@/components/DataTag';
import PageSkeleton from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useMessData } from '@/lib/MessDataContext';
import { DAY_KEYS, DAY_LABELS, MEAL_LABELS, MEAL_PERIODS } from '@/lib/types';
import { todayISO, weekdayKey } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

const blankDish = () => ({ id: `dish-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, name: '', veg: true });

export default function MenuTimings() {
  const { isLoading, menu, saveMenuDay, nowMinutes } = useMessData();
  const { toast } = useToast();

  const todayKey = weekdayKey(todayISO());
  const [day, setDay] = useState(todayKey);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(menu[day])));
  }, [day, menu]);

  const dirty = useMemo(
    () => draft && JSON.stringify(draft) !== JSON.stringify(menu[day]),
    [draft, menu, day],
  );

  if (isLoading || !draft) return <PageSkeleton />;

  const updateMeal = (meal, patch) =>
    setDraft((prev) => ({ ...prev, [meal]: { ...prev[meal], ...patch } }));

  const updateItem = (meal, itemId, patch) =>
    setDraft((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        items: prev[meal].items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      },
    }));

  const addItem = (meal) =>
    setDraft((prev) => ({ ...prev, [meal]: { ...prev[meal], items: [...prev[meal].items, blankDish()] } }));

  const removeItem = (meal, itemId) =>
    setDraft((prev) => ({
      ...prev,
      [meal]: { ...prev[meal], items: prev[meal].items.filter((item) => item.id !== itemId) },
    }));

  const handleSave = () => {
    const cleaned = {};
    MEAL_PERIODS.forEach((meal) => {
      cleaned[meal] = {
        ...draft[meal],
        items: draft[meal].items.filter((item) => item.name.trim()).map((item) => ({ ...item, name: item.name.trim() })),
      };
    });
    saveMenuDay(day, cleaned);
    toast({
      title: 'Menu saved',
      description: `${DAY_LABELS[day]} is updated and visible in the student portal.`,
      duration: 4000,
    });
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Menu & Timings"
        subtitle="Maintain the weekly menu, service windows and per-meal notices."
        meta={
          <>
            <DataTag kind="staff-entered" />
            <span className="text-[12px] text-ink-muted">
              Changes save to this browser and appear immediately in the student portal.
            </span>
          </>
        }
        actions={
          <>
            {dirty ? (
              <Button size="sm" variant="outline" onClick={() => setDraft(JSON.parse(JSON.stringify(menu[day])))}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Discard
              </Button>
            ) : null}
            <Button size="sm" onClick={handleSave} disabled={!dirty}>
              Save changes
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-1 border-b border-line">
        {DAY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setDay(key)}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition-colors',
              day === key
                ? 'border-brand font-medium text-brand'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {DAY_LABELS[key]}
            {key === todayKey ? <span className="h-1.5 w-1.5 rounded-full bg-brand" /> : null}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {MEAL_PERIODS.map((meal) => (
              <Panel
                key={meal}
                title={MEAL_LABELS[meal]}
                subtitle={meal === 'lunch' ? 'Main service of the day' : undefined}
                actions={<DataTag kind="staff-entered" />}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11.5px] font-medium text-ink" htmlFor={`${meal}-start`}>
                      Service starts
                    </label>
                    <Input
                      id={`${meal}-start`}
                      type="time"
                      value={draft[meal].start}
                      onChange={(e) => updateMeal(meal, { start: e.target.value })}
                      className="h-8 bg-white text-[12.5px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11.5px] font-medium text-ink" htmlFor={`${meal}-end`}>
                      Service ends
                    </label>
                    <Input
                      id={`${meal}-end`}
                      type="time"
                      value={draft[meal].end}
                      onChange={(e) => updateMeal(meal, { end: e.target.value })}
                      className="h-8 bg-white text-[12.5px]"
                    />
                  </div>
                </div>

                <div className="mt-3.5 space-y-2">
                  {draft[meal].items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        aria-label={`${MEAL_LABELS[meal]} dish name`}
                        value={item.name}
                        placeholder="Dish name"
                        onChange={(e) => updateItem(meal, item.id, { name: e.target.value })}
                        className="h-8 flex-1 bg-white text-[12.5px]"
                      />
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-ink-muted">
                        Veg
                        <Switch
                          checked={item.veg}
                          onCheckedChange={(checked) => updateItem(meal, item.id, { veg: checked })}
                          className="scale-90"
                        />
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(meal, item.id)}
                        aria-label={`Remove ${item.name || 'dish'}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sunken hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button size="sm" variant="outline" className="mt-3" onClick={() => addItem(meal)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add dish
                </Button>

                <div className="mt-3.5">
                  <label className="mb-1.5 block text-[11.5px] font-medium text-ink" htmlFor={`${meal}-notice`}>
                    Special notice for this meal
                  </label>
                  <Input
                    id={`${meal}-notice`}
                    value={draft[meal].notice}
                    placeholder="Optional — shown to students"
                    onChange={(e) => updateMeal(meal, { notice: e.target.value })}
                    className="h-8 bg-white text-[12.5px]"
                  />
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Panel
            title="Student preview"
            subtitle={`${DAY_LABELS[day]} as students see it. Unsaved edits appear here.`}
            actions={<DataTag kind="demo" />}
          >
            <div className="space-y-4">
              {MEAL_PERIODS.map((meal) => (
                <div key={meal} className="border-b border-line pb-3.5 last:border-b-0 last:pb-0">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[13px] font-semibold text-ink">{MEAL_LABELS[meal]}</p>
                    <p className="tnum text-[11.5px] text-ink-muted">
                      {draft[meal].start}–{draft[meal].end}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {draft[meal].items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                        <span className={item.name.trim() ? 'text-ink' : 'text-ink-muted italic'}>
                          {item.name.trim() || 'Unnamed dish'}
                        </span>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em]',
                            item.veg ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn',
                          )}
                        >
                          {item.veg ? 'Veg' : 'Non-veg'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {draft[meal].notice ? (
                    <p className="mt-2 rounded border border-line bg-sunken px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-muted">
                      {draft[meal].notice}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Timing guidance" subtitle="Service windows drive the demo clock states.">
            <ul className="space-y-2 text-[12px] leading-relaxed text-ink-muted">
              <li>Students see the current meal period derived from these timings.</li>
              <li>Queue and attendance records are grouped by the same meal periods.</li>
              <li>
                Demo clock is currently {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:
                {String(nowMinutes % 60).padStart(2, '0')} — adjust it under Settings.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}