/**
 * Alert text DemoBlaze raises, as observed against the live site.
 *
 * Note the two spellings of "product added". addToCart() takes a different
 * branch depending on whether a `tokenp_` token is present, and the two
 * branches disagree about the full stop:
 *
 *   guest     -> alert("Product added")
 *   signed in -> alert("Product added.")
 *
 * That is DEFECT DB-004 in the README. Both spellings are pinned here rather
 * than papered over with a loose regex, so the day the app is made consistent a
 * test says so instead of quietly passing.
 *
 * Only the messages a spec asserts directly are here. A message that varies per
 * test case is carried by the case itself in the JSON data file — the checkout
 * refusals are the example — so this list stays the set of expectations no data
 * row owns.
 */
export const ALERT = {
  productAddedAsGuest: 'Product added',
  productAddedWhenSignedIn: 'Product added.',
  signUpSuccessful: 'Sign up successful.',
  userAlreadyExists: 'This user already exist.',
  wrongPassword: 'Wrong password.',
  userDoesNotExist: 'User does not exist.',
  fillUsernameAndPassword: 'Please fill out Username and Password.',
  fillNameAndCreditcard: 'Please fill out Name and Creditcard.',
} as const;

export const ORDER_CONFIRMATION_TITLE = 'Thank you for your purchase!';
