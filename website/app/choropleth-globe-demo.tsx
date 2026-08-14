'use client';

import * as stylex from '@stylexjs/stylex';
import React, { useRef, useState } from 'react';

import 'react-flagpack/dist/style.css';
import Flag from 'react-flagpack';

import { ChoroplethGlobe } from '../../dist/index.js';
import type {
  ChoroplethGlobeData,
  ChoroplethGlobeHandle,
} from '../../dist/index.js';

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
        [224, 237, 221],
        [21, 82, 47],
      ],
      missing: [200, 232, 190],
      missingAlpha: 0.58,
    },
    glow: [224, 237, 221],
    heading: 'Forest area per person',
    initialPhi: 0.8,
    summary: 'Forest area divided by population.',
    surface: '#eff7ed',
  },
  oil: {
    accent: '#f1f5ff',
    background: '#041330',
    colors: {
      filled: [
        [79, 89, 110],
        [209, 216, 229],
      ],
      missing: [79, 89, 110],
      missingAlpha: 0.18,
    },
    glow: [79, 89, 110],
    heading: 'Where the oil comes from',
    initialPhi: 2.4,
    summary: 'The barrel room: the largest latest-reported producers.',
    surface: '#102342',
  },
  renewable: {
    accent: '#062f25',
    background: '#ff9d00',
    colors: {
      filled: [
        [255, 232, 163],
        [255, 102, 51],
      ],
      missing: [255, 235, 188],
      missingAlpha: 0.34,
    },
    glow: [255, 251, 243],
    heading: 'The almost-complete grid',
    initialPhi: -1.1,
    summary: 'The leading renewable electricity shares, latest reported year.',
    surface: 'rgb(255 251 243)',
  },
  water: {
    accent: 'rgb(18, 70, 224)',
    background: 'rgb(196, 231, 244)',
    colors: {
      filled: [
        [196, 231, 244],
        [101, 141, 253],
      ],
      missing: [3, 44, 165],
      missingAlpha: 0.01,
    },
    glow: [11, 36, 113],
    heading: 'How much freshwater does each person draw?',
    initialPhi: -2.2,
    summary: 'Annual withdrawals per person.',
    surface: '#ffffff',
  },
} as const;

const FOREST_LEGEND = [
  ['#eff7ed', '0.1'],
  ['#e0eddd', '1'],
  ['#c8e8be', '5'],
  ['#afd9a5', '10+'],
  ['#8ab280', ''],
  ['#4a7d40', ''],
  ['#15522f', ''],
] as const;

const WATER_LEGEND = [0, 500, 1000, 2000, 3500] as const;

