import * as stylex from '@stylexjs/stylex';

import { contentStyles } from './content-styles';
import { ReferenceTable } from './ui/reference-table';

const styles = stylex.create({
  container: { minWidth: 0, overflowWrap: 'anywhere' },
  heading: { fontSize: 20, marginBottom: 12, marginTop: 32 },
  title: { marginBottom: 20 },
});

const propRows = [
  [
    'data',
    'Required',
    'Country entries: alpha2, value, optional id and label · IDs default to alpha2',
  ],
  [
    'colors',
    'Required',
    'Two filled RGB tuples and one missing tuple; channels 0–255',
  ],
  ['colors.missingAlpha', '0.25', 'Missing-country opacity'],
  ['size', 'Container width', 'Square size in CSS pixels'],
  ['colorScheme', 'light', 'light or dark'],
  [
    'activeEntryId',
    'Uncontrolled',
    'Selected ID; null clears · Pair with onActiveEntryChange',
  ],
  ['defaultActiveEntryId', 'null', 'Initial uncontrolled selection'],
  ['onCountryHover', '', 'Hovered country code or null'],
  ['formatValue', '', 'Formats (value, entry)'],
  ['renderTooltip', '', 'Your tooltip UI; absent by default'],
  ['onError', '', 'WebGL initialization or context-loss errors'],
  ['aria-label', 'Country choropleth globe', 'Describe your data'],
  ['className / style', '', 'Applied to the container'],
] as const;

const optionRows = [
  ['autoRotate', 'true', 'Idle rotation'],
  ['interactive', 'true', 'Dragging, hover, and left/right arrows'],
  ['initialPhi', '0', 'Starting rotation in radians'],
  ['baseColor / glowColor', 'Color scheme', 'Surface and glow RGB tuples'],
] as const;

const ApiReference = () => (
  <div {...stylex.props(styles.container)}>
    <h2 {...stylex.props(contentStyles.heading, styles.title)}>
      API reference
    </h2>
    <ReferenceTable label="Globe props and defaults" rows={propRows} />
    <h3 {...stylex.props(styles.heading)}>Globe options</h3>
    <ReferenceTable label="Globe options and defaults" rows={optionRows} />
    <p {...stylex.props(contentStyles.paragraph)}>
      A static image needs both{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>
        interactive: false
      </code>{' '}
      and{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>autoRotate: false</code>
      .
    </p>
    <h3 {...stylex.props(styles.heading)}>Colors</h3>
    <p {...stylex.props(contentStyles.paragraph)}>
      Colors range from the smallest to largest absolute value among supported
      countries in your data. Values of 10 and −10 get the same color. For a
      logarithmic ramp with nonnegative values, pass{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>Math.log1p(value)</code>{' '}
      as each entry’s value. Keep the original values for tooltip formatting.
    </p>
    <h3 {...stylex.props(styles.heading)}>Selection and tooltips</h3>
    <p {...stylex.props(contentStyles.paragraph)}>
      Active entries rotate into view and pause idle rotation. Ref methods:{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>hoverEntry(id)</code>{' '}
      selects,{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>
        clearHoveredEntry()
      </code>{' '}
      clears, and{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>
        navigateToEntry(id)
      </code>{' '}
      only rotates.
    </p>
    <p {...stylex.props(contentStyles.paragraph)}>
      Tooltips receive{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>
        {'{ source, alpha2, entry, entryId, label, formattedValue, x, y }'}
      </code>
      . The x and y coordinates position your tooltip in CSS pixels relative to
      the globe. Countries outside your data have no entry or formatted value.
      Provide{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>formatValue</code> to
      format values for display.
    </p>
    <h3 {...stylex.props(styles.heading)}>Accessibility</h3>
    <p {...stylex.props(contentStyles.paragraph)}>
      Include an{' '}
      <code {...stylex.props(contentStyles.inlineCode)}>aria-label</code> with a
      text summary. Interactive globes support keyboard rotation; static globes
      use an image role. Reduced motion stops idle rotation.
    </p>
  </div>
);

export { ApiReference };
