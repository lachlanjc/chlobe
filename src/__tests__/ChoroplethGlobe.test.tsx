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
  getCountryAnchors: vi.fn(),
  getCountryAtCell: vi.fn<(cell: number) => string | null>(),
  getHoverCell: vi.fn<(longitude: number, latitude: number) => number>(),
}));

vi.mock(import('../globeRenderer'), () => ({ default: mocks.createGlobe }));
vi.mock(import('../choropleth-palette'), () => ({
  generateChoroplethPalette: mocks.generatePalette,
}));
vi.mock(import('../worldGeoData'), () => ({
  getCountryAnchors: mocks.getCountryAnchors,
  getCountryAtCell: mocks.getCountryAtCell,
  getHoverCell: mocks.getHoverCell,
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
const renderTooltipSource = (tooltip: { source: string }) => (
  <span>{tooltip.source}</span>
);

const globe = {
  destroy: vi.fn(),
  project: vi.fn(() => ({ visible: true, x: 0.5, y: 0.5 })),
  unproject: vi.fn<(nx: number, ny: number) => [number, number] | null>(() => [
    39, -98,
  ]),
  update: vi.fn(),
  updatePalette: vi.fn(),
};
const animationFrames = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;

const runAnimationFrame = () => {
  const frame = animationFrames.entries().next().value;
  if (!frame) {
    throw new Error('No animation frame was requested');
  }
  const [id, callback] = frame;
  animationFrames.delete(id);
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

// Separate native observer mocks keep their callbacks and lifetimes independent.
// oxlint-disable-next-line eslint/max-classes-per-file
class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  callback: (entries: { isIntersecting: boolean }[]) => void;
  disconnect = vi.fn<() => void>();
  observe = vi.fn<(element: Element) => void>();

  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createGlobe.mockReturnValue(globe);
  mocks.generatePalette.mockReturnValue(new Uint8Array(1024));
  mocks.getCountryAtCell.mockReturnValue('US');
  mocks.getHoverCell.mockReturnValue(1);
  mocks.getCountryAnchors.mockReturnValue(new Map([['US', [39, -98]]]));
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 200,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 200,
  });
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  vi.stubGlobal('matchMedia', () => ({
    addEventListener: vi.fn(),
    matches: false,
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => animationFrames.delete(id))
  );
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      nextFrameId += 1;
      animationFrames.set(nextFrameId, callback);
      return nextFrameId;
    })
  );
});

afterEach(() => {
  cleanup();
  animationFrames.clear();
  nextFrameId = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  ResizeObserverMock.instances = [];
  IntersectionObserverMock.instances = [];
});

