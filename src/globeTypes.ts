import type { CSSProperties, ReactNode } from 'react';

/** One country and the value used to shade it. */
export interface ChoroplethGlobeData {
  /** Stable application identifier, used by active-entry controls. */
  id: string;
  /** ISO 3166-1 alpha-2 country code. */
  alpha2: string;
  /** Numeric value used to calculate the country's fill. */
  value: number;
  /** Optional caller-owned display name. */
  label?: string;
  /** Optional caller-owned formatted value for a tooltip or legend. */
  formattedValue?: string | null;
}

/** Color settings used to generate the country texture. */
export interface ChoroplethGlobeColors {
  /** Fill color ramp from the smallest to largest absolute value. */
  filled: readonly [string, string];
  /** Fill for countries absent from {@link ChoroplethGlobeProps.data}. */
  missing: string;
  /** Opacity for countries absent from the data. Defaults to 0.25. */
  missingAlpha?: number;
}

/** Small, renderer-independent controls for globe behavior and appearance. */
export interface ChoroplethGlobeOptions {
  /** Whether the globe rotates while it is idle. Defaults to true. */
  autoRotate?: boolean;
  /** Initial horizontal rotation in radians. Defaults to 0. */
  initialPhi?: number;
  /** Whether pointer and keyboard rotation are enabled. Defaults to true. */
  interactive?: boolean;
  /** Neutral globe surface color. */
  baseColor?: readonly [number, number, number];
  /** Outer globe glow color. */
  glowColor?: readonly [number, number, number];
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
export interface ChoroplethGlobeHandle {
  hoverEntry: (id: string) => void;
  clearHoveredEntry: () => void;
  navigateToEntry: (id: string) => void;
}

export interface ChoroplethGlobeProps {
  /** The single source of truth for country values and tooltip metadata. */
  data: readonly ChoroplethGlobeData[];
  colors: ChoroplethGlobeColors;
  /** Fixed square size in CSS pixels. Omit for responsive container sizing. */
  size?: number;
  colorScheme?: 'light' | 'dark';
  globe?: ChoroplethGlobeOptions;
  /** A controlled active country. It is centered and receives an entry tooltip. */
  activeEntryId?: string | null;
  /** Initial active entry in uncontrolled usage. */
  defaultActiveEntryId?: string | null;
  /** Called for canvas keyboard/pointer selection and imperative hover changes. */
  onActiveEntryChange?: (id: string | null) => void;
  /** Called when pointer hit-testing enters or leaves a country. */
  onCountryHover?: (alpha2: string | null) => void;
  /** Optional caller-owned tooltip UI. No tooltip DOM is rendered by default. */
  renderTooltip?: (tooltip: ChoroplethGlobeTooltip) => ReactNode;
  /** Accessible name for the interactive globe, or its image alternative. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}
