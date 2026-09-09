import type { LocatorSpec } from './locator.types';
export function itemsWithin(container: string, item: string): LocatorSpec {
  return { css: `${container} ${item}` };
}
