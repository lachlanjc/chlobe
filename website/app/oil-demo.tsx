'use client';

import * as stylex from '@stylexjs/stylex';
import Flag from 'react-flagpack';

import { formatValue } from './demo-data';
import type { Dataset } from './demo-data';
import { DatasetGlobe, DemoCopyButton, SourceNote } from './demo-primitives';
import { demoStyles } from './demo-styles';
import { useDatasetGlobe } from './use-dataset-globe';

const styles = stylex.create({
  bar: (percentage: number) => ({
    backgroundImage: 'linear-gradient(90deg, rgb(60 94 148), rgb(190 220 255))',
    borderRadius: 2,
    clipPath: `inset(0 ${100 - percentage}% 0 0)`,
    display: 'block',
    height: 5,
    width: '100%',
  }),
  button: {
    backgroundColor: {
      ':hover': 'rgb(190 220 255 / 0.07)',
      default: 'transparent',
    },
    padding: '14px 12px',
  },
  caption: { textAlign: 'center' },
  chart: { alignSelf: 'center', minWidth: 0 },
  chartHeading: {
    borderBottom: '1px solid rgb(190 220 255 / 0.2)',
    display: 'flex',
    fontSize: 12,
    justifyContent: 'space-between',
    padding: '0 12px 12px',
  },
  globe: { marginInline: 'auto', maxWidth: 620, minWidth: 0, width: '100%' },
  header: { display: 'grid', gap: 16, maxWidth: 900 },
  layout: {
    display: 'grid',
    gap: 32,
    gridTemplateColumns: {
      '@media (min-width: 900px)': 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
      default: 'minmax(0, 1fr)',
    },
    marginTop: 8,
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: 12,
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
  legendRamp: {
    backgroundImage: 'linear-gradient(90deg, rgb(60 94 148), rgb(190 220 255))',
    borderRadius: 2,
    height: 8,
    width: 110,
  },
  list: { listStyle: 'none', margin: 0, padding: 0 },
  row: { borderBottom: '1px solid rgb(190 220 255 / 0.12)' },
  rowHeader: {
    alignItems: 'center',
    display: 'grid',
    gap: 12,
    gridTemplateColumns: '28px minmax(0, 1fr) auto',
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#041330',
    backgroundImage:
      'radial-gradient(ellipse at 20% 55%, #183963, transparent 65%)',
    color: '#f1f5ff',
  },
  selected: { backgroundColor: 'rgb(190 220 255 / 0.1)' },
  track: {
    backgroundColor: 'rgb(190 220 255 / 0.08)',
    borderRadius: 2,
    display: 'block',
    marginLeft: 40,
  },
});

const OilDemo = ({ dataset }: { dataset: Dataset }) => {
  const demo = useDatasetGlobe(dataset, 'oil');
  const maximum = Math.max(...dataset.entries.map((entry) => entry.value));

  return (
    <section
      aria-labelledby="oil-heading"
      {...stylex.props(demoStyles.section, styles.section)}
    >
      <div {...stylex.props(demoStyles.container)}>
        <header {...stylex.props(styles.header)}>
          <h2 id="oil-heading" {...stylex.props(demoStyles.heading)}>
            Oil production
          </h2>
        </header>
        <div {...stylex.props(styles.layout)}>
          <div {...stylex.props(styles.globe)}>
            <DatasetGlobe dataset={dataset} demo={demo} story="oil" />
            <div
              aria-label="Oil production color scale"
              {...stylex.props(styles.legend)}
            >
              <span>Less production</span>
              <span aria-hidden="true" {...stylex.props(styles.legendRamp)} />
              <span>More production</span>
            </div>
            <p {...stylex.props(demoStyles.small, styles.caption)}>
              Globe: logarithmic color scale · bars: annual production
            </p>
          </div>
          <div {...stylex.props(styles.chart)}>
            <div {...stylex.props(styles.chartHeading)}>
              <span>Selected producers</span>
              <span>Annual production</span>
            </div>
            <ul {...stylex.props(styles.list)}>
              {demo.featured.map((entry) => (
                <li key={entry.alpha2} {...stylex.props(styles.row)}>
                  <button
                    type="button"
                    {...demo.entryProps(entry)}
                    {...stylex.props(
                      demoStyles.button,
                      styles.button,
                      demo.activeEntryId === entry.alpha2 && styles.selected
                    )}
                  >
                    <span {...stylex.props(styles.rowHeader)}>
                      <span aria-hidden="true">
                        <Flag code={entry.alpha2} size="s" />
                      </span>
                      <span>{entry.label}</span>
                      <strong>{formatValue('oil', entry.value)}</strong>
                    </span>
                    <span aria-hidden="true" {...stylex.props(styles.track)}>
                      <span
                        {...stylex.props(
                          styles.bar((entry.value / maximum) * 100)
                        )}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <footer {...stylex.props(demoStyles.footer)}>
          <SourceNote dataset={dataset} story="oil" />
          <DemoCopyButton dataset={dataset} story="oil" />
        </footer>
      </div>
    </section>
  );
};

export { OilDemo };
