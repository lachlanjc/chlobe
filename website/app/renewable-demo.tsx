'use client';

import * as stylex from '@stylexjs/stylex';
import Flag from 'react-flagpack';

import type { Dataset } from './demo-data';
import { DatasetGlobe, DemoCopyButton, SourceNote } from './demo-primitives';
import { demoStyles } from './demo-styles';
import { useDatasetGlobe } from './use-dataset-globe';

const styles = stylex.create({
  card: {
    backgroundColor: {
      ':active': '#ffffff',
      ':hover': '#fffbf3',
      default: 'rgb(255 251 243 / 0.7)',
    },
    borderColor: 'rgb(187 62 24 / 0.18)',
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'grid',
    gap: 16,
    height: '100%',
    padding: 20,
  },
  cardHeader: { alignItems: 'center', display: 'flex', gap: 10, minHeight: 28 },
  cards: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: {
      '@media (min-width: 900px)': 'repeat(3, minmax(0, 1fr))',
      default: 'repeat(2, minmax(0, 1fr))',
    },
    listStyle: 'none',
    margin: '32px 0 0',
    padding: 0,
  },
  content: { display: 'grid', gap: 24 },
  globe: { maxWidth: 520, minWidth: 0, width: '100%' },
  layout: {
    alignItems: 'center',
    display: 'grid',
    gap: 32,
    gridTemplateColumns: {
      '@media (min-width: 900px)': 'minmax(0, 1fr) minmax(0, 1fr)',
      default: 'minmax(0, 1fr)',
    },
  },
  legend: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: 12,
    gap: 10,
  },
  mix: {
    backgroundColor: '#e5d7bb',
    borderRadius: 2,
    display: 'block',
    height: 10,
    overflow: 'hidden',
  },
  mixFill: (percentage: number) => ({
    backgroundImage: 'linear-gradient(90deg, #ffdb80, #bb3e18)',
    clipPath: `inset(0 ${100 - percentage}% 0 0)`,
    display: 'block',
    height: '100%',
    width: '100%',
  }),
  ramp: {
    backgroundImage: 'linear-gradient(90deg, #ffdb80, #bb3e18)',
    borderRadius: 2,
    height: 10,
    width: 140,
  },
  section: {
    backgroundColor: '#fff3dc',
    backgroundImage:
      'radial-gradient(ellipse at 100% 0%, #ffd181, transparent 65%)',
    color: '#71321f',
  },
  selected: {
    backgroundColor: { ':active': '#ffffff', default: '#fffbf3' },
    borderColor: '#bb3e18',
  },
  swatch: (color: string) => ({
    backgroundColor: color,
    borderRadius: 2,
    height: 10,
    width: 10,
  }),
  value: {
    fontSize: 'clamp(30px, 4vw, 48px)',
    lineHeight: 1,
  },
});

const RenewableDemo = ({ dataset }: { dataset: Dataset }) => {
  const demo = useDatasetGlobe(dataset, 'renewable');

  return (
    <section
      aria-labelledby="renewable-heading"
      {...stylex.props(demoStyles.section, styles.section)}
    >
      <div {...stylex.props(demoStyles.container)}>
        <div {...stylex.props(styles.layout)}>
          <div {...stylex.props(styles.content)}>
            <h2 id="renewable-heading" {...stylex.props(demoStyles.heading)}>
              Renewable electricity
            </h2>
            <div
              aria-label="Renewable electricity globe scale"
              {...stylex.props(styles.legend)}
            >
              <span>0%</span>
              <span aria-hidden="true" {...stylex.props(styles.ramp)} />
              <span>100% renewable</span>
            </div>
            <div {...stylex.props(styles.legend)}>
              <span
                aria-hidden="true"
                {...stylex.props(styles.swatch('#bb3e18'))}
              />
              <span>Renewable electricity</span>
              <span
                aria-hidden="true"
                {...stylex.props(styles.swatch('#e5d7bb'))}
              />
              <span>Other generation</span>
            </div>
          </div>
          <div {...stylex.props(styles.globe)}>
            <DatasetGlobe dataset={dataset} demo={demo} story="renewable" />
          </div>
        </div>
        <ul
          aria-label="Renewable electricity shares"
          {...stylex.props(styles.cards)}
        >
          {demo.featured.map((entry) => (
            <li key={entry.alpha2}>
              <button
                type="button"
                {...demo.entryProps(entry)}
                {...stylex.props(
                  demoStyles.button,
                  styles.card,
                  demo.activeEntryId === entry.alpha2 && styles.selected
                )}
              >
                <span {...stylex.props(styles.cardHeader)}>
                  <span aria-hidden="true">
                    <Flag code={entry.alpha2} size="s" />
                  </span>
                  <span>{entry.label}</span>
                </span>
                <strong {...stylex.props(styles.value)}>
                  {entry.value.toFixed(1)}
                  <span {...stylex.props(demoStyles.summary)}>%</span>
                </strong>
                <span aria-hidden="true" {...stylex.props(styles.mix)}>
                  <span {...stylex.props(styles.mixFill(entry.value))} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <footer {...stylex.props(demoStyles.footer)}>
          <SourceNote dataset={dataset} story="renewable" />
          <DemoCopyButton dataset={dataset} story="renewable" />
        </footer>
      </div>
    </section>
  );
};

export { RenewableDemo };
