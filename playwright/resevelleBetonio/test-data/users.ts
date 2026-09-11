export interface Credentials {
  username: string;
  password: string;
}

/**
 * Account for the logged-in flows. Provisioned by the suite via the site's
 * /signup API; the username gets a per-worker suffix at runtime (see fixtures).
 */
export const testUserBase: Credentials = {
  username: 'resevelleBetonio.iona.qa',
  password: 'Iona-QA-2026',
};

export interface InvalidLoginCase {
  scenario: string;
  /** Exact alert text the site raises. */
  expectedAlert: string;
  /** Built from the provisioned user so the wrong-password case targets an existing account. */
  credentials: (registeredUser: Credentials) => Credentials;
}

const unknownUsername = 'resevelleBetonio.no.such.user.7f3a9';
const wrongPassword = 'definitely-not-the-password';

export const invalidLogins: InvalidLoginCase[] = [
  // Invalid username and/or password -> "User does not exist."
  {
    scenario: 'invalid username and password',
    expectedAlert: 'User does not exist.',
    credentials: () => ({ username: unknownUsername, password: wrongPassword }),
  },
  {
    scenario: 'invalid username and a valid password',
    expectedAlert: 'User does not exist.',
    credentials: (registered) => ({ username: unknownUsername, password: registered.password }),
  },
  // The site distinguishes a known username with the wrong password.
  {
    scenario: 'valid username and an invalid password',
    expectedAlert: 'Wrong password',
    credentials: (registered) => ({ username: registered.username, password: wrongPassword }),
  },
  // Missing username and/or password -> "Please fill out Username and Password."
  {
    scenario: 'missing username',
    expectedAlert: 'Please fill out Username and Password.',
    credentials: (registered) => ({ username: '', password: registered.password }),
  },
  {
    scenario: 'missing password',
    expectedAlert: 'Please fill out Username and Password.',
    credentials: (registered) => ({ username: registered.username, password: '' }),
  },
  {
    scenario: 'missing username and password',
    expectedAlert: 'Please fill out Username and Password.',
    credentials: () => ({ username: '', password: '' }),
  },
];
