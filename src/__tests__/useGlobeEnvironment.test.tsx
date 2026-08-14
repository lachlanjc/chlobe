// @vitest-environment jsdom

import { act, render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePrefersReducedMotion, useSquareSize } from '../useGlobeEnvironment';

let changeListener: (() => void) | undefined;
let responsiveWidth = 0;
const mediaQuery = {
  addEventListener: (_event: string, listener: () => void) => {
    changeListener = listener;
  },
  matches: false,
  removeEventListener: vi.fn(),
};

class ResizeObserverMock {
  static instance: ResizeObserverMock | undefined;
  callback: ResizeObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instance = this;
  }
}

const Environment = ({ fixedSize }: { fixedSize?: number }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { containerRef, size } = useSquareSize(fixedSize);
  return (
    <div
      data-prefers-reduced-motion={prefersReducedMotion}
      data-size={size}
      ref={containerRef}
    />
  );
};

beforeEach(() => {
  responsiveWidth = 0;
  ResizeObserverMock.instance = undefined;
  mediaQuery.matches = false;
  Object.defineProperty(HTMLDivElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => responsiveWidth,
  });
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.stubGlobal('matchMedia', () => mediaQuery);
});

afterEach(() => {
  vi.unstubAllGlobals();
  changeListener = undefined;
});

describe('useGlobeEnvironment', () => {
  it('reacts to reduced-motion preference changes', () => {
    const { container } = render(<Environment />);
    const element = container.firstElementChild;
    if (!(element instanceof HTMLDivElement)) {
      throw new Error('Expected environment element');
    }
    expect(element.dataset.prefersReducedMotion).toBe('false');

    mediaQuery.matches = true;
    act(() => changeListener?.());
    expect(element.dataset.prefersReducedMotion).toBe('true');
  });

  it('uses a ResizeObserver when no fixed size is supplied and cleans it up', () => {
    const { container, unmount } = render(<Environment />);
    const element = container.firstElementChild;
    if (!(element instanceof HTMLDivElement)) {
      throw new Error('Expected environment element');
    }
    responsiveWidth = 320;
    act(() =>
      ResizeObserverMock.instance?.callback([], ResizeObserverMock.instance)
    );
    expect(element.dataset.size).toBe('320');

    const observer = ResizeObserverMock.instance;
    unmount();
    expect(observer?.disconnect).toHaveBeenCalledOnce();
  });

  it('uses the fixed size without creating a ResizeObserver', () => {
    const { container } = render(<Environment fixedSize={256} />);
    expect(container.firstElementChild?.dataset.size).toBe('256');
    expect(ResizeObserverMock.instance).toBeUndefined();
  });
});
