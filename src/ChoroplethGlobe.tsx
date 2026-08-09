import {
  default as React,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { generateChoroplethTexture } from './choroplethTexture';
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
import { getCountryCentroids } from './worldGeoData';

const findEntry = (
  data: readonly ChoroplethGlobeData[],
  id: string | null
): ChoroplethGlobeData | null =>
  id === null ? null : (data.find((entry) => entry.id === id) ?? null);

const ChoroplethGlobe = forwardRef<ChoroplethGlobeHandle, ChoroplethGlobeProps>(
  (
    {
      activeEntryId: controlledActiveEntryId,
      ariaLabel = 'Country choropleth globe',
      className,
      colors,
      colorScheme = 'light',
      data,
      defaultActiveEntryId = null,
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
    const activeEntryId = controlledActiveEntryId ?? uncontrolledActiveEntryId;
    const [tooltip, setTooltip] = useState<ChoroplethGlobeTooltip | null>(null);
    const [centroids, setCentroids] = useState<ReadonlyMap<
      string,
      [number, number]
    > | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const globeRef = useRef<Globe | null>(null);
    const textureRef = useRef<HTMLCanvasElement | null>(null);
    const currentPhiRef = useRef(globeOptions?.initialPhi ?? 0);
    const targetPhiRef = useRef<number | null>(null);
    const dragRef = useRef<{ startPhi: number; startX: number } | null>(null);
    const hoveringCanvasRef = useRef(false);
    const countryLookupSeqRef = useRef(0);
    const lastLookupCoordsRef = useRef<[number, number] | null>(null);
    const dataRef = useRef(data);
    const centroidsRef = useRef(centroids);
    const activeEntryIdRef = useRef(activeEntryId);
    const optionsRef = useRef(globeOptions);
    const reducedMotionRef = useRef(prefersReducedMotion);
    const callbacksRef = useRef({ onCountryHover, renderTooltip });

    // The renderer has long-lived native event handlers and an animation
    // frame loop. Synchronizing its inputs after commit keeps render pure and
    // prevents those handlers from observing stale country data.
    useEffect(() => {
      activeEntryIdRef.current = activeEntryId;
      callbacksRef.current = { onCountryHover, renderTooltip };
      centroidsRef.current = centroids;
      dataRef.current = data;
      optionsRef.current = globeOptions;
      reducedMotionRef.current = prefersReducedMotion;
    }, [
      activeEntryId,
      centroids,
      data,
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
      const textureInput: {
        filledColorRange: [string, string];
        missingAlpha?: number;
        missingColor: string;
        valuesByAlpha2: [string, number][];
      } = JSON.parse(textureKey);
      let cancelled = false;
      const createTexture = async () => {
        try {
          const texture = await generateChoroplethTexture({
            ...textureInput,
            valuesByAlpha2: new Map(textureInput.valuesByAlpha2),
          });
          if (!cancelled) {
            textureRef.current = texture;
            globeRef.current?.updateTexture(texture);
          }
        } catch {
          // The WebGL globe still displays its neutral surface without a 2D context.
        }
      };
      void createTexture();
      return () => {
        cancelled = true;
      };
    }, [textureKey]);

    useEffect(() => {
      let cancelled = false;
      const loadCentroids = async () => {
        try {
          const loadedCentroids = await getCountryCentroids();
          if (!cancelled) {
            setCentroids(loadedCentroids);
          }
        } catch {
          // Navigation degrades gracefully when topology data cannot load.
        }
      };
      void loadCentroids();
      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      const entry = findEntry(data, activeEntryId) ?? data[0] ?? null;
      const location = entry ? centroids?.get(entry.alpha2) : null;
      if (location) {
        targetPhiRef.current = targetPhiForLongitude(
          currentPhiRef.current,
          location[1]
        );
      }
    }, [activeEntryId, centroids, data]);

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
          const location = entry
            ? centroidsRef.current?.get(entry.alpha2)
            : null;
          if (location) {
            targetPhiRef.current = targetPhiForLongitude(
              currentPhiRef.current,
              location[1]
            );
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
        callbacks: callbacksRef,
        canvas: canvasRef,
        centroids: centroidsRef,
        countryLookupSequence: countryLookupSeqRef,
        currentPhi: currentPhiRef,
        data: dataRef,
        drag: dragRef,
        globe: globeRef,
        hoveringCanvas: hoveringCanvasRef,
        lastLookupCoordinates: lastLookupCoordsRef,
        options: optionsRef,
        prefersReducedMotion: reducedMotionRef,
        targetPhi: targetPhiRef,
        texture: textureRef,
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
