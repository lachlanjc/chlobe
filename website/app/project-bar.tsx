import * as stylex from '@stylexjs/stylex';

import { demoStyles } from './demo-styles';

const styles = stylex.create({
  bar: {
    backgroundColor: '#0B2471',
    color: '#d5ddf7',
    fontSize: 14,
    padding: '32px clamp(24px, 6vw, 88px)',
  },
  content: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'space-between',
  },
  link: {
    color: '#ABF1D0',
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: { ':focus-visible': 4, default: null },
    textUnderlineOffset: 3,
  },
  links: { display: 'flex', flexWrap: 'wrap', gap: 24 },
});

const ProjectBar = ({ as }: { as: 'header' | 'footer' }) => {
  const Element = as;
  return (
    <Element {...stylex.props(styles.bar)}>
      <div {...stylex.props(demoStyles.container, styles.content)}>
        <span>chlobe</span>
        <nav
          aria-label={`${as === 'header' ? 'Primary' : 'Footer'} project links`}
          {...stylex.props(styles.links)}
        >
          <a
            href="https://www.npmjs.com/package/chlobe"
            {...stylex.props(styles.link)}
          >
            npm
          </a>
          <a
            href="https://github.com/lachlanjc/chlobe"
            {...stylex.props(styles.link)}
          >
            GitHub
          </a>
          <a href="https://lachlanjc.com" {...stylex.props(styles.link)}>
            @lachlanjc
          </a>
        </nav>
      </div>
    </Element>
  );
};

export { ProjectBar };
