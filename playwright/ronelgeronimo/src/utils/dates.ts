/**
 * Dynamic dates for test data.
 *
 * Hard-coded dates rot. A card expiry of "2027" is a valid future date today and
 * a silently expired one later; a test that says "a year in the past" and means
 * "1999" stops saying anything the year the data is read. Both are written as
 * tokens instead, expanded relative to the clock at run time.
 *
 * Tokens are usable directly from the JSON data files, so a case that needs a
 * future expiry stays a data edit:
 *
 *   { "month": "{{month}}", "year": "{{year+3}}" }
 *
 * Grammar: {{name[±n][:FORMAT]}}
 *
 *   {{today}}                 2026-09-09    the default format
 *   {{today:DD/MM/YYYY}}      09/09/2026
 *   {{today+30}}              2026-10-09    n is days
 *   {{today-1:DD MMM YYYY}}   08 Sep 2026
 *   {{month}}                 09            n is months
 *   {{month+4}}               01
 *   {{year}}                  2026          n is years
 *   {{year+3}}                2029          a card that has not expired
 *   {{year-5}}                2021          a card that certainly has
 *   {{timestamp}}             m0k3z1q       unique per call, for unique data
 *
 * Format tokens: YYYY, YY, MMM, MM, M, DD, D, HH, mm, ss.
 */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const pad = (value: number): string => String(value).padStart(2, '0');

const FORMAT_TOKEN = /YYYY|YY|MMM|MM|M|DD|D|HH|mm|ss/g;

export function formatDate(date: Date, pattern = 'YYYY-MM-DD'): string {
  return pattern.replace(FORMAT_TOKEN, (token) => {
    switch (token) {
      case 'YYYY': return String(date.getFullYear());
      case 'YY': return pad(date.getFullYear() % 100);
      case 'MMM': return MONTHS_SHORT[date.getMonth()];
      case 'MM': return pad(date.getMonth() + 1);
      case 'M': return String(date.getMonth() + 1);
      case 'DD': return pad(date.getDate());
      case 'D': return String(date.getDate());
      case 'HH': return pad(date.getHours());
      case 'mm': return pad(date.getMinutes());
      case 'ss': return pad(date.getSeconds());
      default: return token;
    }
  });
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

export function timestamp(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const DATE_TOKEN = /\{\{(today|month|year|timestamp)([+-]\d+)?(?::([^}]+))?\}\}/g;

export function expandDateTokens(text: string, now = new Date()): string {
  return text.replace(DATE_TOKEN, (_match, name: string, offset?: string, format?: string) => {
    const n = offset ? Number(offset) : 0;

    switch (name) {
      case 'today': return formatDate(addDays(now, n), format ?? 'YYYY-MM-DD');
      case 'month': return formatDate(addMonths(now, n), format ?? 'MM');
      case 'year': return formatDate(addYears(now, n), format ?? 'YYYY');
      default: return timestamp();
    }
  });
}

export function expandDates<T>(value: T, now = new Date()): T {
  if (typeof value === 'string') {
    return expandDateTokens(value, now) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => expandDates(item, now)) as T;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, expandDates(item, now)]),
    ) as T;
  }
  return value;
}
