/**
 * Country polygon data for the world globe chart, derived from the
 * world-atlas (Natural Earth) 110m TopoJSON dataset. Provides GeoJSON
 * features joined to ISO 3166-1 alpha-2 codes, point-in-country hit testing,
 * and polygon-derived country centroids.
 */
import { geoBounds, geoCentroid, geoContains } from 'd3-geo';
import type { Feature, Geometry } from 'geojson';
import { iso31661Alpha2ToNumeric } from 'iso-3166';
import { feature } from 'topojson-client';

/** A single country polygon feature from the world-atlas dataset. */
export type WorldCountryFeature = Feature<Geometry, { name: string }>;

/**
 * world-atlas omits feature ids for territories without an ISO 3166-1 numeric
 * code (Kosovo, Northern Cyprus, Somaliland). We assign Kosovo the Natural
 * Earth sentinel id "-99" so it joins to the XK alpha-2 code; the others stay
 * unmapped and are only drawn as background land.
 */
const KOSOVO_NUMERIC_ID = '-99';

function buildAlpha2ToNumericIdMap(): ReadonlyMap<string, string> {
  // world-atlas feature ids use the ISO 3166-1 numeric code, zero-padded to
  // three characters (e.g. Australia is "036").
  const map = new Map(Object.entries(iso31661Alpha2ToNumeric));
  map.set('XK', KOSOVO_NUMERIC_ID);
  return map;
}

/**
 * ISO 3166-1 alpha-2 code -> the numeric string id used by world-atlas
 * country features (e.g. US -> "840", AU -> "036", XK -> "-99").
 */
export const ALPHA2_TO_NUMERIC_COUNTRY_ID: ReadonlyMap<string, string> =
  buildAlpha2ToNumericIdMap();

const NUMERIC_COUNTRY_ID_TO_ALPHA2: ReadonlyMap<string, string> = new Map(
  Array.from(ALPHA2_TO_NUMERIC_COUNTRY_ID, ([alpha2, numericId]) => [
    numericId,
    alpha2,
  ])
);

/**
 * The numeric string id for a world-atlas country feature, normalized to
 * match `ALPHA2_TO_NUMERIC_COUNTRY_ID` values. Returns null for features
 * that have no id and no known special case.
 */
export function getCountryFeatureNumericId(
  countryFeature: WorldCountryFeature
): string | null {
  if (countryFeature.id != null) {
    return String(countryFeature.id).padStart(3, '0');
  }
  if (countryFeature.properties.name === 'Kosovo') {
    return KOSOVO_NUMERIC_ID;
  }
  return null;
}

let allCountryFeaturesPromise: Promise<readonly WorldCountryFeature[]> | null =
  null;

/**
 * All country polygon features from the world-atlas dataset, including
 * features that have no alpha-2 mapping (still useful as background land).
 * The ~250KB TopoJSON is dynamically imported so it stays out of the main
 * bundle; the loaded features are memoized.
 */
export function getAllCountryFeatures(): Promise<
  readonly WorldCountryFeature[]
> {
  allCountryFeaturesPromise ??= import('world-atlas/countries-110m.json').then(
    (module) => {
      const topology = module.default;
      return feature(topology, topology.objects.countries).features;
    }
  );
  return allCountryFeaturesPromise;
}

interface JoinedCountryFeature {
  feature: WorldCountryFeature;
  alpha2: string;
  /**
   * Bounding box from d3's geoBounds: [[minLng, minLat], [maxLng, maxLat]].
   * For countries crossing the antimeridian (e.g. Fiji, Russia),
   * minLng > maxLng.
   */
  bounds: [[number, number], [number, number]];
}

let countryFeaturesPromise: Promise<readonly JoinedCountryFeature[]> | null =
  null;

/**
 * Country polygon features joined to their ISO 3166-1 alpha-2 codes and
 * bounding boxes, memoized (hover hit-testing calls this repeatedly).
 * Features whose id has no alpha-2 mapping are excluded.
 */
export function getCountryFeatures(): Promise<readonly JoinedCountryFeature[]> {
  countryFeaturesPromise ??= getAllCountryFeatures().then((allFeatures) => {
    const joined: JoinedCountryFeature[] = [];
    for (const countryFeature of allFeatures) {
      const numericId = getCountryFeatureNumericId(countryFeature);
      const alpha2 =
        numericId === null
          ? undefined
          : NUMERIC_COUNTRY_ID_TO_ALPHA2.get(numericId);
      if (alpha2 !== undefined) {
        joined.push({
          alpha2,
          bounds: geoBounds(countryFeature),
          feature: countryFeature,
        });
      }
    }
    return joined;
  });
  return countryFeaturesPromise;
}

/** Whether a [lng, lat] point falls inside a geoBounds bounding box. */
function boundsContain(
  [[minLng, minLat], [maxLng, maxLat]]: [[number, number], [number, number]],
  lng: number,
  lat: number
): boolean {
  if (lat < minLat || lat > maxLat) {
    return false;
  }
  // minLng > maxLng means the box crosses the antimeridian.
  return minLng <= maxLng
    ? lng >= minLng && lng <= maxLng
    : lng >= minLng || lng <= maxLng;
}

/**
 * The ISO 3166-1 alpha-2 code of the country containing the given
 * [longitude, latitude] point, or null for points outside any country
 * polygon (e.g. oceans).
 */
export async function getCountryAtCoordinates(
  lng: number,
  lat: number
): Promise<string | null> {
  const countryFeatures = await getCountryFeatures();
  for (const { feature: countryFeature, alpha2, bounds } of countryFeatures) {
    // The bounding-box check rejects most polygons before the much more
    // expensive point-in-polygon test.
    if (
      boundsContain(bounds, lng, lat) &&
      geoContains(countryFeature, [lng, lat])
    ) {
      return alpha2;
    }
  }
  return null;
}

let countryCentroidsPromise: Promise<
  ReadonlyMap<string, [number, number]>
> | null = null;

/**
 * ISO 3166-1 alpha-2 code -> [latitude, longitude] centroid computed from
 * each country's polygon. (d3's geoCentroid returns [longitude, latitude];
 * we flip to [latitude, longitude] to match the globe's `project()` input.)
 */
export function getCountryCentroids(): Promise<
  ReadonlyMap<string, [number, number]>
> {
  countryCentroidsPromise ??= getCountryFeatures().then((countryFeatures) => {
    const centroids = new Map<string, [number, number]>();
    for (const { feature: countryFeature, alpha2 } of countryFeatures) {
      const [lng, lat] = geoCentroid(countryFeature);
      centroids.set(alpha2, [lat, lng]);
    }
    return centroids;
  });
  return countryCentroidsPromise;
}
