'use client';

import * as stylex from '@stylexjs/stylex';

import { ChoroplethGlobe } from '../../../dist/index.js';
import { DatasetTooltip } from './dataset-tooltip';
import { STORY_DETAILS } from './demo-data';
import type { Dataset, Story } from './demo-data';
import { demoStyles } from './demo-styles';
import type { useDatasetGlobe } from './use-dataset-globe';

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
        renderTooltip={(tooltip) => (
          <DatasetTooltip story={story} tooltip={tooltip} />
        )}
        style={{ containerType: 'inline-size' }}
      />
    </div>
  );
};

export { DatasetGlobe };
