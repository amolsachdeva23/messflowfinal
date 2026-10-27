import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import ChartPanel from '@/components/ChartPanel';
import DataTag from '@/components/DataTag';
import FormField from '@/components/FormField';
import PageSkeleton from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useMessData } from '@/lib/MessDataContext';
import { MEAL_LABELS, MEAL_PERIODS } from '@/lib/types';
import { addDaysISO, datesBetween, formatShortDate, todayISO } from '@/lib/dateUtils';
import { downloadCsv, toCsv } from '@/lib/csv';
import { axisProps, CHART, gridProps, tooltipProps, yAxisProps } from '@/lib/chartTheme';

export default function Analytics() {
  const { isLoading, state } = useMessData();
  const { toast } = useToast();

  const [rangeDays, setRangeDays] = useState('14');
  const [mealFilter, setMealFilter] = useState('all');
  const [from, setFrom] = useState(addDaysISO(todayISO(), -13));
  const [to, setTo] = useState(todayISO());

  const meals = mealFilter === 'all' ? MEAL_PERIODS : [mealFilter];
  const dates = useMemo(() => datesBetween(from, to), [from, to]);

  const report = useMemo(() => {
    const attendance = (state.attendance || []).filter(
      (r) => dates.includes(r.date) && meals.includes(r.meal),
    );
    const food = (state.food || []).filter(
      (r) => dates.includes(r.date) && meals.includes(r.meal),
    );
    const queue = (state.queue || []).filter(
      (o) => dates.includes(o.date) && meals.includes(o.meal),
    );

    const rows = dates.map((date) => {
      const att = attendance.filter((r) => r.date === date);
      const expected = att.reduce((sum, r) => sum + (r.expected || 0), 0);
      const served = att.reduce((sum, r) => sum + (r.served || 0), 0);
      const leftovers = food
        .filter((r) => r.date === date && r.unit === 'kg')
        .reduce((sum, r) => sum + (r.remaining || 0), 0);
      const waste = food.filter((r) => r.date === date).reduce((sum, r) => sum + (r.plateWaste || 0), 0);
      const waitReadings = queue.filter((o) => o.date === date).map((o) => o.waitMinutes || 0);
      const avgWait = waitReadings.length
        ? Math.round(waitReadings.reduce((sum, v) => sum + v, 0) / waitReadings.length)
        : null;
      return {
        date,
        label: formatShortDate(date),
        expected,
        served,
        leftovers,
        waste,
        avgWait,
        error: expected && served ? Math.abs(expected - served) / expected : null,
      };
    });

    const byMeal = MEAL_PERIODS.map((meal) => ({
      meal: MEAL_LABELS[meal],
      leftovers: food
        .filter((r) => r.meal === meal && r.unit === 'kg')
        .reduce((sum, r) => sum + (r.remaining || 0), 0),
    }));

    const shortages = Object.entries(
      food
        .filter((r) => r.shortage)
        .reduce((acc, r) => ({ ...acc, [r.dish]: (acc[r.dish] || 0) + 1 }), {}),
    ).map(([dish, count]) => ({ dish, count }));

    return { rows, byMeal, shortages, attendanceCount: attendance.length };
  }, [state, dates, meals]);

  const errorSeries = report.rows
    .filter((row) => row.error !== null)
    .map((row) => ({ label: row.label, error: Math.round(row.error * 1000) / 10 }));
  const waitSeries = report.rows.filter((row) => row.avgWait !== null);

  const handleExport = () => {
    const columns = [
      { key: 'date', header: 'Date' },
      { key: 'expected', header: 'Expected diners (estimate)' },
      { key: 'served', header: 'Meals served (recorded)' },
      { key: 'error', header: 'Forecast error %', value: (row) => (row.error === null ? '' : (row.error * 100).toFixed(1)) },
      { key: 'leftovers', header: 'Unserved leftover (kg)' },
      { key: 'waste', header: 'Plate waste (kg)' },
      { key: 'avgWait', header: 'Average estimated wait (min)', value: (row) => (row.avgWait === null ? '' : row.avgWait) },
    ];
    downloadCsv(`messflow-analytics-${from}-to-${to}.csv`, toCsv(columns, report.rows));
    toast({
      title: 'CSV report exported',
      description: `${report.rows.length} days of ${mealFilter === 'all' ? 'all meals' : MEAL_LABELS[mealFilter].toLowerCase()} downloaded.`,
      duration: 4000,
    });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Analytics & Reports"
        subtitle="Measured values and forecast estimates are labelled separately throughout."
        meta={
          <>
            <DataTag kind="recorded" />
            <DataTag kind="estimated" />
          </>
        }
        actions={
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download CSV report
          </Button>
        }
      />

      <Panel title="Filters" subtitle="Range and meal period apply to every chart below.">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Range" htmlFor="range" className="w-[160px]">
            <Select
              value={rangeDays}
              onValueChange={(value) => {
                setRangeDays(value);
                setFrom(addDaysISO(to, -(Number(value) - 1)));
              }}
            >
              <SelectTrigger id="range" className="h-8 bg-white text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Meal period" htmlFor="meal-filter" className="w-[160px]">
            <Select value={mealFilter} onValueChange={setMealFilter}>
              <SelectTrigger id="meal-filter" className="h-8 bg-white text-[12.5px]">
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
          <FormField label="From" htmlFor="from" className="w-[150px]">
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => e.target.value && setFrom(e.target.value)}
              className="h-8 bg-white text-[12.5px]"
            />
          </FormField>
          <FormField label="To" htmlFor="to" className="w-[150px]">
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => e.target.value && setTo(e.target.value)}
              className="h-8 bg-white text-[12.5px]"
            />
          </FormField>
          <p className="mb-1.5 text-[11.5px] text-ink-muted">
            {report.attendanceCount} attendance records in range
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Attendance trend"
          subtitle="Meals served against expected diners for the selected range (recorded)."
          height={240}
        >
          <ComposedChart data={report.rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="served" name="Meals served" fill={CHART.brand} radius={[3, 3, 0, 0]} barSize={18} />
            <Line
              type="monotone"
              dataKey="expected"
              name="Expected diners (estimate)"
              stroke={CHART.neutral}
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ChartPanel>

        <ChartPanel
          title="Forecast vs actual attendance"
          subtitle="Expected and recorded turnout per day, showing where the estimate drifted."
          height={240}
        >
          <BarChart data={report.rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="expected" name="Expected (estimate)" fill={CHART.neutral} radius={[3, 3, 0, 0]} barSize={14} />
            <Bar dataKey="served" name="Actual (recorded)" fill={CHART.brand} radius={[3, 3, 0, 0]} barSize={14} />
          </BarChart>
        </ChartPanel>

        <ChartPanel
          title="Forecast error over time"
          subtitle="Absolute difference between expected and recorded attendance, as a percentage."
          height={230}
        >
          {errorSeries.length ? (
            <ComposedChart data={errorSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...yAxisProps} unit="%" />
              <Tooltip {...tooltipProps} formatter={(value) => [`${value}%`, 'Forecast error']} />
              <Line
                type="monotone"
                dataKey="error"
                name="Forecast error"
                stroke={CHART.warn}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </ComposedChart>
          ) : (
            <EmptyState compact title="No comparable days" description="Forecast error needs at least one recorded service." />
          )}
        </ChartPanel>

        <ChartPanel
          title="Recorded leftovers by meal period"
          subtitle="Unserved leftover quantities (kg) recorded in the selected range."
          height={230}
        >
          <BarChart data={report.byMeal} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="meal" {...axisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} formatter={(value) => [`${value} kg`, 'Unserved leftover']} />
            <Bar dataKey="leftovers" name="Unserved leftover (kg)" fill={CHART.brand} radius={[3, 3, 0, 0]} barSize={34} />
          </BarChart>
        </ChartPanel>

        <ChartPanel
          title="Shortage frequency"
          subtitle="Number of reported shortages by dish in the selected range."
          height={230}
        >
          {report.shortages.length ? (
            <BarChart data={report.shortages} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="dish" {...axisProps} interval={0} height={48} tick={{ fill: '#6B7169', fontSize: 10 }} />
              <YAxis {...yAxisProps} allowDecimals={false} />
              <Tooltip {...tooltipProps} formatter={(value) => [value, 'Reported shortages']} />
              <Bar dataKey="count" name="Reported shortages" fill={CHART.danger} radius={[3, 3, 0, 0]} barSize={30} />
            </BarChart>
          ) : (
            <EmptyState
              compact
              title="No shortages reported"
              description="No staff-reported shortages fall inside this range."
            />
          )}
        </ChartPanel>

        <ChartPanel
          title="Average estimated waiting time"
          subtitle="Mean of the recorded queue waiting-time readings per day (minutes, estimate)."
          height={230}
        >
          {waitSeries.length ? (
            <ComposedChart data={waitSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...yAxisProps} unit=" min" />
              <Tooltip {...tooltipProps} formatter={(value) => [`${value} min`, 'Average waiting time']} />
              <Line
                type="monotone"
                dataKey="avgWait"
                name="Average estimated wait"
                stroke={CHART.info}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </ComposedChart>
          ) : (
            <EmptyState compact title="No queue readings" description="No queue observations were recorded in this range." />
          )}
        </ChartPanel>
      </div>

      <Panel title="How to read these figures" subtitle="Measured and estimated values are never mixed.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-sunken px-4 py-3">
            <DataTag kind="recorded" />
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
              Meals served, recorded quantities, leftovers and staff-reported shortages come from the
              mess register and staff entries.
            </p>
          </div>
          <div className="rounded-md border border-line bg-sunken px-4 py-3">
            <DataTag kind="estimated" />
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
              Expected diners, waiting time and forecast error are derived estimates. No live model is
              connected, and no food-savings figure is claimed because none has been verified.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}