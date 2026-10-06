'use client';

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { ChoroplethGlobe } from '../../../dist/index.js';
import type { ChoroplethGlobeColors } from '../../../dist/index.js';
import { CodeBlock } from '../ui/code-block';
import { getBasicCode } from './example-code';
import { data, initialAppearance, initialColors } from './example-data';
import { exampleStyles } from './example-styles';
import { GlobeControls } from './globe-controls';

const BasicGlobeExample = () => {
  const [appearance, setAppearance] = useState(initialAppearance);
  const [colors, setColors] = useState<ChoroplethGlobeColors>(initialColors);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <div {...stylex.props(exampleStyles.example)}>
      <CodeBlock
        aria-label="Basic globe usage"
        fontSize={14}
        lang="typescript"
        title="globe.tsx"
      >
        {getBasicCode(colors, autoRotate, interactive, appearance)}
      </CodeBlock>
      <div {...stylex.props(exampleStyles.preview)}>
        <div {...stylex.props(exampleStyles.previewLayout)}>
          <div {...stylex.props(exampleStyles.globe)}>
            <ChoroplethGlobe
              aria-label="Example renewable electricity shares by country"
              colors={colors}
              data={data}
              globe={{ autoRotate, interactive, ...appearance }}
            />
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

export { BasicGlobeExample };
