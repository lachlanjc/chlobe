import { describe, expect, expectTypeOf, it } from 'vitest';

import { ChoroplethGlobe } from '../index';
import type {
  ChoroplethGlobeData,
  ChoroplethGlobeProps,
  ChoroplethGlobeTooltip,
} from '../index';

const data = [
  {
    alpha2: 'US',
    id: 'united-states',
    label: 'United States',
    value: 42,
  },
] satisfies ChoroplethGlobeData[];

describe('public API', () => {
  it('exports the globe component', () => {
    expect(ChoroplethGlobe).toBeDefined();
  });

  it('supports one data model for shading, labels, and tooltip identity', () => {
    expectTypeOf<ChoroplethGlobeData>().toMatchTypeOf({
      alpha2: 'US',
      id: 'united-states',
      value: 42,
    });

    const tooltip = {
      alpha2: 'US',
      entry: data[0],
      entryId: 'united-states',
      formattedValue: '42 tCO₂e',
      label: 'United States',
      source: 'entry',
      x: 100,
      y: 75,
    } satisfies ChoroplethGlobeTooltip;

    expect(tooltip).toMatchObject({
      alpha2: 'US',
      entryId: 'united-states',
      source: 'entry',
    });
  });

  it('keeps hover and tooltip features opt-in while supporting accessible use', () => {
    const props = {
      activeEntryId: 'united-states',
      'aria-label': 'Emissions by country',
      colors: {
        filled: [
          [15, 23, 42],
          [56, 189, 248],
        ],
        missing: [226, 232, 240],
      },
      data,
      defaultActiveEntryId: null,
      formatValue: (value, entry) => {
        expectTypeOf(value).toEqualTypeOf<number>();
        expectTypeOf(entry).toEqualTypeOf<ChoroplethGlobeData>();
        return `${value} tCO₂e`;
      },
      globe: { interactive: true },
      onActiveEntryChange: (entryId) => {
        expectTypeOf(entryId).toEqualTypeOf<string | null>();
      },
      onCountryHover: (alpha2) => {
        expectTypeOf(alpha2).toEqualTypeOf<string | null>();
      },
      renderTooltip: (tooltip) => {
        expectTypeOf(tooltip).toEqualTypeOf<ChoroplethGlobeTooltip>();
        return tooltip.label ?? tooltip.alpha2;
      },
    } satisfies ChoroplethGlobeProps;

    expect(props['aria-label']).toBe('Emissions by country');
  });

  it('does not require interaction or tooltip callbacks for a labelled static globe', () => {
    const props = {
      'aria-label': 'Country values',
      colors: {
        filled: [
          [15, 23, 42],
          [56, 189, 248],
        ],
        missing: [226, 232, 240],
      },
      data,
      globe: { interactive: false },
    } satisfies ChoroplethGlobeProps;

    expect(props.globe.interactive).toBeFalsy();
  });
});
