import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  entry: { index: 'scripts/bundle-size-entry.ts' },
  deps: { neverBundle: ['react', 'react-dom'] },
  format: ['esm'],
  minify: true,
  outDir: '.bundle-size',
  platform: 'browser',
  target: 'es2022',
});
