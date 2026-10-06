/**
 * Compact, generated country lookups used by the renderer, hover hit-testing,
 * and navigation. The source geography is only needed by the build-time
 * generator in scripts/generate-country-data.mjs.
 */
import {
  ALPHA2_BY_COUNTRY_ID,
  COUNTRY_CENTROIDS_BASE64,
  COUNTRY_COUNT,
  DOT_COUNT,
  DOT_COUNTRY_CORRECTIONS_BASE64,
  HOVER_COUNTRY_RUNS_BASE64,
  HOVER_MAP_HEIGHT,
  HOVER_MAP_WIDTH,
} from './generated-country-data';

const UNMAPPED_ALPHA2 = '--';
const FIBONACCI_TURN = 0.618034;

const decodeBase64 = (encoded: string): Uint8Array => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }
  return bytes;
};

const getAlpha2ForCountryId = (countryId: number): string | null => {
  if (countryId === 0 || countryId > COUNTRY_COUNT) {
    return null;
  }
  const alpha2 = ALPHA2_BY_COUNTRY_ID.slice(countryId * 2, countryId * 2 + 2);
  return alpha2 === UNMAPPED_ALPHA2 ? null : alpha2;
};

let countryIdByAlpha2: ReadonlyMap<string, number> | null = null;

export const getCountryIdByAlpha2 = (): ReadonlyMap<string, number> => {
  if (countryIdByAlpha2) {
    return countryIdByAlpha2;
  }
  const countryIds = new Map<string, number>();
  for (let countryId = 1; countryId <= COUNTRY_COUNT; countryId += 1) {
    const alpha2 = getAlpha2ForCountryId(countryId);
    if (alpha2) {
      countryIds.set(alpha2, countryId);
    }
  }
  countryIdByAlpha2 = countryIds;
  return countryIds;
};

let hoverCountryIds: Uint8Array | null = null;

const getHoverCountryIds = (): Uint8Array => {
  if (hoverCountryIds) {
    return hoverCountryIds;
  }
  const runs = decodeBase64(HOVER_COUNTRY_RUNS_BASE64);
  const countryIds = new Uint8Array(HOVER_MAP_WIDTH * HOVER_MAP_HEIGHT);
  const runCount = runs.length / 2;
  let outputOffset = 0;
  for (let index = 0; index < runCount; index += 1) {
    const runLength = runs[index];
    const countryId = runs[index + runCount];
    countryIds.fill(countryId, outputOffset, outputOffset + runLength);
    outputOffset += runLength;
  }
  hoverCountryIds = countryIds;
  return countryIds;
};

const getHoverCountryId = (longitude: number, latitude: number): number => {
  const normalizedLongitude = (((longitude + 180) % 360) + 360) % 360;
  const x = Math.min(
    HOVER_MAP_WIDTH - 1,
    Math.floor((normalizedLongitude / 360) * HOVER_MAP_WIDTH)
  );
  const y = Math.max(
    0,
    Math.min(
      HOVER_MAP_HEIGHT - 1,
      Math.floor(((90 - latitude) / 180) * HOVER_MAP_HEIGHT)
    )
  );
  return getHoverCountryIds()[y * HOVER_MAP_WIDTH + x];
};

let dotCountryIds: Uint8Array | null = null;

/** Reconstructs exact dot IDs from the hover raster plus sparse corrections. */
export const getDotCountryIds = (): Uint8Array => {
  if (dotCountryIds) {
    return dotCountryIds;
  }
  const countryIds = new Uint8Array(DOT_COUNT + 1);
  for (let index = 0; index <= DOT_COUNT; index += 1) {
    const latitude = (Math.asin(1 - (2 * index) / DOT_COUNT) * 180) / Math.PI;
    const longitude = -((index * FIBONACCI_TURN) % 1) * 360;
    countryIds[index] = getHoverCountryId(longitude, latitude);
  }

  const corrections = decodeBase64(DOT_COUNTRY_CORRECTIONS_BASE64);
  let correctionIndex = -1;
  for (let offset = 0; offset < corrections.length;) {
    let delta = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = corrections[offset];
      offset += 1;
      delta += (byte % 128) * 2 ** shift;
      shift += 7;
    } while (byte >= 128);
    correctionIndex += delta + 1;
    countryIds[correctionIndex] = corrections[offset];
    offset += 1;
  }
  dotCountryIds = countryIds;
  return countryIds;
};

/** Returns the ISO2 code at a longitude/latitude point, or null for ocean. */
export const getCountryAtCoordinates = (
  longitude: number,
  latitude: number
): string | null =>
  getAlpha2ForCountryId(getHoverCountryId(longitude, latitude));

let countryCentroids: ReadonlyMap<string, [number, number]> | null = null;

/** Returns precomputed ISO2 -> [latitude, longitude] country centroids. */
export const getCountryCentroids = (): ReadonlyMap<
  string,
  [number, number]
> => {
  if (countryCentroids) {
    return countryCentroids;
  }
  const bytes = decodeBase64(COUNTRY_CENTROIDS_BASE64);
  const centroids = new Map<string, [number, number]>();
  for (let countryId = 1; countryId <= COUNTRY_COUNT; countryId += 1) {
    const alpha2 = getAlpha2ForCountryId(countryId);
    if (!alpha2) {
      continue;
    }
    centroids.set(alpha2, [
      (bytes[countryId * 2] / 255) * 180 - 90,
      (bytes[countryId * 2 + 1] / 255) * 360 - 180,
    ]);
  }
  countryCentroids = centroids;
  return centroids;
};
