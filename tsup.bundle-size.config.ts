import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: { index: 'scripts/bundle-size-entry.ts' },
  external: ['react', 'react-dom'],
  format: ['esm'],
  minify: true,
  outDir: '.bundle-size',
  platform: 'browser',
  splitting: true,
  target: 'es2022',
});
