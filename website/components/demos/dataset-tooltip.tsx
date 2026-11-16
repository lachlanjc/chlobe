'use client';

import * as stylex from '@stylexjs/stylex';

import type { ChoroplethGlobeTooltip } from '../../../dist/index.js';
import { getTooltipPosition } from '../tooltip-position';
import { STORY_DETAILS } from './demo-data';
import type { Story } from './demo-data';
import { demoStyles } from './demo-styles';

const DatasetTooltip = ({
  story,
  tooltip: { entry, label, formattedValue, x, y },
}: {
  story: Story;
  tooltip: ChoroplethGlobeTooltip;
}) => {
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

export { DatasetTooltip };
