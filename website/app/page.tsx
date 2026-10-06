import * as stylex from '@stylexjs/stylex';

import forest from '../public/data/forest-area-per-person.json';
import oil from '../public/data/oil-production.json';
import renewable from '../public/data/renewable-electricity-share.json';
import water from '../public/data/water-withdrawals-per-person.json';
import { ChoroplethGlobeDemo } from './choropleth-globe-demo';
import { CodeBlock } from './code-block';
import { demoStyles } from './demo-styles';
import { Hero } from './hero';
import { ProjectBar } from './project-bar';
import {
  BasicGlobeExample,
  LegendGlobeExample,
  TooltipGlobeExample,
} from './tech-globe-previews';

const styles = stylex.create({
  storyLink: { color: '#0B2471', textUnderlineOffset: 3 },
  tech: {
    padding: 'clamp(40px, 7vw, 88px) clamp(24px, 6vw, 88px)',
  },
  techContent: {
    columnGap: 64,
    display: 'grid',
    rowGap: 32,
  },
  techHead: {
    fontSize: 24,
    fontWeight: 700,
    gridColumn: '1 / -1',
    margin: 0,
  },
  techP: {
    fontSize: 18,
    lineHeight: 1.5,
    marginBlock: 12,
    maxWidth: 640,
    textWrap: 'pretty',
  },
});

const Home = () => (
  <>
    <ProjectBar as="header" />
    <Hero />
    <ChoroplethGlobeDemo
      forest={forest}
      oil={oil}
      renewable={renewable}
      water={water}
    />
    <section {...stylex.props(styles.tech)}>
      <div {...stylex.props(demoStyles.container, styles.techContent)}>
        <div>
          <h2 {...stylex.props(styles.techHead)}>The story</h2>
          <p {...stylex.props(styles.techP)}>
            Most globes on the web use 3D renderers, which are massive. Shu
            Ding’s{' '}
            <a
              {...stylex.props(styles.storyLink)}
              href="https://cobe.vercel.app/"
            >
              cobe
            </a>{' '}
            realized you could prebuild a tiny bitmap of where land is and
            render a sphere with a shader in just 5KB. Brilliant!
          </p>
          <p {...stylex.props(styles.techP)}>
            But cobe doesn’t know where countries are. Adding GeoJSON data and
            rendering it is easily &gt;100KB. <strong>chlobe</strong> evolves
            cobe’s approach, uniquely coloring each country in the compressed
            bitmap, then keeps an index of country names &amp; colors to render
            levels over each country’s dots using a provided color scale. It’s
            just 15KB.
          </p>
          <p {...stylex.props(styles.techP)}>
            Thanks to{' '}
            <a
              {...stylex.props(styles.storyLink)}
              href="https://www.nickrabinowitz.com/"
            >
              Nick Rabinowitz
            </a>{' '}
            for this idea.
          </p>
        </div>
        <div>
          <h2 {...stylex.props(styles.techHead)}>Install &amp; use</h2>
          <p {...stylex.props(styles.techP)}>
            Add with your preferred package manager:
          </p>
          <CodeBlock
            aria-label="Install chlobe and React"
            fontSize={14}
            lang="shell"
          >
            pnpm add chlobe
          </CodeBlock>
          <p {...stylex.props(styles.techP)}>
            Then render a globe in React with an RGB color ramp:
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
      </div>
    </section>
    <ProjectBar as="footer" />
  </>
);

export default Home;
