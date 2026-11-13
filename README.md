# chlobe

chlobe is a lightweight React library for visualizing country-level data (e.g. population density per country) on a [cobe](https://cobe.vercel.app/)-style WebGL choropleth globe. Give it country values and a color scale, and get a high-performance interactive globe. You can control labels, value formatting, and tooltip UI.

## Install

```sh
pnpm add @chlobe/react
```

`react` 18 or later is a peer dependency. The component needs a browser with WebGL support. Use it inside a Client Component (`'use client'`).

## Quick start

```tsx
'use client';

import { ChoroplethGlobe } from '@chlobe/react';

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

Each entry needs a unique ISO 3166-1 alpha-2 `alpha2` country code and a numeric `value`. Duplicate country codes throw an error. Optionally provide a stable `id` (defaults to `alpha2`) for active-entry controls, imperative methods, and tooltip `entryId`. `label` is optional metadata for your UI.

RGB colors use channels from `0` through `255`. Why RGB tuples? They’re more efficient for shaders. [Here’s a converter](https://retool.com/utilities/hex-to-rgb).

With no `size`, the globe fills the width of its container and keeps a square aspect ratio. Pass `size={360}` for a fixed CSS-pixel square.

## Color scale and country names

The ramp spans the smallest to largest **absolute value** among supported countries in `data`. Equal positive and negative magnitudes have the same color. Missing countries use `colors.missing`, with `missingAlpha` defaulting to `0.25`.

There is no configurable domain or built-in logarithmic scale. Transform values yourself with `Math.log1p` or `Math.sqrt`. The component passes the supplied value through to `formatValue(value, entry)`, so both arguments contain the transformed value. Keep original values in a separate lookup (for example, keyed by `alpha2`) if tooltips should display them.

Country names are caller-owned: provide `label` or use `Intl.DisplayNames`, as in the examples below.

## Tooltips and selection

The package deliberately renders no tooltip DOM. Supply `renderTooltip` to render your own UI; the callback receives the matching entry, formatted value, and CSS-pixel `{ x, y }` anchor relative to the globe container.

```tsx
'use client';

import { ChoroplethGlobe } from '@chlobe/react';
import { useState } from 'react';

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
        style={{ containerType: 'inline-size' }}
        renderTooltip={(tooltip) => (
          <div
            role="tooltip"
            style={{
              boxSizing: 'border-box',
              left: 0,
              overflowWrap: 'anywhere',
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              transform: `translate(clamp(0px, ${tooltip.x - 110}px, calc(100cqw - 220px)), calc(${tooltip.y}px - 100% - 12px))`,
              whiteSpace: 'normal',
              width: 'min(220px, 100%)',
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

`activeEntryId` is controlled when provided. For uncontrolled use, set `defaultActiveEntryId`. Active entries rotate into view, pause auto-rotation, and take precedence over mouse-hover tooltips. On touch screens, tap a country to show its tooltip until the next interaction; auto-rotation pauses while it is visible. `onCountryHover` independently reports the country code under the pointer, including countries absent from `data`, or `null` when it leaves a country. Hovering or tapping does not change the active entry. Canvas dragging and arrow keys rotate; your controls select entries.

Tooltip `source` is `'pointer'` or `'entry'`. Countries outside your data have null entry metadata; `formattedValue` is null without `formatValue`.

Ref methods use `entry.id ?? entry.alpha2`: `setActiveEntry(id)` requests an active entry, `clearActiveEntry()` requests clearing it, and `navigateToEntry(id)` only rotates. The first two call `onActiveEntryChange` with the requested ID or `null`. With a controlled `activeEntryId`, update the prop in response; otherwise the component updates its own state. Unknown IDs are ignored.

## Custom legend

Reuse the quick-start `emissions` data. Inside your component, attach a ref and loop over the entries:

```tsx
import type { ChoroplethGlobeRef } from '@chlobe/react';
import { useRef } from 'react';

// Inside your Client Component:
const globe = useRef<ChoroplethGlobeRef>(null);
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

// Attach ref={globe} to your ChoroplethGlobe, then render:
return (
  <>
    {emissions.map(({ alpha2, value }) => (
      <button
        key={alpha2}
        type="button"
        onMouseEnter={() => globe.current?.setActiveEntry(alpha2)}
        onMouseLeave={() => globe.current?.clearActiveEntry()}
        onFocus={() => globe.current?.setActiveEntry(alpha2)}
        onBlur={() => globe.current?.clearActiveEntry()}
        onClick={() => globe.current?.navigateToEntry(alpha2)}
      >
        {countryNames.of(alpha2) ?? alpha2} · {value}B metric tons CO₂e
      </button>
    ))}
  </>
);
```

## Options

Adjust behavior with top-level props and customize colors in `colors`:

```tsx
<ChoroplethGlobe
  aria-label="Electricity usage per capita"
  colors={{
    filled: [
      [219, 234, 254],
      [29, 78, 216],
    ],
    missing: [148, 163, 184],
    missingAlpha: 0.25,
  }}
  data={data}
  colorScheme="dark"
  autoRotate={false}
  initialPhi={0.75}
  interactive={true}
/>
```

### Props reference

| Prop | Default | Purpose |
| --- | --- | --- |
| `data` | Required | Country entries with unique `alpha2`, numeric `value`, and optional stable `id` and display `label`. |
| `colors` | Required | `filled` RGB ramp and `missing` RGB color. |
| `colors.missingAlpha` | `0.25` | Opacity for countries without data. |
| `colors.base` / `colors.glow` | Color scheme | Globe surface and outer glow colors, as 0–255 RGB tuples. Custom values override the scheme defaults. |
| `size` | Container width | Omit for a responsive square; set a number for a fixed CSS-pixel square. |
| `colorScheme` | `'light'` | `'light'` or `'dark'`; selects globe shading and default surface and glow colors. |
| `autoRotate` | `true` | Rotate while idle; active selection, pointer hover, touch tooltips, and reduced motion pause rotation. |
| `interactive` | `true` | Enable pointer dragging and hover, touch taps, and arrow-key rotation. Tooltips require `renderTooltip`. Set `false` for an image-role canvas. |
| `initialPhi` | `0` | Starting horizontal rotation in radians. |
| `activeEntryId` | Uncontrolled | Controlled active entry ID; pass `null` to clear it. |
| `defaultActiveEntryId` | `null` | Initial active entry for uncontrolled use. |
| `onActiveEntryChange` | — | Called by ref methods when they request a selection change. |
| `onCountryHover` | — | Receives the pointer country code, or `null` when leaving a country. |
| `formatValue` | — | Formats `(value, entry)` for tooltips. |
| `renderTooltip` | — | Renders caller-owned tooltip UI; no tooltip DOM is added by default. |
| `onError` | — | Receives WebGL initialization and context-loss errors. |
| `aria-label` | `Country choropleth globe` | Accessible name for the canvas. |
| `className` / `style` | — | Applied to the globe container. |

`interactive` defaults to `true`; set it to `false` and `autoRotate={false}` for a static globe. When a controlled `activeEntryId` is provided, update it in response to `onActiveEntryChange` if you use the ref methods.

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
