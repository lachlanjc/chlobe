'use client';

import * as stylex from '@stylexjs/stylex';
import React, { useRef, useState } from 'react';

import 'react-flagpack/dist/style.css';
import Flag from 'react-flagpack';

import { ChoroplethGlobe } from '../../dist/index.js';
import type {
  ChoroplethGlobeData,
  ChoroplethGlobeRef,
} from '../../dist/index.js';
import { CopyButton } from './copy-button';

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

const STORY_DETAILS = {
  forest: {
    accent: '#15522f',
    background: '#eff7ed',
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
    summary:
      'From Canada’s vast forests to India’s densely populated landscape.',
    surface: '#eff7ed',
  },
  oil: {
    accent: '#f1f5ff',
    background: '#041330',
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
    summary:
      'Oil production across the Americas, the Middle East, Europe, and Australia.',
    surface: '#102342',
  },
  renewable: {
    accent: '#062f25',
    background: '#ff9d00',
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
    summary:
      'From Norway’s almost-complete renewable grid to Saudi Arabia’s 0.1% share.',
    surface: 'rgb(255 251 243)',
  },
  water: {
    accent: 'rgb(18, 70, 224)',
    background: 'rgb(196, 231, 244)',
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
    summary:
      'Annual withdrawals per person, from Turkmenistan to the Democratic Republic of Congo.',
    surface: '#ffffff',
  },
} as const;

const styles = stylex.create({
  content: { display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 },
  forest: { backgroundColor: '#eff7ed', color: '#15522f' },
  forestHighlight: { borderLeft: '4px solid #15522f' },
  heading: {
    fontSize: 'clamp(38px, 5vw, 70px)',
    letterSpacing: '-0.055em',
    lineHeight: 0.94,
    margin: 0,
    maxWidth: 580,
    textWrap: 'balance',
  },
  highlight: { marginTop: 12, paddingLeft: 16 },
  highlightValue: { display: 'block', fontSize: 32, letterSpacing: '-0.05em' },
  legendGradient: { height: 14 },
  legendLabels: {
    display: 'flex',
    fontSize: 12,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  oil: { backgroundColor: '#041330', color: '#f1f5ff' },
  rankButton: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '1fr auto',
    padding: '9px 12px',
    textAlign: 'left',
    width: '100%',
  },
  rankButtonForest: { backgroundColor: '#eff7ed', color: '#15522f' },
  rankButtonOil: { backgroundColor: '#102342', color: '#f1f5ff' },
  rankButtonRenewable: {
    backgroundColor: 'rgb(255 251 243)',
    color: '#062f25',
  },
  rankButtonWater: { backgroundColor: '#ffffff', color: 'rgb(18, 70, 224)' },
  rankButtonWithFlag: { gridTemplateColumns: '28px 1fr auto' },
  rankList: {
    display: 'grid',
    gap: 2,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  renewable: { backgroundColor: '#ff9d00', color: '#062f25' },
  section: {
    containIntrinsicSize: '760px',
    contentVisibility: 'auto',
    padding: 'clamp(32px, 7vw, 88px) clamp(24px, 6vw, 88px)',
  },
  sectionGrid: {
    display: 'grid',
    gap: 'clamp(28px, 5vw, 88px)',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
    margin: '0 auto',
    maxWidth: 1260,
  },
  source: { fontSize: 13, lineHeight: 1.4, margin: 0, opacity: 0.8 },
  summary: { fontSize: 18, lineHeight: 1.45, margin: 0, maxWidth: 510 },
  tooltip: {
    fontSize: 13,
    padding: '8px 10px',
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translate(-50%, calc(-100% - 12px))',
    whiteSpace: 'nowrap',
  },
  tooltipForest: {
    backgroundColor: '#eff7ed',
    border: '1px solid #15522f',
    color: '#15522f',
  },
  tooltipOil: {
    backgroundColor: '#102342',
    border: '1px solid #f1f5ff',
    color: '#f1f5ff',
  },
  tooltipRenewable: {
    backgroundColor: 'rgb(255 251 243)',
    border: '1px solid #062f25',
    color: '#062f25',
  },
  tooltipValue: { display: 'block' },
  tooltipWater: {
    backgroundColor: '#ffffff',
    border: '1px solid rgb(18, 70, 224)',
    color: 'rgb(18, 70, 224)',
  },
  visual: {
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  water: { backgroundColor: 'rgb(196, 231, 244)', color: 'rgb(18, 70, 224)' },
});

const STORY_STYLES = {
  forest: {
    rankButton: styles.rankButtonForest,
    section: styles.forest,
    tooltip: styles.tooltipForest,
  },
  oil: {
    rankButton: styles.rankButtonOil,
    section: styles.oil,
    tooltip: styles.tooltipOil,
  },
  renewable: {
    rankButton: styles.rankButtonRenewable,
    section: styles.renewable,
    tooltip: styles.tooltipRenewable,
  },
  water: {
    rankButton: styles.rankButtonWater,
    section: styles.water,
    tooltip: styles.tooltipWater,
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
    globe={{ autoRotate: ${story === 'forest' || story === 'renewable'}, interactive: ${story !== 'forest'} }}
  />
);`;
};

const DatasetLegend = ({
  dataset,
  story,
}: {
  dataset: Dataset;
  story: Story;
}) => {
  const { colors } = STORY_DETAILS[story];
  const values = dataset.entries.map(({ value }) => value);
  const scale = story === 'water' ? 'Square-root' : 'Logarithmic';

  return (
    <div aria-label={`${dataset.name} scale`}>
      <div
        {...stylex.props(styles.legendGradient)}
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(${colors.filled[0].join(', ')}), rgb(${colors.filled[1].join(', ')}))`,
        }}
      />
      <div {...stylex.props(styles.legendLabels)}>
        <span>{formatValue(story, Math.min(...values))}</span>
        <span>{formatValue(story, Math.max(...values))}</span>
      </div>
      {story === 'renewable' ? null : (
        <p {...stylex.props(styles.source)}>
          {scale} color scale · values shown in original units
        </p>
      )}
    </div>
  );
};

