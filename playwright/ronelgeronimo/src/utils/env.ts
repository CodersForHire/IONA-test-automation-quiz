import * as path from 'node:path';
import * as dotenv from 'dotenv';

import environments from '../../environments.json';
import type { EnvConfig, TestUser } from './types';

/**
 * Environment resolution for the whole suite.
 *
 * One config, one set of specs; the environment is chosen at run time by
 * TEST_ENV. Copying playwright.config.ts per environment is the alternative,
 * and it guarantees the copies drift apart.
 */

export const ENVIRONMENTS = ['dev', 'test', 'staging'] as const;
export type EnvName = (typeof ENVIRONMENTS)[number];

function resolveEnvName(): EnvName {
  const raw = process.env.TEST_ENV?.trim().toLowerCase();

  if (!raw) return 'test';

  if (!(ENVIRONMENTS as readonly string[]).includes(raw)) {
    throw new Error(
      `Unknown TEST_ENV "${process.env.TEST_ENV}". ` +
        `Expected one of: ${ENVIRONMENTS.join(', ')}.`,
    );
  }
  return raw as EnvName;
}

export const ENV: EnvName = resolveEnvName();

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

dotenv.config({ path: path.join(REPO_ROOT, `.env.${ENV}`), quiet: true });
dotenv.config({ path: path.join(REPO_ROOT, '.env'), quiet: true });

const fromFile = (environments as Record<EnvName, EnvConfig>)[ENV];

export const envConfig: EnvConfig = {
  ...fromFile,
  baseURL: process.env.BASE_URL ?? fromFile.baseURL,
};

export const API_URL = process.env.API_URL ?? 'https://api.demoblaze.com';

/**
 * Worker count for the run, from PW_WORKERS.
 *
 * Concurrency is a per-machine and per-target decision — a laptop, a CI agent
 * and a Docker container with a capped `--cpus` all want different numbers, and
 * the system under test is a shared public demo that starts timing out when
 * pushed. Keeping it in .env means changing it does not mean editing the config
 * that every environment shares.
 *
 * Accepts a positive integer ("4") or a percentage of cores ("50%"), which is
 * what Playwright's own `workers` option takes. Unset falls back to the defaults
 * below: deliberately low, matched to what DemoBlaze can serve.
 */
export function resolveWorkers(): number | string {
  const raw = process.env.PW_WORKERS?.trim();

  if (!raw) return process.env.CI ? 2 : 4;

  if (/^\d+%$/.test(raw)) {
    if (Number.parseInt(raw, 10) > 0) return raw;
  } else if (/^\d+$/.test(raw)) {
    const count = Number.parseInt(raw, 10);
    if (count > 0) return count;
  }

  throw new Error(
    `Invalid PW_WORKERS "${process.env.PW_WORKERS}". ` +
      `Expected a positive integer (e.g. 4) or a percentage of cores (e.g. "50%").`,
  );
}

export const AUTH_DIR = path.join(REPO_ROOT, '.auth');

export function hasCredentials(): boolean {
  return Boolean(process.env.DEMOBLAZE_USER && process.env.DEMOBLAZE_PASS);
}

export function credentials(): TestUser {
  const username = process.env.DEMOBLAZE_USER;
  const password = process.env.DEMOBLAZE_PASS;

  if (!username || !password) {
    throw new Error(
      `Missing DEMOBLAZE_USER / DEMOBLAZE_PASS for TEST_ENV="${ENV}".\n` +
        `Copy .env.example to .env (or .env.${ENV}) and fill in a DemoBlaze account.\n` +
        `Register one in seconds at ${envConfig.baseURL} via the "Sign up" link.`,
    );
  }

  return { username, password };
}
