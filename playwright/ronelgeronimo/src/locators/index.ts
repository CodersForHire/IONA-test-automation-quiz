import { ENV, type EnvName } from '../utils/env';
import { DEV_LOCATORS } from './dev';
import type { LocatorSpec } from './locator.types';
import { STAGING_LOCATORS } from './staging';
import { TEST_LOCATORS } from './test';

/**
 * The locator set for the environment this run is pointed at.
 *
 * Resolved once, at import, from TEST_ENV — the same variable that picks the
 * base URL and the timeouts. Page objects read from here and hold no selectors
 * of their own, so pointing the suite at a differently-built host is an edit
 * under that environment's folder and nothing else.
 *
 * Each environment owns a COMPLETE set rather than a set of deltas: dev/, test/
 * and staging/ each hold their own pages/ and component.locators.ts, and are
 * free to diverge element by element.
 */

export type Locators = {
  [Group in keyof typeof TEST_LOCATORS]: Record<keyof (typeof TEST_LOCATORS)[Group], LocatorSpec>;
};

const LOCATOR_SETS: Record<EnvName, Locators> = {
  dev: DEV_LOCATORS,
  test: TEST_LOCATORS,
  staging: STAGING_LOCATORS,
};

export const LOCATORS: Locators = LOCATOR_SETS[ENV];
