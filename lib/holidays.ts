/**
 * Norwegian public holidays — computed, never tabulated.
 *
 * A stored table would go stale the moment it ran past its last year, and the
 * Easter-relative holidays move every year, so the whole set is derived from
 * the year alone. Any year in or out of the current one resolves the same way.
 *
 * These are the twelve official public holidays ("røde dager"). Julaften and
 * nyttårsaften are deliberately absent: they are not public holidays, and many
 * businesses do open on them. An owner who closes early can still add either
 * as a custom exceptional date.
 *
 * Dates are handled as plain calendar dates in local Norwegian time, formatted
 * `YYYY-MM-DD`. Nothing here depends on the machine's timezone, because every
 * date is constructed and read through the same UTC accessors.
 */

/** Stable identifiers — the NO/EN labels live in the message catalogues. */
export const HOLIDAY_KEYS = [
  "newYearsDay",
  "maundyThursday",
  "goodFriday",
  "easterSunday",
  "easterMonday",
  "labourDay",
  "constitutionDay",
  "ascensionDay",
  "whitSunday",
  "whitMonday",
  "christmasDay",
  "boxingDay",
] as const;

export type HolidayKey = (typeof HOLIDAY_KEYS)[number];

export type Holiday = {
  key: HolidayKey;
  /** `YYYY-MM-DD` */
  date: string;
};

/** `YYYY-MM-DD` for a UTC-constructed date, without timezone drift. */
function iso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** A date `offset` days from `base`, still in UTC. */
function addDays(base: Date, offset: number): Date {
  return new Date(base.getTime() + offset * 86_400_000);
}

/**
 * Easter Sunday, by the anonymous Gregorian algorithm. Valid for every year in
 * the Gregorian calendar, which is what makes the whole set year-independent.
 */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Every Norwegian public holiday in `year`, in calendar order. */
export function norwegianPublicHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);

  const list: Holiday[] = [
    { key: "newYearsDay",     date: iso(new Date(Date.UTC(year, 0, 1)))  },
    { key: "maundyThursday",  date: iso(addDays(easter, -3))             },
    { key: "goodFriday",      date: iso(addDays(easter, -2))             },
    { key: "easterSunday",    date: iso(easter)                          },
    { key: "easterMonday",    date: iso(addDays(easter, 1))              },
    { key: "labourDay",       date: iso(new Date(Date.UTC(year, 4, 1)))  },
    { key: "constitutionDay", date: iso(new Date(Date.UTC(year, 4, 17))) },
    { key: "ascensionDay",    date: iso(addDays(easter, 39))             },
    { key: "whitSunday",      date: iso(addDays(easter, 49))             },
    { key: "whitMonday",      date: iso(addDays(easter, 50))             },
    { key: "christmasDay",    date: iso(new Date(Date.UTC(year, 11, 25)))},
    { key: "boxingDay",       date: iso(new Date(Date.UTC(year, 11, 26)))},
  ];

  return list.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * The next `count` holidays on or after `from`, crossing the year boundary as
 * needed. Scanning three consecutive years is what keeps a December view from
 * showing an empty list — the answer is simply next year's January onwards.
 */
export function upcomingNorwegianHolidays(from: Date, count = 8): Holiday[] {
  const year = from.getFullYear();
  const today = iso(new Date(Date.UTC(year, from.getMonth(), from.getDate())));

  return [year, year + 1, year + 2]
    .flatMap((y) => norwegianPublicHolidays(y))
    .filter((h) => h.date >= today)
    .slice(0, count);
}

/** `YYYY-MM-DD` — the shape every exceptional-hours date is stored in. */
export const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** True for a syntactically valid date string that is also a real calendar day. */
export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  // Rejects 2026-02-30 and friends, which the regex alone lets through.
  return (
    parsed.getUTCFullYear() === y &&
    parsed.getUTCMonth() === m - 1 &&
    parsed.getUTCDate() === d
  );
}

/** The holiday falling on `date`, or null when it is an ordinary day. */
export function holidayOn(date: string): HolidayKey | null {
  const year = Number(date.slice(0, 4));
  if (!Number.isInteger(year)) return null;
  return norwegianPublicHolidays(year).find((h) => h.date === date)?.key ?? null;
}
