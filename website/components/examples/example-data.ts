import type { ChoroplethGlobeColors } from '../../../dist/index.js';

const initialColors = {
  filled: [
    [219, 234, 254],
    [29, 78, 216],
  ],
  missing: [148, 163, 184],
} satisfies ChoroplethGlobeColors;

// Renewable electricity share (%), 2021, rounded to one decimal place.
const data = [
  { alpha2: 'NO', value: 99.1 },
  { alpha2: 'BR', value: 77.4 },
  { alpha2: 'DE', value: 39.8 },
  { alpha2: 'CN', value: 28.4 },
  { alpha2: 'SA', value: 0.1 },
];
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export { countryNames, data, initialColors };
