interface DatasetEntry {
  alpha2: string;
  label: string;
  value: number;
  year: number;
}

interface Dataset {
  entries: DatasetEntry[];
  name: string;
  source: string;
  unit: string;
}

type Story = 'forest' | 'oil' | 'water' | 'renewable';

const SOURCE_REGISTRY: Record<Story, string> = {
  forest:
    'https://api.worldbank.org/v2/country/all/indicator/AG.LND.FRST.K2?format=json',
  oil: 'https://ourworldindata.org/grapher/oil-production-by-country',
  renewable:
    'https://api.worldbank.org/v2/country/all/indicator/EG.ELC.RNEW.ZS?format=json',
  water:
    'https://api.worldbank.org/v2/country/all/indicator/ER.H2O.FWTL.K3?format=json',
};

const STORY_DETAILS = {
  forest: {
    accent: '#15522f',
    colors: {
      filled: [
        [153, 194, 143],
        [21, 82, 47],
      ],
      missing: [200, 232, 190],
      missingAlpha: 0.58,
    },
    countries: ['CA', 'RU', 'BR', 'CD', 'CN', 'IN'],
    glow: [224, 237, 221],
    heading: 'Forest area per person',
    initialPhi: 0.8,
    surface: '#eff7ed',
  },
  oil: {
    accent: '#f1f5ff',
    colors: {
      filled: [
        [60, 94, 148],
        [190, 220, 255],
      ],
      missing: [79, 89, 110],
      missingAlpha: 0.18,
    },
    countries: ['US', 'SA', 'RU', 'BR', 'NO', 'AU'],
    glow: [79, 89, 110],
    heading: 'Where oil comes from',
    initialPhi: 2.4,
    surface: '#102342',
  },
  renewable: {
    accent: '#062f25',
    colors: {
      filled: [
        [255, 219, 128],
        [187, 62, 24],
      ],
      missing: [255, 235, 188],
      missingAlpha: 0.34,
    },
    countries: ['NO', 'BR', 'DE', 'CN', 'IN', 'SA'],
    glow: [255, 251, 243],
    heading: 'Different paths to a renewable grid',
    initialPhi: -1.1,
    surface: 'rgb(255 251 243)',
  },
  water: {
    accent: 'rgb(18, 70, 224)',
    colors: {
      filled: [
        [130, 188, 226],
        [18, 70, 224],
      ],
      missing: [3, 44, 165],
      missingAlpha: 0.01,
    },
    countries: ['TM', 'US', 'IN', 'BR', 'ET', 'CD'],
    glow: [11, 36, 113],
    heading: 'How much freshwater does each person draw?',
    initialPhi: -2.2,
    surface: '#ffffff',
  },
} as const;

const getFeaturedEntries = (story: Story, entries: readonly DatasetEntry[]) =>
  STORY_DETAILS[story].countries.flatMap((alpha2) => {
    const entry = entries.find((candidate) => candidate.alpha2 === alpha2);
    return entry ? [entry] : [];
  });

const formatYearRange = (entries: readonly DatasetEntry[]) => {
  const years = entries.map((entry) => entry.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  return firstYear === lastYear ? `${firstYear}` : `${firstYear}–${lastYear}`;
};

const formatValue = (story: Story, value: number) => {
  if (story === 'forest') {
    return `${value.toFixed(2)} ha/person`;
  }
  if (story === 'oil') {
    return `${Math.round(value).toLocaleString()} TWh`;
  }
  if (story === 'renewable') {
    return `${value.toFixed(1)}%`;
  }
  return `${Math.round(value).toLocaleString()} m³/person`;
};

const getGlobeValue = (story: Story, value: number) => {
  if (story === 'oil' || story === 'forest') {
    return Math.log1p(value);
  }
  return story === 'water' ? Math.sqrt(value) : value;
};

const getExampleCode = (story: Story, entries: readonly DatasetEntry[]) => {
  const { colors } = STORY_DETAILS[story];
  const sampleData = getFeaturedEntries(story, entries)
    .map(({ alpha2, value }) => {
      const roundedValue = Number(value.toFixed(story === 'forest' ? 2 : 1));
      let sampleValue = `${roundedValue}`;
      if (story === 'oil' || story === 'forest') {
        sampleValue = `Math.log1p(${roundedValue})`;
      } else if (story === 'water') {
        sampleValue = `Math.sqrt(${roundedValue})`;
      }
      return `    { alpha2: '${alpha2}', value: ${sampleValue} },`;
    })
    .join('\n');

  return `import { ChoroplethGlobe } from 'chlobe';

export const Globe = () => (
  <ChoroplethGlobe
    data={[
${sampleData}
    ]}
    colors={{
      filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
      missing: [${colors.missing.join(', ')}],
      missingAlpha: ${colors.missingAlpha},
    }}
    globe={{ autoRotate: ${story === 'renewable'}, interactive: ${story !== 'forest'} }}
  />
);`;
};

const getFillColor = (story: Story, dataset: Dataset, value: number) => {
  const values = dataset.entries.map((entry) =>
    getGlobeValue(story, entry.value)
  );
  const minimum = Math.min(...values);
  const range = Math.max(...values) - minimum;
  const amount =
    range > 0 ? (getGlobeValue(story, value) - minimum) / range : 0;
  const [low, high] = STORY_DETAILS[story].colors.filled;
  return `rgb(${low.map((channel, index) => Math.round(channel + (high[index] - channel) * amount)).join(', ')})`;
};

export {
  formatValue,
  formatYearRange,
  getExampleCode,
  getFeaturedEntries,
  getFillColor,
  getGlobeValue,
  SOURCE_REGISTRY,
  STORY_DETAILS,
};
export type { Dataset, DatasetEntry, Story };
