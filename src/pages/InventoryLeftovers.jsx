import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import ChartPanel from '@/components/ChartPanel';
import DataTag from '@/components/DataTag';
import StatusIndicator from '@/components/StatusIndicator';
import MealPeriodSelector from '@/components/MealPeriodSelector';
import DateFilter from '@/components/DateFilter';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import PageSkeleton from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useMessData } from '@/lib/MessDataContext';
import { MEAL_LABELS, MEAL_PERIODS, UNIT_LABELS } from '@/lib/types';
import { addDaysISO, formatShortDate, todayISO } from '@/lib/dateUtils';
import { dishesFor } from '@/lib/calculations';
import { downloadCsv, toCsv } from '@/lib/csv';
import { axisProps, CHART, gridProps, tooltipProps, yAxisProps } from '@/lib/chartTheme';

const emptyForm = { prepared: '', served: '', remaining: '', plateWaste: '', note: '' };

export default function InventoryLeftovers() {
  const { isLoading, state, foodRows, saveFoodRows, selectedDate, selectedMeal, setSelectedDate, setSelectedMeal } =
    useMessData();
  const { toast } = useToast();

  const mealDishes = dishesFor(selectedMeal);
  const [dish, setDish] = useState(mealDishes[0]?.dish || '');
  const [form, setForm] = useState(emptyForm);
  const [shortage, setShortage] = useState(false);
  const [errors, setErrors] = useState({});

  const [filters, setFilters] = useState({
    meal: 'all',
    from: addDaysISO(todayISO(), -9),
    to: todayISO(),
    dish: '',
    shortagesOnly: false,
  });

  const signature = `${selectedDate}|${selectedMeal}|${dish}`;
  useEffect(() => {
    const record = foodRows.find((row) => row.dish === dish);
    setErrors({});
    if (record && record.recorded) {
      setForm({
        prepared: String(record.prepared ?? ''),
        served: String(record.served ?? ''),
        remaining: String(record.remaining ?? ''),
        plateWaste: record.plateWaste ? String(record.plateWaste) : '',
        note: record.note || '',
      });
      setShortage(!!record.shortage);
    } else {
      setForm(emptyForm);
      setShortage(false);
    }
  }, [signature, foodRows, dish]);

  const activeDish = foodRows.find((row) => row.dish === dish);
  const unit = activeDish?.unit || 'kg';

  const selectedRecords = useMemo(
    () => (state.food || []).filter((r) => r.date === selectedDate && r.meal === selectedMeal),
    [state.food, selectedDate, selectedMeal],
  );

  const totals = useMemo(() => {
    const sum = (predicate, field) =>
      selectedRecords.filter(predicate).reduce((acc, r) => acc + (r[field] || 0), 0);
    return {
      preparedKg: sum((r) => r.unit === 'kg', 'prepared'),
      preparedPieces: sum((r) => r.unit === 'pieces', 'prepared'),
      servedKg: sum((r) => r.unit === 'kg', 'served'),
      servedPieces: sum((r) => r.unit === 'pieces', 'served'),
      leftoverKg: sum((r) => r.unit === 'kg', 'remaining'),
      leftoverPieces: sum((r) => r.unit === 'pieces', 'remaining'),
      plateWasteKg: sum(() => true, 'plateWaste'),
      shortages: selectedRecords.filter((r) => r.shortage).length,
    };
  }, [selectedRecords]);

  const historyRows = useMemo(() => {
    const order = Object.fromEntries(MEAL_PERIODS.map((meal, index) => [meal, index]));
    return (state.food || [])
      .filter((record) => record.date >= filters.from && record.date <= filters.to)
      .filter((record) => filters.meal === 'all' || record.meal === filters.meal)
      .filter((record) => (filters.dish ? record.dish.toLowerCase().includes(filters.dish.toLowerCase()) : true))
      .filter((record) => (filters.shortagesOnly ? record.shortage : true))
      .sort((a, b) => (a.date === b.date ? order[a.meal] - order[b.meal] : a.date < b.date ? 1 : -1));
  }, [state.food, filters]);

  const leftoverChart = useMemo(() => {
    const days = [];
    for (let i = 9; i >= 0; i -= 1) {
      const date = addDaysISO(todayISO(), -i);
      const rows = (state.food || []).filter((r) => r.date === date && r.unit === 'kg');
      days.push({
        label: formatShortDate(date),
        leftover: rows.reduce((sum, r) => sum + (r.remaining || 0), 0),
        waste: rows.reduce((sum, r) => sum + (r.plateWaste || 0), 0),
      });
    }
    return days;
  }, [state.food]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    const prepared = Number(form.prepared);
    const served = Number(form.served);
    const remaining = form.remaining === '' ? Math.max(0, prepared - served) : Number(form.remaining);
    const plateWaste = form.plateWaste === '' ? 0 : Number(form.plateWaste);

    if (form.prepared === '' || !Number.isFinite(prepared) || prepared < 0) {
      next.prepared = 'Enter the quantity prepared.';
    }
    if (form.served !== '' && (!Number.isFinite(served) || served < 0)) {
      next.served = 'Enter a valid served quantity.';
    } else if (Number.isFinite(served) && Number.isFinite(prepared) && served > prepared) {
      next.served = 'Served quantity cannot exceed the quantity prepared.';
    }
    if (!Number.isFinite(remaining) || remaining < 0 || remaining > prepared) {
      next.remaining = 'Unserved leftover must be between 0 and the quantity prepared.';
    }
    if (!Number.isFinite(plateWaste) || plateWaste < 0) {
      next.plateWaste = 'Enter a valid plate-waste quantity.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    saveFoodRows(selectedDate, selectedMeal, [
      {
        ...activeDish,
        dish,
        unit,
        planned: activeDish?.planned ?? 0,
        prepared,
        served: form.served === '' ? Math.max(0, prepared - remaining) : served,
        remaining,
        plateWaste: unit === 'kg' ? plateWaste : 0,
        shortage,
        note: form.note.trim(),
      },
    ]);
    toast({
      title: 'Quantity record saved',
      description: `${dish} for ${MEAL_LABELS[selectedMeal].toLowerCase()} on ${selectedDate} was recorded locally.`,
      duration: 4000,
    });
  };

  const handleExport = () => {
    const columns = [
      { key: 'date', header: 'Date' },
      { key: 'meal', header: 'Meal period', value: (row) => MEAL_LABELS[row.meal] },
      { key: 'dish', header: 'Dish' },
      { key: 'unit', header: 'Unit' },
      { key: 'prepared', header: 'Prepared' },
      { key: 'served', header: 'Served / issued' },
      { key: 'remaining', header: 'Unserved leftover' },
      { key: 'plateWaste', header: 'Plate waste' },
      { key: 'shortage', header: 'Shortage reported', value: (row) => (row.shortage ? 'Yes' : 'No') },
      { key: 'note', header: 'Staff note' },
    ];
    downloadCsv(`messflow-leftovers-${filters.from}-to-${filters.to}.csv`, toCsv(columns, historyRows));
    toast({
      title: 'CSV exported',
      description: `${historyRows.length} visible records downloaded.`,
      duration: 4000,
    });
  };

  if (isLoading) return <PageSkeleton />;

  const conceptCards = [
    {
      label: 'Quantity prepared',
      value: `${totals.preparedKg} kg`,
      detail: `${totals.preparedPieces} pieces recorded`,
    },
    {
      label: 'Served / issued',
      value: `${totals.servedKg} kg`,
      detail: `${totals.servedPieces} pieces issued at the counter`,
    },
    {
      label: 'Unserved leftover',
      value: `${totals.leftoverKg} kg`,
      detail: `${totals.leftoverPieces} pieces not served`,
    },
    {
      label: 'Reported shortages',
      value: totals.shortages,
      detail: totals.shortages ? 'Dishes that ran short during service' : 'No shortage reported',
    },
    {
      label: 'Plate waste',
      value: `${totals.plateWasteKg} kg`,
      detail: 'Measured separately at the wash area',
    },
  ];

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span className="tnum whitespace-nowrap">{formatShortDate(row.date)}</span>,
    },
    { key: 'meal', header: 'Meal', render: (row) => MEAL_LABELS[row.meal] },
    { key: 'dish', header: 'Dish', render: (row) => <span className="font-medium text-ink">{row.dish}</span> },
    {
      key: 'prepared',
      header: 'Prepared',
      align: 'right',
      render: (row) => <span className="tnum">{row.prepared} {UNIT_LABELS[row.unit]}</span>,
    },
    {
      key: 'remaining',
      header: 'Left over',
      align: 'right',
      render: (row) => <span className="tnum">{row.remaining} {UNIT_LABELS[row.unit]}</span>,
    },
    {
      key: 'shortage',
      header: 'Shortage',
      align: 'center',
      render: (row) =>
        row.shortage ? (
          <StatusIndicator tone="danger" label="Reported" size="sm" />
        ) : (
          <span className="text-[12px] text-ink-muted">None</span>
        ),
    },
    {
      key: 'note',
      header: 'Staff note',
      render: (row) => <span className="text-[12.5px] text-ink-muted">{row.note || '—'}</span>,
    },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Inventory & Leftovers"
        subtitle="Prepared, served, unserved and wasted quantities are recorded as separate values."
        meta={
          <>
            <DataTag kind="staff-entered" />
            <span className="text-[12px] text-ink-muted">
              {formatShortDate(selectedDate)} · {MEAL_LABELS[selectedMeal]}
            </span>
          </>
        }
        actions={
          <>
            <DateFilter value={selectedDate} onChange={setSelectedDate} />
            <MealPeriodSelector value={selectedMeal} onChange={setSelectedMeal} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {conceptCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-line bg-white px-4 py-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {card.label}
            </p>
            <p className="tnum mt-2 text-[22px] font-semibold leading-none text-ink">{card.value}</p>
            <p className="mt-2 text-[11px] leading-snug text-ink-muted">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-line bg-white px-4 py-3">
        <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-info" />
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Unserved leftover is food prepared but not served. Plate waste is measured separately at the
          wash area and is never counted as leftover. Nothing here is presented as verified waste
          reduction.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title="Record quantities"
          subtitle="Enter what the kitchen prepared and issued for a dish."
          actions={<DataTag kind="staff-entered" />}
        >
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <FormField label="Dish" htmlFor="record-dish" required>
              <Select
                value={dish}
                onValueChange={(value) => {
                  setDish(value);
                  setForm(emptyForm);
                }}
              >
                <SelectTrigger id="record-dish" className="h-9 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealDishes.map((model) => (
                    <SelectItem key={model.dish} value={model.dish}>
                      {model.dish} ({model.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {activeDish?.recorded ? (
              <p className="rounded border border-line bg-sunken px-2.5 py-2 text-[11.5px] text-ink-muted">
                Updating the existing record for {dish}.
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <FormField label={`Prepared (${unit})`} htmlFor="record-prepared" required error={errors.prepared}>
                <Input
                  id="record-prepared"
                  type="number"
                  min="0"
                  value={form.prepared}
                  onChange={(e) => {
                    const prepared = e.target.value;
                    const served = form.served === '' ? null : Number(form.served);
                    setForm({
                      ...form,
                      prepared,
                      remaining: served === null ? form.remaining : String(Math.max(0, Number(prepared || 0) - served)),
                    });
                  }}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
              <FormField label={`Served / issued (${unit})`} htmlFor="record-served" error={errors.served}>
                <Input
                  id="record-served"
                  type="number"
                  min="0"
                  value={form.served}
                  onChange={(e) => {
                    const served = e.target.value;
                    setForm({
                      ...form,
                      served,
                      remaining: String(Math.max(0, Number(form.prepared || 0) - Number(served || 0))),
                    });
                  }}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label={`Unserved leftover (${unit})`}
                htmlFor="record-remaining"
                error={errors.remaining}
                hint="Suggested from prepared minus served."
              >
                <Input
                  id="record-remaining"
                  type="number"
                  min="0"
                  value={form.remaining}
                  onChange={(e) => setForm({ ...form, remaining: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
              <FormField
                label="Plate waste (kg)"
                htmlFor="record-waste"
                error={errors.plateWaste}
                hint={unit === 'kg' ? 'Weighed separately, if measured.' : 'Not tracked for piece items.'}
              >
                <Input
                  id="record-waste"
                  type="number"
                  min="0"
                  step="0.1"
                  disabled={unit !== 'kg'}
                  value={form.plateWaste}
                  onChange={(e) => setForm({ ...form, plateWaste: e.target.value })}
                  className="h-9 bg-white text-[13px] disabled:bg-sunken"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
              <div>
                <p className="text-[12.5px] font-medium text-ink">Shortage reported</p>
                <p className="text-[11px] text-ink-muted">The dish ran short during service.</p>
              </div>
              <Switch checked={shortage} onCheckedChange={setShortage} />
            </div>

            <FormField label="Staff note (optional)" htmlFor="record-note">
              <Input
                id="record-note"
                value={form.note}
                placeholder="e.g. Rice held back for late shift"
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="h-9 bg-white text-[13px]"
              />
            </FormField>

            <Button type="submit" size="sm" className="w-full">
              Save record
            </Button>
          </form>
        </Panel>

        <div className="space-y-4 xl:col-span-2">
          <ChartPanel
            title="Recorded unserved leftovers"
            subtitle="Unserved leftover and separately measured plate waste per day (kg, all meals)."
            height={240}
            footer={
              <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Unserved leftover (staff record)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#B9BDB4]" /> Plate waste (separately measured)
                </span>
              </div>
            }
          >
            <BarChart data={leftoverChart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="leftover" name="Unserved leftover (kg)" fill={CHART.brand} radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey="waste" name="Plate waste (kg)" fill={CHART.neutral} radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ChartPanel>

          <Panel
            title="Recorded history"
            subtitle="Filter the log or export the visible records."
            actions={
              <>
                <DataTag kind="recorded" />
                <Button size="sm" variant="outline" onClick={handleExport} disabled={!historyRows.length}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </>
            }
            flush
          >
            <div className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-3.5">
              <FormField label="From" htmlFor="filter-from" className="w-[140px]">
                <Input
                  id="filter-from"
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value || filters.from })}
                  className="h-8 bg-white text-[12.5px]"
                />
              </FormField>
              <FormField label="To" htmlFor="filter-to" className="w-[140px]">
                <Input
                  id="filter-to"
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value || filters.to })}
                  className="h-8 bg-white text-[12.5px]"
                />
              </FormField>
              <FormField label="Meal period" htmlFor="filter-meal" className="w-[150px]">
                <Select value={filters.meal} onValueChange={(value) => setFilters({ ...filters, meal: value })}>
                  <SelectTrigger id="filter-meal" className="h-8 bg-white text-[12.5px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All meals</SelectItem>
                    {MEAL_PERIODS.map((meal) => (
                      <SelectItem key={meal} value={meal}>
                        {MEAL_LABELS[meal]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Dish search" htmlFor="filter-dish" className="w-[170px]">
                <Input
                  id="filter-dish"
                  value={filters.dish}
                  placeholder="e.g. rice"
                  onChange={(e) => setFilters({ ...filters, dish: e.target.value })}
                  className="h-8 bg-white text-[12.5px]"
                />
              </FormField>
              <label className="mb-1 flex items-center gap-2 text-[12.5px] text-ink">
                <Switch
                  checked={filters.shortagesOnly}
                  onCheckedChange={(checked) => setFilters({ ...filters, shortagesOnly: checked })}
                  className="scale-90"
                />
                Shortages only
              </label>
            </div>

            <DataTable
              columns={columns}
              rows={historyRows}
              minWidth={880}
              empty={
                <EmptyState
                  compact
                  title="No records match these filters"
                  description="Widen the date range or clear the dish search to see more recorded quantities."
                />
              }
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}