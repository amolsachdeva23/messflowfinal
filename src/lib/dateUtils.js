const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const pad = (n) => String(n).padStart(2, '0');

/** Local (not UTC) ISO date string: YYYY-MM-DD */
export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayISO(reference = new Date()) {
  return toISODate(reference);
}

export function addDaysISO(iso, days) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function weekdayKey(iso) {
  return DAY_KEYS[parseISODate(iso).getDay()];
}

export function weekdayLong(iso) {
  return WEEKDAYS_LONG[parseISODate(iso).getDay()];
}

/** "Mon, 26 Oct" */
export function formatShortDate(iso) {
  const d = parseISODate(iso);
  return `${WEEKDAYS_LONG[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Monday, 26 October 2026" */
export function formatLongDate(iso) {
  const d = parseISODate(iso);
  const month = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][d.getMonth()];
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${month} ${d.getFullYear()}`;
}

export function isToday(iso) {
  return iso === todayISO();
}

export function timeToMinutes(time) {
  if (!time || typeof time !== 'string' || !time.includes(':')) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(minutes) {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Inclusive list of ISO dates between two dates */
export function datesBetween(fromISO, toISO) {
  const out = [];
  let cursor = fromISO;
  let guard = 0;
  while (cursor <= toISO && guard < 400) {
    out.push(cursor);
    cursor = addDaysISO(cursor, 1);
    guard += 1;
  }
  return out;
}

export function humanDuration(minutes) {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function relativeTimeLabel(isoDateTime, reference = new Date()) {
  const then = new Date(isoDateTime);
  const diff = Math.round((reference.getTime() - then.getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} min ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  return `${Math.floor(h / 24)} d ago`;
}

/** "Mon 20" — compact chart axis label */
export function formatAxisDay(iso) {
  const d = parseISODate(iso);
  return `${WEEKDAYS_LONG[d.getDay()].slice(0, 3)} ${d.getDate()}`;
}

/** "13:05" -> "1:05 pm" (used only where a spoken style reads better) */
export function to12Hour(time) {
  if (!time || !time.includes(':')) return time || '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m || 0)} ${suffix}`;
}