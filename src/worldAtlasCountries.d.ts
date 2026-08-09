/**
 * Types for the world-atlas TopoJSON data file. Declared as an ambient module
 * so TypeScript doesn't try to infer a structural type from the ~250KB JSON
 * (and so the topology gets proper topojson-specification types).
 */
declare module 'world-atlas/countries-110m.json' {
  import type { GeometryCollection, Topology } from 'topojson-specification';

  interface WorldAtlasCountryProperties {
    name: string;
  }

  const topology: Topology<{
    countries: GeometryCollection<WorldAtlasCountryProperties>;
    land: GeometryCollection;
  }>;
  export default topology;
}
