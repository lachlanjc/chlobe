'use client';

import * as stylex from '@stylexjs/stylex';

import { CopyButton } from '../ui/copy-button';
import {
  formatYearRange,
  getExampleCode,
  SOURCE_REGISTRY,
  STORY_DETAILS,
} from './demo-data';
import type { Dataset, Story } from './demo-data';
import { demoStyles } from './demo-styles';

const DemoFooter = ({ dataset, story }: { dataset: Dataset; story: Story }) => (
  <footer {...stylex.props(demoStyles.footer)}>
    <p
      {...stylex.props(
        demoStyles.source,
        story === 'water' && demoStyles.sourceHalfWidth
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
    <CopyButton
      code={getExampleCode(story, dataset.entries)}
      copyLabel="Copy code"
      label={`${STORY_DETAILS[story].heading} code example`}
    />
  </footer>
);

export { DemoFooter };
