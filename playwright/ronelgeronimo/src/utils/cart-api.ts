import type { APIRequestContext, BrowserContext } from '@playwright/test';

import { API_URL } from './env';

interface CartItem {
  id: string;
  prod_id: number;
}

/** The signed-in user's auth token, or undefined for an anonymous context. */
export async function authToken(context: BrowserContext): Promise<string | undefined> {
  const cookies = await context.cookies();
  return cookies.find((c) => c.name === 'tokenp_')?.value;
}

export async function emptyCart(
  request: APIRequestContext,
  token: string,
): Promise<void> {
  const response = await request.post(`${API_URL}/viewcart`, {
    data: { cookie: token, flag: true },
  });

  const body = (await response.json()) as { Items?: CartItem[] };

  for (const item of body.Items ?? []) {
    await request.post(`${API_URL}/deleteitem`, { data: { id: item.id } });
  }
}
