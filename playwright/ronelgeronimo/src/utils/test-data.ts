import { timestamp } from './dates';

/**
 * Generate a username that cannot collide with an existing DemoBlaze account
 * or with a parallel worker.
 *
 * The negative login cases need both a name that certainly does not exist and,
 * for "Wrong password.", an account that certainly does. Generating one per run
 * keeps those tests independent of any shared account someone else may have
 * changed.
 */
export function uniqueUsername(prefix: string): string {
  return `${prefix}_${timestamp()}`;
}
