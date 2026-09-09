import { expandDates } from './dates';

/**
 * Load the cases out of a JSON data file.
 *
 * Two jobs, both of which every suite used to do by hand:
 *
 * 1. Expand date tokens (see utils/dates.ts), so a case can say `{{year+3}}`
 *    and no spec has to know that it did.
 * 2. Apply the case type, so a malformed row is a compile error at the point of
 *    use rather than a confusing runtime failure.
 */
export function loadCases<T>(file: { readonly cases: readonly unknown[] }): T[] {
  return expandDates([...file.cases]) as T[];
}

export function loadCase<T>(value: unknown): T {
  return expandDates(value) as T;
}
