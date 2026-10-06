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
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#0B2471',
    color: '#FFFBF3',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minHeight: '64svh',
    padding: 'clamp(40px, 8vw, 120px) clamp(24px, 6vw, 88px)',
    textAlign: 'center',
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
    textUnderlineOffset: '3px',
  },
});

const Home = () => (
  <main {...stylex.props(styles.shell)}>
    <section {...stylex.props(styles.hero, styles.intro)}>
      <p {...stylex.props(styles.eyebrow)}>`bun add chlobe`</p>
      <h1 {...stylex.props(styles.title)}>
        Visualize country data on a gl
        <span {...stylex.props(styles.titleGlobe)}></span>be.
      </h1>
      <p {...stylex.props(styles.description)}>
        It’s a{' '}
        <a
          {...stylex.props(styles.titleGlobe)}
          href="https://en.wikipedia.org/wiki/Choropleth_map"
        >
          chloropleth
        </a>{' '}
        version of the brilliant{' '}
        <a {...stylex.props(styles.titleGlobe)} href="https://cobe.vercel.app/">
          cobe
        </a>
        .
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
