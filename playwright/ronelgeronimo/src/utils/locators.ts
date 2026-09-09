import type { Locator, Page } from '@playwright/test';

import type { LocatorParams, LocatorSpec, Scope } from '../locators/locator.types';

/**
 * Turns a `LocatorSpec` into a Playwright `Locator`.
 *
 * The specs themselves — and the per-environment overrides applied to them —
 * live in locators/. This is only the interpreter that reads one, so it sits
 * with the other helpers rather than with the data it consumes.
 */

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

function fill(template: string, params: LocatorParams): string {
  return template.replace(PLACEHOLDER, (_match, key: string) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(
        `Locator template "${template}" has no value for {{${key}}}. ` +
          `Pass it as a parameter to resolve().`,
      );
    }
    return String(value);
  });
}

function fillName(
  name: string | RegExp | undefined,
  params: LocatorParams,
): string | RegExp | undefined {
  return typeof name === 'string' ? fill(name, params) : name;
}

function pageOf(scope: Scope): Page {
  const maybeLocator = scope as Locator;
  return typeof maybeLocator.page === 'function' ? maybeLocator.page() : (scope as Page);
}

function build(scope: Scope, spec: LocatorSpec, params: LocatorParams): Locator {
  if ('role' in spec) {
    return scope.getByRole(spec.role, {
      name: fillName(spec.name, params),
      exact: spec.exact,
      level: spec.level,
    });
  }
  if ('label' in spec) {
    return scope.getByLabel(fill(spec.label, params), { exact: spec.exact });
  }
  if ('placeholder' in spec) {
    return scope.getByPlaceholder(fill(spec.placeholder, params), { exact: spec.exact });
  }
  if ('text' in spec) {
    return scope.getByText(fill(spec.text, params), { exact: spec.exact });
  }
  if ('testId' in spec) {
    return scope.getByTestId(fill(spec.testId, params));
  }
  return scope.locator(fill(spec.css, params));
}

export function resolve(
  scope: Scope,
  spec: LocatorSpec,
  params: LocatorParams = {},
): Locator {
  // `within` narrows the SCOPE before the spec is built, so the spec describes
  // the element and the container it lives in separately, and both stay
  // role-based. Applied first: the filters below refine the result, not the
  // container it was found in.
  const base = spec.within ? resolve(scope, spec.within, params) : scope;

  let locator = build(base, spec, params);

  if (spec.has) {
    locator = locator.filter({ has: resolve(pageOf(scope), spec.has, params) });
  }
  if (spec.hasText !== undefined) {
    locator = locator.filter({ hasText: fill(spec.hasText, params) });
  }
  if (spec.nth !== undefined) {
    locator = locator.nth(spec.nth);
  }

  return locator;
}
