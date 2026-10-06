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
      const { createProgram: originalCreateProgram } = prototype;
      prototype.createProgram = function createProgram() {
        const canvas = this.canvas as HTMLCanvasElement;
        canvas.dataset.programCount = String(
          Number(canvas.dataset.programCount ?? 0) + 1
        );
        return originalCreateProgram.call(this);
      };
      const draw = prototype.drawArrays;
      prototype.drawArrays = function drawArrays(...args) {
        draw.apply(this, args);
        const canvas = this.canvas as HTMLCanvasElement;
        canvas.dataset.drawCount = String(
          Number(canvas.dataset.drawCount ?? 0) + 1
        );
        if (
          canvas.width < 32 ||
          canvas.height < 32 ||
          canvas.dataset.renderedPixels === '1024'
        ) {
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
  await expect(page.locator('#oil-heading')).toBeVisible();
  await expect(page.locator('#water-heading')).toBeVisible();

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
  const programCount =
    (await oilGlobe.getAttribute('data-program-count')) ?? '';
  await oilSection
    .getByRole('button', { name: 'Saudi Arabia 6,232 TWh' })
    .click();
  await expect(oilGlobe).toHaveAttribute('data-program-count', programCount);
  const originalWidth = await oilGlobe.evaluate(
    (canvas: HTMLCanvasElement) => canvas.width
  );
  await page.setViewportSize({ height: 800, width: 820 });
  await expect
    .poll(() => oilGlobe.evaluate((canvas: HTMLCanvasElement) => canvas.width))
    .not.toBe(originalWidth);
  await expect(oilGlobe).toHaveAttribute('data-program-count', programCount);

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

  const programsBeforeLoss = Number(
    await oilGlobe.getAttribute('data-program-count')
  );
  const drawsBeforeLoss = Number(
    await oilGlobe.getAttribute('data-draw-count')
  );
  const canLoseContext = await oilGlobe.evaluate(
    (canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      const extension = context?.getExtension('WEBGL_lose_context');
      if (!extension) {
        return false;
      }
      canvas.addEventListener(
        'webglcontextlost',
        (event) => {
          canvas.dataset.lossPrevented = String(event.defaultPrevented);
          window.setTimeout(() => extension.restoreContext(), 100);
        },
        { once: true }
      );
      extension.loseContext();
      return true;
    }
  );
  expect(canLoseContext).toBe(true);
  await expect(oilGlobe).toHaveAttribute('data-loss-prevented', 'true');
  await expect(oilGlobe).toHaveAttribute(
    'data-program-count',
    String(programsBeforeLoss + 1)
  );
  await expect
    .poll(async () => Number(await oilGlobe.getAttribute('data-draw-count')))
    .toBeGreaterThan(drawsBeforeLoss);
  await page.screenshot({ path: 'test-results/globe-demo.png' });
});
