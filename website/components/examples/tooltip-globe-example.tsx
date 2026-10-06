'use client';

import * as stylex from '@stylexjs/stylex';

import type { ChoroplethGlobeTooltip } from '../../../dist/index.js';
import { getTooltipCode } from './example-code';
import { countryNames } from './example-data';
import { GlobeExample } from './globe-example';

const styles = stylex.create({
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 4px 16px rgb(15 23 42 / 0.12)',
    color: '#354150',
    fontSize: 13,
    left: 0,
    padding: '8px 10px',
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    whiteSpace: 'nowrap',
  },
  tooltipValue: { display: 'block' },
});

const formatRenewableValue = (value: number) =>
  `${value}% renewable electricity`;

const renderCountryTooltip = ({
  alpha2,
  label,
  formattedValue,
  x,
  y,
}: ChoroplethGlobeTooltip) => (
  <div
    role="tooltip"
    {...stylex.props(styles.tooltip)}
    style={{
      transform: `translate(${x}px, ${y}px) translate(-50%, calc(-100% - 12px))`,
    }}
  >
    <strong>{label ?? countryNames.of(alpha2) ?? alpha2}</strong>
    <span {...stylex.props(styles.tooltipValue)}>
      {formattedValue ?? 'No data'}
    </span>
  </div>
);

const TooltipGlobeExample = () => (
  <GlobeExample
    getCode={getTooltipCode}
    globeProps={{
      'aria-label': 'Country tooltip globe preview',
      formatValue: formatRenewableValue,
      renderTooltip: renderCountryTooltip,
    }}
    label="Country tooltip example"
    title="globe-tooltip.tsx"
  />
);

export { TooltipGlobeExample };
