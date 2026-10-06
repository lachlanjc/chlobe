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
    // minHeight: '64svh',
    padding: 'clamp(30px, 8vh, 60px) clamp(24px, 6vw, 88px)',
    textAlign: 'center',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  tech: {
    display: 'grid',
    gap: 32,
    gridTemplateColumns: 'repeat(2, 1fr)',
    marginInline: 'auto',
    maxWidth: 1200,
    padding: 'clamp(30px, 8vh, 60px) clamp(24px, 6vw, 88px)',
  },
  techHead: {
    fontSize: 24,
    fontWeight: 700,
    gridColumn: '1 / -1',
    margin: 0,
  },
  techP: {
    // color: '#d5ddf7',
    fontSize: 18,
    lineHeight: 1.5,
    marginBlock: 12,
    maxWidth: 560,
    textWrap: 'pretty',
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
  <>
    <header {...stylex.props(styles.hero, styles.intro)}>
      <p {...stylex.props(styles.eyebrow)}>`bun add chlobe`</p>
      <h1 {...stylex.props(styles.title)}>
        Visualize country data on a gl
        <span {...stylex.props(styles.titleGlobe)}></span>be.
      </h1>
      <p {...stylex.props(styles.description)}>
        A 15KB{' '}
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
    </header>
    <section {...stylex.props(styles.tech)}>
      <div>
        <h2 {...stylex.props(styles.techHead)}>The story</h2>
        <p {...stylex.props(styles.techP)}>
          Most globes on the web use 3D renderers, which are massive. Shu Ding’s{' '}
          <a
            {...stylex.props(styles.titleGlobe)}
            href="https://cobe.vercel.app/"
          >
            cobe
          </a>{' '}
          realized you could prebuild a tiny bitmap of where land is and render
          a sphere with a shader in just 5KB. Brilliant!
        </p>
        <p {...stylex.props(styles.techP)}>
          But cobe doesn’t know where countries are. Adding GeoJSON data and
          rendering it is easily &gt;100KB. <strong>chlobe</strong> evolves
          cobe’s approach, uniquely coloring each country in the compressed
          bitmap, then keeps an index of country names &amp; colors to render
          levels over each country’s dots using a provided color scale. It’s
          just 15KB.
        </p>
      </div>
      <div>
        <h2 {...stylex.props(styles.techHead)}>Behavior</h2>
        <ul {...stylex.props(styles.techP)}>
          <li>
            <strong>Auto-rotate:</strong> spins the globe slowly by default, but
            stops when you interact with it.
          </li>
          <li>
            <strong>Interactive:</strong> rotate it with your mouse or touch
            gestures. Hovering over a country will highlight it and show its
            name and value in a tooltip.
          </li>
          <li>
            <strong>Remote control:</strong> quickly rotate to a country when
            you hover its legend entry
          </li>
        </ul>
      </div>
    </section>
    <ChoroplethGlobeDemo
      forest={forest}
      oil={oil}
      renewable={renewable}
      water={water}
    />
  </>
);

export default Home;
