import { execFileSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const consumerDirectory = mkdtempSync(join(tmpdir(), 'react-cobe-countries-'));
const modulesDirectory = join(consumerDirectory, 'node_modules');

execFileSync('mkdir', ['-p', modulesDirectory]);
symlinkSync(process.cwd(), join(modulesDirectory, 'react-cobe-countries'));
writeFileSync(
  join(consumerDirectory, 'consumer.cjs'),
  "const { ChoroplethGlobe } = require('react-cobe-countries');\nif (!ChoroplethGlobe) process.exit(1);\n"
);
writeFileSync(
  join(consumerDirectory, 'consumer.mjs'),
  "import { ChoroplethGlobe } from 'react-cobe-countries';\nif (!ChoroplethGlobe) process.exit(1);\n"
);

for (const file of ['consumer.cjs', 'consumer.mjs']) {
  execFileSync(process.execPath, [join(consumerDirectory, file)], {
    stdio: 'inherit',
  });
}
