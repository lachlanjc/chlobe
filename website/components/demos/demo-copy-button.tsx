'use client';

import { CopyButton } from '../ui/copy-button';
import { getExampleCode, STORY_DETAILS } from './demo-data';
import type { Dataset, Story } from './demo-data';

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

export { DemoCopyButton };
