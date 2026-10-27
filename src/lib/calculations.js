import { MEAL_LABELS, MEAL_PERIODS } from '@/lib/types';
import { timeToMinutes, weekdayKey, weekdayLong } from '@/lib/dateUtils';

/**
 * Tracked staple dish groups per meal period. The weekly menu names the
 * specific dish of the day; quantity records track these stable groups.
 */
export const DISH_MODEL = {
  breakfast: [
    { dish: 'Breakfast main', unit: 'kg', perHead: 0.15 },
    { dish: 'Boiled eggs', unit: 'pieces', perHead: 1.4 },
    { dish: 'Banana', unit: 'pieces', perHead: 0.9 },
    { dish: 'Tea', unit: 'cups', perHead: 1.1 },
  ],
  lunch: [
    { dish: 'Steamed rice', unit: 'kg', perHead: 0.19 },
    { dish: 'Dal tadka', unit: 'kg', perHead: 0.13 },
    { dish: 'Seasonal vegetable', unit: 'kg', perHead: 0.15 },
    { dish: 'Roti', unit: 'pieces', perHead: 3.2 },
    { dish: 'Curd', unit: 'kg', perHead: 0.1 },
  ],
  snacks: [
    { dish: 'Snack', unit: 'pieces', perHead: 1.2 },
    { dish: 'Tea', unit: 'cups', perHead: 1.3 },
  ],
  dinner: [
    { dish: 'Steamed rice', unit: 'kg', perHead: 0.17 },
    { dish: 'Dal fry', unit: 'kg', perHead: 0.12 },
    { dish: 'Chapati', unit: 'pieces', perHead: 3.4 },
    { dish: 'Main curry', unit: 'kg', perHead: 0.11 },
    { dish: 'Salad', unit: 'kg', perHead: 0.08 },
  ],
};

export const BASE_DINERS = { breakfast: 204, lunch: 352, snacks: 148, dinner: 312 };

export const WEEKDAY_FACTOR = {
  sunday: 0.9,
  monday: 1.0,
  tuesday: 1.03,
  wednesday: 1.02,
  thursday: 1.05,
  friday: 1.07,
  saturday: 0.86,
};

export const SERVICE_WINDOWS = {
  breakfast: ['07:15', '09:00'],
  lunch: ['12:30', '14:00'],
  snacks: ['17:30', '18:30'],
  dinner: ['20:30', '22:00'],
};

export function dishesFor(meal) {
  return DISH_MODEL[meal] || [];
}

export function expectedDemand(perHead, diners, unit) {
  const value = perHead * Math.max(0, diners || 0);
  if (unit === 'kg') return Math.round(value);
  return Math.round(value / 5) * 5;
}

export function forecastFor(meal, expectedDiners) {
  return dishesFor(meal).map((model) => ({
    dish: model.dish,
    unit: model.unit,
    expectedDemand: expectedDemand(model.perHead, expectedDiners, model.unit),
  }));
}

export function serviceState(start, end, minutes) {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (minutes < s) return 'upcoming';
  if (minutes > e) return 'ended';
  return 'in-service';
}

const PROGRESS_CURVE = [
  [0, 0.02],
  [0.1, 0.24],
  [0.25, 0.45],
  [0.4, 0.6],
  [0.6, 0.82],
  [0.8, 0.95],
  [1, 1],
];

/** Share of the meal's diners that have been served at a point in the window. */
export function serviceProgress(start, end, minutes) {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  const ratio = Math.min(1, Math.max(0, (minutes - s) / Math.max(1, e - s)));
  for (let i = 1; i < PROGRESS_CURVE.length; i += 1) {
    const [r1, v1] = PROGRESS_CURVE[i - 1];
    const [r2, v2] = PROGRESS_CURVE[i];
    if (ratio <= r2) return v1 + ((ratio - r1) / (r2 - r1)) * (v2 - v1);
  }
  return 1;
}

