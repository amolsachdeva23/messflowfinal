import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import ChartPanel from '@/components/ChartPanel';
import KpiCard from '@/components/KpiCard';
import DataTag from '@/components/DataTag';
import StatusIndicator from '@/components/StatusIndicator';
import MealPeriodSelector from '@/components/MealPeriodSelector';
import DateFilter from '@/components/DateFilter';
import DataTable from '@/components/DataTable';
import AlertItem from '@/components/AlertItem';
import QuantityUpdateDialog from '@/components/QuantityUpdateDialog';
import PageSkeleton from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useMessData } from '@/lib/MessDataContext';
import { MEAL_LABELS } from '@/lib/types';
import { formatLongDate, formatShortDate } from '@/lib/dateUtils';
import { foodStatus } from '@/lib/calculations';
import { axisProps, CHART, gridProps, tooltipProps, yAxisProps } from '@/lib/chartTheme';

const SERVICE_STATE_LABEL = {
  'in-service': 'In service',
  upcoming: 'Service not started',
  ended: 'Service ended',
};

export default function Overview() {
  const {
    isLoading,
    settings,
    selectedDate,
    selectedMeal,
    setSelectedMeal,
    setSelectedDate,
    selectedWindow,
    selectedServiceState,
    selectedAttendance,
    expectedDiners,
    servedDiners,
    comparable,
    foodRows,
    remainingKg,
    queueData,
    activitySeries,
    quality,
    forecast,
    forecastFactors,
    alerts,
    dismissAlert,
  } = useMessData();

  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;

  const percentServed = expectedDiners ? Math.round((servedDiners / expectedDiners) * 100) : 0;
  const deltaValue = comparable ? expectedDiners - comparable.served : null;

  const columns = [
    {
      key: 'dish',
      header: 'Dish',
      render: (row) => (
        <span className="font-medium text-ink">
          {row.dish}
          <span className="ml-2 text-[11.5px] font-normal text-ink-muted">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'planned',
      header: 'Planned',
      align: 'right',
      render: (row) => <span className="tnum">{row.planned}</span>,
    },
    {
      key: 'prepared',
      header: 'Prepared',
      align: 'right',
      render: (row) => <span className="tnum">{row.prepared}</span>,
    },
    {
      key: 'remaining',
      header: 'Remaining',
      align: 'right',
      render: (row) => <span className="tnum">{row.remaining}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => {
        const status = foodStatus(row);
        return <StatusIndicator tone={status.tone} label={status.label} size="sm" />;
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Mess Overview"
        subtitle="Monitor dining activity and plan today's service."
        meta={
          <>
            <DataTag kind="demo" />
            <span className="text-[12px] text-ink-muted">
              {formatLongDate(selectedDate)} · {settings.activeMess}
            </span>
          </>
        }
        actions={
          <>
            <DateFilter value={selectedDate} onChange={setSelectedDate} />
            <MealPeriodSelector value={selectedMeal} onChange={setSelectedMeal} />
            <Link
              to="/student"
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-[12.5px] font-medium text-ink transition-colors hover:bg-sunken"
            >
              Student View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-line bg-white px-5 py-3">
        <StatusIndicator
          tone={
            selectedServiceState === 'in-service'
              ? 'ok'
              : selectedServiceState === 'upcoming'
                ? 'info'
                : 'neutral'
          }
          label={`${MEAL_LABELS[selectedMeal]} · ${SERVICE_STATE_LABEL[selectedServiceState]}`}
        />
        {selectedWindow ? (
          <span className="text-[12px] text-ink-muted">
            Service window {selectedWindow.start}–{selectedWindow.end}
          </span>
        ) : null}
        <span className="text-[12px] text-ink-muted">
          Recorded for this meal: {servedDiners} served
          {selectedAttendance?.partial ? ' so far' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Estimated diners"
          value={expectedDiners}
          support="Expected this meal."
          delta={
            deltaValue === null
              ? 'No comparable service recorded yet'
              : `${deltaValue >= 0 ? '+' : ''}${deltaValue} vs ${formatShortDate(comparable.date)} ${MEAL_LABELS[selectedMeal].toLowerCase()} (${comparable.served} served)`
          }
          deltaTone={deltaValue > 0 ? 'up' : deltaValue < 0 ? 'down' : 'neutral'}
          sourceKind="estimated"
        />
        <KpiCard
          label="Meals served"
          value={servedDiners}
          support={`${percentServed}% of expected diners.`}
          progress={percentServed / 100}
          sourceKind={selectedServiceState === 'in-service' ? 'simulated' : 'recorded'}
          sourceLabel={selectedServiceState === 'in-service' ? 'Simulated' : undefined}
        />
        <KpiCard
          label="Estimated waiting time"
          value={queueData.stale ? '—' : queueData.waitMinutes}
          unit={queueData.stale ? undefined : 'min'}
          support={
            queueData.stale
              ? 'Waiting time unavailable — no current observation.'
              : 'Based on current service activity.'
          }
          delta={
            queueData.hasData && queueData.observedAtTime
              ? `Last observation ${queueData.observedAtTime}`
              : 'No observation recorded for this meal'
          }
          sourceKind="simulated"
        />
        <KpiCard
          label="Food remaining"
          value={remainingKg}
          unit="kg"
          support="Across tracked dishes. Staff-entered estimates, not measured weights."
          sourceKind="staff-entered"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartPanel
          className="lg:col-span-2"
          title={`Dining activity · ${MEAL_LABELS[selectedMeal]}`}
          subtitle="Meals served each day for this meal period compared with the expected turnout."
          height={252}
          footer={
            <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-[2px] w-4 rounded-full bg-brand" /> Meals served (recorded /
                simulated counter)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-[2px] w-4 rounded-full bg-[#B9BDB4]" /> Expected diners (forecast
                estimate)
              </span>
            </div>
          }
        >
          <AreaChart data={activitySeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="servedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.16} />
                <stop offset="100%" stopColor={CHART.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Area
              type="monotone"
              dataKey="served"
              name="Meals served"
              stroke={CHART.brand}
              strokeWidth={2}
              fill="url(#servedFill)"
            />
            <Line
              type="monotone"
              dataKey="expected"
              name="Expected diners"
              stroke={CHART.neutral}
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ChartPanel>

        <Panel
          title="Demand forecast"
          subtitle="Preparation estimate for the selected meal period."
          actions={<DataTag kind="estimated" />}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Expected diners
              </p>
              <p className="tnum mt-1 text-[28px] font-semibold leading-none text-ink">
                {expectedDiners}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Forecast quality
              </p>
              <p className="mt-1 text-[13px] font-medium text-brand">{quality.level}</p>
              <p className="text-[11px] text-ink-muted">
                {quality.sampleSize} comparable meal{quality.sampleSize === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
            {forecast.map((item) => (
              <li key={item.dish} className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink">{item.dish}</span>
                <span className="tnum text-ink-muted">
                  {item.expectedDemand} {item.unit}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-md border border-line bg-sunken px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Factors considered
            </p>
            <ul className="mt-2 space-y-1.5">
              {forecastFactors.map((factor) => (
                <li key={factor} className="flex gap-2 text-[11.5px] leading-relaxed text-ink-muted">
                  <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ink-muted/50" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
            Demo estimate calculated from recorded meal history. No live model or camera feed is
            connected.
          </p>
        </Panel>
      </div>

      <Panel
        title="Needs attention"
        subtitle="Conditions that may need a decision for this meal period."
        actions={<DataTag kind="demo" />}
      >
        {alerts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            compact
            title="Nothing needs attention"
            description="No threshold breaches, shortages or unusual demand for this meal period."
          />
        ) : (
          <ul className="space-y-2.5">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onDismiss={dismissAlert} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Food preparation summary"
        subtitle="Tracked staple dish groups for this meal period. Quantities are staff-entered."
        actions={
          <>
            <DataTag kind="staff-entered" />
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              Update quantities
            </Button>
          </>
        }
        flush
      >
        <DataTable
          columns={columns}
          rows={foodRows}
          empty={<EmptyState title="No quantity records" description="Nothing has been recorded for this meal period yet." compact />}
        />
      </Panel>

      <QuantityUpdateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}