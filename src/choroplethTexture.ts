/**
 * Generates an equirectangular choropleth texture of world countries on a
 * hidden 2D canvas, for use as a globe texture (e.g. via cobe's
 * updateTexture). Safe to import during SSR: `document` is only accessed
 * inside `generateChoroplethTexture`.
 */
import { geoEquirectangular, geoPath } from 'd3-geo';
import { interpolateLab } from 'd3-interpolate';

import {
  ALPHA2_TO_NUMERIC_COUNTRY_ID,
  getAllCountryFeatures,
  getCountryFeatureNumericId,
} from './worldGeoData';

const DEFAULT_TEXTURE_WIDTH = 1024;
const DEFAULT_TEXTURE_HEIGHT = 512;
const DEFAULT_MISSING_ALPHA = 0.25;

/** Alpha ramps from 0.7 (smallest values) to 1.0 (the largest value). */
const FILLED_ALPHA_BASE = 0.7;
const FILLED_ALPHA_RANGE = 0.3;

// interpolateLab returns a closure; cache it per color range since callers
// invoke computeCountryFill once per country (texture) or legend row.
const interpolatorByRange = new Map<string, (t: number) => string>();
function getRangeInterpolator(
  range: readonly [string, string]
): (t: number) => string {
  const key = `${range[0]}|${range[1]}`;
  let interpolator = interpolatorByRange.get(key);
  if (!interpolator) {
    interpolator = interpolateLab(range[0], range[1]);
    interpolatorByRange.set(key, interpolator);
  }
  return interpolator;
}

/**
 * The fill style and alpha for a country with data. The country's share of
 * the maximum magnitude picks a color along `filledColorRange` and scales
 * opacity; magnitudes are absolute so negative values behave like positive
 * ones.
 */
export function computeCountryFill(input: {
  value: number;
  maxMagnitude: number;
  filledColorRange: readonly [string, string];
}): { fillStyle: string; alpha: number } {
  const share =
    input.maxMagnitude > 0 ? Math.abs(input.value) / input.maxMagnitude : 0;
  return {
    fillStyle: getRangeInterpolator(input.filledColorRange)(share),
    alpha: FILLED_ALPHA_BASE + FILLED_ALPHA_RANGE * share,
  };
}

/**
 * Draws every world country onto a hidden canvas using an equirectangular
 * projection. Countries present in `valuesByAlpha2` are filled with a color
 * interpolated along `filledColorRange` by their share of the maximum
 * magnitude; all other countries are filled with `missingColor` at
 * `missingAlpha`.
 *
 * @throws Error when a 2D canvas context is unavailable.
 */
export async function generateChoroplethTexture(input: {
  valuesByAlpha2: ReadonlyMap<string, number>;
  filledColorRange: readonly [string, string];
  missingColor: string;
  missingAlpha?: number;
  width?: number;
  height?: number;
}): Promise<HTMLCanvasElement> {
  const {
    valuesByAlpha2,
    filledColorRange,
    missingColor,
    missingAlpha = DEFAULT_MISSING_ALPHA,
    width = DEFAULT_TEXTURE_WIDTH,
    height = DEFAULT_TEXTURE_HEIGHT,
  } = input;

  const valuesByNumericId = new Map<string, number>();
  let maxMagnitude = 0;
  for (const [alpha2, value] of valuesByAlpha2) {
    const numericId = ALPHA2_TO_NUMERIC_COUNTRY_ID.get(alpha2);
    if (numericId === undefined) {
      continue;
    }
    valuesByNumericId.set(numericId, value);
    maxMagnitude = Math.max(maxMagnitude, Math.abs(value));
  }

  const allFeatures = await getAllCountryFeatures();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get 2d context for choropleth texture');
  }
  context.clearRect(0, 0, width, height);

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = geoPath(projection, context);

  for (const countryFeature of allFeatures) {
    const numericId = getCountryFeatureNumericId(countryFeature);
    const value =
      numericId === null ? undefined : valuesByNumericId.get(numericId);
    context.beginPath();
    path(countryFeature);
    if (value !== undefined) {
      const { fillStyle, alpha } = computeCountryFill({
        value,
        maxMagnitude,
        filledColorRange,
      });
      context.globalAlpha = alpha;
      context.fillStyle = fillStyle;
    } else {
      context.globalAlpha = missingAlpha;
      context.fillStyle = missingColor;
    }
    context.fill();
  }

  context.globalAlpha = 1;
  return canvas;
}
