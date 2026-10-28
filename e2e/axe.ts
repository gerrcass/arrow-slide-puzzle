import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';

const require = createRequire(import.meta.url);

export interface AxeViolation {
  readonly id: string;
  readonly impact: string;
  readonly help: string;
  readonly targets: readonly string[];
}

interface AxeRunResult {
  readonly violations: readonly {
    readonly id: string;
    readonly impact: string | null;
    readonly help: string;
    readonly nodes: readonly { readonly target: readonly string[] }[];
  }[];
}

/**
 * Runs axe-core in the page against WCAG A/AA (including 2.1 and 2.2) and
 * returns serious or critical violations. Exceptions, if any, are documented
 * in docs/accessibility.md rather than silently suppressed here.
 */
export async function seriousAxeViolations(page: Page): Promise<readonly AxeViolation[]> {
  const source = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await page.addScriptTag({ content: source });
  const result = await page.evaluate(async () => {
    const scoped = window as unknown as {
      axe: {
        run: (
          context: Document,
          options: Record<string, unknown>,
        ) => Promise<AxeRunResult>;
      };
    };
    return scoped.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
      },
      resultTypes: ['violations'],
    });
  });

  return result.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? 'unknown',
      help: violation.help,
      targets: violation.nodes.flatMap((node) => node.target),
    }));
}
