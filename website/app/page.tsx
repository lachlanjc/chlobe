import * as stylex from "@stylexjs/stylex";

import { ChoroplethGlobeDemo } from "./ChoroplethGlobeDemo";

const styles = stylex.create({
  description: {
    color: "#d5ddf7",
    fontSize: 18,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 560,
  },
  eyebrow: {
    color: "#b8c9ff",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  intro: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  shell: {
    backgroundColor: "#0B2471",
    color: "#FFFBF3",
    display: "flex",
    flexDirection: "column",
    gap: 40,
    minHeight: "100svh",
    padding: "clamp(24px, 6vw, 88px)",
  },
  title: {
    fontSize: "clamp(38px, 7vw, 72px)",
    letterSpacing: "-0.055em",
    lineHeight: 0.98,
    margin: 0,
    maxWidth: 760,
    textWrap: "balance",
  },
  titleGlobe: {
    color: "#ABF1D0",
  },
});

const Home = () => (
  <main {...stylex.props(styles.shell)}>
    <section {...stylex.props(styles.intro)}>
      <p {...stylex.props(styles.eyebrow)}>Cobe Countries</p>
      <h1 {...stylex.props(styles.title)}>
        Visualize country data on a gl
        <span {...stylex.props(styles.titleGlobe)}></span>be.
      </h1>
      <p {...stylex.props(styles.description)}>
        Hover a country or the legend to inspect its data. Drag the globe to
        explore.
      </p>
    </section>
    <ChoroplethGlobeDemo />
  </main>
);

export default Home;
