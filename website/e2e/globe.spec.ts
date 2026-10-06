// oxlint-disable vitest/prefer-importing-vitest-globals
import { expect, test } from '@playwright/test';

test('renders and supports the environmental globe sections', async ({
  page,
}) => {
  // Read after drawing because the production context does not preserve pixels.
  await page.addInitScript(() => {
    for (const prototype of [
      WebGLRenderingContext.prototype,
      WebGL2RenderingContext.prototype,
    ]) {
      const draw = prototype.drawArrays;
      prototype.drawArrays = function drawArrays(...args) {
        draw.apply(this, args);
        const canvas = this.canvas as HTMLCanvasElement;
        if (canvas.dataset.renderedPixels) {
          return;
        }
        const pixels = new Uint8Array(32 * 32 * 4);
        this.readPixels(
          Math.floor(canvas.width / 2) - 16,
          Math.floor(canvas.height / 2) - 16,
          32,
          32,
          this.RGBA,
          this.UNSIGNED_BYTE,
          pixels
        );
        let opaque = 0;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] > 0) {
            opaque += 1;
          }
        }
        canvas.dataset.renderedPixels = String(opaque);
      };
    }
  });
  await page.goto('/');

  await expect(page.locator('#forest-heading')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Where the oil comes from' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'How much freshwater does each person draw?',
    })
  ).toBeVisible();

  const forestGlobe = page.getByLabel('Forest area per person by country');
  await expect(forestGlobe).toHaveAttribute('role', 'img');

  const oilGlobe = page.getByLabel('Oil production by country');
  await expect(oilGlobe).toHaveAttribute('role', 'application');
  // Sections use content-visibility, so visit them in order before reading pixels.
  for (const canvas of await page.locator('canvas').all()) {
    // oxlint-disable-next-line eslint/no-await-in-loop
    await canvas.scrollIntoViewIfNeeded();
    // oxlint-disable-next-line eslint/no-await-in-loop
    await expect(canvas).toHaveAttribute('data-rendered-pixels', '1024');
  }

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
