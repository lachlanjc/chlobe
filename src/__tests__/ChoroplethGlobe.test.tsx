// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import React, { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ChoroplethGlobe from '../ChoroplethGlobe';
import type { ChoroplethGlobeHandle } from '../globeTypes';

const mocks = vi.hoisted(() => ({
  createGlobe: vi.fn(),
  generatePalette: vi.fn(),
  getCountryAtCoordinates: vi.fn(),
  getCountryCentroids: vi.fn(),
}));

vi.mock(import('../globeRenderer'), () => ({ default: mocks.createGlobe }));
vi.mock(import('../choropleth-palette'), () => ({
  generateChoroplethPalette: mocks.generatePalette,
}));
vi.mock(import('../worldGeoData'), () => ({
  getCountryAtCoordinates: mocks.getCountryAtCoordinates,
  getCountryCentroids: mocks.getCountryCentroids,
}));

const data = [
  {
    alpha2: 'US',
    id: 'us',
    label: 'United States',
    value: 42,
  },
];
const colors = {
  filled: [
    [0, 0, 0],
    [255, 255, 255],
  ],
  missing: [204, 204, 204],
} as const;
const formatValue = (value: number) => `${value} tCO₂e`;

const globe = {
  destroy: vi.fn(),
  project: vi.fn(() => ({ visible: true, x: 0.5, y: 0.5 })),
  unproject: vi.fn(() => [39, -98] as [number, number]),
  update: vi.fn(),
  updatePalette: vi.fn(),
};
const animationFrames: FrameRequestCallback[] = [];

const runAnimationFrame = () => {
  const callback = animationFrames.at(-1);
  if (!callback) {
    throw new Error('No animation frame was requested');
  }
  act(() => callback(0));
};

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  callback: ResizeObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createGlobe.mockReturnValue(globe);
  mocks.generatePalette.mockReturnValue(new Uint8Array(1024));
  mocks.getCountryAtCoordinates.mockReturnValue('US');
  mocks.getCountryCentroids.mockReturnValue(new Map([['US', [39, -98]]]));
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 200,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 200,
  });
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.stubGlobal('matchMedia', () => ({
    addEventListener: vi.fn(),
    matches: false,
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    })
  );
});

afterEach(() => {
  cleanup();
  animationFrames.length = 0;
  vi.unstubAllGlobals();
  ResizeObserverMock.instances = [];
});

describe(ChoroplethGlobe, () => {
  it('renders an accessible, non-interactive image and cleans up its renderer', () => {
    const { getByLabelText, unmount } = render(
      <ChoroplethGlobe
        ariaLabel="Country values"
        colors={colors}
        data={data}
        globe={{ interactive: false }}
        size={200}
      />
    );

    const canvas = getByLabelText('Country values');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('tabindex')).toBeNull();
    fireEvent.keyDown(canvas, { key: 'ArrowLeft' });
    expect(globe.update).not.toHaveBeenCalled();

    const destroyCount = globe.destroy.mock.calls.length;
    unmount();
    expect(globe.destroy).toHaveBeenCalledTimes(destroyCount + 1);
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(
      expect.any(Number)
    );
  });

  it('provides entry identity to tooltip consumers and supports the imperative escape hatch', async () => {
    const ref = createRef<ChoroplethGlobeHandle>();
    const onActiveEntryChange = vi.fn();
    const renderTooltip = vi.fn(() => null);
    render(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        defaultActiveEntryId="us"
        formatValue={formatValue}
        onActiveEntryChange={onActiveEntryChange}
        ref={ref}
        renderTooltip={renderTooltip}
        size={200}
      />
    );

    await waitFor(() => {
      runAnimationFrame();
      expect(renderTooltip).toHaveBeenCalledWith(
        expect.objectContaining({
          alpha2: 'US',
          entry: data[0],
          entryId: 'us',
          formattedValue: '42 tCO₂e',
          source: 'entry',
        })
      );
    });

    ref.current?.clearHoveredEntry();
    expect(onActiveEntryChange).toHaveBeenLastCalledWith(null);
    ref.current?.hoverEntry('us');
    expect(onActiveEntryChange).toHaveBeenLastCalledWith('us');
  });

  it('only performs country hit testing for requested hover features', async () => {
    const { getByLabelText, rerender } = render(
      <ChoroplethGlobe colors={colors} data={data} size={200} />
    );
    const canvas = getByLabelText('Country choropleth globe');
    fireEvent.pointerMove(canvas, { offsetX: 50, offsetY: 60 });
    expect(mocks.getCountryAtCoordinates).not.toHaveBeenCalled();

    const onCountryHover = vi.fn();
    const renderTooltip = vi.fn(() => null);
    rerender(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        formatValue={formatValue}
        onCountryHover={onCountryHover}
        renderTooltip={renderTooltip}
        size={200}
      />
    );
    fireEvent.pointerMove(canvas, { offsetX: 50, offsetY: 60 });

    await waitFor(() => expect(onCountryHover).toHaveBeenCalledWith('US'));
    expect(renderTooltip).toHaveBeenCalledWith(
      expect.objectContaining({
        alpha2: 'US',
        entryId: 'us',
        source: 'pointer',
      })
    );
  });

  it('rotates from keyboard input when interactive', () => {
    const { getByLabelText } = render(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        globe={{ autoRotate: false }}
        size={200}
      />
    );
    fireEvent.keyDown(getByLabelText('Country choropleth globe'), {
      key: 'ArrowRight',
    });
    runAnimationFrame();
    expect(globe.update).toHaveBeenCalledWith({ phi: 0.25 });
  });

  it('uploads a new palette after data changes', () => {
    const { rerender } = render(
      <ChoroplethGlobe colors={colors} data={data} size={200} />
    );
    expect(mocks.generatePalette).toHaveBeenCalledOnce();

    rerender(
      <ChoroplethGlobe
        colors={colors}
        data={[{ ...data[0], value: 84 }]}
        size={200}
      />
    );
    expect(mocks.generatePalette).toHaveBeenCalledTimes(2);
    expect(globe.updatePalette).toHaveBeenCalledOnce();
  });
});
