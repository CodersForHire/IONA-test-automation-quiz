import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { Result } from 'axe-core';

/**
 * Run axe against the current page and return the violations.
 *
 * One place to change the WCAG scope for the whole suite.
 */
export async function analyzeA11y(page: Page, tags: string[]): Promise<Result[]> {
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  return results.violations;
}

export function violationIds(violations: Result[]): string[] {
  return violations.map((v) => v.id).sort();
}

export function describeViolations(violations: Result[]): string {
  return violations
    .map((v) => `${v.id} (${v.impact ?? 'unknown'}, ${v.nodes.length} node(s)): ${v.help}`)
    .join('\n');
}
