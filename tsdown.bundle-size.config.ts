import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  deps: { neverBundle: ['react', 'react-dom'] },
  entry: { index: 'scripts/bundle-size-entry.ts' },
  format: ['esm'],
  minify: true,
  outDir: '.bundle-size',
  platform: 'browser',
  target: 'es2022',
});