const styles = stylex.create({
  content: { display: 'flex', flexDirection: 'column', gap: 22 },
  forest: { backgroundColor: '#eff7ed', color: '#15522f' },
  forestHighlight: { borderLeft: '4px solid #15522f' },
  forestSwatch0: { backgroundColor: '#eff7ed' },
  forestSwatch1: { backgroundColor: '#e0eddd' },
  forestSwatch2: { backgroundColor: '#c8e8be' },
  forestSwatch3: { backgroundColor: '#afd9a5' },
  forestSwatch4: { backgroundColor: '#8ab280' },
  forestSwatch5: { backgroundColor: '#4a7d40' },
  forestSwatch6: { backgroundColor: '#15522f' },
  heading: {
    fontSize: 'clamp(38px, 5vw, 70px)',
    letterSpacing: '-0.055em',
    lineHeight: 0.94,
    margin: 0,
    maxWidth: 580,
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
  legendStack: { display: 'flex', height: 12, overflow: 'hidden' },
  legendSwatch: { flex: 1 },
  oil: { backgroundColor: '#041330', color: '#f1f5ff' },
  rankButton: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '28px 1fr auto',
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
  rankButtonWithFlag: { gridTemplateColumns: '30px 28px 1fr auto' },
  rankList: {
    display: 'grid',
    gap: 2,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  rankNumber: { fontVariantNumeric: 'tabular-nums', opacity: 0.65 },
  renewable: { backgroundColor: '#ff9d00', color: '#062f25' },
  renewableGradient: {
    backgroundImage:
      'linear-gradient(90deg, rgb(255, 232, 163), rgb(255, 102, 51))',
  },
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
  waterGradient: {
    backgroundImage:
      'linear-gradient(90deg, rgb(196, 231, 244), rgb(18, 70, 224))',
  },
});

const FOREST_SWATCH_STYLES = [
  styles.forestSwatch0,
  styles.forestSwatch1,
  styles.forestSwatch2,
  styles.forestSwatch3,
  styles.forestSwatch4,
  styles.forestSwatch5,
  styles.forestSwatch6,
] as const;

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

const getTopEntries = (entries: readonly DatasetEntry[]) => {
  const topEntries: DatasetEntry[] = [];
  for (const entry of entries) {
    const insertionIndex = topEntries.findIndex(
      (topEntry) => entry.value > topEntry.value
    );
    if (insertionIndex === -1) {
      topEntries.push(entry);
    } else {
      topEntries.splice(insertionIndex, 0, entry);
    }
    if (topEntries.length > 5) {
      topEntries.pop();
    }
  }
  return topEntries;
};

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
  if (story === 'oil') {
    return Math.log1p(value);
  }
  return story === 'water' ? Math.sqrt(value) : value;
};

const ForestLegend = () => (
  <div aria-label="Forest area per person scale">
    <div {...stylex.props(styles.legendStack)}>
      {FOREST_LEGEND.map(([color], index) => (
        <span
          key={color}
          {...stylex.props(styles.legendSwatch, FOREST_SWATCH_STYLES[index])}
        />
      ))}
    </div>
    <div {...stylex.props(styles.legendLabels)}>
      {FOREST_LEGEND.slice(0, 4).map(([, label]) => (
        <span key={label}>{label} ha</span>
      ))}
    </div>
  </div>
);

const WaterLegend = () => (
  <div aria-label="Freshwater withdrawals per person scale">
    <div {...stylex.props(styles.legendGradient, styles.waterGradient)} />
    <div {...stylex.props(styles.legendLabels)}>
      {WATER_LEGEND.map((value) => (
        <span key={value}>{value.toLocaleString()}</span>
      ))}
    </div>
  </div>
);

const RenewableLegend = () => (
  <div aria-label="Renewable electricity share scale">
    <div {...stylex.props(styles.legendGradient, styles.renewableGradient)} />
    <div {...stylex.props(styles.legendLabels)}>
      <span>0%</span>
      <span>50%</span>
      <span>100%</span>
    </div>
  </div>
);

const EmptyLegend = () => null;

const LEGEND_REGISTRY = {
  forest: ForestLegend,
  oil: EmptyLegend,
  renewable: RenewableLegend,
  water: WaterLegend,
} as const;

const DatasetSection = ({
  dataset,
  story,
}: {
  dataset: Dataset;
  story: Story;
}) => {
  const details = STORY_DETAILS[story];
  const storyStyles = STORY_STYLES[story];
  const Legend = LEGEND_REGISTRY[story];
  const globeRef = useRef<ChoroplethGlobeHandle>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(() =>
    story === 'oil'
      ? (getTopEntries(dataset.entries).at(0)?.alpha2 ?? null)
      : null
  );
  const sourceById = new Map(
    dataset.entries.map((entry) => [entry.alpha2, entry])
  );
  const globeData: ChoroplethGlobeData[] = [];
  for (const entry of dataset.entries) {
    if (story === 'oil' && entry.value === 0) {
      continue;
    }
    globeData.push({
      alpha2: entry.alpha2,
      id: entry.alpha2,
      label: entry.label,
      value: getGlobeValue(story, entry.value),
    });
  }
  const topEntries = getTopEntries(dataset.entries);
  const highlightedEntry = topEntries.at(0);
  const formattedTooltipValue = (
    _value: number,
    entry: ChoroplethGlobeData
  ) => {
    const source = sourceById.get(entry.id);
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
          <Legend />
          <p {...stylex.props(styles.source)}>
            {dataset.name} · {dataset.unit} · latest available:{' '}
            {formatYearRange(dataset.entries)} · {dataset.source}
          </p>
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
            <ol {...stylex.props(styles.rankList)}>
              {topEntries.map((entry, index) => (
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
                    <span
                      aria-hidden="true"
                      {...stylex.props(styles.rankNumber)}
                    >
                      0{index + 1}
                    </span>
                    {story === 'oil' || story === 'renewable' ? (
                      <Flag
                        code={entry.alpha2}
                        gradient="real-linear"
                        hasDropShadow
                        size="S"
                      />
                    ) : null}
                    <span>{entry.label}</span>
                    <strong>{formatValue(story, entry.value)}</strong>
                  </button>
                </li>
              ))}
            </ol>
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
