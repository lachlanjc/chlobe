'use client';

import * as stylex from '@stylexjs/stylex';
import { Tooltip, TooltipTrigger } from 'react-aria-components/Tooltip';

import { installPrompt } from './install-prompt-text';
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
  prompt: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
    overflowWrap: 'anywhere',
  },
});

const InstallPrompt = () => (
  <TooltipTrigger delay={0}>
    <CopyButton
      code={installPrompt}
      copyLabel="Copy prompt"
      label="install prompt"
    />
    <Tooltip offset={8} placement="bottom" {...stylex.props(styles.popover)}>
      <p {...stylex.props(styles.prompt)}>{installPrompt}</p>
    </Tooltip>
  </TooltipTrigger>
);

export { InstallPrompt };
