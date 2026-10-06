'use client';

import * as stylex from '@stylexjs/stylex';
import type { CSSProperties, ReactNode } from 'react';
import { SwitchButton, SwitchField } from 'react-aria-components/Switch';

const styles = stylex.create({
  switchButton: {
    alignItems: 'center',
    color: '#354150',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 14,
    gap: 12,
    padding: 4,
    position: 'relative',
  },
  switchFocus: { outline: '2px solid currentColor', outlineOffset: 3 },
  switchThumb: {
    backgroundColor: {
      '@media (forced-colors: active)': 'ButtonText',
      default: '#ffffff',
    },
    borderRadius: 1,
    height: 16,
    width: 16,
  },
  switchThumbSelected: {
    backgroundColor: {
      '@media (forced-colors: active)': 'HighlightText',
      default: '#ffffff',
    },
    transform: 'translateX(16px)',
  },
  switchTrack: {
    backgroundColor: {
      '@media (forced-colors: active)': 'ButtonFace',
      default: '#e2e8f0',
    },
    border: '1px solid #94a3b8',
    borderRadius: 2,
    display: 'flex',
    flexShrink: 0,
    height: 20,
    padding: 2,
    width: 36,
  },
  switchTrackSelected: {
    backgroundColor: {
      '@media (forced-colors: active)': 'Highlight',
      default: 'var(--switch-accent)',
    },
    borderColor: {
      '@media (forced-colors: active)': 'Highlight',
      default: 'var(--switch-accent)',
    },
  },
});

const Switch = ({
  accentColor = '#1d4ed8',
  isSelected,
  children,
  onChange,
}: {
  accentColor?: string;
  isSelected: boolean;
  children: ReactNode;
  onChange: (selected: boolean) => void;
}) => {
  const style: CSSProperties & { '--switch-accent': string } = {
    '--switch-accent': accentColor,
  };

  return (
    <SwitchField isSelected={isSelected} onChange={onChange} style={style}>
      <SwitchButton {...stylex.props(styles.switchButton)}>
        {({ isSelected: selected, isFocusVisible }) => (
          <>
            <span
              aria-hidden="true"
              {...stylex.props(
                styles.switchTrack,
                selected && styles.switchTrackSelected,
                isFocusVisible && styles.switchFocus
              )}
            >
              <span
                {...stylex.props(
                  styles.switchThumb,
                  selected && styles.switchThumbSelected
                )}
              />
            </span>
            {children}
          </>
        )}
      </SwitchButton>
    </SwitchField>
  );
};

export { Switch };
