'use client';

import * as stylex from '@stylexjs/stylex';

import { ChoroplethGlobe } from '../../../dist/index.js';
import type { ChoroplethGlobeTooltip } from '../../../dist/index.js';
import { getTooltipPosition } from '../tooltip-position';
import { STORY_DETAILS } from './demo-data';
import type { Dataset, Story } from './demo-data';
import { demoStyles } from './demo-styles';
import type { useDatasetGlobe } from './use-dataset-globe';

const renderTooltip = (
  story: Story,
  { entry, label, formattedValue, x, y }: ChoroplethGlobeTooltip
) => {
  if (!entry) {
    return null;
  }
  const { surface, accent } = STORY_DETAILS[story];
  const tooltipProps = stylex.props(demoStyles.tooltip(surface, accent));
  return (
    <div
      data-testid="globe-tooltip"
      {...tooltipProps}
      style={{ ...tooltipProps.style, ...getTooltipPosition(x, y) }}
    >
      <strong>{label}</strong>
      <span {...stylex.props(demoStyles.tooltipValue)}>{formattedValue}</span>
    </div>
  );
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
        colors={{ ...details.colors, base: details.glow, glow: details.glow }}
        data={data}
        formatValue={formatTooltipValue}
        autoRotate
        initialPhi={details.initialPhi}
        interactive
        onActiveEntryChange={handleActiveEntryChange}
        ref={globeRef}
        renderTooltip={(tooltip) => renderTooltip(story, tooltip)}
        style={{ containerType: 'inline-size' }}
      />
    </div>
  );
};

export { DatasetGlobe };
