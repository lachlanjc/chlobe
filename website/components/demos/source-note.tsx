'use client';

import * as stylex from '@stylexjs/stylex';

import { formatYearRange, SOURCE_REGISTRY } from './demo-data';
import type { Dataset, Story } from './demo-data';
import { demoStyles } from './demo-styles';

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

export { SourceNote };
