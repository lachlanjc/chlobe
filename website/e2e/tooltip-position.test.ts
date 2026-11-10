// oxlint-disable vitest/prefer-importing-vitest-globals
import { devices, expect, test } from '@playwright/test';

import { getTooltipPosition } from '../components/tooltip-position';

test.use({ ...devices['iPhone 13'], browserName: 'webkit' });

test('keeps long tooltips within narrow screens', async ({ page }) => {
  const checkWidth = async (viewportWidth: number) => {
    await page.setViewportSize({ height: 600, width: viewportWidth });
    await page.setContent(`
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body { margin: 0; } #globe { container-type: inline-size; margin: 24px; position: relative; }</style>
      <div id="globe"><div id="tooltip">An exceptionally long country name and an unbroken value: ${'x'.repeat(300)}</div></div>
    `);
    const globe = page.locator('#globe');
    const tooltip = page.locator('#tooltip');
    const bounds = await globe.boundingBox();
    if (!bounds) {
      throw new Error('Globe container has no bounding box');
    }

    for (const x of [
      -50,
      0,
      bounds.width / 2,
      bounds.width,
      bounds.width + 50,
    ]) {
      // oxlint-disable-next-line eslint/no-await-in-loop
      await tooltip.evaluate(
        (element, position) => {
          Object.assign((element as HTMLElement).style, position);
        },
        getTooltipPosition(x, 100)
      );
      // oxlint-disable-next-line eslint/no-await-in-loop
      const result = await tooltip.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          contentFits: element.scrollWidth <= element.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
          left: rect.left,
          right: rect.right,
        };
      });
      expect(result.contentFits).toBe(true);
      expect(Math.abs(result.bottom - (bounds.y + 88))).toBeLessThan(1);
      expect(
        Math.abs(
          result.left -
            (bounds.x + Math.max(0, Math.min(x - 110, bounds.width - 220)))
        )
      ).toBeLessThan(1);
      expect(result.left).toBeGreaterThanOrEqual(0);
      expect(result.right).toBeLessThanOrEqual(viewportWidth);
      expect(result.documentWidth).toBe(viewportWidth);
    }
  };
  await checkWidth(240);
  await checkWidth(320);
  await checkWidth(390);
});

test('preserves the demo tooltip colors', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const oil = page.locator('section[aria-labelledby="oil-heading"]');
  await oil.getByRole('button', { name: 'United States 10,350 TWh' }).focus();
  const tooltip = oil.getByTestId('globe-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('background-color', 'rgb(16, 35, 66)');
  await expect(tooltip).toHaveCSS('color', 'rgb(241, 245, 255)');
});
