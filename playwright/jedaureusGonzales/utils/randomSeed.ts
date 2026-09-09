import { randomInt } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_SEED_MIN = 1;
const DEFAULT_SEED_MAX_EXCLUSIVE = 2_147_483_647;

export function resolveRandomSeed(envKey = 'PW_RANDOM_SEED'): number {
  const rawSeed = process.env[envKey] ?? readSeedFromDotEnv(envKey);

  if (rawSeed && /^\d+$/.test(rawSeed)) {
    const parsedSeed = Number(rawSeed);

    if (Number.isInteger(parsedSeed) && parsedSeed > 0) {
      return parsedSeed;
    }
  }

  return randomInt(DEFAULT_SEED_MIN, DEFAULT_SEED_MAX_EXCLUSIVE);
}

function readSeedFromDotEnv(envKey: string): string | undefined {
  const dotEnvPath = resolve(process.cwd(), '.env');

  if (!existsSync(dotEnvPath)) {
    return undefined;
  }

  const envContents = readFileSync(dotEnvPath, 'utf8');
  const lines = envContents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');

    if (key === envKey) {
      return valueParts.join('=').trim();
    }
  }

  return undefined;
}
