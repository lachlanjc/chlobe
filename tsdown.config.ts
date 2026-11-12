import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: { generator: 'oxc' },
  entry: ['src/index.ts'],
  fixedExtension: false,
  format: ['cjs', 'esm'],
  target: 'es2022',
  tsconfig: 'tsconfig.build.json',
});
