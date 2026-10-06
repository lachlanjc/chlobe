import * as stylex from '@stylexjs/stylex';

const contentStyles = stylex.create({
  content: {
    columnGap: 64,
    display: 'grid',
    rowGap: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    gridColumn: '1 / -1',
    margin: 0,
  },
  link: { color: '#0B2471', textUnderlineOffset: 3 },
  paragraph: {
    fontSize: 18,
    lineHeight: 1.5,
    marginBlock: 12,
    maxWidth: 640,
    textWrap: 'pretty',
  },
});

export { contentStyles };
