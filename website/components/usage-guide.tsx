import * as stylex from '@stylexjs/stylex';

import { ApiReference } from './api-reference';
import { contentStyles } from './content-styles';
import { BasicGlobeExample } from './examples/basic-globe-example';
import { LegendGlobeExample } from './examples/legend-globe-example';
import { TooltipGlobeExample } from './examples/tooltip-globe-example';
import { siteStyles } from './site-styles';
import { Story } from './story';
import { CodeBlock } from './ui/code-block';

const UsageGuide = () => (
  <section {...stylex.props(siteStyles.section)}>
    <div {...stylex.props(siteStyles.container, contentStyles.content)}>
      <Story />
      <div>
        <h2 {...stylex.props(contentStyles.heading)}>Install &amp; use</h2>
        <p {...stylex.props(contentStyles.paragraph)}>
          Requires React 18+ and WebGL:
        </p>
        <CodeBlock aria-label="Install chlobe" fontSize={14} lang="shell">
          pnpm add @lachlanjc/chlobe
        </CodeBlock>
        <p {...stylex.props(contentStyles.paragraph)}>
          Render a globe with an RGB color ramp (it’s more efficient for
          shaders):
        </p>
        <BasicGlobeExample />
      </div>
      <div>
        <h2 {...stylex.props(contentStyles.heading)}>Custom legend</h2>
        <p {...stylex.props(contentStyles.paragraph)}>
          Hover or focus a legend button to highlight its country. Click it to
          rotate the globe there.
        </p>
        <LegendGlobeExample />
      </div>
      <div>
        <h2 {...stylex.props(contentStyles.heading)}>Custom tooltip</h2>
        <p {...stylex.props(contentStyles.paragraph)}>
          Hover a country to see its name and renewable electricity share.
          Countries outside the dataset show “No data”.
        </p>
        <TooltipGlobeExample />
      </div>
      <ApiReference />
    </div>
  </section>
);

export { UsageGuide };
