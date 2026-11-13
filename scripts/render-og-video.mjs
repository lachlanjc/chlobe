import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { chromium } from '@playwright/test';

// Start the website on port 3180, then run `pnpm render:og-video`.
const FRAME_COUNT = 180;
const WIDTH = 1200;
const HEIGHT = 630;
const sourceUrl = process.env.OG_VIDEO_URL ?? 'http://127.0.0.1:3180/og-video';
const output = path.resolve('website/public/og-video.mp4');
const frameDirectory = await mkdtemp(path.join(tmpdir(), 'chlobe-og-video-'));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { height: HEIGHT, width: WIDTH },
  });
  await page.goto(sourceUrl, { waitUntil: 'networkidle' });
  await page.locator('canvas[data-ready="true"]').waitFor();
  await page.addStyleTag({
    content: 'nextjs-portal { display: none !important; }',
  });

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    // Frames must be rendered and captured in order.
    // oxlint-disable-next-line eslint/no-await-in-loop
    await page.evaluate((index) => {
      window.renderOgVideoFrame(index);
    }, frame);
    // oxlint-disable-next-line eslint/no-await-in-loop
    await page.screenshot({
      animations: 'disabled',
      path: path.join(
        frameDirectory,
        `frame-${String(frame).padStart(3, '0')}.png`
      ),
    });
  }
} finally {
  await browser.close();
}

const encoder = spawnSync(
  'swift',
  ['scripts/encode-og-video.swift', frameDirectory, output],
  { stdio: 'inherit' }
);
if (encoder.status !== 0) {
  throw new Error(`Video encoder failed with status ${encoder.status}`);
}
await rm(frameDirectory, { force: true, recursive: true });
