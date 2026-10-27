import { MEAL_PERIODS } from '@/lib/types';
import {
  addDaysISO,
  minutesToTime,
  parseISODate,
  timeToMinutes,
  todayISO,
  weekdayKey,
} from '@/lib/dateUtils';
import {
  BASE_DINERS,
  DISH_MODEL,
  SERVICE_WINDOWS,
  WEEKDAY_FACTOR,
  expectedDemand,
  resolveClockMinutes,
  serviceProgress,
  serviceState,
  waitMinutesFromQueue,
} from '@/lib/calculations';

const DEFAULT_SEAT_CAPACITY = 180;

const DEFAULT_SETTINGS = {
  messName: 'Hostel 7 Mess',
  campus: 'BIT Mesra',
  messOptions: Array.from({ length: 13 }, (_, i) => `Hostel ${i + 1} Mess`),
  activeMess: 'Hostel 7 Mess',
  seatCapacity: DEFAULT_SEAT_CAPACITY,
  serviceStations: 2,
  thresholds: { queueLength: 35, waitMinutes: 12, seatOccupancy: 85 },
  staleAfterMinutes: 25,
  notifications: { queueAlerts: true, shortageAlerts: true, dailySummary: false },
  staff: { name: 'Amol Sachdeva', role: 'Mess Supervisor', initials: 'AS' },
  demoClock: { mode: 'fixed', fixedTime: '13:10' },
};

/** Stable pseudo-random in [0,1) derived from a key — keeps sample data coherent. */
function rand01(key) {
  let h = 2166136261;
  const str = String(key);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0 || 1;
  x = Math.imul(x ^ (x >>> 15), 2246822519);
  x ^= x >>> 13;
  x = Math.imul(x ^ (x >>> 16), 3266489917);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export function expectedDinersFor(date, meal) {
  const base = (BASE_DINERS[meal] || 200) * WEEKDAY_FACTOR[weekdayKey(date)];
  const wobble = (rand01(`exp|${date}|${meal}`) - 0.5) * 0.06;
  return Math.max(20, Math.round(base * (1 + wobble)));
}

function queuePoint({ date, meal, time, ratio, expected, capacity, key }) {
  const shape = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, ratio))), 0.8);
  const jitter = 0.9 + rand01(key) * 0.2;
  const queueLength = Math.max(0, Math.round(expected * 0.06 * Math.max(shape, 0.05) * jitter));
  const beingServed = Math.max(0, Math.round((2 + 4 * shape) * jitter));
  const peopleInside = Math.max(0, Math.round(expected * 0.28 * Math.max(shape, 0.06) * jitter));
  const diningCount = Math.max(0, peopleInside - queueLength - beingServed);
  const availableSeats = Math.max(0, capacity - diningCount);
  return {
    id: `q|${date}|${meal}|${time}`,
    date,
    meal,
    time,
    queueLength,
    beingServed,
    diningCount,
    peopleInside,
    waitMinutes: waitMinutesFromQueue(queueLength, 2, 45),
    availableSeats,
    source: 'simulated',
  };
}

/** Builds attendance, food and queue records for a single date. */
export function buildDayRecords(date, clockMinutes, isToday, capacity = DEFAULT_SEAT_CAPACITY) {
  const attendance = [];
  const food = [];
  const queue = [];

  for (const meal of MEAL_PERIODS) {
    const expected = expectedDinersFor(date, meal);
    const [start, end] = SERVICE_WINDOWS[meal];
    const state = isToday ? serviceState(start, end, clockMinutes) : 'ended';
    const progress = state === 'in-service' ? serviceProgress(start, end, clockMinutes) : 1;

    const served =
      state === 'in-service'
        ? Math.round(expected * progress)
        : Math.round(expected * (0.86 + rand01(`srv|${date}|${meal}`) * 0.16));
    attendance.push({
      id: `att|${date}|${meal}`,
      date,
      meal,
      expected,
      served,
      partial: state === 'in-service',
      source: isToday ? 'simulated' : 'recorded',
    });

    if (state === 'upcoming') continue;

    DISH_MODEL[meal].forEach((model) => {
      const key = `f|${date}|${meal}|${model.dish}`;
      const planned = expectedDemand(model.perHead, expected, model.unit);
      let prepared = Math.round(planned * (0.94 + rand01(`${key}|prep`) * 0.1));
      let servedRatio;
      if (state === 'in-service') {
        if (isToday && meal === 'lunch' && model.dish === 'Dal tadka') {
          prepared = Math.round(planned * 0.88);
          servedRatio = 0.93;
        } else {
          servedRatio = progress * (0.95 + rand01(`${key}|s`) * 0.1);
        }
      } else {
        servedRatio = 0.88 + rand01(`${key}|s`) * 0.1;
      }
      const servedQty = Math.min(prepared, Math.round(prepared * servedRatio));
      const remaining = Math.max(0, prepared - servedQty);
      const plateWaste =
        model.unit === 'kg' ? Math.round(servedQty * (0.06 + rand01(`${key}|w`) * 0.05)) : 0;
      let shortage = false;
      let note = '';
      if (state === 'ended' && remaining <= Math.max(0.5, planned * 0.025) && rand01(`${key}|sh`) > 0.6) {
        shortage = true;
        note = 'Ran short near the end of service.';
      }
      food.push({
        id: key,
        date,
        meal,
        dish: model.dish,
        unit: model.unit,
        planned,
        prepared,
        served: servedQty,
        remaining,
        plateWaste,
        shortage,
        note,
        source: 'staff-entered',
      });
    });

    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    const last = state === 'in-service' ? clockMinutes : e;
    const step = state === 'in-service' ? 5 : 15;
    for (let t = s; t <= last; t += step) {
      queue.push(
        queuePoint({
          date,
          meal,
          time: minutesToTime(t),
          ratio: (t - s) / (e - s),
          expected,
          capacity,
          key: `q|${date}|${meal}|${t}`,
        }),
      );
    }
    if ((last - s) % step !== 0) {
      queue.push(
        queuePoint({
          date,
          meal,
          time: minutesToTime(last),
          ratio: (last - s) / (e - s),
          expected,
          capacity,
          key: `q|${date}|${meal}|${last}`,
        }),
      );
    }
  }

  return { attendance, food, queue };
}

