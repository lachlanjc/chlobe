import {
  default as React,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { generateChoroplethPalette } from './choropleth-palette';
import type { Globe } from './globeRenderer';
import type {
  ChoroplethGlobeData,
  ChoroplethGlobeHandle,
  ChoroplethGlobeProps,
  ChoroplethGlobeTooltip,
} from './globeTypes';
import { targetPhiForLongitude } from './rotation';
import { usePrefersReducedMotion, useSquareSize } from './useGlobeEnvironment';
import { useGlobeRenderer } from './useGlobeRenderer';
import { getCountryAnchors } from './worldGeoData';

const findEntry = (
  data: readonly ChoroplethGlobeData[],
  id: string | null
): ChoroplethGlobeData | null =>
  id === null ? null : (data.find((entry) => entry.id === id) ?? null);

const ChoroplethGlobe = forwardRef<ChoroplethGlobeHandle, ChoroplethGlobeProps>(
  (
    {
      activeEntryId: controlledActiveEntryId,
      'aria-label': ariaLabel = 'Country choropleth globe',
      className,
      colors,
      colorScheme = 'light',
      data,
      defaultActiveEntryId = null,
      formatValue,
      globe: globeOptions,
      onActiveEntryChange,
      onCountryHover,
      renderTooltip,
      size: fixedSize,
      style,
    },
    ref
  ) => {
    const { containerRef, size } = useSquareSize(fixedSize);
    const prefersReducedMotion = usePrefersReducedMotion();
    const [uncontrolledActiveEntryId, setUncontrolledActiveEntryId] =
      useState(defaultActiveEntryId);
    const activeEntryId =
      controlledActiveEntryId === undefined
        ? uncontrolledActiveEntryId
        : controlledActiveEntryId;
    const [tooltip, setTooltip] = useState<ChoroplethGlobeTooltip | null>(null);
    const anchors = getCountryAnchors();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const globeRef = useRef<Globe | null>(null);
    const requestRenderRef = useRef<(() => void) | null>(null);
    const paletteRef = useRef<Uint8Array | null>(null);
    const currentPhiRef = useRef(globeOptions?.initialPhi ?? 0);
    const targetPhiRef = useRef<number | null>(null);
    const dragRef = useRef<{ startPhi: number; startX: number } | null>(null);
    const hoveringCanvasRef = useRef(false);
    const dataRef = useRef(data);
    const anchorsRef = useRef(anchors);
    const activeEntryIdRef = useRef(activeEntryId);
    const optionsRef = useRef(globeOptions);
    const reducedMotionRef = useRef(prefersReducedMotion);
    const callbacksRef = useRef({
      formatValue,
      onCountryHover,
      renderTooltip,
    });
    // The renderer has long-lived native event handlers and an animation
    // frame loop. Synchronizing its inputs after commit keeps render pure and
    // prevents those handlers from observing stale country data.
    useEffect(() => {
      activeEntryIdRef.current = activeEntryId;
      callbacksRef.current = { formatValue, onCountryHover, renderTooltip };
      anchorsRef.current = anchors;
      dataRef.current = data;
      optionsRef.current = globeOptions;
      reducedMotionRef.current = prefersReducedMotion;
      requestRenderRef.current?.();
    }, [
      activeEntryId,
      anchors,
      data,
      formatValue,
      globeOptions,
      onCountryHover,
      prefersReducedMotion,
      renderTooltip,
    ]);

    const setActiveEntry = (id: string | null) => {
      if (controlledActiveEntryId === undefined) {
        setUncontrolledActiveEntryId(id);
      }
      onActiveEntryChange?.(id);
    };

    const textureKey = JSON.stringify({
      filledColorRange: colors.filled,
      missingAlpha: colors.missingAlpha,
      missingColor: colors.missing,
      valuesByAlpha2: data.map(
        ({ alpha2, value }) => [alpha2, value] as [string, number]
      ),
    });

    useEffect(() => {
      const paletteInput: {
        filledColorRange: [[number, number, number], [number, number, number]];
        missingAlpha?: number;
        missingColor: [number, number, number];
        valuesByAlpha2: [string, number][];
      } = JSON.parse(textureKey);
      const palette = generateChoroplethPalette({
        ...paletteInput,
        valuesByAlpha2: new Map(paletteInput.valuesByAlpha2),
      });
      paletteRef.current = palette;
      globeRef.current?.updatePalette(palette);
    }, [textureKey]);

    useEffect(() => {
      const entry = findEntry(data, activeEntryId) ?? data[0] ?? null;
      const location = entry ? anchors?.get(entry.alpha2) : null;
      if (location) {
        targetPhiRef.current = targetPhiForLongitude(
          currentPhiRef.current,
          location[1]
        );
        requestRenderRef.current?.();
      }
    }, [activeEntryId, anchors, data]);

    useImperativeHandle(
      ref,
      () => ({
        clearHoveredEntry: () => setActiveEntry(null),
        hoverEntry: (id) => {
          if (findEntry(dataRef.current, id)) {
            setActiveEntry(id);
          }
        },
        navigateToEntry: (id) => {
          const entry = findEntry(dataRef.current, id);
          const location = entry ? anchorsRef.current?.get(entry.alpha2) : null;
          if (location) {
            targetPhiRef.current = targetPhiForLongitude(
              currentPhiRef.current,
              location[1]
            );
            requestRenderRef.current?.();
          }
        },
      }),
      [setActiveEntry]
    );

    useGlobeRenderer({
      colorScheme,
      globeOptions,
      refs: {
        activeEntryId: activeEntryIdRef,
        anchors: anchorsRef,
        callbacks: callbacksRef,
        canvas: canvasRef,
        currentPhi: currentPhiRef,
        data: dataRef,
        drag: dragRef,
        globe: globeRef,
        hoveringCanvas: hoveringCanvasRef,
        options: optionsRef,
        palette: paletteRef,
        prefersReducedMotion: reducedMotionRef,
        requestRender: requestRenderRef,
        targetPhi: targetPhiRef,
      },
      setTooltip,
      size,
    });

    const interactive = globeOptions?.interactive ?? true;
    return (
      <div
        className={className}
        ref={containerRef}
        style={{
          aspectRatio: '1',
          maxWidth: '100%',
          position: 'relative',
          width: fixedSize ?? '100%',
          ...style,
        }}
      >
        <canvas
          aria-label={ariaLabel}
          ref={canvasRef}
          role={interactive ? 'application' : 'img'}
          style={{
            cursor: interactive ? 'grab' : 'default',
            display: 'block',
            height: '100%',
            touchAction: interactive ? 'none' : 'auto',
            width: '100%',
          }}
          tabIndex={interactive ? 0 : undefined}
        />
        {tooltip && renderTooltip ? renderTooltip(tooltip) : null}
      </div>
    );
  }
);

ChoroplethGlobe.displayName = 'ChoroplethGlobe';

export default ChoroplethGlobe;
