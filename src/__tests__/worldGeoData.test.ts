import { describe, expect, it } from 'vitest';

import {
  ALPHA2_TO_NUMERIC_COUNTRY_ID,
  getCountryAtCoordinates,
  getCountryCentroids,
  getCountryFeatures,
} from '../worldGeoData';

describe(ALPHA2_TO_NUMERIC_COUNTRY_ID, () => {
  it('maps alpha-2 codes to zero-padded numeric ids', () => {
    expect(ALPHA2_TO_NUMERIC_COUNTRY_ID.get('US')).toBe('840');
    expect(ALPHA2_TO_NUMERIC_COUNTRY_ID.get('AU')).toBe('036');
  });

  it('maps Kosovo to the Natural Earth sentinel id', () => {
    expect(ALPHA2_TO_NUMERIC_COUNTRY_ID.get('XK')).toBe('-99');
  });
});

describe(getCountryFeatures, () => {
  it('joins alpha-2 codes onto world-atlas features for major countries', async () => {
    const countryFeatures = await getCountryFeatures();
    const alpha2Codes = new Set(countryFeatures.map((entry) => entry.alpha2));
    expect(alpha2Codes).toContain('US');
    expect(alpha2Codes).toContain('FR');
    expect(alpha2Codes).toContain('CN');
  });
});

describe(getCountryCentroids, () => {
  it('returns a plausible [lat, lng] centroid for the US', async () => {
    const centroids = await getCountryCentroids();
    const us = centroids.get('US');
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
    // The (0, 0) point is in the Gulf of Guinea, i.e. open ocean.
    { expected: null, lat: 0, lng: 0 },
    // Chukotka: Russia's bounding box crosses the antimeridian.
    { expected: 'RU', lat: 65, lng: 178 },
  ];

  it.each(cases)(
    'returns $expected for ($lng, $lat)',
    async ({ lng, lat, expected }) => {
      await expect(getCountryAtCoordinates(lng, lat)).resolves.toStrictEqual(
        expected
      );
    }
  );
});