/** Minutes of the demo environment. Fixed demo clock by default. */
export function resolveClockMinutes(demoClock) {
  if (!demoClock || demoClock.mode !== 'live') return timeToMinutes(demoClock?.fixedTime || '13:10');
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function waitMinutesFromQueue(queueLength, stations = 2, secondsPerDiner = 45) {
  if (!queueLength) return 0;
  return Math.max(2, Math.round((queueLength / stations) * (secondsPerDiner / 60)));
}

export function crowdLevel({ waitMinutes = 0, queueLength = 0, seatOccupancy = 0 }) {
  if (waitMinutes >= 12 || queueLength >= 35 || seatOccupancy >= 85) return 'high';
  if (waitMinutes >= 6 || queueLength >= 15 || seatOccupancy >= 65) return 'moderate';
  return 'low';
}

export function foodStatus(record) {
  const prepared = record.prepared || 0;
  if (record.shortage) return { label: 'Shortage reported', tone: 'danger' };
  if (!prepared) return { label: 'Not prepared yet', tone: 'neutral' };
  const ratio = (record.remaining || 0) / prepared;
  if (ratio <= 0.08) return { label: 'Refill recommended', tone: 'warn' };
  if (ratio <= 0.16) return { label: 'Monitor', tone: 'warn' };
  return { label: 'On track', tone: 'ok' };
}

export function forecastQuality(history) {
  const values = (history || []).filter((v) => v > 0);
  const sampleSize = values.length;
  if (!sampleSize) return { level: 'Low', sampleSize: 0, avg: 0, spread: null };
  const avg = values.reduce((sum, v) => sum + v, 0) / sampleSize;
  const spread =
    Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / sampleSize) / avg;
  const level = spread <= 0.05 ? 'High' : spread <= 0.09 ? 'Moderate' : 'Low';
  return { level, sampleSize, avg: Math.round(avg), spread };
}

export function resolveCurrentMeal(dayMenu, minutes) {
  let inService = null;
  let upcoming = null;
  let ended = null;
  for (const meal of MEAL_PERIODS) {
    const window = dayMenu?.[meal];
    if (!window) continue;
    const state = serviceState(window.start, window.end, minutes);
    if (state === 'in-service' && !inService) inService = { meal, state };
    else if (state === 'upcoming' && !upcoming) upcoming = { meal, state };
    else if (state === 'ended') ended = { meal, state };
  }
  if (inService) return inService;
  if (upcoming) return upcoming;
  return ended || { meal: 'lunch', state: 'upcoming' };
}

/**
 * Unifies the simulated counter series with staff-entered observations for one
 * date + meal. Queue length and total room occupancy stay separate values.
 */
export function deriveQueue({
  observations,
  manualObservations,
  seatCapacity,
  nowMinutes,
  staleAfterMinutes,
  levelOverride,
}) {
  const byTime = (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time);
  const series = [...(observations || [])].sort(byTime);
  const manual = [...(manualObservations || [])].sort(byTime);

  let latest = null;
  let latestIsManual = false;
  if (series.length) latest = series[series.length - 1];
  manual.forEach((entry) => {
    if (!latest || timeToMinutes(entry.time) >= timeToMinutes(latest.time)) {
      latest = entry;
      latestIsManual = true;
    }
  });

  const queueLength = latest ? latest.queueLength || 0 : 0;
  const waitMinutes = latest ? latest.waitMinutes || 0 : 0;
  const lastSimulated = series.length ? series[series.length - 1] : null;
  const beingServed = latestIsManual
    ? (lastSimulated ? lastSimulated.beingServed || 0 : 0)
    : latest
      ? latest.beingServed || 0
      : 0;
  const diningCount = latestIsManual
    ? Math.max(0, seatCapacity - (latest.availableSeats ?? seatCapacity))
    : latest
      ? latest.diningCount || 0
      : 0;
  const availableSeats = latest
    ? (latest.availableSeats ?? Math.max(0, seatCapacity - diningCount))
    : seatCapacity;
  const peopleInside = queueLength + beingServed + diningCount;
  const seatOccupancy = seatCapacity ? (diningCount / seatCapacity) * 100 : 0;
  const observedAtTime = latest ? latest.time : null;
  const minutesSince =
    observedAtTime != null ? nowMinutes - timeToMinutes(observedAtTime) : null;
  const stale =
    !latest || minutesSince == null || minutesSince > (staleAfterMinutes || 25);
  const calculatedLevel = crowdLevel({ waitMinutes, queueLength, seatOccupancy });

  return {
    series,
    manual,
    latest,
    latestIsManual,
    queueLength,
    beingServed,
    diningCount,
    peopleInside,
    availableSeats,
    waitMinutes,
    seatOccupancy,
    observedAtTime,
    minutesSince,
    stale,
    level: levelOverride || calculatedLevel,
    calculatedLevel,
    hasOverride: !!levelOverride,
    hasData: !!latest,
  };
}

