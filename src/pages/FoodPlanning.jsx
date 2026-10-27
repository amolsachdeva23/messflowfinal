import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import ChartPanel from '@/components/ChartPanel';
import DataTag from '@/components/DataTag';
import StatusIndicator from '@/components/StatusIndicator';
import MealPeriodSelector from '@/components/MealPeriodSelector';
import DateFilter from '@/components/DateFilter';
import PageSkeleton from '@/components/PageSkeleton';
import AdjustForecastDialog from '@/components/AdjustForecastDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useMessData } from '@/lib/MessDataContext';
import { MEAL_LABELS } from '@/lib/types';
import { formatLongDate, formatShortDate } from '@/lib/dateUtils';
import { foodStatus } from '@/lib/calculations';
import { axisProps, CHART, gridProps, tooltipProps, yAxisProps } from '@/lib/chartTheme';

export default function FoodPlanning() {
  const {
    isLoading,
    selectedDate,
    selectedMeal,
    setSelectedMeal,
    setSelectedDate,
    expectedDiners,
    servedDiners,
    comparable,
    quality,
    foodRows,
    saveFoodRows,
    adjustExpectedDiners,
    selectedServiceState,
    activitySeries,
  } = useMessData();
  const { toast } = useToast();

  const [draft, setDraft] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const signature = `${selectedDate}|${selectedMeal}`;
  useEffect(() => {
    const next = {};
    foodRows.forEach((row) => {
      next[row.dish] = { planned: row.planned, prepared: row.prepared };
    });
    setDraft(next);
  }, [signature, foodRows]);

  const comparableServed = comparable ? comparable.served : null;
  const delta = comparableServed !== null ? expectedDiners - comparableServed : null;

  const dirty = useMemo(
    () =>
      foodRows.some((row) => {
        const entry = draft[row.dish];
        if (!entry) return false;
        return Number(entry.planned) !== Number(row.planned) || Number(entry.prepared) !== Number(row.prepared);
      }),
    [draft, foodRows],
  );

  const setField = (dish, field, value) =>
    setDraft((prev) => ({ ...prev, [dish]: { ...prev[dish], [field]: value } }));

  const handleSave = () => {
    const rows = foodRows.map((row) => {
      const entry = draft[row.dish] || {};
      const prepared = Number(entry.prepared) || 0;
      return {
        ...row,
        planned: Number(entry.planned) || 0,
        prepared,
        remaining: Math.max(0, prepared - (row.served || 0)),
      };
    });
    saveFoodRows(selectedDate, selectedMeal, rows);
    toast({
      title: 'Planning saved',
      description: `${MEAL_LABELS[selectedMeal]} quantities for ${selectedDate} were saved to this browser.`,
      duration: 4000,
    });
  };

  const handleReset = () => {
    const next = {};
    foodRows.forEach((row) => {
      next[row.dish] = { planned: row.planned, prepared: row.prepared };
    });
    setDraft(next);
    toast({ title: 'Changes discarded', description: 'Quantities are back to the last saved values.', duration: 4000 });
  };

  const trend = useMemo(
    () =>
      activitySeries.map((point) => ({
        label: point.label,
        served: point.served,
        expected: point.expected,
      })),
    [activitySeries],
  );

  if (isLoading) return <PageSkeleton />;

  const stats = [
    {
      label: 'Expected diners',
      value: expectedDiners,
      detail: 'Forecast estimate for this service',
      action: (
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          Adjust forecast
        </Button>
      ),
    },
    {
      label: 'Actual attendance',
      value: selectedServiceState === 'upcoming' ? 'Not yet recorded' : servedDiners,
      detail:
        selectedServiceState === 'in-service'
          ? 'Recorded so far — service in progress'
          : selectedServiceState === 'upcoming'
            ? 'Service has not started'
            : 'Recorded at the counter',
    },
    {
      label: 'Forecast vs previous',
      value: delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta}`,
      detail: comparable
        ? `Against ${formatShortDate(comparable.date)} ${MEAL_LABELS[selectedMeal].toLowerCase()} (${comparable.served} served)`
        : 'No comparable service recorded',
    },
    {
      label: 'Forecast quality',
      value: quality.level,
      detail: `${quality.sampleSize} comparable meal${quality.sampleSize === 1 ? '' : 's'} · demo estimate`,
    },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Food Planning"
        subtitle="Plan quantities against the expected turnout, then record what was actually prepared."
        meta={
          <>
            <DataTag kind="estimated" />
            <span className="text-[12px] text-ink-muted">
              {formatLongDate(selectedDate)} · {MEAL_LABELS[selectedMeal]}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col justify-between rounded-lg border border-line bg-white px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                {stat.label}
              </p>
              <p className="tnum mt-2 text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink">
                {stat.value}
              </p>
              <p className="mt-2 text-[11.5px] leading-snug text-ink-muted">{stat.detail}</p>
            </div>
            {stat.action ? <div className="mt-3">{stat.action}</div> : null}
          </div>
        ))}
      </div>

      <Panel
        title="Preparation plan"
        subtitle="Tracked staple dish groups. Quantities are estimates, not cooking instructions."
        actions={
          <>
            <DataTag kind="staff-entered" />
            {dirty ? (
              <>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save changes
                </Button>
              </>
            ) : null}
          </>
        }
        flush
      >
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full border-collapse" style={{ minWidth: 860 }}>
            <thead>
              <tr className="border-b border-line">
                {['Dish', 'Expected demand', 'Planned', 'Prepared', 'Served', 'Remaining', 'Status'].map(
                  (header, index) => (
                    <th
                      key={header}
                      className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted ${
                        index === 0 ? 'text-left' : index === 6 ? 'text-right' : 'text-right'
                      }`}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {foodRows.map((row) => {
                const entry = draft[row.dish] || { planned: row.planned, prepared: row.prepared };
                const prepared = Number(entry.prepared) || 0;
                const remaining = Math.max(0, prepared - (row.served || 0));
                const status = foodStatus({ ...row, prepared, remaining });
                return (
                  <tr key={row.dish} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] font-medium text-ink">{row.dish}</span>
                      <span className="ml-2 text-[11.5px] text-ink-muted">{row.unit}</span>
                    </td>
                    <td className="tnum px-4 py-2.5 text-right text-[13px] text-ink-muted">
                      {row.expectedDemand}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        aria-label={`Planned quantity for ${row.dish}`}
                        type="number"
                        min="0"
                        value={entry.planned ?? ''}
                        onChange={(e) => setField(row.dish, 'planned', e.target.value)}
                        className="tnum ml-auto h-8 w-[92px] bg-white text-right text-[12.5px]"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        aria-label={`Prepared quantity for ${row.dish}`}
                        type="number"
                        min="0"
                        value={entry.prepared ?? ''}
                        onChange={(e) => setField(row.dish, 'prepared', e.target.value)}
                        className="tnum ml-auto h-8 w-[92px] bg-white text-right text-[12.5px]"
                      />
                    </td>
                    <td className="tnum px-4 py-2.5 text-right text-[13px] text-ink">{row.served}</td>
                    <td className="tnum px-4 py-2.5 text-right text-[13px] text-ink">{remaining}</td>
                    <td className="px-4 py-2.5 text-right">
                      <StatusIndicator tone={status.tone} label={status.label} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartPanel
          className="lg:col-span-2"
          title={`Demand trend · ${MEAL_LABELS[selectedMeal]}`}
          subtitle="Recorded attendance against the forecast expectation for the last seven days."
          height={250}
          footer={
            <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Recorded attendance
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-[2px] w-4 rounded-full bg-[#B9BDB4]" /> Forecast expectation (estimate)
              </span>
            </div>
          }
        >
          <ComposedChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="served" name="Recorded attendance" fill={CHART.brand} radius={[3, 3, 0, 0]} barSize={22} />
            <Line
              type="monotone"
              dataKey="expected"
              name="Forecast expectation"
              stroke={CHART.neutral}
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ChartPanel>

        <Panel
          title="What influences this estimate"
          subtitle="Factors applied to the demo forecast."
          actions={<Info className="h-4 w-4 text-ink-muted" />}
        >
          <ul className="space-y-2.5">
            {[
              'Previous attendance for the same meal period',
              'Day of the week patterns',
              'Meal type and its usual turnout',
              'Menu composition for the day',
              'Holidays and recorded campus events',
            ].map((factor) => (
              <li key={factor} className="flex gap-2 text-[12.5px] leading-relaxed text-ink">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ink-muted/50" />
                {factor}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-muted">
            Preparation recommendations are estimates based on recorded history. They are not
            automatic cooking instructions and no live model is connected.
          </p>
        </Panel>
      </div>

      <AdjustForecastDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}