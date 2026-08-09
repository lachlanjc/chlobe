import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { iso31661Alpha2ToAlpha3, iso31661Alpha3ToAlpha2 } from 'iso-3166';

const outputDirectory = fileURLToPath(
  new URL('../website/public/data/', import.meta.url)
);
const WORLD_BANK_API = 'https://api.worldbank.org/v2/country/all/indicator';
const validAlpha2Codes = new Set(Object.keys(iso31661Alpha2ToAlpha3));

const DATASETS = [
  {
    fileName: 'forest-area-per-person.json',
    getValue: (forestAreaSquareKilometres, population) =>
      (forestAreaSquareKilometres * 100) / population,
    indicator: 'AG.LND.FRST.K2',
    name: 'Forest area per person',
    source: 'World Bank World Development Indicators',
    unit: 'hectares per person',
  },
  {
    fileName: 'water-withdrawals-per-person.json',
    getValue: (withdrawalsCubicMetres, population) =>
      (withdrawalsCubicMetres * 1_000_000_000) / population,
    indicator: 'ER.H2O.FWTL.K3',
    name: 'Annual freshwater withdrawals per person',
    source: 'World Bank World Development Indicators',
    unit: 'cubic metres per person',
  },
  {
    fileName: 'renewable-electricity-share.json',
    indicator: 'EG.ELC.RNEW.ZS',
    name: 'Renewable electricity share',
    source: 'World Bank World Development Indicators',
    unit: 'percent of total electricity output',
  },
];

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to download ${url}: ${response.status}`);
  }
  return response.json();
};

const getWorldBankObservations = async (indicator) => {
  const url = `${WORLD_BANK_API}/${indicator}?format=json&per_page=20000`;
  const [, observations] = await fetchJson(url);

  return observations.filter(
    (observation) =>
      observation.value !== null && validAlpha2Codes.has(observation.country.id)
  );
};

const latestByCountry = (observations) => {
  const latest = new Map();
  for (const observation of observations) {
    const alpha2 = observation.alpha2 ?? observation.country.id;
    const existing = latest.get(alpha2);
    const year = Number(observation.year ?? observation.date);
    const existingYear = Number(existing?.year ?? existing?.date);
    if (!existing || year > existingYear) {
      latest.set(alpha2, observation);
    }
  }
  return latest;
};

const createWorldBankDataset = async (dataset, populationByCountryYear) => {
  const observations = await getWorldBankObservations(dataset.indicator);
  const entries = [];

  for (const observation of observations) {
    const population = populationByCountryYear.get(
      `${observation.country.id}:${observation.date}`
    );
    let { value } = observation;
    if (dataset.getValue) {
      value =
        population === undefined
          ? null
          : dataset.getValue(observation.value, population);
    }

    if (value === null || !Number.isFinite(value)) {
      continue;
    }
    entries.push({
      alpha2: observation.country.id,
      label: observation.country.value,
      value,
      year: Number(observation.date),
    });
  }

  const latestEntries = [...latestByCountry(entries).values()].toSorted(
    (left, right) => left.alpha2.localeCompare(right.alpha2)
  );
  return {
    entries: latestEntries,
    name: dataset.name,
    source: dataset.source,
    unit: dataset.unit,
  };
};

const parseCsvRow = (line) => {
  const values = [];
  let currentValue = '';
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (isQuoted && line[index + 1] === '"') {
        currentValue += character;
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
    } else if (character === ',' && !isQuoted) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += character;
    }
  }
  values.push(currentValue);
  return values;
};

const createOilProductionDataset = async () => {
  const response = await fetch(
    'https://ourworldindata.org/grapher/oil-production-by-country.csv'
  );
  if (!response.ok) {
    throw new Error(`Unable to download oil production: ${response.status}`);
  }

  const csv = await response.text();
  const [header, ...rows] = csv.trim().split('\n');
  const columns = parseCsvRow(header);
  const valueColumn = columns.at(-1);
  const latest = new Map();

  for (const row of rows) {
    const [label, alpha3, year, rawValue] = parseCsvRow(row);
    const alpha2 = iso31661Alpha3ToAlpha2[alpha3];
    const value = Number(rawValue);
    if (!alpha2 || !Number.isFinite(value)) {
      continue;
    }
    const existing = latest.get(alpha2);
    if (!existing || Number(year) > existing.year) {
      latest.set(alpha2, { alpha2, label, value, year: Number(year) });
    }
  }

  return {
    entries: [...latest.values()].toSorted((left, right) =>
      left.alpha2.localeCompare(right.alpha2)
    ),
    name: 'Oil production',
    source:
      'Energy Institute Statistical Review of World Energy via Our World in Data',
    sourceColumn: valueColumn,
    unit: 'terawatt-hours',
  };
};

const populationObservations = await getWorldBankObservations('SP.POP.TOTL');
const populationByCountryYear = new Map(
  populationObservations.map((observation) => [
    `${observation.country.id}:${observation.date}`,
    observation.value,
  ])
);

await mkdir(outputDirectory, { recursive: true });
const worldBankDatasets = await Promise.all(
  DATASETS.map(async (dataset) => ({
    data: await createWorldBankDataset(dataset, populationByCountryYear),
    fileName: dataset.fileName,
  }))
);
await Promise.all(
  worldBankDatasets.map(({ data, fileName }) =>
    writeFile(
      new URL(fileName, `file://${outputDirectory}`).pathname,
      `${JSON.stringify(data, null, 2)}\n`
    )
  )
);

const oilProduction = await createOilProductionDataset();
await writeFile(
  new URL('oil-production.json', `file://${outputDirectory}`).pathname,
  `${JSON.stringify(oilProduction, null, 2)}\n`
);
