import { describe, expect, it } from 'vitest';

import {
  getCountryAtCoordinates,
  getCountryCentroids,
  getCountryIdByAlpha2,
  getDotCountryIds,
} from '../worldGeoData';

describe('generated country data', () => {
  it('indexes major countries by alpha-2 code', () => {
    const countryIds = getCountryIdByAlpha2();
    expect(countryIds.get('US')).toBeTypeOf('number');
    expect(countryIds.get('FR')).toBeTypeOf('number');
    expect(countryIds.get('XK')).toBeTypeOf('number');
  });

  it('includes one lookup for every shader-addressable dot', () => {
    expect(getDotCountryIds()).toHaveLength(16_001);
  });

  it('reconstructs the exact generated dot ownership table', () => {
    let sum = 0;
    let weightedSum = 0;
    const countryIds = getDotCountryIds();
    for (let index = 0; index < countryIds.length; index += 1) {
      sum += countryIds[index];
      weightedSum =
        (weightedSum + countryIds[index] * (index + 1)) % 1_000_000_007;
    }
    expect({ sum, weightedSum }).toStrictEqual({
      sum: 319_814,
      weightedSum: 429_075_111,
    });
  });
});

describe(getCountryCentroids, () => {
  it('returns a plausible [lat, lng] centroid for the US', () => {
    const us = getCountryCentroids().get('US');
    expect(us).toBeDefined();
    const [lat, lng] = us ?? [0, 0];
    expect(lat).toBeGreaterThan(30);
    expect(lat).toBeLessThan(50);
    expect(lng).toBeGreaterThan(-130);
    expect(lng).toBeLessThan(-60);
  });
});

describe(getCountryAtCoordinates, () => {
  const cases: { lng: number; lat: number; expected: string | null }[] = [
    { expected: 'US', lat: 39, lng: -98 },
    { expected: 'FR', lat: 47, lng: 2 },
    { expected: null, lat: 0, lng: 0 },
    { expected: 'RU', lat: 65, lng: 178 },
  ];

  it.each(cases)(
    'returns $expected for ($lng, $lat)',
    ({ lng, lat, expected }) => {
      expect(getCountryAtCoordinates(lng, lat)).toBe(expected);
    }
  );
});
