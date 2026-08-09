"use client";

import * as stylex from "@stylexjs/stylex";
import { useRef } from "react";

import { ChoroplethGlobe } from "../../dist/index.mjs";
import type {
  ChoroplethGlobeEntry,
  ChoroplethGlobeHandle,
} from "../../dist/index.mjs";

const entries: ChoroplethGlobeEntry[] = [
  {
    alpha2: "US",
    formattedValue: "43.2M tCO₂e",
    id: "us",
    label: "United States",
  },
  { alpha2: "CN", formattedValue: "31.0M tCO₂e", id: "cn", label: "China" },
  { alpha2: "BR", formattedValue: "15.8M tCO₂e", id: "br", label: "Brazil" },
  { alpha2: "IN", formattedValue: "12.4M tCO₂e", id: "in", label: "India" },
  { alpha2: "DE", formattedValue: "8.1M tCO₂e", id: "de", label: "Germany" },
  { alpha2: "AU", formattedValue: "5.7M tCO₂e", id: "au", label: "Australia" },
];

const countryNames: Record<string, string> = {
  AU: "Australia",
  BR: "Brazil",
  CN: "China",
  DE: "Germany",
  IN: "India",
  US: "United States",
};

const styles = stylex.create({
  countryButton: {
    ":focus-visible": {
      outline: "2px solid #fff2b2",
      outlineOffset: 4,
    },
    ":hover": {
      color: "#fff2b2",
    },
    alignItems: "center",
    backgroundColor: "transparent",
    border: "none",
    color: "#FFFBF3",
    cursor: "pointer",
    display: "flex",
    fontSize: 15,
    justifyContent: "space-between",
    padding: "8px 0",
    textAlign: "left",
    width: "100%",
  },
  countryList: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  demo: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "clamp(28px, 6vw, 96px)",
  },
  eyebrow: {
    color: "#b8c9ff",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  globePanel: {
    maxWidth: "100%",
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: 28,
    minWidth: "min(100%, 330px)",
  },
  legendHeading: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  legendTitle: {
    fontSize: 28,
    letterSpacing: "-0.035em",
    lineHeight: 1.1,
    margin: 0,
  },
  tooltip: {
    backgroundColor: "#FFFBF3",
    borderRadius: 8,
    color: "#0B2471",
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
    gap: 2,
    padding: "8px 10px",
    pointerEvents: "none",
    position: "absolute",
    transform: "translate(-50%, calc(-100% - 12px))",
    whiteSpace: "nowrap",
  },
});

const ChoroplethGlobeDemo = () => {
  const globeRef = useRef<ChoroplethGlobeHandle>(null);

  return (
    <section {...stylex.props(styles.demo)} aria-label="Country emissions demo">
      <div {...stylex.props(styles.globePanel)}>
        <ChoroplethGlobe
          ref={globeRef}
          choroplethInput={{
            filledColorRange: ["#FFFBF3", "#FF6633"],
            missingAlpha: 0.32,
            missingColor: "#566ba8",
            valuesByAlpha2: entries.map(({ alpha2 }, index) => [
              alpha2,
              entries.length - index,
            ]),
          }}
          colorScheme="light"
          entries={entries}
          getCountryLabel={(alpha2) => countryNames[alpha2] ?? alpha2}
          renderTooltip={({ formattedValue, label, x, y }) => (
            <div {...stylex.props(styles.tooltip)} style={{ left: x, top: y }}>
              <strong>{label}</strong>
              {formattedValue ? <span>{formattedValue}</span> : null}
            </div>
          )}
          size={520}
        />
      </div>
      <aside {...stylex.props(styles.legend)}>
        <div {...stylex.props(styles.legendHeading)}>
          <p {...stylex.props(styles.eyebrow)}>2025 footprint</p>
          <h2 {...stylex.props(styles.legendTitle)}>Emissions by country</h2>
        </div>
        <ol {...stylex.props(styles.countryList)}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                {...stylex.props(styles.countryButton)}
                onBlur={() => globeRef.current?.clearHoveredEntry()}
                onClick={() => globeRef.current?.navigateToEntry(entry.id)}
                onFocus={() => globeRef.current?.hoverEntry(entry.id)}
                onMouseEnter={() => globeRef.current?.hoverEntry(entry.id)}
                onMouseLeave={() => globeRef.current?.clearHoveredEntry()}
                type="button"
              >
                <span>{entry.label}</span>
                <strong>{entry.formattedValue}</strong>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
};

export { ChoroplethGlobeDemo };
