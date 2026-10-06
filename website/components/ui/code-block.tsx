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
    '--sh-entity': 'var(--color-purple)',
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
  forest: {
    '--sh-class': '#66558e',
    '--sh-entity': 'var(--sh-class)',
    '--sh-identifier': '#15522f',
    '--sh-jsxliterals': 'var(--color-mauve)',
    '--sh-keyword': '#8a3b32',
    '--sh-property': '#346ba0',
    '--sh-sign': 'var(--theme-muted)',
    '--sh-string': 'var(--color-green)',
    '--theme-muted': '#627a62',
    '--theme-surface': '#e0eddd',
  },
  header: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 14,
    lineHeight: 1,
    padding: '4px 90px 4px 16px',
    textAlign: 'center',
  },
  oil: {
    '--sh-class': '#c4b5fd',
    '--sh-entity': 'var(--sh-class)',
    '--sh-identifier': '#f1f5ff',
    '--sh-jsxliterals': '#f0abdc',
    '--sh-keyword': '#fda4af',
    '--sh-property': '#93c5fd',
    '--sh-sign': 'var(--theme-muted)',
    '--sh-string': '#7dd3c0',
    '--theme-muted': '#9aabc5',
    '--theme-surface': '#102342',
    colorScheme: 'dark',
  },
  renewable: {
    '--sh-class': '#6451a1',
    '--sh-entity': 'var(--sh-class)',
    '--sh-identifier': '#062f25',
    '--sh-jsxliterals': 'var(--color-mauve)',
    '--sh-keyword': '#ae3d18',
    '--sh-property': '#9e5b13',
    '--sh-sign': 'var(--theme-muted)',
    '--sh-string': 'var(--color-green)',
    '--theme-muted': '#80715d',
    '--theme-surface': '#fffbf3',
  },
  water: {
    '--sh-class': 'var(--color-purple)',
    '--sh-entity': 'var(--sh-class)',
    '--sh-identifier': '#0b2471',
    '--sh-jsxliterals': 'var(--color-mauve)',
    '--sh-keyword': '#a34142',
    '--sh-property': '#245bb4',
    '--sh-sign': 'var(--theme-muted)',
    '--sh-string': '#067565',
    '--theme-muted': '#60798e',
    '--theme-surface': '#eaf6fc',
  },
});

const colorThemes = {
  forest: styles.forest,
  oil: styles.oil,
  renewable: styles.renewable,
  water: styles.water,
};

const CodeBlock = ({
  children,
  className,
  colorTheme,
  title,
  ...props
}: CodeProps & { colorTheme?: keyof typeof colorThemes }) => {
  const { className: blockClassName } = stylex.props(
    styles.block,
    styles.defaultTheme,
    colorTheme && colorThemes[colorTheme]
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
