'use client';

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { ChoroplethGlobe } from '../../../dist/index.js';
import type {
  ChoroplethGlobeColors,
  ChoroplethGlobeTooltip,
} from '../../../dist/index.js';
import { CodeBlock } from '../ui/code-block';
import { getTooltipCode } from './example-code';
import { countryNames, data, initialColors } from './example-data';
import { exampleStyles } from './example-styles';
import { GlobeControls } from './globe-controls';

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

const TooltipGlobeExample = () => {
  const [colors, setColors] = useState<ChoroplethGlobeColors>(initialColors);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <div {...stylex.props(exampleStyles.example)}>
      <CodeBlock
        aria-label="Country tooltip example"
        fontSize={14}
        lang="typescript"
        title="globe-tooltip.tsx"
      >
        {getTooltipCode(colors, autoRotate, interactive)}
      </CodeBlock>
      <div {...stylex.props(exampleStyles.preview)}>
        <div {...stylex.props(exampleStyles.previewLayout)}>
          <div {...stylex.props(exampleStyles.globe)}>
            <ChoroplethGlobe
              aria-label="Country tooltip globe preview"
              colors={colors}
              data={data}
              formatValue={formatRenewableValue}
              globe={{ autoRotate, interactive }}
              renderTooltip={renderCountryTooltip}
            />
          </div>
          <GlobeControls
            autoRotate={autoRotate}
            colors={colors}
            interactive={interactive}
            onAutoRotateChange={setAutoRotate}
            onColorsChange={setColors}
            onInteractiveChange={setInteractive}
          />
        </div>
      </div>
    </div>
  );
};

export { TooltipGlobeExample };
