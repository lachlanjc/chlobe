'use client';

import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { ChoroplethGlobeRef } from '../../../dist/index.js';
import { getLegendCode } from './example-code';
import { countryNames, data } from './example-data';
import { GlobeExample } from './globe-example';

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
  const globe = useRef<ChoroplethGlobeRef>(null);

  return (
    <GlobeExample
      getCode={getLegendCode}
      globeProps={{ 'aria-label': 'Custom legend globe preview', ref: globe }}
      label="Custom legend example"
      title="globe-legend.tsx"
    >
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
    </GlobeExample>
  );
};

export { LegendGlobeExample };
