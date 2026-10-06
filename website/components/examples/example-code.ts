import type { ChoroplethGlobeColors } from '../../../dist/index.js';
import { data } from './example-data';
import type { GlobeAppearance } from './example-data';

const dataCode = `// Renewable electricity share (%), 2021.
const data = [
${data.map(({ alpha2, value }) => `  { alpha2: '${alpha2}', value: ${value} },`).join('\n')}
];`;

const getBasicCode = (
  colors: ChoroplethGlobeColors,
  autoRotate: boolean,
  interactive: boolean,
  appearance: GlobeAppearance
) => `'use client';

import { ChoroplethGlobe } from '@lachlanjc/chlobe';

${dataCode}

<ChoroplethGlobe
  aria-label="Example renewable electricity shares by country"
  colors={{
    filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
    missing: [${colors.missing.join(', ')}]
  }}
  data={data}
  globe={{
    autoRotate: ${autoRotate},
    interactive: ${interactive},
    baseColor: [${appearance.baseColor.join(', ')}],
    glowColor: [${appearance.glowColor.join(', ')}],
  }}
/>`;

const getLegendCode = (
  colors: ChoroplethGlobeColors,
  autoRotate: boolean,
  interactive: boolean,
  appearance: GlobeAppearance
) => `'use client';

import { useRef } from 'react';
import { ChoroplethGlobe, type ChoroplethGlobeRef } from '@lachlanjc/chlobe';

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
        globe={{
          autoRotate: ${autoRotate},
          interactive: ${interactive},
          baseColor: [${appearance.baseColor.join(', ')}],
          glowColor: [${appearance.glowColor.join(', ')}],
        }}
        colors={{
          filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
          missing: [${colors.missing.join(', ')}]
        }}
      />
      {data.map(({ alpha2, value }) => (
        <button
          key={alpha2}
          type="button"
          onMouseEnter={() => globe.current?.hoverEntry(alpha2)}
          onMouseLeave={() => globe.current?.clearHoveredEntry()}
          onFocus={() => globe.current?.hoverEntry(alpha2)}
          onBlur={() => globe.current?.clearHoveredEntry()}
          onClick={() => globe.current?.navigateToEntry(alpha2)}
        >
          {countryNames.of(alpha2) ?? alpha2} · {value}%
        </button>
      ))}
    </>
  );
};`;

const getTooltipCode = (
  colors: ChoroplethGlobeColors,
  autoRotate: boolean,
  interactive: boolean,
  appearance: GlobeAppearance
) => `'use client';

import { ChoroplethGlobe } from '@lachlanjc/chlobe';

${dataCode}
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

<ChoroplethGlobe
  aria-label="Country tooltip globe preview"
  data={data}
  colors={{
    filled: [[${colors.filled[0].join(', ')}], [${colors.filled[1].join(', ')}]],
    missing: [${colors.missing.join(', ')}]
  }}
  globe={{
    autoRotate: ${autoRotate},
    interactive: ${interactive},
    baseColor: [${appearance.baseColor.join(', ')}],
    glowColor: [${appearance.glowColor.join(', ')}],
  }}
  formatValue={(value) => \`\${value}% renewable electricity\`}
  renderTooltip={({ alpha2, label, formattedValue, x, y }) => (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: \`translate(\${x}px, \${y}px) translate(-50%, calc(-100% - 12px))\`,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
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
/>`;

export { getBasicCode, getLegendCode, getTooltipCode };
