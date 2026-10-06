'use client';

import * as stylex from '@stylexjs/stylex';

import { ChoroplethGlobe } from '../../../dist/index.js';
import type { ChoroplethGlobeTooltip } from '../../../dist/index.js';
import { STORY_DETAILS } from './demo-data';
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

export { DatasetGlobe };
