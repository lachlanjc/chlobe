import { execFileSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const consumerDirectory = mkdtempSync(
  path.join(tmpdir(), 'react-cobe-countries-')
);
const modulesDirectory = path.join(consumerDirectory, 'node_modules');

execFileSync('mkdir', ['-p', modulesDirectory]);
symlinkSync(process.cwd(), path.join(modulesDirectory, 'react-cobe-countries'));
writeFileSync(
  path.join(consumerDirectory, 'consumer.cjs'),
  "const { ChoroplethGlobe } = require('react-cobe-countries');\nif (!ChoroplethGlobe) process.exit(1);\n"
);
writeFileSync(
  path.join(consumerDirectory, 'consumer.mjs'),
  "import { ChoroplethGlobe } from 'react-cobe-countries';\nif (!ChoroplethGlobe) process.exit(1);\n"
);

for (const file of ['consumer.cjs', 'consumer.mjs']) {
  execFileSync(process.execPath, [path.join(consumerDirectory, file)], {
    stdio: 'inherit',
  });
}
