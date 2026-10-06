import * as stylex from '@stylexjs/stylex';

const siteStyles = stylex.create({
  container: { marginInline: 'auto', maxWidth: 1260, minWidth: 0 },
  section: { padding: 'clamp(40px, 7vw, 88px) clamp(24px, 6vw, 88px)' },
});

export { siteStyles };
