import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

import type { Credentials } from '../data/testData';

function encodePassword(password: string): string {
  return Buffer.from(password, 'utf8').toString('base64');
}

export function createUniqueCredentials(prefix = 'iona'): Credentials {
  const suffix = `${Date.now()}_${faker.string.alphanumeric({ length: 8, casing: 'lower' })}`;

  return {
    username: `${prefix}_${suffix}`,
    password: 'Password123!',
  };
}

export async function signUpUser(request: APIRequestContext, credentials: Credentials): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await request.post('https://api.demoblaze.com/signup', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          username: credentials.username,
          password: encodePassword(credentials.password),
        },
        timeout: 30000,
      });

      const status = response.status();

      if (status !== 200) {
        throw new Error(`Signup request failed with status ${status}.`);
      }

      const responseText = (await response.text()).trim();

      // Observation: DemoBlaze returns an empty JSON string when the signup succeeds.
      if (responseText && responseText !== '""') {
        throw new Error(`Unexpected signup response: ${responseText}`);
      }

      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}