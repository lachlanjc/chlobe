import * as stylex from '@stylexjs/stylex';

const demoStyles = stylex.create({
  button: {
    backgroundColor: 'transparent',
    borderRadius: 2,
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: { ':focus-visible': 4, default: null },
    textAlign: 'left',
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
    marginTop: 32,
  },
  globeFrame: { paddingBlock: 'clamp(24px, 4vw, 56px)' },
  heading: {
    fontSize: 'clamp(38px, 5.5vw, 72px)',
    lineHeight: 0.98,
    margin: 0,
    textWrap: 'balance',
  },
  small: { fontSize: 12, lineHeight: 1.5, margin: 0 },
  source: {
    fontSize: 12,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 780,
    opacity: 0.75,
  },
  sourceHalfWidth: {
    maxWidth: { '@media (min-width: 800px)': '50%', default: '100%' },
  },
  sourceLink: {
    color: 'inherit',
    textDecorationLine: 'underline',
    textUnderlineOffset: 2,
  },
  summary: {
    fontSize: 18,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 510,
    textWrap: 'pretty',
  },
  tooltip: (surface: string, accent: string, x: number, y: number) => ({
    backgroundColor: surface,
    borderColor: accent,
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    color: accent,
    fontSize: 13,
    left: 0,
    padding: '8px 10px',
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    transform: `translate(${x}px, ${y}px) translate(-50%, calc(-100% - 12px))`,
    whiteSpace: 'nowrap',
    zIndex: 1,
  }),
  tooltipValue: { display: 'block' },
});

export { demoStyles };
