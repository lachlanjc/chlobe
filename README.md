# chlobe

[cobe](https://cobe.vercel.app/) is a brilliant, 5kb library for rendering globes on the web.

This library is a superfast superset (16kb total) for visualizing country-level data (e.g. population density per country) on a cobe-style WebGL choropleth globe. Give it country values and a color ramp; it renders the globe while you can control labels, value formatting, and tooltip UI.

## Install

```sh
pnpm add chlobe
```

`react` 18 or later is a peer dependency. The component needs a browser with WebGL support.

## Quick start

```tsx
import { ChoroplethGlobe } from 'chlobe';

const emissions = [
  { id: 'us', alpha2: 'US', label: 'United States', value: 6 },
  { id: 'br', alpha2: 'BR', label: 'Brazil', value: 1.3 },
  { id: 'in', alpha2: 'IN', label: 'India', value: 4.1 },
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

Each entry needs a stable `id`, an ISO 3166-1 alpha-2 `alpha2` country code, and a numeric `value`. `label` is optional metadata for your UI. RGB colors use channels from `0` through `255`.

(Why RGB tuples? Shaders use [Here’s a converter](https://retool.com/utilities/hex-to-rgb).)

With no `size`, the globe fills the width of its container and keeps a square aspect ratio. Pass `size={360}` for a fixed CSS-pixel square.

## Tooltips and selection

The package deliberately renders no tooltip DOM. Supply `renderTooltip` to render your own UI; the callback receives the matching entry, formatted value, and CSS-pixel `{ x, y }` anchor relative to the globe container.

```tsx
import { useState } from 'react';
import { ChoroplethGlobe } from 'chlobe';

export const InteractiveGlobe = () => {
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  return (
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
      formatValue={(value) => `${value} tCO₂e`}
      onActiveEntryChange={setActiveEntryId}
      renderTooltip={(tooltip) => (
        <div
          style={{
            left: tooltip.x,
            pointerEvents: 'none',
            position: 'absolute',
            top: tooltip.y,
            transform: 'translate(-50%, calc(-100% - 12px))',
          }}
        >
          <strong>{tooltip.label ?? tooltip.alpha2}</strong>
          {tooltip.formattedValue ? <div>{tooltip.formattedValue}</div> : null}
        </div>
      )}
    />
  );
};
```

`activeEntryId` is controlled when provided. For uncontrolled use, set `defaultActiveEntryId`. Selecting an entry centers it and produces a tooltip with `source: 'entry'`; pointer tooltips have `source: 'pointer'`. Use `onCountryHover` when you need just the hovered country code.

For integrations that need an imperative escape hatch, attach a ref and call `hoverEntry(id)`, `clearHoveredEntry()`, or `navigateToEntry(id)`.

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
- `interactive` defaults to `true`; it enables pointer dragging and arrow-key rotation. Set it to `false` for a static, accessible image.
- `initialPhi` is the starting horizontal rotation in radians.
- `baseColor` and `glowColor` use the same 0–255 RGB convention as `colors`.
- `colorScheme` accepts `'light'` (default) or `'dark'`.

Provide `onError={(error) => ...}` to handle unavailable WebGL, shader compilation or linking errors, and context loss. Initialization failures leave an inert canvas; the callback receives the diagnostic. When a WebGL context is lost, animation and interaction pause until the browser restores it. The library then recreates its GPU resources and reapplies the current palette, appearance, and rotation.

## Accessibility

Always provide a meaningful `aria-label`. Interactive globes expose a focusable canvas with arrow-key rotation. A non-interactive globe uses an image role and does not enter the tab order. Respectful motion is built in: rotation stops when the user prefers reduced motion.

## Geographic coverage

The built-in geography comes from Natural Earth 110m: 177 country and territory features, including Kosovo (`XK`). It does not include every ISO2 country. Dots use a fixed 16,000-point lattice; pointer hit-testing uses a 512 × 256 country raster. Small countries and islands can be absent from the source or too small to receive a dot or hover cell. Puerto Rico has source geometry and a navigation anchor, but no hover cell at this resolution.

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
