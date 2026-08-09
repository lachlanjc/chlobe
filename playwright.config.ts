import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './website/e2e',
  use: {
    baseURL: 'http://127.0.0.1:3173',
  },
  webServer: {
    command: 'pnpm --filter website exec next start --port 3173',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:3173',
  },
});
