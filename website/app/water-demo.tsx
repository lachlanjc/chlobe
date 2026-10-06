'use client';

import * as stylex from '@stylexjs/stylex';

import { formatValue, getFillColor } from './demo-data';
import type { Dataset } from './demo-data';
import { DatasetGlobe, DemoCopyButton, SourceNote } from './demo-primitives';
import { demoStyles } from './demo-styles';
import { useDatasetGlobe } from './use-dataset-globe';

const styles = stylex.create({
  bar: (height: number, color: string) => ({
    backgroundImage: `linear-gradient(180deg, ${color}, #78bde5)`,
    borderRadius: 2,
    display: 'block',
    height,
    minHeight: 2,
    width: '100%',
  }),
  barWell: {
    alignItems: 'end',
    backgroundImage:
      'repeating-linear-gradient(to top, rgb(18 70 224 / 0.14) 0 1px, transparent 1px 32px)',
    display: 'flex',
    height: 160,
    paddingInline: '20%',
  },
  button: { display: 'grid', gap: 12, padding: 10, textAlign: 'center' },
  charts: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: {
      '@media (min-width: 800px)': 'repeat(6, minmax(0, 1fr))',
      default: 'repeat(3, minmax(0, 1fr))',
    },
    listStyle: 'none',
    margin: '24px 0 0',
    padding: 0,
  },
  country: { fontSize: 13, lineHeight: 1.3, minHeight: '2.6em' },
  globe: { margin: '24px auto 0', maxWidth: 460, width: '100%' },
  header: {
    display: 'grid',
    gap: 18,
    justifyItems: 'center',
    marginInline: 'auto',
    maxWidth: 840,
    textAlign: 'center',
  },
  heading: {
    backgroundClip: 'text',
    backgroundImage: {
      '@media (forced-colors: active)': 'none',
      default: 'linear-gradient(180deg, #0b2471 10%, #1246e0 60%, #3487c1)',
    },
    color: {
      '@media (forced-colors: active)': 'CanvasText',
      default: 'transparent',
    },
  },
  legend: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: 12,
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  section: {
    backgroundImage: 'linear-gradient(180deg, #edf9fc, #c4e7f4 50%, #e9f6fb)',
    color: '#1246e0',
  },
  selected: { backgroundColor: 'rgb(255 255 255 / 0.5)' },
  swatch: (color: string) => ({
    backgroundColor: color,
    borderRadius: 2,
    height: 12,
    width: 12,
  }),
  value: { fontSize: 'clamp(18px, 2.3vw, 28px)', letterSpacing: '-0.04em' },
});

const WaterDemo = ({ dataset }: { dataset: Dataset }) => {
  const demo = useDatasetGlobe(dataset, 'water');
  const maximum = Math.max(...dataset.entries.map((entry) => entry.value));
  const comparisonMaximum = Math.max(
    ...demo.featured.map((entry) => entry.value)
  );

  return (
    <section
      aria-labelledby="water-heading"
      {...stylex.props(demoStyles.section, styles.section)}
    >
      <div {...stylex.props(demoStyles.container)}>
        <header {...stylex.props(styles.header)}>
          <h2
            id="water-heading"
            {...stylex.props(demoStyles.heading, styles.heading)}
          >
            Freshwater withdrawals
            <br />
            per person
          </h2>
        </header>
        <div {...stylex.props(styles.globe)}>
          <DatasetGlobe dataset={dataset} demo={demo} story="water" />
        </div>
        <div
          aria-label="Freshwater withdrawals color scale"
          {...stylex.props(styles.legend)}
        >
          <span>0 m³/person</span>
          {[0, 0.25, 0.5, 0.75, 1].map((amount) => (
            <span
              aria-hidden="true"
              key={amount}
              {...stylex.props(
                styles.swatch(
                  getFillColor('water', dataset, maximum * amount ** 2)
                )
              )}
            />
          ))}
          <span>{formatValue('water', maximum)}</span>
          <span>· square-root globe scale</span>
        </div>
        <ul
          aria-label="Annual freshwater withdrawals per person"
          {...stylex.props(styles.charts)}
        >
          {demo.featured.map((entry) => (
            <li key={entry.alpha2}>
              <button
                type="button"
                {...demo.entryProps(entry)}
                {...stylex.props(
                  demoStyles.button,
                  styles.button,
                  demo.activeEntryId === entry.alpha2 && styles.selected
                )}
              >
                <strong {...stylex.props(styles.value)}>
                  {Math.round(entry.value).toLocaleString()}{' '}
                  <span {...stylex.props(demoStyles.small)}>m³</span>
                </strong>
                <span aria-hidden="true" {...stylex.props(styles.barWell)}>
                  <span
                    {...stylex.props(
                      styles.bar(
                        (entry.value / comparisonMaximum) * 160,
                        getFillColor('water', dataset, entry.value)
                      )
                    )}
                  />
                </span>
                <span {...stylex.props(styles.country)}>{entry.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <footer {...stylex.props(demoStyles.footer)}>
          <SourceNote dataset={dataset} halfWidth story="water" />
          <DemoCopyButton dataset={dataset} story="water" />
        </footer>
      </div>
    </section>
  );
};

export { WaterDemo };
