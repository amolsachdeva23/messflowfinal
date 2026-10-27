/**
 * Shared domain vocabulary and models for MessFlow.
 *
 * The shape of each record is documented with JSDoc typedefs so the local
 * sample-data layer can be swapped for a future REST / computer-vision service
 * without changing the pages that consume it.
 */

/** @typedef {'breakfast'|'lunch'|'snacks'|'dinner'} MealPeriod */
/** @typedef {'kg'|'pieces'|'cups'} QuantityUnit */
/**
 * How a value reached the interface. Every measurement shown in the UI carries one:
 * - `recorded`  actual value recorded by staff or the mess register
 * - `staff-entered` a manual observation typed by mess staff
 * - `simulated` simulated sensor / counter data used for the demo
 * - `estimated` a forecast produced from historical patterns
 * - `demo` sample data seeded for the demonstration
 */
/** @typedef {'recorded'|'staff-entered'|'simulated'|'estimated'|'demo'} SourceKind */

/**
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} name
 * @property {boolean} veg
 */

/**
 * @typedef {Object} MenuMeal
 * @property {string} start 'HH:MM'
 * @property {string} end 'HH:MM'
 * @property {string} notice
 * @property {MenuItem[]} items
 */

/** @typedef {Record<string, Record<MealPeriod, MenuMeal>>} WeeklyMenu */

/**
 * @typedef {Object} QueueObservation
 * @property {string} id
 * @property {string} date ISO date
 * @property {MealPeriod} meal
 * @property {string} time 'HH:MM' observation time
 * @property {number} queueLength people waiting to be served
 * @property {number} beingServed people at the serving counter
 * @property {number} diningCount people seated and eating
 * @property {number} peopleInside total people inside the dining area
 * @property {number} waitMinutes estimated waiting time
 * @property {number} availableSeats
 * @property {SourceKind} source
 * @property {string} [note]
 */

/**
 * @typedef {Object} AttendanceRecord
 * @property {string} id
 * @property {string} date ISO date
 * @property {MealPeriod} meal
 * @property {number} expected expected diners
 * @property {number} served meals served so far
 * @property {boolean} partial true while service is still in progress
 * @property {SourceKind} source
 */

/**
 * @typedef {Object} FoodQuantityRecord
 * @property {string} id
 * @property {string} date ISO date
 * @property {MealPeriod} meal
 * @property {string} dish
 * @property {QuantityUnit} unit
 * @property {number} planned planned quantity
 * @property {number} prepared quantity prepared
 * @property {number} served quantity served or issued
 * @property {number} remaining unserved leftover
 * @property {number} plateWaste separately weighed plate waste
 * @property {boolean} shortage reported shortage
 * @property {string} note
 * @property {SourceKind} source
 */

/**
 * @typedef {Object} DemandForecast
 * @property {string} date
 * @property {MealPeriod} meal
 * @property {number} expectedDiners
 * @property {'High'|'Moderate'|'Low'} quality forecast quality for the demo estimate
 * @property {number} sampleSize comparable meals used
 * @property {string[]} factors
 * @property {{dish: string, unit: QuantityUnit, expectedDemand: number}[]} items
 */

/**
 * @typedef {Object} OperationalAlert
 * @property {string} id
 * @property {'info'|'warning'|'critical'} severity
 * @property {string} title
 * @property {string} detail
 * @property {string} action
 * @property {string} to route for the action
 * @property {MealPeriod} meal
 * @property {string} date
 */

/**
 * @typedef {Object} Notice
 * @property {string} id
 * @property {string} title
 * @property {string} body
 * @property {'timing'|'menu'|'delay'} type
 * @property {string} postedAt ISO datetime
 * @property {string} date ISO date
 */

/**
 * @typedef {Object} MessSettings
 * @property {string} messName
 * @property {string} campus
 * @property {string[]} messOptions
 * @property {number} seatCapacity
 * @property {number} serviceStations
 * @property {{queueLength: number, waitMinutes: number, seatOccupancy: number}} thresholds
 * @property {number} staleAfterMinutes
 * @property {{queueAlerts: boolean, shortageAlerts: boolean, dailySummary: boolean}} notifications
 * @property {{name: string, role: string, initials: string}} staff
 * @property {{mode: 'fixed'|'live', fixedTime: string}} demoClock
 */

export const MEAL_PERIODS = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const DAY_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export const CROWD_LEVELS = ['low', 'moderate', 'high'];

export const CROWD_META = {
  low: { label: 'Low crowding', tone: 'ok', description: 'Queue is short. Walk in and collect your meal.' },
  moderate: { label: 'Moderate crowding', tone: 'warn', description: 'A short wait at the counter. Around 5–10 minutes.' },
  high: { label: 'High crowding', tone: 'danger', description: 'Long queue at the counter. Consider a later slot.' },
};

export const NOTICE_TYPE_LABELS = {
  timing: 'Timing change',
  menu: 'Menu update',
  delay: 'Service delay',
};

export const UNIT_LABELS = {
  kg: 'kg',
  pieces: 'pieces',
  cups: 'cups',
};