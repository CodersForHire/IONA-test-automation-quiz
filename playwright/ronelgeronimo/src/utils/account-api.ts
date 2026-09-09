import type { APIRequestContext } from '@playwright/test';

import { API_URL } from './env';
import type { TestUser } from './types';

/**
 * Make sure a DemoBlaze account exists, creating it if it does not.
 *
 * The site base64-encodes the password before posting it (b64EncodeUnicode in
 * index.js), so this has to as well or the account is created with a password
 * that the UI login can never reproduce.
 *
 * Idempotent: a fresh account returns an empty body, an existing one returns
 * "This user already exist.". Both mean the account is ready to sign in with.
 */
export async function ensureAccount(
  request: APIRequestContext,
  user: TestUser,
): Promise<void> {
  const response = await request.post(`${API_URL}/signup`, {
    data: {
      username: user.username,
      password: Buffer.from(user.password, 'utf8').toString('base64'),
    },
  });

  const body = (await response.text()).trim().replace(/^"|"$/g, '');

  if (body === '' || body.includes('This user already exist.')) return;

  throw new Error(
    `Could not prepare the DemoBlaze account "${user.username}": ${body || '(empty response)'}`,
  );
}
