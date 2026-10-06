'use client';

import * as stylex from '@stylexjs/stylex';

import { siteStyles } from '../site-styles';
import { DatasetGlobe } from './dataset-globe';
import { formatValue, getFillColor } from './demo-data';
import type { Dataset } from './demo-data';
import { DemoFooter } from './demo-footer';
import { demoStyles } from './demo-styles';
import { useDatasetGlobe } from './use-dataset-globe';

const styles = stylex.create({
  comparison: { borderTop: '1px solid rgb(21 82 47 / 0.2)', paddingTop: 12 },
  comparisons: {
    display: 'grid',
    gap: 24,
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  content: { display: 'grid', gap: 'clamp(32px, 3vw, 48px)', maxWidth: 520 },
  globe: { alignSelf: 'center', minWidth: 0, position: 'relative' },
  layout: {
    alignItems: 'center',
    display: 'grid',
    gap: 32,
    gridTemplateColumns: {
      '@media (min-width: 900px)': 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
      default: 'minmax(0, 1fr)',
    },
  },
  legend: { marginInline: 'auto', maxWidth: 380, paddingInline: 16 },
  legendLabels: {
    display: 'flex',
    fontSize: 12,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  section: {
    backgroundImage: 'linear-gradient(125deg, #f5f5e9, #e5eee0 60%, #d7e5d3)',
    color: '#15522f',
  },
  swatch: (color: string) => ({
    backgroundColor: color,
    borderRadius: 2,
    height: 20,
  }),
  swatches: { display: 'grid', gap: 4, gridTemplateColumns: 'repeat(5, 1fr)' },
  value: {
    display: 'block',
    fontSize: 'clamp(26px, 3vw, 36px)',
    lineHeight: 1.2,
    marginBottom: 4,
  },
});

const stops = [0, 0.25, 0.5, 0.75, 1];

const ForestDemo = ({ dataset }: { dataset: Dataset }) => {
  const demo = useDatasetGlobe(dataset, 'forest');
  const maximum = Math.max(...dataset.entries.map((entry) => entry.value));

  return (
    <section
      aria-labelledby="forest-heading"
      {...stylex.props(siteStyles.section, styles.section)}
    >
      <div {...stylex.props(siteStyles.container)}>
        <div {...stylex.props(styles.layout)}>
          <div {...stylex.props(styles.content)}>
            <h2 id="forest-heading" {...stylex.props(demoStyles.heading)}>
              Forest area per person
            </h2>
            <ul
              aria-label="Forest area per person comparisons"
              {...stylex.props(styles.comparisons)}
            >
              {demo.featured.map((entry) => (
                <li key={entry.alpha2} {...stylex.props(styles.comparison)}>
                  <strong {...stylex.props(styles.value)}>
                    {entry.value.toFixed(2)}{' '}
                    <span {...stylex.props(demoStyles.small)}>ha</span>
                  </strong>
                  <span>{entry.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div {...stylex.props(styles.globe)}>
            <DatasetGlobe dataset={dataset} demo={demo} story="forest" />
            <div
              aria-label="Forest area per person scale"
              {...stylex.props(styles.legend)}
            >
              <div aria-hidden="true" {...stylex.props(styles.swatches)}>
                {stops.map((amount) => (
                  <span
                    key={amount}
                    {...stylex.props(
                      styles.swatch(
                        getFillColor(
                          'forest',
                          dataset,
                          Math.expm1(Math.log1p(maximum) * amount)
                        )
                      )
                    )}
                  />
                ))}
              </div>
              <div {...stylex.props(styles.legendLabels)}>
                <span>0 ha/person</span>
                <span>{formatValue('forest', maximum)}</span>
              </div>
              <p {...stylex.props(demoStyles.small)}>
                Darker dots, more forest per person · logarithmic scale
              </p>
            </div>
          </div>
        </div>
        <DemoFooter dataset={dataset} story="forest" />
      </div>
    </section>
  );
};

export { ForestDemo };
