import * as stylex from '@stylexjs/stylex';

const exampleStyles = stylex.create({
  example: {
    alignItems: 'center',
    display: 'grid',
    gap: 32,
    gridTemplateColumns: {
      '@media (min-width: 1000px)': 'minmax(0, 1.35fr) minmax(0, 1fr)',
      default: 'minmax(0, 1fr)',
    },
  },
  globe: { justifySelf: 'center', maxWidth: 400, minWidth: 0, width: '100%' },
  preview: {
    containerName: 'globe-preview',
    containerType: 'inline-size',
    justifySelf: 'center',
    minWidth: 0,
    width: '100%',
  },
  previewLayout: {
    alignItems: 'start',
    display: 'grid',
    gap: 24,
    gridTemplateColumns: {
      '@container globe-preview (min-width: 512px)': 'minmax(0, 1fr) 200px',
      default: 'minmax(0, 1fr)',
    },
  },
});

export { exampleStyles };
