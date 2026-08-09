'use client';

import * as stylex from '@stylexjs/stylex';
import React, { useRef } from 'react';

import { ChoroplethGlobe } from '../../dist/index.js';
import type {
  ChoroplethGlobeData,
  ChoroplethGlobeHandle,
} from '../../dist/index.js';

const data: ChoroplethGlobeData[] = [
  {
    alpha2: 'US',
    id: 'us',
    label: 'United States',
    value: 43.2,
  },
  {
    alpha2: 'CN',
    id: 'cn',
    label: 'China',
    value: 31,
  },
  {
    alpha2: 'BR',
    id: 'br',
    label: 'Brazil',
    value: 15.8,
  },
  {
    alpha2: 'IN',
    id: 'in',
    label: 'India',
    value: 12.4,
  },
  {
    alpha2: 'DE',
    id: 'de',
    label: 'Germany',
    value: 8.1,
  },
  {
    alpha2: 'AU',
    id: 'au',
    label: 'Australia',
    value: 5.7,
  },
];

const formatValue = (value: number) => `${value.toFixed(1)}M tCO₂e`;

const styles = stylex.create({
  countryButton: {
    ':focus-visible': {
      outline: '2px solid #fff2b2',
      outlineOffset: 4,
    },
    ':hover': {
      color: '#fff2b2',
    },
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#FFFBF3',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 15,
    justifyContent: 'space-between',
    padding: '8px 0',
    textAlign: 'left',
    width: '100%',
  },
  countryList: {
    display: 'flex',
    flexDirection: 'column',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  demo: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'clamp(28px, 6vw, 96px)',
  },
  eyebrow: {
    color: '#b8c9ff',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.08em',
    margin: 0,
    textTransform: 'uppercase',
  },
  globePanel: {
    maxWidth: '100%',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    minWidth: 'min(100%, 330px)',
  },
  legendHeading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  legendTitle: {
    fontSize: 28,
    letterSpacing: '-0.035em',
    lineHeight: 1.1,
    margin: 0,
  },
  tooltip: {
    backgroundColor: '#FFFBF3',
    borderRadius: 8,
    color: '#0B2471',
    display: 'flex',
    flexDirection: 'column',
    fontSize: 13,
    gap: 2,
    padding: '8px 10px',
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translate(-50%, calc(-100% - 12px))',
    whiteSpace: 'nowrap',
  },
});

const ChoroplethGlobeDemo = () => {
  const globeRef = useRef<ChoroplethGlobeHandle>(null);

  return (
    <section {...stylex.props(styles.demo)} aria-label="Country emissions demo">
      <div {...stylex.props(styles.globePanel)}>
        <ChoroplethGlobe
          ref={globeRef}
          colors={{
            filled: [
              [147, 174, 255],
              // [38, 92, 255],
              [11, 36, 113],
            ],
            missing: [86, 107, 168],
            missingAlpha: 0.15,
          }}
          colorScheme="light"
          data={data}
          formatValue={formatValue}
          renderTooltip={({ entry, formattedValue, label, x, y }) =>
            entry ? (
              <div
                {...stylex.props(styles.tooltip)}
                data-testid="globe-tooltip"
                style={{ left: x, top: y }}
              >
                <strong>{label}</strong>
                {formattedValue ? <span>{formattedValue}</span> : null}
              </div>
            ) : null
          }
          size={520}
        />
      </div>
      <aside {...stylex.props(styles.legend)}>
        <div {...stylex.props(styles.legendHeading)}>
          <p {...stylex.props(styles.eyebrow)}>2025 footprint</p>
          <h2 {...stylex.props(styles.legendTitle)}>Emissions by country</h2>
        </div>
        <ol {...stylex.props(styles.countryList)}>
          {data.map((entry) => (
            <li key={entry.id}>
              <button
                {...stylex.props(styles.countryButton)}
                onBlur={() => globeRef.current?.clearHoveredEntry()}
                onClick={() => globeRef.current?.navigateToEntry(entry.id)}
                onFocus={() => globeRef.current?.hoverEntry(entry.id)}
                onMouseEnter={() => globeRef.current?.hoverEntry(entry.id)}
                onMouseLeave={() => globeRef.current?.clearHoveredEntry()}
                type="button"
              >
                <span>{entry.label}</span>
                <strong>{formatValue(entry.value)}</strong>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
};

export { ChoroplethGlobeDemo };
