import * as stylex from '@stylexjs/stylex';
import React from 'react';

import forest from '../public/data/forest-area-per-person.json';
import oil from '../public/data/oil-production.json';
import renewable from '../public/data/renewable-electricity-share.json';
import water from '../public/data/water-withdrawals-per-person.json';
import { ChoroplethGlobeDemo } from './choropleth-globe-demo';
import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';
import {
  BasicGlobeExample,
  LegendGlobeExample,
  TooltipGlobeExample,
} from './tech-globe-previews';

const styles = stylex.create({
  description: {
    color: '#d5ddf7',
    fontSize: 18,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 560,
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
  install: { minWidth: 0, position: 'relative' },
  installCommand: {
    backgroundColor: 'rgb(255 255 255 / 0.06)',
    border: '1px solid rgb(184 201 255 / 0.25)',
    borderRadius: 2,
    color: '#b8c9ff',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: '100%',
    overflowX: 'auto',
    padding: '10px 90px 10px 16px',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  tech: {
    columnGap: 64,
    display: 'grid',
    marginInline: 'auto',
    maxWidth: 1260,
    padding: 'clamp(30px, 8vh, 60px) clamp(24px, 6vw, 88px)',
    rowGap: 32,
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
    textWrap: 'pretty',
  },
  techUl: {
    listStyle: 'none',
    padding: 0,
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
      <div {...stylex.props(styles.install)}>
        <pre
          aria-label="Install chlobe"
          {...stylex.props(styles.installCommand)}
        >
          <code>
            <span aria-hidden="true">$ </span>bun add chlobe
          </code>
        </pre>
        <CopyButton code="bun add chlobe" label="install command" overlay />
      </div>
    </header>
    <ChoroplethGlobeDemo
      forest={forest}
      oil={oil}
      renewable={renewable}
      water={water}
    />
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
        <ul {...stylex.props(styles.techUl)}>
          <li {...stylex.props(styles.techP)}>
            <strong>Auto-rotate prop:</strong> spins the globe slowly by
            default, but stops when you interact with it.
          </li>
          <li {...stylex.props(styles.techP)}>
            <strong>Interactive prop:</strong> rotate it with your mouse or
            touch gestures. Hovering over a country will highlight it and show
            its name and value in a tooltip.
          </li>
          <li {...stylex.props(styles.techP)}>
            <strong>refs for legend control:</strong> quickly rotate to a
            country when you hover its legend entry.
          </li>
        </ul>
      </div>
      <div>
        <h2 {...stylex.props(styles.techHead)}>Install &amp; use</h2>
        <p {...stylex.props(styles.techP)}>
          Install <strong>chlobe</strong> and its React peer dependency:
        </p>
        <CodeBlock
          aria-label="Install chlobe and React"
          fontSize={14}
          lang="shell"
          title="Terminal"
        >
          pnpm add chlobe react
        </CodeBlock>
        <p {...stylex.props(styles.techP)}>
          Then render a globe with 2021 renewable electricity shares and an RGB
          color ramp:
        </p>
        <BasicGlobeExample />
      </div>
      <div>
        <h2 {...stylex.props(styles.techHead)}>Custom legend</h2>
        <p {...stylex.props(styles.techP)}>
          Hover or focus a legend button to highlight its country. Click it to
          rotate the globe there.
        </p>
        <LegendGlobeExample />
      </div>
      <div>
        <h2 {...stylex.props(styles.techHead)}>Custom tooltip</h2>
        <p {...stylex.props(styles.techP)}>
          Hover a country to see its name and renewable electricity share.
          Brazil is selected initially; countries outside the dataset show “No
          data”.
        </p>
        <TooltipGlobeExample />
      </div>
    </section>
  </>
);

export default Home;
