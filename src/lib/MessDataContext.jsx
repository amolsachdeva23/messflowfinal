import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addDaysISO,
  formatAxisDay,
  minutesToTime,
  timeToMinutes,
  todayISO,
  weekdayKey,
} from '@/lib/dateUtils';
import {
  buildAlerts,
  buildFactors,
  deriveQueue,
  dishesFor,
  expectedDemand,
  forecastFor,
  forecastQuality,
  resolveClockMinutes,
  resolveCurrentMeal,
  serviceState,
} from '@/lib/calculations';
import { createSeedState, ensureTodayRecords, expectedDinersFor } from '@/lib/seedData';
import { MEAL_LABELS, MEAL_PERIODS } from '@/lib/types';

const STORAGE_KEY = 'messflow.demo.v2';
const MessContext = createContext(null);

function loadPersisted() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    raw = null;
  }
  if (!raw) return { state: createSeedState(), error: null };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.settings || !parsed.menu || !Array.isArray(parsed.attendance)) {
      return {
        state: createSeedState(),
        error: 'Saved demo data could not be read. Fresh sample data was loaded.',
      };
    }
    return { state: ensureTodayRecords(parsed), error: null };
  } catch (err) {
    return {
      state: createSeedState(),
      error: 'Saved demo data could not be read. Fresh sample data was loaded.',
    };
  }
}