describe(ChoroplethGlobe, () => {
  it('renders an accessible, non-interactive image and cleans up its renderer', () => {
    const { getByLabelText, unmount } = render(
      <ChoroplethGlobe
        aria-label="Country values"
        colors={colors}
        data={data}
        globe={{ interactive: false }}
        size={200}
      />
    );

    const canvas = getByLabelText('Country values');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('tabindex')).toBeNull();
    globe.update.mockClear();
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
    expect(mocks.getCountryAtCell).not.toHaveBeenCalled();

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

  it('moves pointer tooltips within a cell and only emits country transitions', () => {
    const onCountryHover = vi.fn<(alpha2: string | null) => void>();
    const renderTooltip = vi.fn(() => null);
    const { getByLabelText } = render(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        onCountryHover={onCountryHover}
        renderTooltip={renderTooltip}
        size={200}
      />
    );
    const canvas = getByLabelText('Country choropleth globe');
    const move = (x: number) =>
      fireEvent(
        canvas,
        Object.assign(new Event('pointermove', { bubbles: true }), {
          offsetX: x,
          offsetY: 60,
        })
      );
    move(50);
    move(51);
    expect(mocks.getCountryAtCell).toHaveBeenCalledOnce();
    expect(renderTooltip).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 51, y: 60 })
    );

    mocks.getHoverCell.mockReturnValue(2);
    mocks.getCountryAtCell.mockReturnValue('CA');
    globe.unproject.mockReturnValue([39.01, -98.01]);
    move(52);
    expect(onCountryHover).toHaveBeenLastCalledWith('CA');
    globe.unproject.mockReturnValue(null);
    move(53);
    fireEvent.pointerLeave(canvas);
    expect(onCountryHover).toHaveBeenLastCalledWith(null);
    expect(onCountryHover).toHaveBeenCalledTimes(3);
  });

  it('honors an explicit null controlled selection', () => {
    const { rerender, queryByText } = render(
      <ChoroplethGlobe
        activeEntryId="us"
        colors={colors}
        data={data}
        defaultActiveEntryId="us"
        renderTooltip={renderTooltipSource}
        size={200}
      />
    );
    runAnimationFrame();
    expect(queryByText('entry')).not.toBeNull();
    rerender(
      <ChoroplethGlobe
        activeEntryId={null}
        colors={colors}
        data={data}
        defaultActiveEntryId="us"
        renderTooltip={renderTooltipSource}
        size={200}
      />
    );
    runAnimationFrame();
    expect(queryByText('entry')).toBeNull();
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

  it('reuses the renderer across resize, theme, and fresh options objects', () => {
    const { rerender, getByLabelText, unmount } = render(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        globe={{ autoRotate: false }}
        size={200}
      />
    );
    rerender(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        colorScheme="dark"
        globe={{
          autoRotate: false,
          baseColor: [10, 20, 30],
          interactive: false,
        }}
        size={300}
      />
    );
    expect(mocks.createGlobe).toHaveBeenCalledOnce();
    expect(globe.destroy).not.toHaveBeenCalled();
    expect(globe.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        baseColor: [10 / 255, 20 / 255, 30 / 255],
        dark: 1,
        height: 300,
        width: 300,
      })
    );
    globe.update.mockClear();
    fireEvent.keyDown(getByLabelText('Country choropleth globe'), {
      key: 'ArrowRight',
    });
    expect(globe.update).not.toHaveBeenCalled();
    unmount();
    expect(globe.destroy).toHaveBeenCalledOnce();
  });

  it('stops requesting idle frames and wakes for keyboard rotation', () => {
    const { getByLabelText } = render(
      <ChoroplethGlobe
        colors={colors}
        data={[]}
        globe={{ autoRotate: false }}
        size={200}
      />
    );
    runAnimationFrame();
    expect(animationFrames.size).toBe(0);
    fireEvent.keyDown(getByLabelText('Country choropleth globe'), {
      key: 'ArrowRight',
    });
    expect(animationFrames.size).toBe(1);
    runAnimationFrame();
    expect(globe.update).toHaveBeenLastCalledWith({ phi: 0.25 });
    expect(animationFrames.size).toBe(0);
  });

  it('pauses offscreen rotation and resumes when the globe returns', () => {
    render(<ChoroplethGlobe colors={colors} data={[]} size={200} />);
    const [observer] = IntersectionObserverMock.instances;
    act(() => observer.callback([{ isIntersecting: false }]));
    expect(animationFrames.size).toBe(0);
    act(() => observer.callback([{ isIntersecting: true }]));
    runAnimationFrame();
    expect(globe.update).toHaveBeenLastCalledWith({ phi: 0.0025 });
    expect(animationFrames.size).toBe(1);
  });

  it('snaps navigation and stops idle scheduling for reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    }));
    const ref = createRef<ChoroplethGlobeHandle>();
    render(
      <ChoroplethGlobe colors={colors} data={data} ref={ref} size={200} />
    );
    runAnimationFrame();
    expect(animationFrames.size).toBe(0);
    globe.update.mockClear();
    act(() => ref.current?.navigateToEntry('us'));
    expect(animationFrames.size).toBe(1);
    runAnimationFrame();
    expect(animationFrames.size).toBe(0);
  });

  it('cancels frames in a hidden document and wakes when it becomes visible', () => {
    render(<ChoroplethGlobe colors={colors} data={[]} size={200} />);
    const hidden = vi.spyOn(document, 'hidden', 'get');
    hidden.mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    expect(animationFrames.size).toBe(0);
    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    expect(animationFrames.size).toBe(1);
  });

  it('recovers context loss with the current appearance and palette', () => {
    const onError = vi.fn<(error: Error) => void>();
    const { getByLabelText, rerender } = render(
      <ChoroplethGlobe colors={colors} data={[]} onError={onError} size={200} />
    );
    const canvas = getByLabelText('Country choropleth globe');
    runAnimationFrame();
    const lost = new Event('webglcontextlost', { cancelable: true });
    fireEvent(canvas, lost);
    expect({
      pendingFrames: animationFrames.size,
      prevented: lost.defaultPrevented,
    }).toStrictEqual({ pendingFrames: 0, prevented: true });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('context lost'),
      })
    );
    const restoredPalette = new Uint8Array(1024).fill(123);
    mocks.generatePalette.mockReturnValue(restoredPalette);
    rerender(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        colorScheme="dark"
        onError={onError}
        globe={{ autoRotate: false }}
        size={300}
      />
    );
    fireEvent(canvas, new Event('webglcontextrestored'));
    expect(mocks.createGlobe).toHaveBeenCalledTimes(2);
    expect(mocks.createGlobe).toHaveBeenLastCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({ countryPalette: restoredPalette, phi: 0.0025 })
    );
    expect(globe.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ dark: 1, height: 300, width: 300 })
    );
  });

  it('normalizes globe surface and glow colors from the public RGB contract', () => {
    render(
      <ChoroplethGlobe
        colors={colors}
        data={data}
        globe={{ baseColor: [18, 70, 224], glowColor: [196, 231, 244] }}
        size={200}
      />
    );

    expect(mocks.createGlobe).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        baseColor: [18 / 255, 70 / 255, 224 / 255],
        glowColor: [196 / 255, 231 / 255, 244 / 255],
      })
    );
  });
});
