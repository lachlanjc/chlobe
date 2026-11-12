import { data } from './example-data';
import type { ExampleColors } from './example-data';

const dataCode = `// Renewable electricity share (%), 2021.
const data = [
${data.map(({ alpha2, value }) => `  { alpha2: '${alpha2}', value: ${value} },`).join('\n')}
];`;

const getBasicCode = (
  colors: ExampleColors,
  autoRotate: boolean,
  interactive: boolean
) => `'use client';

import { ChoroplethGlobe } from '@chlobe/react';

${dataCode}

export const Globe = () => (
  <ChoroplethGlobe
    aria-label="Example renewable electricity shares by country"
    colors={{
      filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
      missing: [${colors.missing.join(', ')}],
      base: [${colors.base.join(', ')}],
      glow: [${colors.glow.join(', ')}],
    }}
    data={data}
    autoRotate={${autoRotate}}
    interactive={${interactive}}
  />
);`;

const getLegendCode = (
  colors: ExampleColors,
  autoRotate: boolean,
  interactive: boolean
) => `'use client';

import { useRef } from 'react';
import { ChoroplethGlobe, type ChoroplethGlobeRef } from '@chlobe/react';

${dataCode}
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const GlobeWithLegend = () => {
  const globe = useRef<ChoroplethGlobeRef>(null);

  return (
    <>
      <ChoroplethGlobe
        aria-label="Custom legend globe preview"
        ref={globe}
        data={data}
        autoRotate={${autoRotate}}
        interactive={${interactive}}
        colors={{
          filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
          missing: [${colors.missing.join(', ')}],
          base: [${colors.base.join(', ')}],
          glow: [${colors.glow.join(', ')}],
        }}
      />
      {data.map(({ alpha2, value }) => (
        <button
          key={alpha2}
          type="button"
          onMouseEnter={() => globe.current?.setActiveEntry(alpha2)}
          onMouseLeave={() => globe.current?.clearActiveEntry()}
          onFocus={() => globe.current?.setActiveEntry(alpha2)}
          onBlur={() => globe.current?.clearActiveEntry()}
          onClick={() => globe.current?.navigateToEntry(alpha2)}
        >
          {countryNames.of(alpha2) ?? alpha2} · {value}%
        </button>
      ))}
    </>
  );
};`;

const getTooltipCode = (
  colors: ExampleColors,
  autoRotate: boolean,
  interactive: boolean
) => `'use client';

import { ChoroplethGlobe } from '@chlobe/react';

${dataCode}
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const Globe = () => (
  <ChoroplethGlobe
    aria-label="Country tooltip globe preview"
    data={data}
    colors={{
      filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
      missing: [${colors.missing.join(', ')}],
      base: [${colors.base.join(', ')}],
      glow: [${colors.glow.join(', ')}],
    }}
    autoRotate={${autoRotate}}
    interactive={${interactive}}
    formatValue={(value) => \`\${value}% renewable electricity\`}
    style={{ containerType: 'inline-size' }}
    renderTooltip={({ alpha2, label, formattedValue, x, y }) => (
      <div
        role="tooltip"
        style={{
          position: 'absolute',
          boxSizing: 'border-box',
          top: 0,
          left: 0,
          transform: \`translate(clamp(0px, \${x - 110}px, calc(100cqw - 220px)), calc(\${y}px - 100% - 12px))\`,
          width: 'min(220px, 100%)',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          pointerEvents: 'none',
          background: '#ffffff',
          color: '#354150',
          border: '1px solid #cbd5e1',
          borderRadius: 2,
          boxShadow: '0 4px 16px rgb(15 23 42 / 0.12)',
          fontSize: 13,
          padding: '8px 10px',
        }}
      >
        <strong>{label ?? countryNames.of(alpha2) ?? alpha2}</strong>
        <span style={{ display: 'block' }}>
          {formattedValue ?? 'No data'}
        </span>
      </div>
    )}
  />
);`;

export { getBasicCode, getLegendCode, getTooltipCode };
