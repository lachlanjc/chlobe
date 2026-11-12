import { execFileSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const consumerDirectory = mkdtempSync(path.join(tmpdir(), 'chlobe-'));
const scopeDirectory = path.join(consumerDirectory, 'node_modules', '@chlobe');

execFileSync('mkdir', ['-p', scopeDirectory]);
symlinkSync(process.cwd(), path.join(scopeDirectory, 'react'));
writeFileSync(
  path.join(consumerDirectory, 'consumer.cjs'),
  "const { ChoroplethGlobe } = require('@chlobe/react');\nif (!ChoroplethGlobe) process.exit(1);\n"
);
writeFileSync(
  path.join(consumerDirectory, 'consumer.mjs'),
  "import { ChoroplethGlobe } from '@chlobe/react';\nif (!ChoroplethGlobe) process.exit(1);\n"
);

for (const file of ['consumer.cjs', 'consumer.mjs']) {
  execFileSync(process.execPath, [path.join(consumerDirectory, file)], {
    stdio: 'inherit',
  });
}
