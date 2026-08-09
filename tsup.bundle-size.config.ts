import { defineConfig } from 'tsup';

const RUNTIME_DEPENDENCIES = [
  'd3-geo',
  'd3-interpolate',
  'iso-3166',
  'topojson-client',
  'world-atlas',
];

export default defineConfig({
  clean: true,
  entry: { index: 'scripts/bundle-size-entry.ts' },
  external: ['react', 'react-dom'],
  format: ['esm'],
  minify: true,
  noExternal: RUNTIME_DEPENDENCIES,
  outDir: '.bundle-size',
  platform: 'browser',
  splitting: true,
  target: 'es2022',
});
