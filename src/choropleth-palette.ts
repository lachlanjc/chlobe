import { COUNTRY_COUNT } from './generated-country-data';
import type { ChoroplethRgb } from './globeTypes';
import { getCountryIdByAlpha2 } from './worldGeoData';

const DEFAULT_MISSING_ALPHA = 0.25;
const FILLED_ALPHA_BASE = 0.7;
const FILLED_ALPHA_RANGE = 0.3;
const PALETTE_SIZE = 256;
const CHANNEL_COUNT = 4;

const interpolateChannel = (
  start: number,
  end: number,
  share: number
): number => Math.round(start + (end - start) * share);

/** Returns the RGB color and alpha for a country with data. */
export const computeCountryFill = (input: {
  value: number;
  maxMagnitude: number;
  filledColorRange: readonly [ChoroplethRgb, ChoroplethRgb];
}): { color: ChoroplethRgb; alpha: number } => {
  const share =
    input.maxMagnitude > 0 ? Math.abs(input.value) / input.maxMagnitude : 0;
  const [start, end] = input.filledColorRange;
  return {
    alpha: FILLED_ALPHA_BASE + FILLED_ALPHA_RANGE * share,
    color: [
      interpolateChannel(start[0], end[0], share),
      interpolateChannel(start[1], end[1], share),
      interpolateChannel(start[2], end[2], share),
    ],
  };
};

const writePaletteColor = (
  palette: Uint8Array,
  countryId: number,
  color: ChoroplethRgb,
  alpha: number
): void => {
  const offset = countryId * CHANNEL_COUNT;
  const [red, green, blue] = color;
  palette[offset] = red;
  palette[offset + 1] = green;
  palette[offset + 2] = blue;
  palette[offset + 3] = Math.round(alpha * 255);
};

/** Builds the tiny country-ID -> choropleth-color texture uploaded to WebGL. */
export const generateChoroplethPalette = (input: {
  valuesByAlpha2: ReadonlyMap<string, number>;
  filledColorRange: readonly [ChoroplethRgb, ChoroplethRgb];
  missingColor: ChoroplethRgb;
  missingAlpha?: number;
}): Uint8Array => {
  const {
    valuesByAlpha2,
    filledColorRange,
    missingColor,
    missingAlpha = DEFAULT_MISSING_ALPHA,
  } = input;
  const palette = new Uint8Array(PALETTE_SIZE * CHANNEL_COUNT);
  const idsByAlpha2 = getCountryIdByAlpha2();

  for (let countryId = 1; countryId <= COUNTRY_COUNT; countryId += 1) {
    writePaletteColor(palette, countryId, missingColor, missingAlpha);
  }

  let maxMagnitude = 0;
  for (const [alpha2, value] of valuesByAlpha2) {
    if (idsByAlpha2.has(alpha2)) {
      maxMagnitude = Math.max(maxMagnitude, Math.abs(value));
    }
  }
  for (const [alpha2, value] of valuesByAlpha2) {
    const countryId = idsByAlpha2.get(alpha2);
    if (countryId === undefined) {
      continue;
    }
    const fill = computeCountryFill({
      filledColorRange,
      maxMagnitude,
      value,
    });
    writePaletteColor(palette, countryId, fill.color, fill.alpha);
  }
  return palette;
};
