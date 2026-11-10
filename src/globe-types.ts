import type { CSSProperties, ReactNode } from 'react';

/** One country and the value used to shade it. */
export interface ChoroplethGlobeData {
  /** Stable application identifier for active-entry controls. Defaults to alpha2. */
  id?: string;
  /** ISO 3166-1 alpha-2 country code, unique within the data. */
  alpha2: string;
  /** Numeric value used to calculate the country's fill. */
  value: number;
  /** Optional caller-owned display name. */
  label?: string;
}

/** An RGB color with channels in the inclusive 0-255 range. */
export type ChoroplethRgb = readonly [number, number, number];

/** Colors for the country palette and globe appearance. */
export interface ChoroplethGlobeColors {
  /** Fill color ramp from the smallest to largest absolute value. */
  filled: readonly [ChoroplethRgb, ChoroplethRgb];
  /** Fill for countries absent from {@link ChoroplethGlobeProps.data}. */
  missing: ChoroplethRgb;
  /** Neutral globe surface color. Defaults to the color scheme. */
  base?: ChoroplethRgb;
  /** Outer glow color. Defaults to the color scheme. */
  glow?: ChoroplethRgb;
  /** Opacity for countries absent from the data. Defaults to 0.25. */
  missingAlpha?: number;
}

/** A rendered tooltip's country identity and CSS-pixel anchor. */
export interface ChoroplethGlobeTooltip {
  source: 'pointer' | 'entry';
  alpha2: string;
  entry: ChoroplethGlobeData | null;
  entryId: string | null;
  label: string | null;
  formattedValue: string | null;
  x: number;
  y: number;
}

/** Imperative helpers for integrations that cannot use controlled props. */
export interface ChoroplethGlobeRef {
  /** Request an active entry by ID; unknown IDs are ignored. */
  setActiveEntry: (id: string) => void;
  /** Request that the active entry be cleared. */
  clearActiveEntry: () => void;
  /** Rotate to an entry without changing the active entry. */
  navigateToEntry: (id: string) => void;
}

export interface ChoroplethGlobeProps {
  /** Country values and tooltip metadata; duplicate alpha2 codes throw an error. */
  data: readonly ChoroplethGlobeData[];
  colors: ChoroplethGlobeColors;
  /** Fixed square size in CSS pixels. Omit for responsive container sizing. */
  size?: number;
  colorScheme?: 'light' | 'dark';
  /** Whether the globe rotates while idle. Defaults to true. */
  autoRotate?: boolean;
  /** Initial horizontal rotation in radians. Defaults to 0. */
  initialPhi?: number;
  /** Whether pointer and keyboard rotation are enabled. Defaults to true. */
  interactive?: boolean;
  /**
   * Controls the active entry. A matching geographic anchor rotates into view;
   * entry tooltips require `renderTooltip`.
   */
  activeEntryId?: string | null;
  /** Initial active entry in uncontrolled usage. */
  defaultActiveEntryId?: string | null;
  /** Called when a ref method requests an active-entry change. */
  onActiveEntryChange?: (id: string | null) => void;
  /** Reports pointer hover by country code, independently of the active entry. */
  onCountryHover?: (alpha2: string | null) => void;
  /** Reports WebGL initialization failures and recoverable context loss. */
  onError?: (error: Error) => void;
  /** Formats a numeric entry value for the tooltip. */
  formatValue?: (value: number, entry: ChoroplethGlobeData) => string;
  /** Optional caller-owned tooltip UI. No tooltip DOM is rendered by default. */
  renderTooltip?: (tooltip: ChoroplethGlobeTooltip) => ReactNode;
  /** Accessible name for the interactive globe, or its image alternative. */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
}
