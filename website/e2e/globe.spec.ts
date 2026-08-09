// oxlint-disable vitest/prefer-importing-vitest-globals
import { expect, test } from '@playwright/test';

test('renders and supports legend, keyboard, and pointer interaction', async ({
  page,
}) => {
  await page.goto('/');

  const canvas = page.getByLabel('Country choropleth globe');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('role', 'application');

  await page.getByRole('button', { name: /United States/u }).hover();
  await expect(page.getByTestId('globe-tooltip')).toContainText(
    'United States'
  );

  await canvas.focus();
  await page.keyboard.press('ArrowLeft');

  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Globe canvas has no bounding box');
  }
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 30,
    bounds.y + bounds.height / 2
  );
  await page.mouse.up();
});
