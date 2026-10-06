# chlobe

[cobe](https://cobe.vercel.app/) is a brilliant, 5kb library for rendering globes on the web.

This library is a superfast superset (15kb total) for visualizing country-level data (e.g. population density per country) on a cobe-style WebGL choropleth globe. Give it country values and a color ramp; it renders the globe while you can control labels, value formatting, and tooltip UI.

## Install

```sh
pnpm add chlobe
```

`react` 18 or later is a peer dependency. The component needs a browser with WebGL support. Use it inside a Client Component (`'use client'`).

## Quick start

```tsx
'use client';

import { ChoroplethGlobe } from 'chlobe';

const emissions = [
  { alpha2: 'US', value: 6 },
  { alpha2: 'BR', value: 1.3 },
  { alpha2: 'IN', value: 4.1 },
];

export const EmissionsGlobe = () => (
  <ChoroplethGlobe
    aria-label="Emissions by country"
    colors={{
      filled: [
        [219, 234, 254],
        [29, 78, 216],
      ],
      missing: [226, 232, 240],
    }}
    data={emissions}
    formatValue={(value) => `${value}B metric tons CO₂e`}
  />
);
```

Each entry needs an ISO 3166-1 alpha-2 `alpha2` country code and a numeric `value`. Optionally provide a stable `id` (defaults to `alpha2`) for active-entry controls, imperative methods, and tooltip `entryId`. `label` is optional metadata for your UI.

RGB colors use channels from `0` through `255`. Why RGB tuples? They’re more efficient for shaders. [Here’s a converter](https://retool.com/utilities/hex-to-rgb).

With no `size`, the globe fills the width of its container and keeps a square aspect ratio. Pass `size={360}` for a fixed CSS-pixel square.

## Color scale and country names

The ramp spans the smallest to largest **absolute value** among supported countries in `data`. Equal positive and negative magnitudes have the same color. Missing countries use `colors.missing`, with `missingAlpha` defaulting to `0.25`.

There is no configurable domain or built-in logarithmic scale. Transform values yourself with `Math.log1p` or `Math.sqrt`, keeping originals for `formatValue(value, entry)`.

Country names are caller-owned: provide `label` or use `Intl.DisplayNames`, as in the examples below.

## Tooltips and selection

The package deliberately renders no tooltip DOM. Supply `renderTooltip` to render your own UI; the callback receives the matching entry, formatted value, and CSS-pixel `{ x, y }` anchor relative to the globe container.

```tsx
'use client';

import { useState } from 'react';
import { ChoroplethGlobe } from 'chlobe';

// Illustrative annual emissions, in billions of metric tons CO₂e.
const emissions = [
  { alpha2: 'US', value: 6 },
  { alpha2: 'BR', value: 1.3 },
  { alpha2: 'IN', value: 4.1 },
];
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const InteractiveGlobe = () => {
  const [activeEntryId, setActiveEntryId] = useState<string | null>('BR');

  return (
    <>
      <button type="button" onClick={() => setActiveEntryId('US')}>
        Select United States
      </button>
      <button type="button" onClick={() => setActiveEntryId(null)}>
        Clear selection
      </button>
      <ChoroplethGlobe
        activeEntryId={activeEntryId}
        aria-label="Emissions by country"
        colors={{
          filled: [
            [219, 234, 254],
            [29, 78, 216],
          ],
          missing: [226, 232, 240],
          missingAlpha: 0.4,
        }}
        data={emissions}
        formatValue={(value) => `${value}B metric tons CO₂e`}
        onActiveEntryChange={setActiveEntryId}
        renderTooltip={(tooltip) => (
          <div
            role="tooltip"
            style={{
              left: 0,
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              transform: `translate(${tooltip.x}px, ${tooltip.y}px) translate(-50%, calc(-100% - 12px))`,
            }}
          >
            <strong>
              {tooltip.label ??
                countryNames.of(tooltip.alpha2) ??
                tooltip.alpha2}
            </strong>
            <div>{tooltip.formattedValue ?? 'No data'}</div>
          </div>
        )}
      />
    </>
  );
};
```

`activeEntryId` is controlled when provided. For uncontrolled use, set `defaultActiveEntryId`. Active entries rotate into view, pause auto-rotation, and take precedence over pointer tooltips. `onCountryHover` receives a country code or `null`. Canvas dragging and arrow keys rotate; your controls select entries.

Tooltip `source` is `'pointer'` or `'entry'`. Countries outside your data have null entry metadata; `formattedValue` is null without `formatValue`.

Ref methods use `entry.id ?? entry.alpha2`: `hoverEntry(id)` selects and notifies `onActiveEntryChange`, `clearHoveredEntry()` clears selection, and `navigateToEntry(id)` only rotates.

## Custom legend

Reuse the quick-start `emissions` data. Inside your component, attach a ref and loop over the entries:

```tsx
import { useRef } from 'react';
import type { ChoroplethGlobeRef } from 'chlobe';

// Inside your Client Component:
const globe = useRef<ChoroplethGlobeRef>(null);
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

// Attach ref={globe} to your ChoroplethGlobe, then render:
{emissions.map(({ alpha2, value }) => (
  <button
    key={alpha2}
    type="button"
    onMouseEnter={() => globe.current?.hoverEntry(alpha2)}
    onMouseLeave={() => globe.current?.clearHoveredEntry()}
    onFocus={() => globe.current?.hoverEntry(alpha2)}
    onBlur={() => globe.current?.clearHoveredEntry()}
    onClick={() => globe.current?.navigateToEntry(alpha2)}
  >
    {countryNames.of(alpha2) ?? alpha2} · {value}B metric tons CO₂e
  </button>
))}
```

## Options

Use the `globe` prop to adjust behavior and surface colors:

```tsx
<ChoroplethGlobe
  aria-label="Country values"
  colors={colors}
  data={data}
  globe={{
    autoRotate: false,
    baseColor: [15, 23, 42],
    glowColor: [56, 189, 248],
    initialPhi: 0.75,
    interactive: true,
  }}
/>
```

- `autoRotate` defaults to `true`.
- `interactive` defaults to `true`; it enables pointer dragging and arrow-key rotation. Set it to `false` for a non-interactive image; also set `autoRotate: false` to stop rotation.
- `initialPhi` is the starting horizontal rotation in radians (default `0`).
- `baseColor` and `glowColor` use the same 0–255 RGB convention as `colors`.
- `colorScheme` accepts `'light'` (default) or `'dark'`.

Provide `onError={(error) => ...}` to handle unavailable WebGL, shader compilation or linking errors, and context loss. Initialization failures leave an inert canvas; the callback receives the diagnostic. When a WebGL context is lost, animation and interaction pause until the browser restores it. The library then recreates its GPU resources and reapplies the current palette, appearance, and rotation.

All prop, data, tooltip, ref, and RGB types are exported. `className` and `style` apply to the container.

## Accessibility

Always provide a meaningful `aria-label`. Interactive globes expose a focusable canvas with arrow-key rotation. A non-interactive globe uses an image role and does not enter the tab order. Rotation stops when the user prefers reduced motion. Provide an accompanying text summary or accessible data table for the values; a canvas label alone does not expose the dataset to screen readers.

## Geographic coverage

The built-in geography comes from Natural Earth 110m: 177 country and territory features. It does not include every ISO2 country. Dots use a fixed 16,000-point lattice; pointer hit-testing uses a 512 × 256 country raster. Small countries and islands can be absent from the source or too small to receive a dot or hover cell. Puerto Rico has source geometry and a navigation anchor, but no hover cell at this resolution.

Navigation and entry tooltips use precomputed land anchors near each country's geographic centroid. Anchors are checked against source polygons during generation and stored as three-byte cell locations on a finer grid, so decoding does not round them across borders. Countries with hover coverage use anchors inside their own hover region.

## Development

```sh
pnpm build
pnpm test
pnpm check
```

The country geometry and shader modules are generated during the build. Run `pnpm generate` after changing their source inputs.

## License

[MIT](./LICENSE.md)
