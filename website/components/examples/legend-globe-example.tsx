'use client';

import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';

import { ChoroplethGlobe } from '../../../dist/index.js';
import type {
  ChoroplethGlobeColors,
  ChoroplethGlobeRef,
} from '../../../dist/index.js';
import { CodeBlock } from '../ui/code-block';
import { getLegendCode } from './example-code';
import { countryNames, data, initialColors } from './example-data';
import { exampleStyles } from './example-styles';
import { GlobeControls } from './globe-controls';

const styles = stylex.create({
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
});

const LegendGlobeExample = () => {
  const [colors, setColors] = useState<ChoroplethGlobeColors>(initialColors);
  const globe = useRef<ChoroplethGlobeRef>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <div {...stylex.props(exampleStyles.example)}>
      <CodeBlock
        aria-label="Custom legend example"
        fontSize={14}
        lang="typescript"
        title="globe-legend.tsx"
      >
        {getLegendCode(colors, autoRotate, interactive)}
      </CodeBlock>
      <div {...stylex.props(exampleStyles.preview)}>
        <div {...stylex.props(exampleStyles.previewLayout)}>
          <div {...stylex.props(exampleStyles.globe)}>
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

export { LegendGlobeExample };