const DatasetSection = ({
  dataset,
  story,
}: {
  dataset: Dataset;
  story: Story;
}) => {
  const details = STORY_DETAILS[story];
  const storyStyles = STORY_STYLES[story];
  const globeRef = useRef<ChoroplethGlobeRef>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(() =>
    story === 'oil'
      ? (getFeaturedEntries(story, dataset.entries).at(0)?.alpha2 ?? null)
      : null
  );
  const sourceById = new Map(
    dataset.entries.map((entry) => [entry.alpha2, entry])
  );
  const globeData: ChoroplethGlobeData[] = [];
  for (const entry of dataset.entries) {
    globeData.push({
      alpha2: entry.alpha2,
      label: entry.label,
      value: getGlobeValue(story, entry.value),
    });
  }
  const featuredEntries = getFeaturedEntries(story, dataset.entries);
  const highlightedEntry = featuredEntries.at(0);
  const formattedTooltipValue = (
    _value: number,
    entry: ChoroplethGlobeData
  ) => {
    const source = sourceById.get(entry.id ?? entry.alpha2);
    return source ? `${formatValue(story, source.value)} · ${source.year}` : '';
  };

  const isInteractive = story !== 'forest';
  const showList = story !== 'forest';

  return (
    <section
      aria-labelledby={`${story}-heading`}
      {...stylex.props(styles.section, storyStyles.section)}
    >
      <div {...stylex.props(styles.sectionGrid)}>
        <div {...stylex.props(styles.content)}>
          <h2 id={`${story}-heading`} {...stylex.props(styles.heading)}>
            {details.heading}
          </h2>
          <p {...stylex.props(styles.summary)}>{details.summary}</p>
          {story === 'forest' && highlightedEntry ? (
            <div {...stylex.props(styles.highlight, styles.forestHighlight)}>
              <strong {...stylex.props(styles.highlightValue)}>
                {formatValue(story, highlightedEntry.value)}
              </strong>
              <span>
                {highlightedEntry.label}, latest available year{' '}
                {highlightedEntry.year}
              </span>
            </div>
          ) : null}
          <DatasetLegend dataset={dataset} story={story} />
          <p {...stylex.props(styles.source)}>
            {dataset.name} · {dataset.entries.length} countries · {dataset.unit}{' '}
            · latest available: {formatYearRange(dataset.entries)} ·{' '}
            {dataset.source}
          </p>
          <CopyButton
            code={getExampleCode(story, dataset.entries)}
            label={`${details.heading} code example`}
          />
        </div>
        <div {...stylex.props(styles.visual)}>
          <ChoroplethGlobe
            activeEntryId={activeEntryId}
            aria-label={`${dataset.name} by country`}
            colorScheme={story === 'oil' ? 'dark' : 'light'}
            colors={details.colors}
            data={globeData}
            formatValue={formattedTooltipValue}
            globe={{
              autoRotate: story === 'forest' || story === 'renewable',
              baseColor: details.glow,
              glowColor: details.glow,
              initialPhi: details.initialPhi,
              interactive: isInteractive,
            }}
            onActiveEntryChange={setActiveEntryId}
            ref={globeRef}
            renderTooltip={({ entry, formattedValue, label, x, y }) =>
              entry ? (
                <div
                  data-testid="globe-tooltip"
                  {...stylex.props(styles.tooltip, storyStyles.tooltip)}
                  style={{ left: x, top: y }}
                >
                  <strong>{label}</strong>
                  <span {...stylex.props(styles.tooltipValue)}>
                    {formattedValue}
                  </span>
                </div>
              ) : null
            }
          />
          {showList ? (
            <ul {...stylex.props(styles.rankList)}>
              {featuredEntries.map((entry) => (
                <li key={entry.alpha2}>
                  <button
                    onBlur={() => globeRef.current?.clearHoveredEntry()}
                    onClick={() =>
                      globeRef.current?.navigateToEntry(entry.alpha2)
                    }
                    onFocus={() => globeRef.current?.hoverEntry(entry.alpha2)}
                    onMouseEnter={() =>
                      globeRef.current?.hoverEntry(entry.alpha2)
                    }
                    onMouseLeave={() => globeRef.current?.clearHoveredEntry()}
                    {...stylex.props(
                      styles.rankButton,
                      storyStyles.rankButton,
                      story === 'oil' || story === 'renewable'
                        ? styles.rankButtonWithFlag
                        : null
                    )}
                    type="button"
                  >
                    {story === 'oil' || story === 'renewable' ? (
                      <Flag
                        code={entry.alpha2}
                        gradient="real-linear"
                        hasDropShadow
                        size="s"
                      />
                    ) : null}
                    <span>{entry.label}</span>
                    <strong>{formatValue(story, entry.value)}</strong>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const ChoroplethGlobeDemo = ({
  forest,
  oil,
  renewable,
  water,
}: {
  forest: Dataset;
  oil: Dataset;
  renewable: Dataset;
  water: Dataset;
}) => (
  <>
    <DatasetSection dataset={forest} story="forest" />
    <DatasetSection dataset={oil} story="oil" />
    <DatasetSection dataset={water} story="water" />
    <DatasetSection dataset={renewable} story="renewable" />
  </>
);

export { ChoroplethGlobeDemo };
