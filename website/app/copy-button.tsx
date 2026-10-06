'use client';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';
import { Button } from 'react-aria-components/Button';

const styles = stylex.create({
  button: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderColor: 'currentColor',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    color: 'var(--sh-title-color, inherit)',
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: 1.5,
    padding: '3px 8px',
  },
  focus: { outline: '2px solid currentColor', outlineOffset: 3 },
  hover: {
    backgroundColor: 'color-mix(in srgb, currentColor 10%, transparent)',
  },
  overlay: { position: 'absolute', right: 10, top: 8 },
  pressed: {
    backgroundColor: 'color-mix(in srgb, currentColor 18%, transparent)',
  },
});

const CopyButton = ({
  code,
  label,
  overlay = false,
}: {
  code: string;
  label: string;
  overlay?: boolean;
}) => {
  const [status, setStatus] = useState<'Copy' | 'Copied' | 'Try again'>('Copy');

  useEffect(() => {
    if (status === 'Copy') {
      return;
    }
    const timeout = setTimeout(() => setStatus('Copy'), 2000);
    return () => clearTimeout(timeout);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus('Copied');
    } catch {
      setStatus('Try again');
    }
  };

  return (
    <Button
      aria-label={`Copy ${label}`}
      className={({ isFocusVisible, isHovered, isPressed }) =>
        stylex.props(
          styles.button,
          overlay && styles.overlay,
          isHovered && styles.hover,
          isPressed && styles.pressed,
          isFocusVisible && styles.focus
        ).className ?? ''
      }
      onPress={copy}
      type="button"
    >
      <span aria-live="polite">{status}</span>
    </Button>
  );
};

export { CopyButton };
