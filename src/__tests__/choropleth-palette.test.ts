import { describe, expect, it } from 'vitest';

import {
  computeCountryFill,
  generateChoroplethPalette,
} from '../choropleth-palette';
import { getCountryIdByAlpha2 } from '../worldGeoData';

describe(computeCountryFill, () => {
  const filledColorRange = [
    [130, 182, 255],
    [0, 81, 195],
  ] as const;

  it('returns the range start color at 70% alpha for a zero-share value', () => {
    const fill = computeCountryFill({
      filledColorRange,
      maxMagnitude: 100,
      value: 0,
    });
    expect(fill.color).toStrictEqual([130, 182, 255]);
    expect(fill.alpha).toBeCloseTo(0.7);
  });

  it('returns the range end color at full alpha for the max value', () => {
    const fill = computeCountryFill({
      filledColorRange,
      maxMagnitude: 100,
      value: 100,
    });
    expect(fill.color).toStrictEqual([0, 81, 195]);
    expect(fill.alpha).toBeCloseTo(1);
  });

  it('uses absolute values for the share, so negatives match positives', () => {
    const negative = computeCountryFill({
      filledColorRange,
      maxMagnitude: 100,
      value: -50,
    });
    const positive = computeCountryFill({
      filledColorRange,
      maxMagnitude: 100,
      value: 50,
    });
    expect(negative).toStrictEqual(positive);
    expect(negative.alpha).toBeCloseTo(0.85);
  });
});

describe(generateChoroplethPalette, () => {
  it('keeps ocean transparent and colors missing and populated countries', () => {
    const palette = generateChoroplethPalette({
      filledColorRange: [
        [100, 150, 200],
        [200, 250, 255],
      ],
      missingColor: [10, 20, 30],
      valuesByAlpha2: new Map([['US', 5]]),
    });
    const countryIds = getCountryIdByAlpha2();
    const usOffset = (countryIds.get('US') ?? 0) * 4;
    const frOffset = (countryIds.get('FR') ?? 0) * 4;

    expect(palette.slice(0, 4)).toStrictEqual(new Uint8Array([0, 0, 0, 0]));
    expect(palette.slice(usOffset, usOffset + 4)).toStrictEqual(
      new Uint8Array([200, 250, 255, 255])
    );
    expect(palette.slice(frOffset, frOffset + 4)).toStrictEqual(
      new Uint8Array([10, 20, 30, 64])
    );
  });
});
