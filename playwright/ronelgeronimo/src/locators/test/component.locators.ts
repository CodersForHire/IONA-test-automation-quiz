import type { LocatorGroup } from '../locator.types';

/**
 * Selectors for the shared components — the pieces of UI that belong to no
 * single page.
 *
 * The nav bar rides on every page, the three modals are opened from more than
 * one of them, and the SweetAlert confirmation is an overlay with no page of
 * its own. Each page object gets its own file under pages/; these have no page
 * to sit beside, so they live together here and are read by the matching class
 * in components/.
 *
 * Strategy is the framework's: role and accessible name first, `label` next,
 * and `css` only where the markup makes role-based addressing genuinely
 * ambiguous. Every `css` entry says why, and every reason below was checked
 * against the live DemoBlaze DOM rather than assumed.
 */

export const NAV_BAR_LOCATORS = {
  loginLink: { role: 'link', name: 'Log in', exact: true },
  signUpLink: { role: 'link', name: 'Sign up', exact: true },
  welcomeLink: { role: 'link', name: 'Welcome {{username}}', exact: true },
  // By id, and it has to stay that way. Signed out this is
  // `<a id="nameofuser" style="display:none">` with no text, and the specs
  // assert toBeHidden() on it. An element hidden with display:none is not in
  // the accessibility tree, so a role-based locator would match NOTHING —
  // toBeHidden() would still pass, but vacuously, and would no longer prove
  // the element is present and hidden.
  welcomeLabel: { css: '#nameofuser' },
  logOutLink: { role: 'link', name: 'Log out', exact: true },
} as const satisfies LocatorGroup;

/**
 * The "Log in" modal.
 *
 * The modal itself is a real `role="dialog"` labelled by its title, so it is
 * addressed that way. Its two FIELDS are not: the markup has
 * `<label for="log-name">Username:</label>` above `<input id="loginusername">`
 * — the `for` points at an element that does not exist, so the labels are
 * associated with nothing. Confirmed on the live page: getByLabel("Username:")
 * matches 0 elements, and getByRole("textbox") inside the modal matches both
 * inputs, so neither can address a field. That broken association is itself a
 * real accessibility defect (DEFECT DB-005 in the README); the ids are stable
 * and author-written, so they are what is left.
 */
export const LOGIN_MODAL_LOCATORS = {
  root: { css: '#logInModal' },
  usernameInput: { css: '#loginusername' },
  passwordInput: { css: '#loginpassword' },
  submitButton: { role: 'button', name: 'Log in' },
} as const satisfies LocatorGroup;

/**
 * The "Sign up" modal.
 *
 * Unlike the login modal, this one's labels are wired up correctly —
 * `<label for="sign-username">` does point at `<input id="sign-username">` —
 * so the fields are addressed by their labels. DB-005 is a defect in the login
 * modal only.
 */
export const SIGN_UP_MODAL_LOCATORS = {
  root: { css: '#signInModal' },
  usernameInput: { css: '#sign-username' },
  passwordInput: { css: '#sign-password' },
  submitButton: { role: 'button', name: 'Sign up' },
} as const satisfies LocatorGroup;

/**
 * The "Place Order" modal: name, country, city, credit card, month, year.
 *
 * `totalLabel` is the total as DISPLAYED, and it is matched by its text because
 * it is a `<label>`: the markup gives it `for="name"`, the same input the
 * "Name:" label points at, so getByLabel("Total:") resolves to the name INPUT
 * and not to the text the specs assert on. Matching the label's own text is
 * what actually addresses it.
 *
 * `closeButton` is filtered by text because the modal has two buttons named
 * "Close" — the × in the header (named by aria-label) and the footer button.
 * Only the second carries "Close" as text.
 */
export const ORDER_MODAL_LOCATORS = {
  root: { css: '#orderModal' },
  totalLabel: { css: '#totalm' },
  nameInput: { css: '#name' },
  countryInput: { label: 'Country:' },
  cityInput: { label: 'City:' },
  cardInput: { label: 'Credit card:' },
  monthInput: { label: 'Month:' },
  yearInput: { label: 'Year:' },
  purchaseButton: { role: 'button', name: 'Purchase' },
  closeButton: { role: 'button', name: 'Close', hasText: 'Close' },
} as const satisfies LocatorGroup;

/**
 * The SweetAlert order confirmation.
 *
 * The root stays CSS, and deliberately. SweetAlert renders a bare
 * `<div class="sweet-alert">` with NO role attribute, while the Bootstrap order
 * modal behind it still carries `role="dialog"` — so getByRole("dialog") at
 * this moment matches the ORDER MODAL, not the confirmation. Verified on the
 * live page. Everything inside the root is role-based.
 */
export const ORDER_CONFIRMATION_LOCATORS = {
  root: { css: '.sweet-alert' },
  title: { role: 'heading' },
  details: { css: 'p' },
  confirmButton: { role: 'button', name: 'OK' },
} as const satisfies LocatorGroup;