/** Contextual alerts derived from the current selection's own data. */
export function buildAlerts({
  date,
  meal,
  serviceStatus,
  foodRows,
  queue,
  expectedDiners,
  comparableAvg,
  thresholds,
  notifications,
  dismissed,
}) {
  const alerts = [];
  const push = (id, severity, title, detail, action, to) => {
    if (!(dismissed || []).includes(id)) {
      alerts.push({ id, severity, title, detail, action, to, date, meal });
    }
  };

  (foodRows || []).forEach((row) => {
    if (!row.recorded || !(row.prepared > 0)) return;
    const ratio = (row.remaining || 0) / row.prepared;
    if (row.shortage) {
      if (notifications.shortageAlerts !== false) {
        push(
          `food-short|${date}|${meal}|${row.dish}`,
          'critical',
          `${row.dish} shortage reported`,
          `The kitchen reported running short of ${row.dish} during ${MEAL_LABELS[meal].toLowerCase()} service.`,
          'Record quantities',
          '/inventory',
        );
      }
    } else if (ratio <= 0.08 && serviceStatus === 'in-service') {
      push(
        `food-low|${date}|${meal}|${row.dish}`,
        'warning',
        `${row.dish} is running lower than expected`,
        `${row.remaining} ${row.unit} remaining of ${row.prepared} ${row.unit} prepared. A refill may be needed before service ends.`,
        'Review stock',
        '/inventory',
      );
    }
  });

  if (notifications.queueAlerts !== false && queue.hasData && !queue.stale) {
    if (queue.waitMinutes >= thresholds.waitMinutes) {
      push(
        `queue|${date}|${meal}`,
        'critical',
        'Queue waiting time exceeded the configured threshold',
        `Current estimate is ${queue.waitMinutes} minutes against a threshold of ${thresholds.waitMinutes} minutes.`,
        'View queue',
        '/queue',
      );
    } else if (queue.waitMinutes >= thresholds.waitMinutes * 0.75) {
      push(
        `queue|${date}|${meal}`,
        'warning',
        'Queue waiting time is approaching the configured threshold',
        `Current estimate is ${queue.waitMinutes} minutes; the alert threshold is ${thresholds.waitMinutes} minutes.`,
        'View queue',
        '/queue',
      );
    }
    if (queue.seatOccupancy >= thresholds.seatOccupancy) {
      push(
        `seat|${date}|${meal}`,
        'warning',
        'Seating occupancy is above the configured level',
        `About ${Math.round(queue.seatOccupancy)}% of seats are occupied right now.`,
        'View queue',
        '/queue',
      );
    }
  }

  if (comparableAvg > 0 && expectedDiners > comparableAvg * 1.05) {
    push(
      `demand|${date}|${meal}`,
      'info',
      `${MEAL_LABELS[meal]} demand is forecast higher than usual`,
      `Expected ${expectedDiners} diners — about ${Math.round((expectedDiners / comparableAvg - 1) * 100)}% above the comparable average of ${comparableAvg}.`,
      'View forecast',
      '/planning',
    );
  }

  return alerts.slice(0, 5);
}

/** Plain-language explanation of what drives the forecast estimate. */
export function buildFactors({ date, meal, expectedDiners, comparableAvg, quality, dayMenu, notices }) {
  const factors = [];
  factors.push(
    `Historical attendance — average ${comparableAvg || expectedDiners} diners across the last ${quality.sampleSize} comparable ${MEAL_LABELS[meal].toLowerCase()} services.`,
  );
  const factor = WEEKDAY_FACTOR[weekdayKey(date)];
  const pct = Math.round(Math.abs(factor - 1) * 100);
  factors.push(
    `Day of the week — ${weekdayLong(date)} attendance runs about ${pct}% ${factor >= 1 ? 'above' : 'below'} the weekly average.`,
  );
  const rank =
    Object.entries(BASE_DINERS)
      .sort((a, b) => b[1] - a[1])
      .findIndex(([m]) => m === meal) + 1;
  factors.push(`Meal type — ${MEAL_LABELS[meal]} is the #${rank} service of the day by expected turnout.`);
  const items = dayMenu?.[meal]?.items || [];
  factors.push(
    `Menu — ${items.length} dishes${items.length ? `, including ${items.slice(0, 2).map((item) => item.name).join(' and ')}` : ''}.`,
  );
  const latest = (notices || [])[0];
  factors.push(
    latest
      ? `Campus calendar — ${latest.title}.`
      : 'Campus calendar — no events recorded for this date.',
  );
  return factors;
}