export function MessDataProvider({ children }) {
  const initial = useMemo(loadPersisted, []);
  const [state, setState] = useState(initial.state);
  const [loadError, setLoadError] = useState(initial.error);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState(initial.state.savedAt || null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const persist = useCallback((next) => {
    const savedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, savedAt }));
    } catch (err) {
      // Storage may be unavailable (private mode) — the demo still works in memory.
    }
    setLastSavedAt(savedAt);
    return savedAt;
  }, []);

  const update = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const nowMinutes = resolveClockMinutes(state.settings?.demoClock);
  const menu = state.menu;
  const selectedDate = state.selected?.date || todayISO();
  const selectedMeal = state.selected?.meal || 'lunch';
  const settings = state.settings;

  const menuDayFor = useCallback((date) => menu[weekdayKey(date)] || null, [menu]);
  const selectedMenuDay = menuDayFor(selectedDate);
  const selectedWindow = selectedMenuDay ? selectedMenuDay[selectedMeal] : null;
  const selectedServiceState = selectedWindow
    ? serviceState(selectedWindow.start, selectedWindow.end, nowMinutes)
    : 'upcoming';

  const attendanceFor = useCallback(
    (date, meal) => (state.attendance || []).find((r) => r.date === date && r.meal === meal) || null,
    [state.attendance],
  );
  const selectedAttendance = attendanceFor(selectedDate, selectedMeal);
  const comparable = attendanceFor(addDaysISO(selectedDate, -7), selectedMeal);

  const adjKey = `${selectedDate}|${selectedMeal}`;
  const expectedDiners =
    state.forecastAdjustments?.[adjKey] ??
    selectedAttendance?.expected ??
    expectedDinersFor(selectedDate, selectedMeal);
  const servedDiners = selectedAttendance?.served || 0;

  const comparableHistory = useMemo(() => {
    const values = [];
    for (let i = 1; i <= 4; i += 1) {
      const rec = attendanceFor(addDaysISO(selectedDate, -7 * i), selectedMeal);
      if (rec && rec.served > 0) values.push(rec.served);
    }
    return values;
  }, [attendanceFor, selectedDate, selectedMeal]);

  const quality = useMemo(() => forecastQuality(comparableHistory), [comparableHistory]);
  const forecast = useMemo(() => forecastFor(selectedMeal, expectedDiners), [selectedMeal, expectedDiners]);
  const forecastFactors = useMemo(
    () =>
      buildFactors({
        date: selectedDate,
        meal: selectedMeal,
        expectedDiners,
        comparableAvg: quality.avg,
        quality,
        dayMenu: selectedMenuDay,
        notices: state.notices,
      }),
    [selectedDate, selectedMeal, expectedDiners, quality, selectedMenuDay, state.notices],
  );

  const foodRows = useMemo(() => {
    const records = state.food || [];
    return dishesFor(selectedMeal).map((model) => {
      const record = records.find(
        (r) => r.date === selectedDate && r.meal === selectedMeal && r.dish === model.dish,
      );
      const demand = expectedDemand(model.perHead, expectedDiners, model.unit);
      if (record) return { ...record, expectedDemand: demand, recorded: true };
      return {
        id: null,
        date: selectedDate,
        meal: selectedMeal,
        dish: model.dish,
        unit: model.unit,
        planned: demand,
        prepared: 0,
        served: 0,
        remaining: 0,
        plateWaste: 0,
        shortage: false,
        note: '',
        source: 'demo',
        expectedDemand: demand,
        recorded: false,
      };
    });
  }, [state.food, selectedDate, selectedMeal, expectedDiners]);

  const remainingKg = useMemo(
    () => foodRows.filter((r) => r.unit === 'kg').reduce((sum, r) => sum + (r.remaining || 0), 0),
    [foodRows],
  );

  const observationsFor = useCallback(
    (date, meal) => (state.queue || []).filter((o) => o.date === date && o.meal === meal),
    [state.queue],
  );
  const manualFor = useCallback(
    (date, meal) => (state.manualObservations || []).filter((o) => o.date === date && o.meal === meal),
    [state.manualObservations],
  );

  const queueStateFor = useCallback(
    (date, meal) =>
      deriveQueue({
        observations: observationsFor(date, meal),
        manualObservations: manualFor(date, meal),
        seatCapacity: settings?.seatCapacity || 180,
        nowMinutes,
        staleAfterMinutes: settings?.staleAfterMinutes || 25,
        levelOverride: state.levelOverrides?.[`${date}|${meal}`] || null,
      }),
    [observationsFor, manualFor, settings, nowMinutes, state.levelOverrides],
  );

  const queueData = useMemo(
    () => queueStateFor(selectedDate, selectedMeal),
    [queueStateFor, selectedDate, selectedMeal],
  );

  const alerts = useMemo(
    () =>
      buildAlerts({
        date: selectedDate,
        meal: selectedMeal,
        serviceStatus: selectedServiceState,
        foodRows,
        queue: queueData,
        expectedDiners,
        comparableAvg: quality.avg,
        thresholds: settings?.thresholds || { queueLength: 35, waitMinutes: 12, seatOccupancy: 85 },
        notifications: settings?.notifications || {},
        dismissed: state.dismissedAlerts || [],
      }),
    [
      selectedDate,
      selectedMeal,
      selectedServiceState,
      foodRows,
      queueData,
      expectedDiners,
      quality.avg,
      settings,
      state.dismissedAlerts,
    ],
  );

  const activitySeries = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = addDaysISO(selectedDate, -i);
      const rec = attendanceFor(d, selectedMeal);
      out.push({
        label: formatAxisDay(d),
        served: rec ? rec.served : 0,
        expected: rec ? rec.expected : expectedDinersFor(d, selectedMeal),
        partial: !!rec?.partial,
      });
    }
    return out;
  }, [attendanceFor, selectedDate, selectedMeal]);

  const studentView = useMemo(() => {
    const today = todayISO();
    const dayMenu = menu[weekdayKey(today)] || null;
    const current = resolveCurrentMeal(dayMenu, nowMinutes);
    const queue = queueStateFor(today, current.meal);
    let nextMeal = null;
    if (current.state !== 'in-service' && dayMenu) {
      for (const meal of MEAL_PERIODS) {
        const window = dayMenu[meal];
        if (window && timeToMinutes(window.start) > nowMinutes) {
          nextMeal = { meal, start: window.start, tomorrow: false };
          break;
        }
      }
      if (!nextMeal) {
        nextMeal = { meal: 'breakfast', start: dayMenu.breakfast.start, tomorrow: true };
      }
    }
    return { today, dayMenu, current, queue, nextMeal };
  }, [menu, nowMinutes, queueStateFor]);

  const setSelectedDate = useCallback(
    (date) => update((prev) => ({ ...prev, selected: { ...prev.selected, date } })),
    [update],
  );
  const setSelectedMeal = useCallback(
    (meal) => update((prev) => ({ ...prev, selected: { ...prev.selected, meal } })),
    [update],
  );
  const updateSettings = useCallback(
    (patch) => update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    [update],
  );
  const setMessLocation = useCallback(
    (activeMess) => updateSettings({ activeMess, messName: activeMess }),
    [updateSettings],
  );

  const saveFoodRows = useCallback(
    (date, meal, rows) =>
      update((prev) => {
        const food = [...(prev.food || [])];
        rows.forEach((row) => {
          const prepared = Number(row.prepared) || 0;
          const served = Number(row.served) || 0;
          const remaining = Number.isFinite(Number(row.remaining))
            ? Math.max(0, Number(row.remaining))
            : Math.max(0, prepared - served);
          const record = {
            id: `food|${date}|${meal}|${row.dish}`,
            date,
            meal,
            dish: row.dish,
            unit: row.unit,
            planned: Number(row.planned) || 0,
            prepared,
            served,
            remaining,
            plateWaste: Number(row.plateWaste) || 0,
            shortage: !!row.shortage,
            note: row.note || '',
            source: 'staff-entered',
          };
          const idx = food.findIndex((r) => r.date === date && r.meal === meal && r.dish === row.dish);
          if (idx >= 0) food[idx] = { ...food[idx], ...record, id: food[idx].id };
          else food.push(record);
        });
        return { ...prev, food };
      }),
    [update],
  );

  const adjustExpectedDiners = useCallback(
    ({ date, meal, value, applyPlanned }) =>
      update((prev) => {
        const key = `${date}|${meal}`;
        const forecastAdjustments = { ...(prev.forecastAdjustments || {}), [key]: value };
        let food = prev.food;
        if (applyPlanned) {
          food = (prev.food || []).map((rec) => {
            if (rec.date !== date || rec.meal !== meal) return rec;
            const model = dishesFor(meal).find((d) => d.dish === rec.dish);
            if (!model) return rec;
            return { ...rec, planned: expectedDemand(model.perHead, value, rec.unit) };
          });
        }
        return { ...prev, forecastAdjustments, food };
      }),
    [update],
  );

  const saveMenuDay = useCallback(
    (day, draft) => update((prev) => ({ ...prev, menu: { ...prev.menu, [day]: draft } })),
    [update],
  );

  const addManualObservation = useCallback(
    (entry) =>
      update((prev) => ({
        ...prev,
        manualObservations: [
          ...(prev.manualObservations || []),
          { id: `mo|${Date.now()}`, source: 'staff-entered', ...entry },
        ],
      })),
    [update],
  );

  const deleteManualObservation = useCallback(
    (id) =>
      update((prev) => ({
        ...prev,
        manualObservations: (prev.manualObservations || []).filter((m) => m.id !== id),
      })),
    [update],
  );

  const setLevelOverride = useCallback(
    (date, meal, level) =>
      update((prev) => {
        const key = `${date}|${meal}`;
        const levelOverrides = { ...(prev.levelOverrides || {}) };
        if (level) levelOverrides[key] = level;
        else delete levelOverrides[key];
        return { ...prev, levelOverrides };
      }),
    [update],
  );

  const dismissAlert = useCallback(
    (id) =>
      update((prev) => ({ ...prev, dismissedAlerts: [...(prev.dismissedAlerts || []), id] })),
    [update],
  );

  const addNotice = useCallback(
    (notice) =>
      update((prev) => ({
        ...prev,
        notices: [
          {
            id: `notice|${Date.now()}`,
            postedAt: new Date().toISOString(),
            date: todayISO(),
            ...notice,
          },
          ...(prev.notices || []),
        ],
      })),
    [update],
  );

  const deleteNotice = useCallback(
    (id) => update((prev) => ({ ...prev, notices: (prev.notices || []).filter((n) => n.id !== id) })),
    [update],
  );

  const saveNow = useCallback(() => persist(stateRef.current), [persist]);

  const resetDemo = useCallback(() => {
    const fresh = createSeedState();
    setState(fresh);
    persist(fresh);
    setLoadError(null);
  }, [persist]);

  const clearLoadError = useCallback(() => setLoadError(null), []);

  const value = {
    // state
    isLoading,
    loadError,
    clearLoadError,
    state,
    settings,
    menu,
    menuDayFor,
    lastSavedAt,
    saveNow,
    resetDemo,
    // clock & selection
    nowMinutes,
    selectedDate,
    selectedMeal,
    setSelectedDate,
    setSelectedMeal,
    updateSettings,
    setMessLocation,
    saveMenuDay,
    selectedMenuDay,
    selectedWindow,
    selectedServiceState,
    // attendance & forecast
    selectedAttendance,
    attendanceFor,
    comparable,
    expectedDiners,
    servedDiners,
    quality,
    forecast,
    forecastFactors,
    // food
    foodRows,
    remainingKg,
    saveFoodRows,
    adjustExpectedDiners,
    // queue
    queueData,
    queueStateFor,
    addManualObservation,
    deleteManualObservation,
    setLevelOverride,
    // alerts & notices
    alerts,
    notices: state.notices,
    dismissAlert,
    addNotice,
    deleteNotice,
    // charts
    activitySeries,
    // student portal
    studentView,
  };

  return <MessContext.Provider value={value}>{children}</MessContext.Provider>;
}

export function useMessData() {
  const context = useContext(MessContext);
  if (!context) throw new Error('useMessData must be used within MessDataProvider');
  return context;
}

export { MEAL_LABELS };