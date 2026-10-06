import * as stylex from '@stylexjs/stylex';

import { contentStyles } from './content-styles';

const Story = () => (
  <div>
    <h2 {...stylex.props(contentStyles.heading)}>The story</h2>
    <p {...stylex.props(contentStyles.paragraph)}>
      Most globes on the web use 3D renderers, which are massive. Shu Ding’s{' '}
      <a {...stylex.props(contentStyles.link)} href="https://cobe.vercel.app/">
        cobe
      </a>{' '}
      realized you could prebuild a tiny bitmap of where land is and render a
      sphere with a shader in just 5KB. Brilliant!
    </p>
    <p {...stylex.props(contentStyles.paragraph)}>
      But cobe doesn’t know where countries are. Adding GeoJSON data and
      rendering it is easily &gt;100KB. <strong>chlobe</strong> evolves cobe’s
      approach, preprocessing the GeoJSON and uniquely coloring each country
      into the compressed bitmap, then keeps an index of country codes &amp;
      colors to render levels over each country’s dots using a provided color
      scale. The library is just 15KB minified.
    </p>
    <p {...stylex.props(contentStyles.paragraph)}>
      Thanks to{' '}
      <a
        {...stylex.props(contentStyles.link)}
        href="https://www.nickrabinowitz.com/"
      >
        Nick Rabinowitz
      </a>{' '}
      for this idea.
    </p>
  </div>
);

export { Story };
