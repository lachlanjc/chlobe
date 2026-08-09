// oxlint-disable vitest/prefer-importing-vitest-globals
import { expect, test } from '@playwright/test';

test('renders four distinct environmental globe sections', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Room to grow' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Where the oil comes from' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'How much freshwater does each person draw?',
    })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The almost-complete grid' })
  ).toBeVisible();

  const forestGlobe = page.getByLabel('Forest area per person by country');
  await expect(forestGlobe).toHaveAttribute('role', 'img');

  const oilGlobe = page.getByLabel('Oil production by country');
  await expect(oilGlobe).toHaveAttribute('role', 'application');

  const oilSection = page.locator('section[aria-labelledby="oil-heading"]');
  await expect(oilSection.getByRole('button')).toHaveCount(5);

  await oilGlobe.focus();
  await page.keyboard.press('ArrowLeft');

  const bounds = await oilGlobe.boundingBox();
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
