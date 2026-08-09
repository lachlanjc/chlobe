import * as stylex from "@stylexjs/stylex";

export default function Home() {
  return <div {...stylex.props(styles.shell)}></div>;
}

const styles = stylex.create({
  shell: {
    display: "flex",
    flexDirection: "column",
  },
});
