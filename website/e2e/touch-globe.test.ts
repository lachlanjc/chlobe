// oxlint-disable vitest/prefer-importing-vitest-globals
import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['iPhone 13'], browserName: 'webkit' });

test('keeps a country tooltip visible after a tap with or without rotation', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const canvas = page.getByLabel('Country tooltip globe preview');
  const tooltip = page.getByRole('tooltip');
  const autoRotate = page.getByRole('switch', { name: 'Auto-rotate' }).nth(2);

  for (const rotate of [true, false]) {
    if (!rotate) {
      // oxlint-disable-next-line eslint/no-await-in-loop
      await autoRotate.focus();
      // oxlint-disable-next-line eslint/no-await-in-loop
      await page.keyboard.press('Space');
      // oxlint-disable-next-line eslint/no-await-in-loop
      await expect(autoRotate).not.toBeChecked();
    }
    // Lazy sections can change the page height while scrolling to the canvas.
    // oxlint-disable-next-line eslint/no-await-in-loop
    await expect
      .poll(async () => {
        await canvas.scrollIntoViewIfNeeded();
        return await canvas.evaluate((element: HTMLCanvasElement) => {
          const bounds = element.getBoundingClientRect();
          return (
            document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2
            ) === element
          );
        });
      })
      .toBe(true);
    // oxlint-disable-next-line eslint/no-await-in-loop
    const bounds = await canvas.boundingBox();
    if (!bounds) {
      throw new Error('Globe canvas has no bounding box');
    }

    // Sample the visible globe until a country is found as the globe rotates.
    const positions = [0.3, 0.4, 0.5, 0.6, 0.7].flatMap((y) =>
      [0.3, 0.4, 0.5, 0.6, 0.7].map((x) => [x, y])
    );
    for (const [x, y] of positions) {
      // oxlint-disable-next-line eslint/no-await-in-loop
      await page.touchscreen.tap(
        bounds.x + bounds.width * x,
        bounds.y + bounds.height * y
      );
      // oxlint-disable-next-line eslint/no-await-in-loop
      if (await tooltip.isVisible()) {
        break;
      }
    }
    // oxlint-disable-next-line eslint/no-await-in-loop
    await expect(tooltip).toBeVisible();
    // The tooltip must survive the touch pointer leaving the canvas.
    // oxlint-disable-next-line eslint/no-await-in-loop
    await page.waitForTimeout(300);
    // oxlint-disable-next-line eslint/no-await-in-loop
    await expect(tooltip).toBeVisible();
  }
});
