import { APIRequestContext } from '@playwright/test';
import { MESSAGES } from '../data/testData';

const API_BASE_URL = 'https://api.demoblaze.com';

/**
 * Base64-encodes a password exactly the way DemoBlaze's own client JS does
 * (js/cart.js#b64EncodeUnicode - a UTF-8-safe base64 encode), verified
 * live against the deployed site: an account created here still logs in
 * correctly through the real Log In modal, which independently re-applies
 * this same encoding to whatever the user types before sending it to
 * `POST /login`. Node's Buffer-based UTF-8-to-base64 encoding produces the
 * identical byte sequence as the browser's approach, so the two stay
 * compatible.
 */
function encodePassword(password: string): string {
  return Buffer.from(password, 'utf-8').toString('base64');
}

/** Shape of DemoBlaze's `/signup` response when it's rejecting the request
 *  (e.g. `{ "errorMessage": "This user already exist." }`). A successful
 *  sign-up returns the JSON string `""` instead, which fails this check
 *  and correctly falls through to "no error". */
interface SignupErrorResponse {
  errorMessage: string;
}

function isSignupErrorResponse(value: unknown): value is SignupErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'errorMessage' in value &&
    typeof (value as { errorMessage: unknown }).errorMessage === 'string'
  );
}

/**
 * Registers `username`/`password` directly against DemoBlaze's backend
 * (`POST /signup`), without going through the Sign Up modal.
 *
 * Per the team's conventions doc (§9): "Use API calls to set up UI test
 * state... instead of clicking through the UI to reach a precondition."
 * Creating an account is exactly that kind of precondition for every test
 * that calls this - authenticated-checkout.spec.ts, regression.spec.ts's
 * logout test, and negative.spec.ts's wrong-password test all need *a*
 * real account to exist, but aren't testing sign-up itself. Only
 * negative.spec.ts's own duplicate-signup test deliberately keeps using
 * the real Sign Up modal, because signing up IS the behavior under test
 * there.
 *
 * Tolerates the account already existing (DemoBlaze's shared, persistent
 * backend has no reset between runs), so it's safe to call unconditionally
 * rather than tracking whether a given run already created it. Response
 * shape verified live: a successful sign-up returns an empty JSON string
 * body (`""`), not an object, while a duplicate returns
 * `{ "errorMessage": "This user already exist." }`.
 */
export async function ensureUserRegistered(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<void> {
  const response = await request.post(`${API_BASE_URL}/signup`, {
    data: { username, password: encodePassword(password) },
  });
  const body: unknown = await response.json().catch(() => null);
  const errorMessage = isSignupErrorResponse(body) ? body.errorMessage : undefined;

  if (errorMessage && errorMessage !== MESSAGES.userAlreadyExists) {
    throw new Error(`Unexpected sign-up response while seeding test user: "${errorMessage}"`);
  }
}
