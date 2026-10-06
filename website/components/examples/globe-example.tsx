'use client';

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { ChoroplethGlobe } from '../../../dist/index.js';
import type { ChoroplethGlobeColors } from '../../../dist/index.js';
import { CodeBlock } from '../ui/code-block';
import type { getBasicCode } from './example-code';
import { data, initialAppearance, initialColors } from './example-data';
import { exampleStyles } from './example-styles';
import { GlobeControls } from './globe-controls';

interface GlobeExampleProps {
  children?: ReactNode;
  getCode: typeof getBasicCode;
  globeProps: Pick<
    ComponentProps<typeof ChoroplethGlobe>,
    'aria-label' | 'ref' | 'formatValue' | 'renderTooltip'
  >;
  label: string;
  title: string;
}

const GlobeExample = ({
  children,
  getCode,
  globeProps,
  label,
  title,
}: GlobeExampleProps) => {
  const [appearance, setAppearance] = useState(initialAppearance);
  const [colors, setColors] = useState<ChoroplethGlobeColors>(initialColors);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <div {...stylex.props(exampleStyles.example)}>
      <CodeBlock
        aria-label={label}
        fontSize={14}
        lang="typescript"
        title={title}
      >
        {getCode(colors, autoRotate, interactive, appearance)}
      </CodeBlock>
      <div {...stylex.props(exampleStyles.preview)}>
        <div {...stylex.props(exampleStyles.previewLayout)}>
          <div {...stylex.props(exampleStyles.globe)}>
            <ChoroplethGlobe
              {...globeProps}
              colors={colors}
              data={data}
              globe={{ autoRotate, interactive, ...appearance }}
            />
            {children}
          </div>
          <GlobeControls
            appearance={appearance}
            onAppearanceChange={setAppearance}
            autoRotate={autoRotate}
            colors={colors}
            interactive={interactive}
            onAutoRotateChange={setAutoRotate}
            onColorsChange={setColors}
            onInteractiveChange={setInteractive}
          />
        </div>
      </div>
    </div>
  );
};

export { GlobeExample };
