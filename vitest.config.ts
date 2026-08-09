import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/__tests__/**'],
      include: ['src/rotation.ts', 'src/worldGeoData.ts'],
      provider: 'v8',
      thresholds: {
        branches: 85,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
});
