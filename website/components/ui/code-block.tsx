'use client';

import * as stylex from '@stylexjs/stylex';
import { Code } from '@sugar-high/react';
import type { CodeProps } from '@sugar-high/react';

import { CopyButton } from './copy-button';

const styles = stylex.create({
  block: { minWidth: 0, position: 'relative' },
  defaultTheme: {
    '--sh-class': '#8d85ff',
    '--sh-comment': 'var(--theme-muted)',
    '--sh-control-color': 'var(--theme-muted)',
    '--sh-entity': '#665ac7',
    '--sh-identifier': '#354150',
    '--sh-jsxliterals': '#bf7db6',
    '--sh-keyword': '#f47067',
    '--sh-line-number-color': 'var(--theme-muted)',
    '--sh-property': '#4e8fdf',
    '--sh-sign': '#8996a3',
    '--sh-string': '#00a99a',
    '--sh-title-color': 'var(--sh-identifier)',
    '--theme-muted': '#a19595',
    '--theme-surface': '#f6f6f6',
    backgroundColor: 'var(--theme-surface)',
    color: 'var(--sh-identifier)',
    colorScheme: 'light',
  },
  header: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 14,
    lineHeight: 1,
    padding: '4px 90px 4px 16px',
    textAlign: 'center',
  },
});

const CodeBlock = ({ children, className, title, ...props }: CodeProps) => {
  const { className: blockClassName } = stylex.props(
    styles.block,
    styles.defaultTheme
  );

  return (
    <div className={`${blockClassName} ${className ?? ''}`}>
      {title ? <div {...stylex.props(styles.header)}>{title}</div> : null}
      <Code {...props} controls={false}>
        {children}
      </Code>
      <CopyButton code={children} label={title ?? 'code'} overlay />
    </div>
  );
};

export { CodeBlock };
