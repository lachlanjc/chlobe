import * as stylex from '@stylexjs/stylex';

import { CopyButton } from './ui/copy-button';

const styles = stylex.create({
  description: {
    color: '#d5ddf7',
    fontSize: 18,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 560,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#0B2471',
    color: '#FFFBF3',
    display: 'flex',
    isolation: 'isolate',
    padding: 'clamp(48px, 12vh, 88px) clamp(24px, 6vw, 88px)',
    position: 'relative',
    textAlign: 'center',
  },
  heroContent: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    position: 'relative',
    width: '100%',
    zIndex: 1,
  },
  heroPattern: {
    backgroundImage:
      'radial-gradient(circle, rgb(184 201 255 / 0.12) 2px, transparent 2.5px), radial-gradient(circle, rgb(184 201 255 / 0.12) 2px, transparent 2.5px)',
    backgroundPosition: '0 0, 8px 14px',
    backgroundSize: '16px 28px',
    inset: 0,
    maskImage: 'radial-gradient(circle at center, #000 0%, transparent 75%)',
    pointerEvents: 'none',
    position: 'absolute',
  },
  install: { minWidth: 0, position: 'relative' },
  installCommand: {
    backgroundColor: 'rgb(255 255 255 / 0.06)',
    borderColor: 'rgb(184 201 255 / 0.25)',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    color: '#b8c9ff',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: '100%',
    overflowX: 'auto',
    padding: '10px 90px 10px 16px',
  },
  link: {
    color: '#ABF1D0',
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: { ':focus-visible': 4, default: null },
    textUnderlineOffset: 3,
  },
  title: {
    fontSize: 'clamp(38px, 7vw, 72px)',
    letterSpacing: '-0.055em',
    lineHeight: 0.98,
    margin: 0,
    maxWidth: 760,
    textAlign: 'center',
    textWrap: 'balance',
    width: '100%',
  },
});

const Hero = () => (
  <section aria-labelledby="hero-title" {...stylex.props(styles.hero)}>
    <span aria-hidden="true" {...stylex.props(styles.heroPattern)} />
    <div {...stylex.props(styles.heroContent)}>
      <h1 id="hero-title" {...stylex.props(styles.title)}>
        Visualize country data on a gl
        <span {...stylex.props(styles.link)}></span>be.
      </h1>
      <p {...stylex.props(styles.description)}>
        <strong>chlobe:</strong> a 15KB React{' '}
        <a
          href="https://en.wikipedia.org/wiki/Choropleth_map"
          {...stylex.props(styles.link)}
        >
          chloropleth
        </a>{' '}
        version of the brilliant{' '}
        <a href="https://cobe.vercel.app/" {...stylex.props(styles.link)}>
          cobe
        </a>
        .
      </p>
      <div {...stylex.props(styles.install)}>
        <pre
          aria-label="Install chlobe"
          {...stylex.props(styles.installCommand)}
        >
          <code>
            <span aria-hidden="true">$ </span>pnpm add chlobe
          </code>
        </pre>
        <CopyButton code="pnpm add chlobe" label="install command" overlay />
      </div>
    </div>
  </section>
);

export { Hero };
