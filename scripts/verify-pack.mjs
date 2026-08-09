import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf-8',
  env: {
    ...process.env,
    npm_config_cache: join(process.cwd(), '.npm-cache'),
  },
});
const [{ files }] = JSON.parse(output);
const allowedRootFiles = new Set([
  'package.json',
  'README.md',
  'LICENSE',
  'LICENSE.md',
  'LICENCE',
]);
const unexpectedFiles = files
  .map(({ path }) => path)
  .filter((path) => !path.startsWith('dist/') && !allowedRootFiles.has(path));

if (unexpectedFiles.length > 0) {
  throw new Error(
    `npm pack would include non-public files: ${unexpectedFiles.join(', ')}`
  );
}

for (const path of [
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/index.d.cts',
]) {
  if (!files.some((file) => file.path === path)) {
    throw new Error(`npm pack is missing ${path}`);
  }
}
