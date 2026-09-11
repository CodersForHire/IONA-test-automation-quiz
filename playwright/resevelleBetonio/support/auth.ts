import { APIRequestContext, BrowserContext } from '@playwright/test';
import { Credentials } from '../test-data/users';

export const API_URL = 'https://api.demoblaze.com';

/** The site base64-encodes passwords before sending them. */
const encodePassword = (password: string): string => Buffer.from(password, 'utf8').toString('base64');

/** Registers the account; an "already exists" answer counts as success. */
export async function ensureUserExists(api: APIRequestContext, user: Credentials): Promise<void> {
  const response = await api.post(`${API_URL}/signup`, {
    data: { username: user.username, password: encodePassword(user.password) },
  });
  const body = (await response.json().catch(() => ({}))) as { errorMessage?: string };
  const ok = response.ok() && (!body.errorMessage || body.errorMessage === 'This user already exist.');
  if (!ok) {
    throw new Error(`Could not provision test user "${user.username}": ${response.status()} ${JSON.stringify(body)}`);
  }
}

/** Logs in via the API and sets the `tokenp_` cookie the site's own login sets. */
export async function loginViaApi(api: APIRequestContext, context: BrowserContext, user: Credentials): Promise<void> {
  const response = await api.post(`${API_URL}/login`, {
    data: { username: user.username, password: encodePassword(user.password) },
  });
  const body = await response.text();
  if (!response.ok() || !body.includes('Auth_token: ')) {
    throw new Error(`API login failed for "${user.username}": ${response.status()} ${body}`);
  }
  // Body is the JSON-quoted string `Auth_token: <token>`.
  const raw = body.trim().startsWith('"') ? (JSON.parse(body) as string) : body;
  const token = raw.replace('Auth_token: ', '').trim();
  await context.addCookies([{ name: 'tokenp_', value: token, domain: '.demoblaze.com', path: '/' }]);
}
