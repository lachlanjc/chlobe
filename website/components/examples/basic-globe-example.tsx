'use client';

import { getBasicCode } from './example-code';
import { GlobeExample } from './globe-example';

const BasicGlobeExample = () => (
  <GlobeExample
    getCode={getBasicCode}
    globeProps={{
      'aria-label': 'Example renewable electricity shares by country',
    }}
    label="Basic globe usage"
    title="globe.tsx"
  />
);

export { BasicGlobeExample };
