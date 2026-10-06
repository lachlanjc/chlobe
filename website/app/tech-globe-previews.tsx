'use client';

import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';
import type { Color } from 'react-aria-components/ColorPicker';

import { ChoroplethGlobe } from '../../dist/index.js';
import type {
  ChoroplethGlobeColors,
  ChoroplethGlobeRef,
  ChoroplethGlobeTooltip,
  ChoroplethRgb,
} from '../../dist/index.js';
import { CodeBlock } from './code-block';
import { ColorPicker } from './color-picker';
import { Switch } from './switch';

const initialColors = {
  filled: [
    [219, 234, 254],
    [29, 78, 216],
  ],
  missing: [148, 163, 184],
} satisfies ChoroplethGlobeColors;

// Renewable electricity share (%), 2021, rounded to one decimal place.
const data = [
  { alpha2: 'NO', value: 99.1 },
  { alpha2: 'BR', value: 77.4 },
  { alpha2: 'DE', value: 39.8 },
  { alpha2: 'CN', value: 28.4 },
  { alpha2: 'SA', value: 0.1 },
];
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

const styles = stylex.create({
  colorControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    // justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  controls: {
    alignSelf: 'center',
    borderWidth: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    margin: 0,
    minWidth: 0,
    padding: 0,
  },
  controlsLegend: {
    borderWidth: 0,
    clip: 'rect(0, 0, 0, 0)',
    clipPath: 'inset(50%)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
  },
  example: {
    alignItems: 'center',
    display: 'grid',
    gap: 32,
    gridTemplateColumns: {
      '@media (min-width: 1000px)': 'minmax(0, 1.35fr) minmax(0, 1fr)',
      default: 'minmax(0, 1fr)',
    },
  },
  globe: { justifySelf: 'center', maxWidth: 400, minWidth: 0, width: '100%' },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  legendButton: {
    backgroundColor: { ':hover': '#dbeafe', default: '#eff6ff' },
    borderColor: '#bfdbfe',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    color: '#1d4ed8',
    cursor: 'pointer',
    fontSize: 14,
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: { ':focus-visible': 3, default: null },
    padding: '8px 12px',
  },
  preview: {
    containerName: 'globe-preview',
    containerType: 'inline-size',
    justifySelf: 'center',
    minWidth: 0,
    width: '100%',
  },
  previewLayout: {
    alignItems: 'start',
    display: 'grid',
    gap: 24,
    gridTemplateColumns: {
      '@container globe-preview (min-width: 512px)': 'minmax(0, 1fr) 200px',
      default: 'minmax(0, 1fr)',
    },
  },
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

const toRgb = (color: Color): ChoroplethRgb => {
  const rgb = color.toFormat('rgb');
  return [
    Math.round(rgb.getChannelValue('red')),
    Math.round(rgb.getChannelValue('green')),
    Math.round(rgb.getChannelValue('blue')),
  ];
};

const GlobeControls = ({
  autoRotate,
  colors,
  interactive,
  onAutoRotateChange,
  onColorsChange,
  onInteractiveChange,
}: {
  autoRotate: boolean;
  colors: ChoroplethGlobeColors;
  interactive: boolean;
  onAutoRotateChange: (selected: boolean) => void;
  onColorsChange: (colors: ChoroplethGlobeColors) => void;
  onInteractiveChange: (selected: boolean) => void;
}) => (
  <fieldset {...stylex.props(styles.controls)}>
    <legend {...stylex.props(styles.controlsLegend)}>Options</legend>
    <div {...stylex.props(styles.colorControls)}>
      <Switch
        accentColor={`rgb(${colors.filled[1].join(', ')})`}
        isSelected={autoRotate}
        onChange={onAutoRotateChange}
      >
        Auto-rotate
      </Switch>
      <Switch
        accentColor={`rgb(${colors.filled[1].join(', ')})`}
        isSelected={interactive}
        onChange={onInteractiveChange}
      >
        Interactive
      </Switch>
    </div>
    <div {...stylex.props(styles.colorControls)}>
      <ColorPicker
        label="Minimum"
        onChange={(color) =>
          onColorsChange({
            ...colors,
            filled: [toRgb(color), colors.filled[1]],
          })
        }
        value={`rgb(${colors.filled[0].join(', ')})`}
      />
      <ColorPicker
        label="Maximum"
        onChange={(color) =>
          onColorsChange({
            ...colors,
            filled: [colors.filled[0], toRgb(color)],
          })
        }
        value={`rgb(${colors.filled[1].join(', ')})`}
      />
      <ColorPicker
        label="Missing"
        onChange={(color) =>
          onColorsChange({ ...colors, missing: toRgb(color) })
        }
        value={`rgb(${colors.missing.join(', ')})`}
      />
    </div>
  </fieldset>
);

const dataCode = `// Renewable electricity share (%), 2021.
const data = [
${data.map(({ alpha2, value }) => `  { alpha2: '${alpha2}', value: ${value} },`).join('\n')}
];`;

const getBasicCode = (
  colors: ChoroplethGlobeColors,
  autoRotate: boolean,
  interactive: boolean
) => `import { ChoroplethGlobe } from 'chlobe';

${dataCode}

<ChoroplethGlobe
  aria-label="Example renewable electricity shares by country"
  colors={{
    filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
    missing: [${colors.missing.join(', ')}]
  }}
  data={data}
  globe={{ autoRotate: ${autoRotate}, interactive: ${interactive} }}
/>`;

const getLegendCode = (
  colors: ChoroplethGlobeColors,
  autoRotate: boolean,
  interactive: boolean
) => `'use client';

import { useRef } from 'react';
import { ChoroplethGlobe, type ChoroplethGlobeRef } from 'chlobe';

${dataCode}
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const GlobeWithLegend = () => {
  const globe = useRef<ChoroplethGlobeRef>(null);

  return (
    <>
      <ChoroplethGlobe
        aria-label="Custom legend globe preview"
        ref={globe}
        data={data}
        globe={{ autoRotate: ${autoRotate}, interactive: ${interactive} }}
        colors={{
          filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
          missing: [${colors.missing.join(', ')}]
        }}
      />
      {data.map(({ alpha2, value }) => (
        <button
          key={alpha2}
          type="button"
          onMouseEnter={() => globe.current?.hoverEntry(alpha2)}
          onMouseLeave={() => globe.current?.clearHoveredEntry()}
          onFocus={() => globe.current?.hoverEntry(alpha2)}
          onBlur={() => globe.current?.clearHoveredEntry()}
          onClick={() => globe.current?.navigateToEntry(alpha2)}
        >
          {countryNames.of(alpha2) ?? alpha2} · {value}%
        </button>
      ))}
    </>
  );
};`;

const getTooltipCode = (
  colors: ChoroplethGlobeColors,
  autoRotate: boolean,
  interactive: boolean
) => `import { ChoroplethGlobe } from 'chlobe';

${dataCode}
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

<ChoroplethGlobe
  aria-label="Country tooltip globe preview"
  data={data}
  colors={{
    filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
    missing: [${colors.missing.join(', ')}]
  }}
  globe={{ autoRotate: ${autoRotate}, interactive: ${interactive} }}
  formatValue={(value) => \`\${value}% renewable electricity\`}
  renderTooltip={({ alpha2, label, formattedValue, x, y }) => (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: \`translate(\${x}px, \${y}px) translate(-50%, calc(-100% - 12px))\`,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        background: '#ffffff',
        color: '#354150',
        border: '1px solid #cbd5e1',
        borderRadius: 2,
        boxShadow: '0 4px 16px rgb(15 23 42 / 0.12)',
        fontSize: 13,
        padding: '8px 10px',
      }}
    >
      <strong>{label ?? countryNames.of(alpha2) ?? alpha2}</strong>
      <span style={{ display: 'block' }}>
        {formattedValue ?? 'No data'}
      </span>
    </div>
  )}
/>`;

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

const BasicGlobeExample = () => {
  const [colors, setColors] = useState<ChoroplethGlobeColors>(initialColors);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <div {...stylex.props(styles.example)}>
      <CodeBlock
        aria-label="Basic globe usage"
        fontSize={14}
        lang="typescript"
        title="globe.tsx"
      >
        {getBasicCode(colors, autoRotate, interactive)}
      </CodeBlock>
      <div {...stylex.props(styles.preview)}>
        <div {...stylex.props(styles.previewLayout)}>
          <div {...stylex.props(styles.globe)}>
            <ChoroplethGlobe
              aria-label="Example renewable electricity shares by country"
              colors={colors}
              data={data}
              globe={{ autoRotate, interactive }}
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

const LegendGlobeExample = () => {
  const [colors, setColors] = useState<ChoroplethGlobeColors>(initialColors);
  const globe = useRef<ChoroplethGlobeRef>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <div {...stylex.props(styles.example)}>
      <CodeBlock
        aria-label="Custom legend example"
        fontSize={14}
        lang="typescript"
        title="legend.tsx"
      >
        {getLegendCode(colors, autoRotate, interactive)}
      </CodeBlock>
      <div {...stylex.props(styles.preview)}>
        <div {...stylex.props(styles.previewLayout)}>
          <div {...stylex.props(styles.globe)}>
            <ChoroplethGlobe
              aria-label="Custom legend globe preview"
              colors={colors}
              data={data}
              globe={{ autoRotate, interactive }}
              ref={globe}
            />
            <div {...stylex.props(styles.legend)}>
              {data.map(({ alpha2, value }) => (
                <button
                  key={alpha2}
                  {...stylex.props(styles.legendButton)}
                  onBlur={() => globe.current?.clearHoveredEntry()}
                  onClick={() => globe.current?.navigateToEntry(alpha2)}
                  onFocus={() => globe.current?.hoverEntry(alpha2)}
                  onMouseEnter={() => globe.current?.hoverEntry(alpha2)}
                  onMouseLeave={() => globe.current?.clearHoveredEntry()}
                  type="button"
                >
                  {countryNames.of(alpha2) ?? alpha2} · {value}%
                </button>
              ))}
            </div>
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

const TooltipGlobeExample = () => {
  const [colors, setColors] = useState<ChoroplethGlobeColors>(initialColors);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <div {...stylex.props(styles.example)}>
      <CodeBlock
        aria-label="Country tooltip example"
        fontSize={14}
        lang="typescript"
        title="tooltip.tsx"
      >
        {getTooltipCode(colors, autoRotate, interactive)}
      </CodeBlock>
      <div {...stylex.props(styles.preview)}>
        <div {...stylex.props(styles.previewLayout)}>
          <div {...stylex.props(styles.globe)}>
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

export { BasicGlobeExample, LegendGlobeExample, TooltipGlobeExample };
