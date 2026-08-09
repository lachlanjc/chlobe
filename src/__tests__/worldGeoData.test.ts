import { describe, expect, it } from 'vitest';

import {
  ALPHA2_TO_NUMERIC_COUNTRY_ID,
  getCountryAtCoordinates,
  getCountryCentroids,
  getCountryFeatures,
} from '../worldGeoData';

describe('ALPHA2_TO_NUMERIC_COUNTRY_ID', () => {
  it('maps alpha-2 codes to zero-padded numeric ids', () => {
    expect(ALPHA2_TO_NUMERIC_COUNTRY_ID.get('US')).toEqual('840');
    expect(ALPHA2_TO_NUMERIC_COUNTRY_ID.get('AU')).toEqual('036');
  });

  it('maps Kosovo to the Natural Earth sentinel id', () => {
    expect(ALPHA2_TO_NUMERIC_COUNTRY_ID.get('XK')).toEqual('-99');
  });
});

describe('getCountryFeatures', () => {
  it('joins alpha-2 codes onto world-atlas features for major countries', async () => {
    const countryFeatures = await getCountryFeatures();
    const alpha2Codes = new Set(countryFeatures.map((entry) => entry.alpha2));
    expect(alpha2Codes).toContain('US');
    expect(alpha2Codes).toContain('FR');
    expect(alpha2Codes).toContain('CN');
  });
});

describe('getCountryCentroids', () => {
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

describe('getCountryAtCoordinates', () => {
  const cases: Array<{ lng: number; lat: number; expected: string | null }> = [
    { lng: -98, lat: 39, expected: 'US' },
    { lng: 2, lat: 47, expected: 'FR' },
    // The (0, 0) point is in the Gulf of Guinea, i.e. open ocean.
    { lng: 0, lat: 0, expected: null },
    // Chukotka: Russia's bounding box crosses the antimeridian.
    { lng: 178, lat: 65, expected: 'RU' },
  ];

  it.each(cases)(
    'returns $expected for ($lng, $lat)',
    async ({ lng, lat, expected }) => {
      await expect(getCountryAtCoordinates(lng, lat)).resolves.toEqual(
        expected
      );
    }
  );
});
