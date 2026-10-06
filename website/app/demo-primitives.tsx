'use client';

import * as stylex from '@stylexjs/stylex';

import { ChoroplethGlobe } from '../../dist/index.js';
import type { ChoroplethGlobeTooltip } from '../../dist/index.js';
import { CopyButton } from './copy-button';
import {
  formatYearRange,
  getExampleCode,
  SOURCE_REGISTRY,
  STORY_DETAILS,
} from './demo-data';
import type { Dataset, Story } from './demo-data';
import { demoStyles } from './demo-styles';
import type { useDatasetGlobe } from './use-dataset-globe';

const renderTooltip = (
  story: Story,
  { entry, label, formattedValue, x, y }: ChoroplethGlobeTooltip
) => {
  const { surface, accent } = STORY_DETAILS[story];
  return entry ? (
    <div
      data-testid="globe-tooltip"
      {...stylex.props(demoStyles.tooltip(surface, accent, x, y))}
    >
      <strong>{label}</strong>
      <span {...stylex.props(demoStyles.tooltipValue)}>{formattedValue}</span>
    </div>
  ) : null;
};

const DatasetGlobe = ({
  dataset,
  story,
  demo: {
    activeEntryId,
    data,
    formatTooltipValue,
    globeRef,
    handleActiveEntryChange,
  },
}: {
  dataset: Dataset;
  story: Story;
  demo: ReturnType<typeof useDatasetGlobe>;
}) => {
  const details = STORY_DETAILS[story];
  return (
    <div {...stylex.props(demoStyles.globeFrame)}>
      <ChoroplethGlobe
        activeEntryId={activeEntryId}
        aria-label={`${dataset.name} by country`}
        colorScheme={story === 'oil' ? 'dark' : 'light'}
        colors={details.colors}
        data={data}
        formatValue={formatTooltipValue}
        globe={{
          autoRotate: story === 'renewable',
          baseColor: details.glow,
          glowColor: details.glow,
          initialPhi: details.initialPhi,
          interactive: story !== 'forest',
        }}
        onActiveEntryChange={handleActiveEntryChange}
        ref={globeRef}
        renderTooltip={(tooltip) => renderTooltip(story, tooltip)}
      />
    </div>
  );
};

const SourceNote = ({
  dataset,
  halfWidth = false,
  story,
}: {
  dataset: Dataset;
  halfWidth?: boolean;
  story: Story;
}) => (
  <p
    {...stylex.props(
      demoStyles.source,
      halfWidth && demoStyles.sourceHalfWidth
    )}
  >
    {dataset.name} · {dataset.entries.length} countries · {dataset.unit} ·
    latest available: {formatYearRange(dataset.entries)} ·{' '}
    <a
      href={SOURCE_REGISTRY[story]}
      rel="noopener noreferrer"
      target="_blank"
      {...stylex.props(demoStyles.sourceLink)}
    >
      {dataset.source}
    </a>
  </p>
);

const DemoCopyButton = ({
  dataset,
  story,
}: {
  dataset: Dataset;
  story: Story;
}) => (
  <CopyButton
    code={getExampleCode(story, dataset.entries)}
    copyLabel="Copy code"
    label={`${STORY_DETAILS[story].heading} code example`}
  />
);

export { DatasetGlobe, DemoCopyButton, SourceNote };
