import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import DataTag from '@/components/DataTag';
import FormField from '@/components/FormField';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageSkeleton from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { NOTICE_TYPE_LABELS } from '@/lib/types';
import { formatShortDate, relativeTimeLabel } from '@/lib/dateUtils';

const DATA_SOURCES = [
  { kind: 'demo', text: 'Sample data seeded for this demonstration.' },
  { kind: 'recorded', text: 'Actual values recorded in the mess register.' },
  { kind: 'staff-entered', text: 'Observations and quantities typed by mess staff.' },
  { kind: 'simulated', text: 'Simulated counter readings — no camera is connected.' },
  { kind: 'estimated', text: 'Forecast estimates from historical patterns.' },
];

export default function Settings() {
  const {
    isLoading,
    settings,
    updateSettings,
    saveNow,
    resetDemo,
    lastSavedAt,
    notices,
    addNotice,
    deleteNotice,
  } = useMessData();
  const { toast } = useToast();

  const [messForm, setMessForm] = useState({
    messName: settings.messName,
    campus: settings.campus,
    seatCapacity: String(settings.seatCapacity),
    serviceStations: String(settings.serviceStations),
  });
  const [thresholdForm, setThresholdForm] = useState({
    queueLength: String(settings.thresholds.queueLength),
    waitMinutes: String(settings.thresholds.waitMinutes),
    seatOccupancy: String(settings.thresholds.seatOccupancy),
    staleAfterMinutes: String(settings.staleAfterMinutes),
  });
  const [clockForm, setClockForm] = useState({
    mode: settings.demoClock.mode,
    fixedTime: settings.demoClock.fixedTime,
  });
  const [noticeForm, setNoticeForm] = useState({ type: 'timing', title: '', body: '' });
  const [noticeError, setNoticeError] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (isLoading) return <PageSkeleton />;

  const numberOr = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Mess details, operational thresholds, student notices and demo data controls."
        meta={<DataTag kind="demo" />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Mess details" subtitle="Shown across the staff dashboard and the student portal.">
          <div className="space-y-3.5">
            <FormField label="Mess name" htmlFor="mess-name" required>
              <Input
                id="mess-name"
                value={messForm.messName}
                onChange={(e) => setMessForm({ ...messForm, messName: e.target.value })}
                className="h-9 bg-white text-[13px]"
              />
            </FormField>
            <FormField label="Campus / institution" htmlFor="campus" required>
              <Input
                id="campus"
                value={messForm.campus}
                onChange={(e) => setMessForm({ ...messForm, campus: e.target.value })}
                className="h-9 bg-white text-[13px]"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Seating capacity" htmlFor="capacity" hint="Used for occupancy estimates.">
                <Input
                  id="capacity"
                  type="number"
                  min="20"
                  value={messForm.seatCapacity}
                  onChange={(e) => setMessForm({ ...messForm, seatCapacity: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
              <FormField label="Serving counters open" htmlFor="stations" hint="Used to derive waiting time.">
                <Input
                  id="stations"
                  type="number"
                  min="1"
                  max="8"
                  value={messForm.serviceStations}
                  onChange={(e) => setMessForm({ ...messForm, serviceStations: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
            </div>
            <Button
              size="sm"
              onClick={() => {
                updateSettings({
                  messName: messForm.messName.trim() || settings.messName,
                  campus: messForm.campus.trim() || settings.campus,
                  seatCapacity: numberOr(messForm.seatCapacity, settings.seatCapacity),
                  serviceStations: numberOr(messForm.serviceStations, settings.serviceStations),
                });
                toast({ title: 'Mess details saved', description: 'Updated on this browser.', duration: 4000 });
              }}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save details
            </Button>
          </div>
        </Panel>

        <Panel title="Queue warning thresholds" subtitle="Alerts are raised when a reading crosses these values.">
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Queue length" htmlFor="t-queue" hint="People waiting">
                <Input
                  id="t-queue"
                  type="number"
                  min="5"
                  value={thresholdForm.queueLength}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, queueLength: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
              <FormField label="Waiting time (min)" htmlFor="t-wait" hint="Estimated minutes">
                <Input
                  id="t-wait"
                  type="number"
                  min="2"
                  value={thresholdForm.waitMinutes}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, waitMinutes: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
              <FormField label="Seating occupancy (%)" htmlFor="t-seats">
                <Input
                  id="t-seats"
                  type="number"
                  min="20"
                  max="100"
                  value={thresholdForm.seatOccupancy}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, seatOccupancy: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
              <FormField label="Reading is stale after (min)" htmlFor="t-stale" hint="Older readings show as unavailable.">
                <Input
                  id="t-stale"
                  type="number"
                  min="5"
                  value={thresholdForm.staleAfterMinutes}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, staleAfterMinutes: e.target.value })}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
            </div>
            <Button
              size="sm"
              onClick={() => {
                updateSettings({
                  thresholds: {
                    queueLength: numberOr(thresholdForm.queueLength, settings.thresholds.queueLength),
                    waitMinutes: numberOr(thresholdForm.waitMinutes, settings.thresholds.waitMinutes),
                    seatOccupancy: numberOr(thresholdForm.seatOccupancy, settings.thresholds.seatOccupancy),
                  },
                  staleAfterMinutes: numberOr(thresholdForm.staleAfterMinutes, settings.staleAfterMinutes),
                });
                toast({
                  title: 'Thresholds saved',
                  description: 'Queue alerts now use the new limits.',
                  duration: 4000,
                });
              }}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save thresholds
            </Button>
          </div>
        </Panel>

        <Panel title="Alerts & notifications" subtitle="Choose which operational conditions raise an alert.">
          <div className="space-y-3">
            {[
              { key: 'queueAlerts', label: 'Queue threshold alerts', detail: 'Warn when waiting time or occupancy crosses a threshold.' },
              { key: 'shortageAlerts', label: 'Shortage alerts', detail: 'Warn when a dish is reported short during service.' },
              { key: 'dailySummary', label: 'Daily summary', detail: 'Summarise the day once the dinner service closes.' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-md border border-line px-3.5 py-2.5">
                <div>
                  <p className="text-[12.5px] font-medium text-ink">{item.label}</p>
                  <p className="text-[11px] text-ink-muted">{item.detail}</p>
                </div>
                <Switch
                  checked={settings.notifications[item.key]}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, [item.key]: checked },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Demo clock" subtitle="Controls the time of day used to derive service states.">
          <div className="space-y-3.5">
            <FormField label="Clock mode" htmlFor="clock-mode">
              <Select
                value={clockForm.mode}
                onValueChange={(value) => setClockForm({ ...clockForm, mode: value })}
              >
                <SelectTrigger id="clock-mode" className="h-9 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed demo time</SelectItem>
                  <SelectItem value="live">Follow the real clock</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Demo time"
              htmlFor="clock-time"
              hint="Sample readings are generated around this time, so the demo shows a service in progress."
            >
              <Input
                id="clock-time"
                type="time"
                disabled={clockForm.mode !== 'fixed'}
                value={clockForm.fixedTime}
                onChange={(e) => setClockForm({ ...clockForm, fixedTime: e.target.value })}
                className="h-9 bg-white text-[13px] disabled:bg-sunken"
              />
            </FormField>
            <Button
              size="sm"
              onClick={() => {
                updateSettings({
                  demoClock: { mode: clockForm.mode, fixedTime: clockForm.fixedTime || '13:10' },
                });
                toast({
                  title: 'Demo clock updated',
                  description:
                    clockForm.mode === 'live'
                      ? 'The app now follows the real clock; readings recorded earlier today may show as unavailable.'
                      : `Service states are now derived from ${clockForm.fixedTime}.`,
                  duration: 4500,
                });
              }}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save clock
            </Button>
          </div>
        </Panel>

        <Panel
          title="Student notices"
          subtitle="Posted notices appear in the student portal."
          actions={<DataTag kind="staff-entered" />}
        >
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr]">
              <FormField label="Type" htmlFor="notice-type">
                <Select
                  value={noticeForm.type}
                  onValueChange={(value) => setNoticeForm({ ...noticeForm, type: value })}
                >
                  <SelectTrigger id="notice-type" className="h-9 bg-white text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['timing', 'menu', 'delay'].map((type) => (
                      <SelectItem key={type} value={type}>
                        {NOTICE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Title" htmlFor="notice-title" required error={noticeError}>
                <Input
                  id="notice-title"
                  value={noticeForm.title}
                  placeholder="e.g. Snacks counter closes early today"
                  onChange={(e) => {
                    setNoticeForm({ ...noticeForm, title: e.target.value });
                    setNoticeError(null);
                  }}
                  className="h-9 bg-white text-[13px]"
                />
              </FormField>
            </div>
            <FormField label="Notice text" htmlFor="notice-body">
              <Textarea
                id="notice-body"
                rows={2}
                value={noticeForm.body}
                placeholder="Short explanation for students"
                onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
                className="bg-white text-[13px]"
              />
            </FormField>
            <Button
              size="sm"
              onClick={() => {
                if (!noticeForm.title.trim()) {
                  setNoticeError('Enter a title for the notice.');
                  return;
                }
                addNotice({
                  type: noticeForm.type,
                  title: noticeForm.title.trim(),
                  body: noticeForm.body.trim(),
                });
                setNoticeForm({ type: 'timing', title: '', body: '' });
                toast({ title: 'Notice published', description: 'Students will see it in the portal.', duration: 4000 });
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Publish notice
            </Button>

            <ul className="divide-y divide-line border-t border-line pt-3">
              {notices.map((notice) => (
                <li key={notice.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-ink">{notice.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-muted">
                      {NOTICE_TYPE_LABELS[notice.type]} · {relativeTimeLabel(notice.postedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteNotice(notice.id)}
                    aria-label="Delete notice"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sunken hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Demo data" subtitle="Everything is stored in this browser only.">
          <div className="space-y-3">
            <div className="rounded-md border border-line bg-sunken px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Last saved
              </p>
              <p className="mt-1 text-[12.5px] text-ink">
                {lastSavedAt
                  ? `${formatShortDate(lastSavedAt.slice(0, 10))} · ${relativeTimeLabel(lastSavedAt)}`
                  : 'Not saved yet'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  saveNow();
                  toast({ title: 'Demo data saved', description: 'Current values were written to this browser.', duration: 4000 });
                }}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save demo data
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>
                Reset demo data
              </Button>
            </div>

            <div className="border-t border-line pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Data sources used in this app
              </p>
              <ul className="mt-2 space-y-2">
                {DATA_SOURCES.map((source) => (
                  <li key={source.kind} className="flex items-start gap-2.5">
                    <DataTag kind={source.kind} />
                    <span className="text-[11.5px] leading-relaxed text-ink-muted">{source.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        destructive
        title="Reset demo data?"
        description="All locally saved quantities, menu edits, observations and notices will be replaced with freshly seeded sample data."
        confirmLabel="Reset demo data"
        onConfirm={() => {
          resetDemo();
          toast({ title: 'Demo data reset', description: 'Sample data was regenerated for today.', duration: 4000 });
        }}
      />
    </div>
  );
}