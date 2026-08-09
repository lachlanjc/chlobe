import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import createGlobe from './globeRenderer';
import type { Globe } from './globeRenderer';
import type {
  ChoroplethGlobeData,
  ChoroplethGlobeOptions,
  ChoroplethGlobeTooltip,
} from './globeTypes';
import { AUTO_ROTATE_PHI_PER_FRAME, stepPhiTowardTarget } from './rotation';
import { getCountryAtCoordinates } from './worldGeoData';

const COUNTRY_LOOKUP_MIN_DEGREES = 0.5;
const KEYBOARD_ROTATION_STEP = 0.25;

interface GlobeCallbacks {
  formatValue?: (value: number, entry: ChoroplethGlobeData) => string;
  onCountryHover?: (alpha2: string | null) => void;
  renderTooltip?: (tooltip: ChoroplethGlobeTooltip) => unknown;
}

interface GlobeRendererRefs {
  activeEntryId: MutableRefObject<string | null>;
  callbacks: MutableRefObject<GlobeCallbacks>;
  canvas: MutableRefObject<HTMLCanvasElement | null>;
  centroids: MutableRefObject<ReadonlyMap<string, [number, number]> | null>;
  currentPhi: MutableRefObject<number>;
  data: MutableRefObject<readonly ChoroplethGlobeData[]>;
  drag: MutableRefObject<{ startPhi: number; startX: number } | null>;
  globe: MutableRefObject<Globe | null>;
  hoveringCanvas: MutableRefObject<boolean>;
  lastLookupCoordinates: MutableRefObject<[number, number] | null>;
  options: MutableRefObject<ChoroplethGlobeOptions | undefined>;
  palette: MutableRefObject<Uint8Array | null>;
  prefersReducedMotion: MutableRefObject<boolean>;
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
  useEffect(() => {
    const canvas = refs.canvas.current;
    if (!canvas || size <= 0) {
      return;
    }
    const isDark = colorScheme === 'dark';
    const options = globeOptions ?? {};
    const interactive = options.interactive ?? true;
    const globe = createGlobe(canvas, {
      baseColor: [
        ...(options.baseColor ?? (isDark ? [0.1, 0.1, 0.15] : [1, 1, 1])),
      ] as [number, number, number],
      countryPalette: refs.palette.current ?? undefined,
      dark: isDark ? 1 : 0,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      diffuse: 1.2,
      glowColor: [
        ...(options.glowColor ??
          (isDark ? [0.08, 0.08, 0.15] : [0.85, 0.85, 0.9])),
      ] as [number, number, number],
      height: size,
      mapBrightness: 6,
      mapSamples: 16_000,
      phi: refs.currentPhi.current,
      scale: 1.2,
      theta: 0.2,
      width: size,
    });
    refs.globe.current = globe;

    let animationFrame: number | null = null;
    let shownTooltip: ChoroplethGlobeTooltip | null = null;
    const setEntryTooltip = () => {
      const entry = findEntry(refs.data.current, refs.activeEntryId.current);
      const location = entry ? refs.centroids.current?.get(entry.alpha2) : null;
      if (!entry || !location) {
        return;
      }
      const projected = globe.project(location);
      if (!projected.visible) {
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
        shownTooltip.entry !== entry
      ) {
        shownTooltip = next;
        setTooltip(next);
      }
    };
    const clearEntryTooltip = () => {
      if (shownTooltip) {
        shownTooltip = null;
        setTooltip((current) => (current?.source === 'entry' ? null : current));
      }
    };

    let lastRenderedPhi = refs.currentPhi.current;
    const render = () => {
      let phi = refs.currentPhi.current;
      if (!refs.drag.current) {
        if (refs.targetPhi.current !== null) {
          const step = stepPhiTowardTarget(phi, refs.targetPhi.current);
          phi = step.phi;
          if (step.done) {
            refs.targetPhi.current = null;
          }
        } else if (
          refs.options.current?.autoRotate !== false &&
          !refs.hoveringCanvas.current &&
          refs.activeEntryId.current === null &&
          !refs.prefersReducedMotion.current
        ) {
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
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    const clearPointerTooltip = () =>
      setTooltip((current) => (current?.source === 'pointer' ? null : current));
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
        refs.callbacks.current.onCountryHover?.(null);
        clearPointerTooltip();
        return;
      }
      const [latitude, longitude] = coordinates;
      const last = refs.lastLookupCoordinates.current;
      if (
        last &&
        Math.abs(last[0] - latitude) < COUNTRY_LOOKUP_MIN_DEGREES &&
        Math.abs(last[1] - longitude) < COUNTRY_LOOKUP_MIN_DEGREES
      ) {
        return;
      }
      refs.lastLookupCoordinates.current = [latitude, longitude];
      const alpha2 = getCountryAtCoordinates(longitude, latitude);
      refs.callbacks.current.onCountryHover?.(alpha2);
      if (!alpha2 || !refs.callbacks.current.renderTooltip) {
        clearPointerTooltip();
        return;
      }
      const entry =
        refs.data.current.find((item) => item.alpha2 === alpha2) ?? null;
      setTooltip((current) =>
        current?.source === 'entry'
          ? current
          : {
              alpha2,
              entry,
              entryId: entry?.id ?? null,
              formattedValue: entry
                ? (refs.callbacks.current.formatValue?.(entry.value, entry) ??
                  null)
                : null,
              label: entry?.label ?? null,
              source: 'pointer',
              x,
              y,
            }
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      refs.drag.current = {
        startPhi: refs.currentPhi.current,
        startX: event.clientX,
      };
      refs.targetPhi.current = null;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const drag = refs.drag.current;
      if (drag) {
        refs.currentPhi.current =
          drag.startPhi + (event.clientX - drag.startX) / 100;
      } else {
        handleHover(event.offsetX, event.offsetY);
      }
    };
    const onPointerUp = () => {
      refs.drag.current = null;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        refs.currentPhi.current +=
          event.key === 'ArrowLeft'
            ? -KEYBOARD_ROTATION_STEP
            : KEYBOARD_ROTATION_STEP;
        refs.targetPhi.current = null;
      }
    };
    const onPointerEnter = () => {
      refs.hoveringCanvas.current = true;
    };
    const onPointerLeave = () => {
      refs.hoveringCanvas.current = false;
      refs.lastLookupCoordinates.current = null;
      refs.callbacks.current.onCountryHover?.(null);
      clearPointerTooltip();
    };
    if (interactive) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointerenter', onPointerEnter);
      canvas.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('keydown', onKeyDown);
    }
    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerenter', onPointerEnter);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('keydown', onKeyDown);
      globe.destroy();
      refs.globe.current = null;
    };
  }, [
    colorScheme,
    globeOptions,
    refs.activeEntryId,
    refs.callbacks,
    refs.canvas,
    refs.centroids,
    refs.currentPhi,
    refs.data,
    refs.drag,
    refs.globe,
    refs.hoveringCanvas,
    refs.lastLookupCoordinates,
    refs.options,
    refs.palette,
    refs.prefersReducedMotion,
    refs.targetPhi,
    setTooltip,
    size,
  ]);
};
