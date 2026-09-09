import { accessibility as data } from '../../src/data';
import {
  expect,
  loadCases,
  test,
  type AccessibilityCase,
} from '../../src/fixtures/page-manager.fixture';
import { analyzeA11y, describeViolations, violationIds } from '../../src/utils/a11y';

/**
 * REGRESSION — accessibility checks with axe.
 *
 * Regression only: they are Chromium-only, and a changed baseline is not a
 * reason to block a deployment the way a broken checkout is. Still selectable
 * on their own with `--grep @a11y`.
 *
 * DemoBlaze has real, long-standing violations, so "zero violations" would be a
 * permanently red test that nobody looks at. Instead each page carries a
 * baseline of the rule ids it currently breaks, and the assertion is that the
 * set has not changed:
 *
 *   a new rule id      -> fail, something regressed
 *   a missing rule id  -> fail, something was fixed and the baseline must shrink
 *
 * The second half is what stops the baseline decaying into a permanent
 * allow-list. Every entry names the defect it stands for.
 *
 * How a case is REACHED is part of its data. Pages with a standing URL are
 * opened by path; the product page is opened through the catalogue with
 * HomePage.openProduct(), because /prod.html?idp_=<id> identifies a product by
 * database key rather than by name. Going through the UI also means this spec
 * scans the page a user actually lands on, and stops carrying an id that no
 * page object or locator file knows about.
 */
const cases = loadCases<AccessibilityCase>(data);
const { wcagTags } = data;

test.describe('Accessibility', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    "axe's colour-contrast results are rendering-engine specific; checked on Chromium only",
  );

  for (const testCase of cases) {
    test(
      `${testCase.title} breaks no accessibility rules beyond its baseline`,
      { tag: testCase.tags },
      async ({ page, pm }) => {
        await test.step(`Open ${testCase.title}`, async () => {
          if ('product' in testCase) {
            await pm.homePage.open();
            await pm.homePage.selectCategory(testCase.category);
            await pm.homePage.openProduct(testCase.product);
          } else {
            await page.goto(testCase.path);
          }

          await expect(page.getByText(testCase.ready).first()).toBeVisible();
        });

        const violations = await test.step('Run axe against the page', async () =>
          analyzeA11y(page, wcagTags));

        const report = describeViolations(violations) || 'no violations';

        await test.step('Verify the violations match the baseline', async () => {
          await test.info().attach(`axe-${testCase.title}`, {
            body: report,
            contentType: 'text/plain',
          });

          expect(violationIds(violations), report).toEqual(
            Object.keys(testCase.baseline).sort(),
          );
        });
      },
    );
  }
});