function mealDef(start, end, items, notice = '') {
  return {
    start,
    end,
    notice,
    items: items.map(([name, veg]) => ({ id: name, name, veg: veg === 1 })),
  };
}

export function buildWeeklyMenu() {
  // Timings are the same every day, per the Hostel 7 mess sheet.
  const TIMES = {
    breakfast: ['07:15', '09:00'],
    lunch: ['12:30', '14:00'],
    snacks: ['17:30', '18:30'],
    dinner: ['20:30', '22:00'],
  };
  const meal = (period, items, notice = '') => mealDef(TIMES[period][0], TIMES[period][1], items, notice);

  return {
    monday: {
      breakfast: meal('breakfast', [['Boiled egg', 0], ['Upma', 1], ['Chai', 1], ['Sprouts', 1]]),
      lunch: meal('lunch', [['Dal', 1], ['Jeera rice', 1], ['Dahi', 1], ['Aloo chana', 1], ['Roti', 1], ['Salad', 1]]),
      snacks: meal('snacks', [['Cutlet', 1], ['Mix fruit', 1], ['Chai/Coffee', 1]]),
      dinner: meal('dinner', [['Seasonal veg', 1], ['Roti', 1], ['Chana dal', 1], ['Rice', 1], ['Salad', 1], ['Sewai kheer (alternate)', 1]]),
    },
    tuesday: {
      breakfast: meal('breakfast', [['Besan chilla', 1], ['Chutney', 1], ['Coffee', 1]]),
      lunch: meal('lunch', [['Rajma rice', 1], ['Aloo bhujji fried', 1], ['Salad', 1], ['Roti', 1]]),
      snacks: meal('snacks', [['Dal kachori', 1], ['Aloo chana sabji', 1], ['Chai', 1]]),
      dinner: meal('dinner', [['Rice', 1], ['Roti', 1], ['Mix veg', 1], ['Sweets', 1], ['Fried dal', 1], ['Salad', 1]]),
    },
    wednesday: {
      breakfast: meal('breakfast', [['Omlette', 0], ['Butter bread', 1], ['Doodh', 1], ['Jam', 1], ['Banana', 1]]),
      lunch: meal('lunch', [['Dal', 1], ['Jeera rice', 1], ['Dahi', 1], ['Roti', 1], ['Matar paneer', 1], ['Baigan/Potato pakoda', 1], ['Salad', 1]]),
      snacks: meal('snacks', [['Chowmien/Pasta/Maggie', 1], ['Chai/Coffee', 1]]),
      dinner: meal('dinner', [['Chicken/Veg biryani', 0], ['Veg raita', 1]]),
    },
    thursday: {
      breakfast: meal('breakfast', [['Puri', 1], ['Aloo dam', 1], ['Jalebi', 1], ['Sprouts', 1], ['Chai', 1]]),
      lunch: meal('lunch', [['Curry chawal', 1], ['Papad', 1], ['Aloo bhujia', 1], ['Salad', 1], ['Roti', 1]]),
      snacks: meal('snacks', [['Pav bhaji/Vada pav', 1], ['Sliced pyaaz + green fried chilli', 1], ['Chai', 1]]),
      dinner: meal('dinner', [['Aloo dum', 1], ['Rice', 1], ['Dal', 1], ['Sweets', 1], ['Pyaaz', 1], ['Roti', 1]]),
    },
    friday: {
      breakfast: meal('breakfast', [['Uttapam/Idli', 1], ['Chai', 1], ['Nariyal badam chutney', 1], ['Sambhar', 1]]),
      lunch: meal('lunch', [['Pulao', 1], ['Dal tadka', 1], ['Mix veg', 1], ['Boondi raita', 1], ['Salad', 1]]),
      snacks: meal('snacks', [['Bread pakoda/Pyaaz pakoda', 1], ['Chai', 1]]),
      dinner: meal('dinner', [['Chicken do pyaza', 0], ['Kadhai paneer', 1], ['Rice', 1], ['Roti', 1], ['Salad', 1]]),
    },
    saturday: {
      breakfast: meal('breakfast', [['Aloo paratha/Paneer paratha', 1], ['Dahi', 1], ['Chai', 1]]),
      lunch: meal('lunch', [['Khichdi', 1], ['Dahi', 1], ['Papad', 1], ['Aloo choka', 1]]),
      snacks: meal('snacks', [['Samosa chat', 1], ['Chai', 1], ['Coffee', 1], ['Pyaaz', 1]]),
      dinner: meal('dinner', [['Custard', 1], ['Kashmiri pulao', 1], ['Chana dal', 1], ['Manchurian/Kofta', 1], ['Puri', 1]]),
    },
    sunday: {
      breakfast: meal('breakfast', [['Chhole bhature', 1], ['Pyaaz and nimbu', 1], ['Chai', 1]]),
      lunch: meal('lunch', [['Dal', 1], ['Chawal', 1], ['Chokha/Aloo bhujia', 1], ['Roti', 1], ['Papad/Chips', 1], ['Salad', 1]]),
      snacks: meal('snacks', [['Pani puri', 1], ['Chai', 1]]),
      dinner: meal('dinner', [['Butter chicken', 0], ['Paneer do pyaza', 1], ['Chawal', 1], ['Roti', 1], ['Pyaaz', 1]]),
    },
  };
}

