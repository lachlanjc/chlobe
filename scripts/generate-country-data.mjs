import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { geoBounds, geoCentroid, geoContains } from 'd3-geo';
import { iso31661NumericToAlpha2 } from 'iso-3166';
import { feature } from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json' with { type: 'json' };

import {
  DOT_COUNT,
  DOT_TEXTURE_WIDTH,
  HOVER_MAP_HEIGHT,
  HOVER_MAP_WIDTH,
} from './country-data-config.mjs';

const KOSOVO_NUMERIC_ID = '-99';
const UNMAPPED_ALPHA2 = '--';
const FIBONACCI_TURN = 0.618034;

const outputPath = fileURLToPath(
  new URL('../src/generated-country-data.ts', import.meta.url)
);

const getNumericId = (countryFeature) => {
  if (countryFeature.id !== null && countryFeature.id !== undefined) {
    return String(countryFeature.id).padStart(3, '0');
  }
  return countryFeature.properties.name === 'Kosovo' ? KOSOVO_NUMERIC_ID : null;
};

const getAlpha2 = (numericId) => {
  if (numericId === KOSOVO_NUMERIC_ID) {
    return 'XK';
  }
  return numericId === null
    ? null
    : (iso31661NumericToAlpha2[numericId] ?? null);
};

const countries = feature(
  worldTopology,
  worldTopology.objects.countries
).features.map((countryFeature, index) => {
  const numericId = getNumericId(countryFeature);
  const alpha2 = getAlpha2(numericId);
  return {
    alpha2,
    bounds: geoBounds(countryFeature),
    centroid: geoCentroid(countryFeature),
    countryFeature,
    id: index + 1,
  };
});

if (countries.length > 255) {
  throw new Error('Country IDs no longer fit in one byte');
}

const boundsContain = ([[minLng, minLat], [maxLng, maxLat]], lng, lat) =>
  lat >= minLat &&
  lat <= maxLat &&
  (minLng <= maxLng
    ? lng >= minLng && lng <= maxLng
    : lng >= minLng || lng <= maxLng);

const getCountryId = (lng, lat) => {
  for (const country of countries) {
    if (
      boundsContain(country.bounds, lng, lat) &&
      geoContains(country.countryFeature, [lng, lat])
    ) {
      return country.id;
    }
  }
  return 0;
};

const fibonacciLongitude = (index) => {
  let remaining = index;
  let turns = 0;
  const bitTurns = [
    [16_384, 0.868872],
    [8192, 0.934436],
    [4096, 0.467218],
    [2048, 0.733609],
    [1024, 0.866804],
    [512, 0.433402],
    [256, 0.216701],
    [128, 0.108351],
    [64, 0.554175],
    [32, 0.777088],
    [16, 0.888544],
    [8, 0.944272],
    [4, 0.472136],
    [2, 0.236068],
    [1, 0.618034],
  ];
  for (const [bit, turn] of bitTurns) {
    if (remaining >= bit) {
      remaining -= bit;
      turns += turn;
    }
  }
  const thetaDegrees = (turns - Math.floor(turns)) * 360;
  return ((-thetaDegrees + 540) % 360) - 180;
};

const dotCountryIds = new Uint8Array(DOT_COUNT + 1);
for (let index = 0; index <= DOT_COUNT; index += 1) {
  const latitude = (Math.asin(1 - (2 * index) / DOT_COUNT) * 180) / Math.PI;
  dotCountryIds[index] = getCountryId(fibonacciLongitude(index), latitude);
}

const hoverCountryIds = new Uint8Array(HOVER_MAP_WIDTH * HOVER_MAP_HEIGHT);
for (let y = 0; y < HOVER_MAP_HEIGHT; y += 1) {
  const latitude = 90 - ((y + 0.5) / HOVER_MAP_HEIGHT) * 180;
  for (let x = 0; x < HOVER_MAP_WIDTH; x += 1) {
    const longitude = ((x + 0.5) / HOVER_MAP_WIDTH) * 360 - 180;
    hoverCountryIds[y * HOVER_MAP_WIDTH + x] = getCountryId(
      longitude,
      latitude
    );
  }
}

const hoverRunLengths = [];
const hoverRunCountryIds = [];
for (let offset = 0; offset < hoverCountryIds.length;) {
  const countryId = hoverCountryIds[offset];
  let runLength = 1;
  while (
    runLength < 255 &&
    offset + runLength < hoverCountryIds.length &&
    hoverCountryIds[offset + runLength] === countryId
  ) {
    runLength += 1;
  }
  hoverRunLengths.push(runLength);
  hoverRunCountryIds.push(countryId);
  offset += runLength;
}

const getRasterCountryIdForDot = (index) => {
  const latitude = (Math.asin(1 - (2 * index) / DOT_COUNT) * 180) / Math.PI;
  const turns = (index * FIBONACCI_TURN) % 1;
  const longitude = -turns * 360;
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
  return hoverCountryIds[y * HOVER_MAP_WIDTH + x];
};

const writeVarint = (output, value) => {
  let remaining = value;
  while (remaining > 127) {
    output.push((remaining % 128) + 128);
    remaining = Math.floor(remaining / 128);
  }
  output.push(remaining);
};

const dotCountryCorrections = [];
let previousCorrectionIndex = -1;
for (let index = 0; index <= DOT_COUNT; index += 1) {
  if (dotCountryIds[index] === getRasterCountryIdForDot(index)) {
    continue;
  }
  writeVarint(dotCountryCorrections, index - previousCorrectionIndex - 1);
  dotCountryCorrections.push(dotCountryIds[index]);
  previousCorrectionIndex = index;
}

const alpha2ByCountryId = [
  UNMAPPED_ALPHA2,
  ...countries.map((country) => country.alpha2 ?? UNMAPPED_ALPHA2),
].join('');

const centroidBytes = Buffer.alloc((countries.length + 1) * 2);
for (const country of countries) {
  if (country.alpha2 === null) {
    continue;
  }
  const [longitude, latitude] = country.centroid;
  centroidBytes[country.id * 2] = Math.round(((latitude + 90) / 180) * 255);
  centroidBytes[country.id * 2 + 1] = Math.round(
    ((longitude + 180) / 360) * 255
  );
}

const generatedSource = `/**
 * Generated by scripts/generate-country-data.mjs from Natural Earth 110m.
 * Do not edit by hand.
 */

export const COUNTRY_COUNT = ${countries.length};
export const DOT_COUNT = ${DOT_COUNT.toLocaleString('en-US').replace(',', '_')};
export const DOT_TEXTURE_WIDTH = ${DOT_TEXTURE_WIDTH};
export const HOVER_MAP_WIDTH = ${HOVER_MAP_WIDTH};
export const HOVER_MAP_HEIGHT = ${HOVER_MAP_HEIGHT};
export const ALPHA2_BY_COUNTRY_ID =
  '${alpha2ByCountryId}';
export const COUNTRY_CENTROIDS_BASE64 =
  '${centroidBytes.toString('base64')}';
export const DOT_COUNTRY_CORRECTIONS_BASE64 =
  '${Buffer.from(dotCountryCorrections).toString('base64')}';
export const HOVER_COUNTRY_RUNS_BASE64 =
  '${Buffer.from([...hoverRunLengths, ...hoverRunCountryIds]).toString('base64')}';
`;

await writeFile(outputPath, generatedSource);
