import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Camera, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import ChartPanel from '@/components/ChartPanel';
import KpiCard from '@/components/KpiCard';
import DataTag from '@/components/DataTag';
import StatusIndicator from '@/components/StatusIndicator';
import MealPeriodSelector from '@/components/MealPeriodSelector';
import DateFilter from '@/components/DateFilter';
import QueueFlow from '@/components/QueueFlow';
import FormField from '@/components/FormField';
import PageSkeleton from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { useMessData } from '@/lib/MessDataContext';
import { CROWD_LEVELS, CROWD_META, MEAL_LABELS } from '@/lib/types';
import { formatLongDate, minutesToTime, relativeTimeLabel } from '@/lib/dateUtils';
import { axisProps, CHART, gridProps, tooltipProps, yAxisProps } from '@/lib/chartTheme';
import { cn } from '@/lib/utils';

const SOURCE_LABEL = { simulated: 'Simulated counter data', 'staff-entered': 'Staff observation' };

export default function LiveQueue() {
  const {
    isLoading,
    settings,
    selectedDate,
    selectedMeal,
    setSelectedMeal,
    setSelectedDate,
    selectedServiceState,
    selectedWindow,
    queueData,
    addManualObservation,
    deleteManualObservation,
    setLevelOverride,
    nowMinutes,
    selectedMenuDay,
  } = useMessData();
  const { toast } = useToast();

  const [form, setForm] = useState({
    queueLength: '',
    waitMinutes: '',
    availableSeats: '',
    time: minutesToTime(nowMinutes),
    note: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm((prev) => ({ ...prev, time: minutesToTime(nowMinutes) }));
  }, [nowMinutes]);

  if (isLoading) return <PageSkeleton />;

  const { thresholds, seatCapacity } = settings;
  const thresholdAlert =
    selectedServiceState === 'in-service' && queueData.hasData && !queueData.stale
      ? queueData.waitMinutes >= thresholds.waitMinutes
        ? { tone: 'danger', text: `Waiting time of ${queueData.waitMinutes} minutes has crossed the configured threshold of ${thresholds.waitMinutes} minutes.` }
        : queueData.waitMinutes >= thresholds.waitMinutes * 0.75
          ? { tone: 'warn', text: `Waiting time of ${queueData.waitMinutes} minutes is approaching the configured threshold of ${thresholds.waitMinutes} minutes.` }
          : null
      : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    const queueLength = Number(form.queueLength);
    const waitMinutes = Number(form.waitMinutes);
    const seats = form.availableSeats === '' ? null : Number(form.availableSeats);

    if (form.queueLength === '' || !Number.isFinite(queueLength) || queueLength < 0 || queueLength > 400) {
      next.queueLength = 'Enter the observed queue length (0–400).';
    }
    if (form.waitMinutes === '' || !Number.isFinite(waitMinutes) || waitMinutes < 0 || waitMinutes > 60) {
      next.waitMinutes = 'Enter the current waiting time in minutes (0–60).';
    }
    if (seats !== null && (!Number.isFinite(seats) || seats < 0 || seats > seatCapacity)) {
      next.availableSeats = `Available seats must be between 0 and ${seatCapacity}.`;
    }
    if (!form.time) next.time = 'Enter the observation time.';
    setErrors(next);
    if (Object.keys(next).length) return;

    addManualObservation({
      date: selectedDate,
      meal: selectedMeal,
      time: form.time,
      queueLength: Math.round(queueLength),
      waitMinutes: Math.round(waitMinutes),
      availableSeats: seats === null ? undefined : Math.round(seats),
      note: form.note.trim(),
    });
    setForm({
      queueLength: '',
      waitMinutes: '',
      availableSeats: '',
      time: minutesToTime(nowMinutes),
      note: '',
    });
    toast({
      title: 'Observation recorded',
      description: `Manual queue observation saved for ${MEAL_LABELS[selectedMeal].toLowerCase()} at ${form.time}.`,
      duration: 4000,
    });
  };

  const trend = queueData.series.map((point) => ({
    time: point.time,
    wait: point.waitMinutes,
    queue: point.queueLength,
  }));

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Live Queue"
        subtitle="Queue length, counter activity and seating are separate measurements."
        meta={
          <>
            <DataTag kind="simulated" />
            <DataTag kind="demo" />
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

      {thresholdAlert ? (
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-md border px-4 py-3',
            thresholdAlert.tone === 'danger'
              ? 'border-danger-border bg-danger-soft'
              : 'border-warn-border bg-warn-soft',
          )}
        >
          <AlertTriangle
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0',
              thresholdAlert.tone === 'danger' ? 'text-danger' : 'text-warn',
            )}
          />
          <p className="flex-1 text-[12.5px] leading-relaxed text-ink">
            {thresholdAlert.text}{' '}
            <Link to="/settings" className="font-medium underline decoration-dotted">
              Configure thresholds
            </Link>
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="People inside dining area"
          value={queueData.peopleInside}
          support="Everyone seated, being served and waiting — not the queue length."
          sourceKind={queueData.latestIsManual ? 'staff-entered' : 'simulated'}
        />
        <KpiCard
          label="Waiting in serving queue"
          value={queueData.queueLength}
          support="People waiting to be served at the counter."
          sourceKind={queueData.latestIsManual ? 'staff-entered' : 'simulated'}
        />
        <KpiCard
          label="Estimated waiting time"
          value={queueData.stale ? '—' : queueData.waitMinutes}
          unit={queueData.stale ? undefined : 'min'}
          support={
            queueData.stale
              ? 'Waiting time unavailable for this meal.'
              : 'Derived from the current queue length.'
          }
          sourceKind={queueData.latestIsManual ? 'staff-entered' : 'simulated'}
        />
        <KpiCard
          label="Estimated seating occupancy"
          value={Math.round(queueData.seatOccupancy)}
          unit="%"
          support={`${queueData.availableSeats} of ${seatCapacity} seats free (estimate).`}
          progress={queueData.seatOccupancy / 100}
          sourceKind="simulated"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-line bg-white px-5 py-3">
        <StatusIndicator
          tone={queueData.stale ? 'neutral' : CROWD_META[queueData.level].tone}
          label={`${CROWD_META[queueData.level].label} · ${MEAL_LABELS[selectedMeal]}`}
        />
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Clock className="h-3.5 w-3.5" />
          {queueData.observedAtTime
            ? `Last recorded ${queueData.observedAtTime} · ${SOURCE_LABEL[queueData.latestIsManual ? 'staff-entered' : 'simulated']}`
            : 'No observation recorded for this meal yet'}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Camera className="h-3.5 w-3.5" />
          No camera or sensor integration is connected in this demo.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel
            title="Service flow"
            subtitle="Three distinct stages of the meal service."
            actions={<DataTag kind={queueData.latestIsManual ? 'staff-entered' : 'simulated'} />}
          >
            <QueueFlow queue={queueData} />
          </Panel>

          <ChartPanel
            title="Waiting-time trend"
            subtitle={`Queue waiting time and queue length across the ${MEAL_LABELS[selectedMeal].toLowerCase()} service window.`}
            height={250}
            footer={
              <p className="text-[11.5px] text-ink-muted">
                Simulated counter readings at short intervals. Values are demo data, not live camera
                measurements.
              </p>
            }
          >
            <ComposedChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="time" {...axisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ fontSize: 11.5, paddingTop: 6 }} iconType="line" />
              <Line
                type="monotone"
                dataKey="wait"
                name="Waiting time (min)"
                stroke={CHART.brand}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="queue"
                name="People in queue"
                stroke={CHART.neutral}
                strokeWidth={1.75}
                dot={false}
              />
            </ComposedChart>
          </ChartPanel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Service status"
            subtitle="Sets the crowding level published to students."
          >
            <div className="grid grid-cols-3 gap-2">
              {CROWD_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLevelOverride(selectedDate, selectedMeal, level)}
                  className={cn(
                    'rounded-md border px-2 py-2 text-[12px] font-medium transition-colors',
                    queueData.level === level
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line text-ink-muted hover:bg-sunken hover:text-ink',
                  )}
                >
                  {CROWD_META[level].label.replace(' crowding', '')}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
              Calculated level from current readings: {CROWD_META[queueData.calculatedLevel].label}.
            </p>
            {queueData.hasOverride ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setLevelOverride(selectedDate, selectedMeal, null)}
              >
                Clear manual override
              </Button>
            ) : null}
          </Panel>

          <Panel
            title="Manual observation"
            subtitle="Record what you can see at the counter."
            actions={<DataTag kind="staff-entered" />}
          >
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Observed queue length" htmlFor="obs-queue" required error={errors.queueLength}>
                  <Input
                    id="obs-queue"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.queueLength}
                    onChange={(e) => setForm({ ...form, queueLength: e.target.value })}
                    className="h-9 bg-white text-[13px]"
                  />
                </FormField>
                <FormField label="Current waiting time (min)" htmlFor="obs-wait" required error={errors.waitMinutes}>
                  <Input
                    id="obs-wait"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.waitMinutes}
                    onChange={(e) => setForm({ ...form, waitMinutes: e.target.value })}
                    className="h-9 bg-white text-[13px]"
                  />
                </FormField>
                <FormField
                  label="Available seats (if known)"
                  htmlFor="obs-seats"
                  error={errors.availableSeats}
                >
                  <Input
                    id="obs-seats"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.availableSeats}
                    onChange={(e) => setForm({ ...form, availableSeats: e.target.value })}
                    className="h-9 bg-white text-[13px]"
                  />
                </FormField>
                <FormField label="Observation time" htmlFor="obs-time" required error={errors.time}>
                  <Input
                    id="obs-time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="h-9 bg-white text-[13px]"
                  />
                </FormField>
              </div>
              <FormField label="Note (optional)" htmlFor="obs-note">
                <Input
                  id="obs-note"
                  value={form.note}
                  placeholder="e.g. Extra counter opened for rice"
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
              <Button type="submit" size="sm" className="w-full">
                Save observation
              </Button>
            </form>
          </Panel>

          <Panel
            title="Recent staff observations"
            subtitle={
              selectedWindow
                ? `Manual entries recorded by staff for this meal.`
                : 'Manual entries recorded by staff.'
            }
            flush
          >
            {queueData.manual.length === 0 ? (
              <EmptyState
                compact
                title="No manual observations"
                description="Simulated counter readings are shown until a staff observation is recorded."
              />
            ) : (
              <ul>
                {[...queueData.manual].reverse().map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 border-b border-line px-5 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-ink">
                        {entry.time} · queue {entry.queueLength}, wait {entry.waitMinutes} min
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-ink-muted">
                        {entry.availableSeats != null ? `${entry.availableSeats} seats free · ` : ''}
                        {entry.note || 'No note'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteManualObservation(entry.id)}
                      className="shrink-0 rounded-md px-2 py-1 text-[11.5px] font-medium text-ink-muted transition-colors hover:bg-sunken hover:text-danger"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="About this data" subtitle="What is measured and what is simulated.">
            <ul className="space-y-2 text-[12px] leading-relaxed text-ink-muted">
              <li>Counter readings in this demo are simulated values, refreshed to the demo clock.</li>
              <li>Staff observations override simulated readings for the same meal period.</li>
              <li>Waiting time is derived from the queue length and the number of open counters.</li>
              <li>Seating occupancy is an estimate based on seats free, not a headcount.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}