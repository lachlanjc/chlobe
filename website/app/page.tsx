import * as stylex from '@stylexjs/stylex';
import React from 'react';

import forest from '../public/data/forest-area-per-person.json';
import oil from '../public/data/oil-production.json';
import renewable from '../public/data/renewable-electricity-share.json';
import water from '../public/data/water-withdrawals-per-person.json';
import { ChoroplethGlobeDemo } from './choropleth-globe-demo';

const styles = stylex.create({
  description: {
    color: '#d5ddf7',
    fontSize: 18,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 560,
  },
  eyebrow: {
    color: '#b8c9ff',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.08em',
    margin: 0,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: '#0B2471',
    color: '#FFFBF3',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minHeight: '64svh',
    padding: 'clamp(40px, 8vw, 120px) clamp(24px, 6vw, 88px)',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  shell: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: 'clamp(38px, 7vw, 72px)',
    letterSpacing: '-0.055em',
    lineHeight: 0.98,
    margin: 0,
    maxWidth: 760,
    textWrap: 'balance',
  },
  titleGlobe: {
    color: '#ABF1D0',
  },
});

const Home = () => (
  <main {...stylex.props(styles.shell)}>
    <section {...stylex.props(styles.hero, styles.intro)}>
      <p {...stylex.props(styles.eyebrow)}>Cobe Countries</p>
      <h1 {...stylex.props(styles.title)}>
        Visualize country data on a gl
        <span {...stylex.props(styles.titleGlobe)}></span>be.
      </h1>
      <p {...stylex.props(styles.description)}>
        Four environmental datasets, each with a globe tailored to the story it
        tells. Hover or drag the interactive maps to explore.
      </p>
    </section>
    <ChoroplethGlobeDemo
      forest={forest}
      oil={oil}
      renewable={renewable}
      water={water}
    />
  </main>
);

export default Home;
