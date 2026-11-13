'use client';

import * as stylex from '@stylexjs/stylex';
import { Dialog } from 'react-aria-components/Dialog';
import { Link } from 'react-aria-components/Link';
import { Popover } from 'react-aria-components/Popover';
import { PreviewTrigger } from 'react-aria-components/PreviewTrigger';

import {
  installPrompt,
  installPromptPrefix,
  installPromptUrl,
} from './install-prompt-text';
import { CopyButton } from './ui/copy-button';

const styles = stylex.create({
  popover: {
    backgroundColor: 'hsl(0 0% 100% / 0.9)',
    borderColor: 'rgb(11 36 113 / 0.15)',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 8px 24px rgb(11 36 113 / 0.15)',
    color: '#354150',
    maxWidth: 'calc(100vw - 24px)',
    padding: 16,
    width: 280,
  },
  dialog: { outline: 'none' },
  link: {
    color: '#0B2471',
    outline: { ':focus-visible': '2px solid currentColor', default: null },
    outlineOffset: 3,
    textUnderlineOffset: 3,
  },
  prompt: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
    overflowWrap: 'anywhere',
  },
});

const InstallPrompt = () => (
  <PreviewTrigger delay={0}>
    <CopyButton
      code={installPrompt}
      copyLabel="Copy prompt"
      label="install prompt"
    />
    <Popover
      offset={8}
      placement="bottom"
      shouldSkipAnimation={false}
      {...stylex.props(styles.popover)}
    >
      <Dialog
        aria-label="Agents quickstart prompt"
        {...stylex.props(styles.dialog)}
      >
        <p {...stylex.props(styles.prompt)}>
          {installPromptPrefix}
          <Link href={installPromptUrl} {...stylex.props(styles.link)}>
            {installPromptUrl}
          </Link>
        </p>
      </Dialog>
    </Popover>
  </PreviewTrigger>
);

export { InstallPrompt };
