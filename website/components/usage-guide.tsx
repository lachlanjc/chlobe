import * as stylex from '@stylexjs/stylex';

import { ApiReference } from './api-reference';
import { contentStyles } from './content-styles';
import { BasicGlobeExample } from './examples/basic-globe-example';
import { LegendGlobeExample } from './examples/legend-globe-example';
import { TooltipGlobeExample } from './examples/tooltip-globe-example';
import {
  installPrompt,
  installPromptPrefix,
  installPromptUrl,
} from './install-prompt-text';
import { siteStyles } from './site-styles';
import { Story } from './story';
import { CodeBlock } from './ui/code-block';
import { CopyButton } from './ui/copy-button';

const styles = stylex.create({
  prompt: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
    overflowWrap: 'anywhere',
    padding: '16px 80px 16px 16px',
    whiteSpace: 'pre-wrap',
  },
  promptBlock: {
    backgroundColor: '#f6f6f6',
    color: '#354150',
    position: 'relative',
  },
  promptLink: {
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: 3,
  },
});

const UsageGuide = () => (
  <section {...stylex.props(siteStyles.section)}>
    <div {...stylex.props(siteStyles.container, contentStyles.content)}>
      <Story />
      <div>
        <h2 {...stylex.props(contentStyles.heading)}>Agents quickstart</h2>
        <div {...stylex.props(styles.promptBlock)}>
          <pre
            aria-label="Agents quickstart prompt"
            {...stylex.props(styles.prompt)}
          >
            <code>
              {installPromptPrefix}
              <a
                href={installPromptUrl}
                {...stylex.props(contentStyles.link, styles.promptLink)}
              >
                {installPromptUrl}
              </a>
            </code>
          </pre>
          <CopyButton code={installPrompt} label="agent prompt" overlay />
        </div>
      </div>
      <div>
        <h2 {...stylex.props(contentStyles.heading)}>Install &amp; use</h2>
        <p {...stylex.props(contentStyles.paragraph)}>
          Requires React 18+ and WebGL:
        </p>
        <CodeBlock aria-label="Install chlobe" fontSize={14} lang="shell">
          pnpm add @chlobe/react
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
