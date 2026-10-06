'use client';

import * as stylex from '@stylexjs/stylex';
import { Dialog } from 'react-aria-components/Dialog';
import { Link } from 'react-aria-components/Link';
import { Popover } from 'react-aria-components/Popover';
import { PreviewTrigger } from 'react-aria-components/PreviewTrigger';

const definitionUrl = 'https://en.wikipedia.org/wiki/Choropleth_map';

const styles = stylex.create({
  definition: { fontSize: 14, lineHeight: 1.5, margin: '0 0 12px' },
  dialog: { outline: 'none' },
  fade: { opacity: 0 },
  link: {
    color: '#0B2471',
    fontSize: 14,
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: 3,
    textUnderlineOffset: 3,
  },
  popover: {
    backgroundColor: 'hsl(0 0% 100% / 0.9)',
    borderColor: 'rgb(11 36 113 / 0.15)',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 8px 24px rgb(11 36 113 / 0.15)',
    color: '#354150',
    maxWidth: 'calc(100vw - 24px)',
    opacity: 1,
    padding: 16,
    transitionDuration:  '95ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    width: 280,
  },
  trigger: {
    color: '#ABF1D0',
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: 4,
    textUnderlineOffset: 3,
  },
});

const ChoroplethDefinition = () => (
  <PreviewTrigger>
    <Link href={definitionUrl} {...stylex.props(styles.trigger)}>
      choropleth
    </Link>
    <Popover
      className={({ isEntering, isExiting }) =>
        stylex.props(styles.popover, (isEntering || isExiting) && styles.fade)
          .className ?? ''
      }
      offset={8}
      placement="bottom"
    >
      <Dialog
        aria-label="Choropleth definition"
        {...stylex.props(styles.dialog)}
      >
        <p {...stylex.props(styles.definition)}>
          A map that uses color to show how a value varies between regions, such
          as GDP by country.
        </p>
        <Link href={definitionUrl} {...stylex.props(styles.link)}>
          Wikipedia
        </Link>
      </Dialog>
    </Popover>
  </PreviewTrigger>
);

export { ChoroplethDefinition };