function isoAt(date, time) {
  const d = parseISODate(date);
  const [h, m] = (time || '09:00').split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

export function buildNotices(today) {
  return [
    {
      id: 'notice-1',
      type: 'timing',
      title: 'Dinner starts 15 minutes early today',
      body: `On account of the inter-hostel sports final, dinner on ${weekdayLongOf(today)} runs 19:15–21:15 instead of the usual timing.`,
      postedAt: isoAt(addDaysISO(today, -1), '18:40'),
      date: today,
    },
    {
      id: 'notice-2',
      type: 'menu',
      title: 'Paneer curry replaces rajma at dinner',
      body: 'Fresh paneer arrived this morning, so the dinner menu has been updated.',
      postedAt: isoAt(addDaysISO(today, -1), '11:20'),
      date: today,
    },
    {
      id: 'notice-3',
      type: 'delay',
      title: 'Short delay in snack service',
      body: 'The snack counter opened about ten minutes late while the fryer was being serviced.',
      postedAt: isoAt(addDaysISO(today, -2), '16:55'),
      date: addDaysISO(today, -2),
    },
  ];
}

function weekdayLongOf(iso) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[parseISODate(iso).getDay()];
}

export function createSeedState() {
  const today = todayISO();
  const clockMinutes = resolveClockMinutes(DEFAULT_SETTINGS.demoClock);
  const attendance = [];
  const food = [];
  const queue = [];

  for (let back = 20; back >= 0; back -= 1) {
    const date = addDaysISO(today, -back);
    const day = buildDayRecords(date, clockMinutes, back === 0, DEFAULT_SETTINGS.seatCapacity);
    attendance.push(...day.attendance);
    food.push(...day.food);
    queue.push(...day.queue);
  }

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    settings: DEFAULT_SETTINGS,
    menu: buildWeeklyMenu(),
    attendance,
    food,
    queue,
    manualObservations: [
      {
        id: 'mo-seed-1',
        date: today,
        meal: 'breakfast',
        time: '08:05',
        queueLength: 12,
        waitMinutes: 4,
        availableSeats: 41,
        note: 'Regular Monday rush near the tea counter.',
        source: 'staff-entered',
      },
    ],
    dismissedAlerts: [],
    notices: buildNotices(today),
    forecastAdjustments: {},
    levelOverrides: {},
    selected: { date: today, meal: 'lunch' },
  };
}

/** Refreshes today's records when the app is opened on a later day. */
export function ensureTodayRecords(state) {
  if (!state || !state.settings || !state.menu) return createSeedState();
  const today = todayISO();
  const clockMinutes = resolveClockMinutes(state.settings.demoClock);
  let next = state;

  const hasToday = (next.attendance || []).some((r) => r.date === today);
  if (!hasToday) {
    const day = buildDayRecords(today, clockMinutes, true, state.settings.seatCapacity || DEFAULT_SEAT_CAPACITY);
    next = {
      ...next,
      attendance: [...(next.attendance || []).filter((r) => r.date !== today), ...day.attendance],
      food: [...(next.food || []).filter((r) => r.date !== today), ...day.food],
      queue: [...(next.queue || []).filter((r) => r.date !== today), ...day.queue],
    };
  }
  if (!next.selected || next.selected.date !== today) {
    next = { ...next, selected: { date: today, meal: next.selected?.meal || 'lunch' } };
  }
  return next;
}