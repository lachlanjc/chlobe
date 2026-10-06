import { useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import createGlobe from './globeRenderer';
import type { Globe, GlobeOptions } from './globeRenderer';
import type {
  ChoroplethRgb,
  ChoroplethGlobeData,
  ChoroplethGlobeOptions,
  ChoroplethGlobeTooltip,
} from './globeTypes';
import { AUTO_ROTATE_PHI_PER_FRAME, stepPhiTowardTarget } from './rotation';
import { getCountryAtCell, getHoverCell } from './worldGeoData';

const KEYBOARD_ROTATION_STEP = 0.25;

const normalizeRgb = (color: ChoroplethRgb): [number, number, number] => [
  color[0] / 255,
  color[1] / 255,
  color[2] / 255,
];

const getAppearance = (
  colorScheme: 'light' | 'dark',
  options: ChoroplethGlobeOptions | undefined
): Pick<GlobeOptions, 'baseColor' | 'glowColor' | 'dark'> => {
  const isDark = colorScheme === 'dark';
  const defaultBaseColor: [number, number, number] = isDark
    ? [0.1, 0.1, 0.15]
    : [1, 1, 1];
  const defaultGlowColor: [number, number, number] = isDark
    ? [0.08, 0.08, 0.15]
    : [0.85, 0.85, 0.9];
  return {
    baseColor: options?.baseColor
      ? normalizeRgb(options.baseColor)
      : defaultBaseColor,
    dark: isDark ? 1 : 0,
    glowColor: options?.glowColor
      ? normalizeRgb(options.glowColor)
      : defaultGlowColor,
  };
};

interface GlobeCallbacks {
  formatValue?: (value: number, entry: ChoroplethGlobeData) => string;
  onCountryHover?: (alpha2: string | null) => void;
  renderTooltip?: (tooltip: ChoroplethGlobeTooltip) => unknown;
}

interface GlobeRendererRefs {
  activeEntryId: MutableRefObject<string | null>;
  callbacks: MutableRefObject<GlobeCallbacks>;
  canvas: MutableRefObject<HTMLCanvasElement | null>;
  anchors: MutableRefObject<ReadonlyMap<string, [number, number]> | null>;
  currentPhi: MutableRefObject<number>;
  data: MutableRefObject<readonly ChoroplethGlobeData[]>;
  drag: MutableRefObject<{ startPhi: number; startX: number } | null>;
  globe: MutableRefObject<Globe | null>;
  hoveringCanvas: MutableRefObject<boolean>;
  options: MutableRefObject<ChoroplethGlobeOptions | undefined>;
  palette: MutableRefObject<Uint8Array | null>;
  prefersReducedMotion: MutableRefObject<boolean>;
  requestRender: MutableRefObject<(() => void) | null>;
  targetPhi: MutableRefObject<number | null>;
}

export interface GlobeRendererOptions {
  colorScheme: 'light' | 'dark';
  globeOptions: ChoroplethGlobeOptions | undefined;
  refs: GlobeRendererRefs;
  setTooltip: Dispatch<SetStateAction<ChoroplethGlobeTooltip | null>>;
  size: number;
}

const findEntry = (
  data: readonly ChoroplethGlobeData[],
  id: string | null
): ChoroplethGlobeData | null =>
  id === null ? null : (data.find((entry) => entry.id === id) ?? null);

export const useGlobeRenderer = ({
  colorScheme,
  globeOptions,
  refs,
  setTooltip,
  size,
}: GlobeRendererOptions): void => {
  const initialConfiguration = useRef({ colorScheme, globeOptions, size });
  const { globe: globeRef, requestRender: requestRenderRef } = refs;
  useEffect(() => {
    const canvas = refs.canvas.current;
    if (!canvas) {
      return;
    }
    const {
      colorScheme: initialScheme,
      globeOptions: initialOptions,
      size: initialSize,
    } = initialConfiguration.current;
    const globe = createGlobe(canvas, {
      ...getAppearance(initialScheme, initialOptions),
      countryPalette: refs.palette.current ?? undefined,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      height: Math.max(initialSize, 1),
      mapSamples: 16_000,
      phi: refs.currentPhi.current,
      scale: 1.2,
      theta: 0.2,
      width: Math.max(initialSize, 1),
    });
    globeRef.current = globe;

    let animationFrame: number | null = null;
    let isVisible = true;
    let shownTooltip: ChoroplethGlobeTooltip | null = null;
    const clearEntryTooltip = () => {
      if (shownTooltip) {
        shownTooltip = null;
        setTooltip((current) => (current?.source === 'entry' ? null : current));
      }
    };
    const setEntryTooltip = () => {
      const entry = findEntry(refs.data.current, refs.activeEntryId.current);
      const location = entry ? refs.anchors.current?.get(entry.alpha2) : null;
      if (!entry || !location || !refs.callbacks.current.renderTooltip) {
        clearEntryTooltip();
        return;
      }
      const projected = globe.project(location);
      if (!projected.visible) {
        clearEntryTooltip();
        return;
      }
      const next: ChoroplethGlobeTooltip = {
        alpha2: entry.alpha2,
        entry,
        entryId: entry.id,
        formattedValue:
          refs.callbacks.current.formatValue?.(entry.value, entry) ?? null,
        label: entry.label ?? null,
        source: 'entry',
        x: projected.x * canvas.clientWidth,
        y: projected.y * canvas.clientHeight,
      };
      if (
        !shownTooltip ||
        Math.abs(shownTooltip.x - next.x) > 1 ||
        Math.abs(shownTooltip.y - next.y) > 1 ||
        shownTooltip.entry !== entry ||
        shownTooltip.formattedValue !== next.formattedValue
      ) {
        shownTooltip = next;
        setTooltip(next);
      }
    };
    let lastRenderedPhi = refs.currentPhi.current;
    const shouldAutoRotate = () =>
      refs.options.current?.autoRotate !== false &&
      !refs.hoveringCanvas.current &&
      refs.activeEntryId.current === null &&
      !refs.prefersReducedMotion.current;
    const cancelFrame = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };
    const render = () => {
      animationFrame = null;
      if (!isVisible || document.hidden) {
        return;
      }
      let phi = refs.currentPhi.current;
      if (!refs.drag.current) {
        if (refs.targetPhi.current !== null) {
          const step = refs.prefersReducedMotion.current
            ? { done: true, phi: refs.targetPhi.current }
            : stepPhiTowardTarget(phi, refs.targetPhi.current);
          const { done, phi: nextPhi } = step;
          phi = nextPhi;
          if (done) {
            refs.targetPhi.current = null;
          }
        } else if (shouldAutoRotate()) {
          phi += AUTO_ROTATE_PHI_PER_FRAME;
        }
      }
      refs.currentPhi.current = phi;
      if (lastRenderedPhi !== phi) {
        globe.update({ phi });
        lastRenderedPhi = phi;
      }
      if (refs.activeEntryId.current === null) {
        clearEntryTooltip();
      } else {
        setEntryTooltip();
      }
      if (
        !refs.drag.current &&
        (refs.targetPhi.current !== null || shouldAutoRotate())
      ) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };
    const requestRender = () => {
      if (animationFrame === null && isVisible && !document.hidden) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };
    requestRenderRef.current = requestRender;
    requestRender();

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelFrame();
      } else {
        requestRender();
      }
    };
    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
              requestRender();
            } else {
              cancelFrame();
            }
          })
        : null;
    observer?.observe(canvas);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const clearPointerTooltip = () =>
      setTooltip((current) => (current?.source === 'pointer' ? null : current));
    let lastCell: number | null = null;
    let hoveredAlpha2: string | null = null;
    let cellAlpha2: string | null = null;
    const emitCountryHover = (alpha2: string | null) => {
      if (alpha2 !== hoveredAlpha2) {
        hoveredAlpha2 = alpha2;
        refs.callbacks.current.onCountryHover?.(alpha2);
      }
    };
    const handleHover = (x: number, y: number) => {
      if (
        !refs.callbacks.current.renderTooltip &&
        !refs.callbacks.current.onCountryHover
      ) {
        return;
      }
      const coordinates = globe.unproject(
        x / canvas.clientWidth,
        y / canvas.clientHeight
      );
      if (!coordinates) {
        lastCell = null;
        emitCountryHover(null);
        clearPointerTooltip();
        return;
      }
      const [latitude, longitude] = coordinates;
      const cell = getHoverCell(longitude, latitude);
      if (lastCell !== cell) {
        lastCell = cell;
        cellAlpha2 = getCountryAtCell(cell);
      }
      const alpha2 = cellAlpha2;
      emitCountryHover(alpha2);
      if (!alpha2 || !refs.callbacks.current.renderTooltip) {
        clearPointerTooltip();
        return;
      }
      const entry =
        refs.data.current.find((item) => item.alpha2 === alpha2) ?? null;
      const formattedValue = entry
        ? (refs.callbacks.current.formatValue?.(entry.value, entry) ?? null)
        : null;
      setTooltip((current) => {
        if (
          current?.source === 'entry' ||
          (current?.source === 'pointer' &&
            current.x === x &&
            current.y === y &&
            current.entry === entry &&
            current.alpha2 === alpha2 &&
            current.formattedValue === formattedValue)
        ) {
          return current;
        }
        return {
          alpha2,
          entry,
          entryId: entry?.id ?? null,
          formattedValue,
          label: entry?.label ?? null,
          source: 'pointer',
          x,
          y,
        };
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (refs.options.current?.interactive === false) {
        return;
      }
      refs.drag.current = {
        startPhi: refs.currentPhi.current,
        startX: event.clientX,
      };
      refs.targetPhi.current = null;
      lastCell = null;
      emitCountryHover(null);
      clearPointerTooltip();
      canvas.setPointerCapture?.(event.pointerId);
      requestRender();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (refs.options.current?.interactive === false) {
        return;
      }
      const drag = refs.drag.current;
      if (drag) {
        refs.currentPhi.current =
          drag.startPhi + (event.clientX - drag.startX) / 100;
        requestRender();
      } else {
        handleHover(event.offsetX, event.offsetY);
      }
    };
    const onPointerUp = () => {
      refs.drag.current = null;
      requestRender();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (refs.options.current?.interactive === false) {
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        refs.currentPhi.current +=
          event.key === 'ArrowLeft'
            ? -KEYBOARD_ROTATION_STEP
            : KEYBOARD_ROTATION_STEP;
        refs.targetPhi.current = null;
        requestRender();
      }
    };
    const onPointerEnter = () => {
      refs.hoveringCanvas.current = refs.options.current?.interactive !== false;
      requestRender();
    };
    const onPointerLeave = () => {
      refs.hoveringCanvas.current = false;
      lastCell = null;
      emitCountryHover(null);
      clearPointerTooltip();
      requestRender();
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('lostpointercapture', onPointerUp);
    canvas.addEventListener('pointerenter', onPointerEnter);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('keydown', onKeyDown);
    return () => {
      cancelFrame();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      requestRenderRef.current = null;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('lostpointercapture', onPointerUp);
      canvas.removeEventListener('pointerenter', onPointerEnter);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('keydown', onKeyDown);
      globe.destroy();
      globeRef.current = null;
    };
  }, [
    refs.activeEntryId,
    refs.callbacks,
    refs.canvas,
    refs.anchors,
    refs.currentPhi,
    refs.data,
    refs.drag,
    globeRef,
    refs.hoveringCanvas,
    refs.options,
    refs.palette,
    refs.prefersReducedMotion,
    requestRenderRef,
    refs.targetPhi,
    setTooltip,
  ]);

  useEffect(() => {
    if (size <= 0) {
      return;
    }
    const options = globeOptions ?? {};
    globeRef.current?.update({
      ...getAppearance(colorScheme, options),
      height: size,
      width: size,
    });
    if (options.interactive === false) {
      refs.drag.current = null;
      refs.hoveringCanvas.current = false;
    }
    requestRenderRef.current?.();
  }, [
    colorScheme,
    globeOptions,
    globeRef,
    refs.drag,
    refs.hoveringCanvas,
    requestRenderRef,
    size,
  ]);
};
