import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { generateChoroplethTexture } from './choroplethTexture';
import createGlobe from './globeRenderer';
import type { Globe } from './globeRenderer';
import {
  AUTO_ROTATE_PHI_PER_FRAME,
  stepPhiTowardTarget,
  targetPhiForLongitude,
} from './rotation';
import { getCountryAtCoordinates, getCountryCentroids } from './worldGeoData';

/**
 * Skip re-running the async country hit test while the unprojected pointer
 * coordinates stay within this many degrees of the last lookup.
 */
const COUNTRY_LOOKUP_MIN_DEGREES = 0.5;

/** A data row the globe can navigate to and show a hover tooltip for. */
export interface ChoroplethGlobeEntry {
  id: string;
  /** User-facing label (e.g. the localized country name). */
  label: string;
  /** Pre-formatted value shown in tooltips, or null when there is none. */
  formattedValue: string | null;
  /** ISO 3166-1 alpha-2 code the row resolved to. */
  alpha2: string;
}

/** Inputs for asynchronously generating the country choropleth texture. */
export interface ChoroplethGlobeInput {
  /** [alpha2, value] entries (an array so the input JSON-serializes). */
  valuesByAlpha2: [string, number][];
  /** Fill color ramp from the smallest to the largest magnitude. */
  filledColorRange: [string, string];
  /** Fill for countries without data. */
  missingColor: string;
  missingAlpha: number;
}

/**
 * Imperative interactions, e.g. for a legend rendered next to the globe:
 * hovering an entry rotates to it and anchors a tooltip on it.
 */
export interface ChoroplethGlobeHandle {
  hoverEntry: (id: string) => void;
  clearHoveredEntry: () => void;
  navigateToEntry: (id: string) => void;
}

/** A tooltip anchor in CSS pixels relative to the globe's top-left. */
export interface ChoroplethGlobeTooltip {
  /**
   * What anchors the tooltip: direct pointer hit-testing on the canvas, or
   * an externally hovered entry (which wins while active, since the globe
   * rotates to it).
   */
  source: 'pointer' | 'entry';
  label: string;
  formattedValue: string | null;
  x: number;
  y: number;
}

/** SSR-safe, reactive reduced-motion preference. */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * An interactive 3D choropleth globe (via the vendored cobe WebGL renderer):
 * country values shade the corresponding landmasses as regions via an
 * asynchronously generated texture. Purely presentational — callers supply
 * resolved entries (alpha-2 codes with labels/formatted values) and colors.
 *
 * Interactions:
 * - Auto-rotation, paused while dragging, hovering the canvas or an
 *   externally hovered entry, easing toward a target, or when reduced
 *   motion is requested.
 * - Drag-to-rotate via pointer events.
 * - Rotates to center the top entry when data resolves or changes, and to a
 *   hovered/clicked entry (via the imperative `ChoroplethGlobeHandle`).
 * - Hover tooltips: country polygon hit-testing on the canvas, and
 *   projected centroid anchoring while an entry is hovered externally.
 *
 * Degrades gracefully without WebGL (blank canvas, interactions no-op).
 */
export interface ChoroplethGlobeProps {
  /** Rows with data, sorted by descending magnitude (entries[0] is top). */
  entries: ChoroplethGlobeEntry[];
  choroplethInput: ChoroplethGlobeInput;
  /** Square canvas size in CSS pixels. */
  size: number;
  /** Changes the globe's neutral surface and glow colors. Defaults to light. */
  colorScheme?: 'light' | 'dark';
  /** Applied to the element that contains the canvas and rendered tooltip. */
  className?: string;
  /** Applied to the element that contains the canvas and rendered tooltip. */
  style?: CSSProperties;
  /**
   * Localized display name for an alpha-2 country code, used for
   * name-only hover tooltips on countries without a data row.
   */
  getCountryLabel: (alpha2: string) => string;
  /**
   * Renders a tooltip for either a hovered country or externally hovered
   * entry. The library owns hit-testing and anchor coordinates only; callers
   * own all tooltip UI and positioning.
   */
  renderTooltip?: (tooltip: ChoroplethGlobeTooltip) => ReactNode;
}

const ChoroplethGlobe = forwardRef<ChoroplethGlobeHandle, ChoroplethGlobeProps>(
  (
    {
      entries,
      choroplethInput,
      size,
      colorScheme = 'light',
      className,
      style,
      getCountryLabel,
      renderTooltip,
    },
    ref
  ) => {
    const isDarkMode = colorScheme === 'dark';

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const globeRef = useRef<Globe | null>(null);
    // The latest generated choropleth texture, kept so a re-created globe
    // (e.g. after a resize) can re-upload it without regenerating.
    const textureRef = useRef<HTMLCanvasElement | null>(null);

    // Rotation state lives in refs so the rAF loop and event handlers can
    // read/write it without re-running the globe effect. `currentPhiRef`
    // persists the rotation across globe re-creations (e.g. theme changes).
    const currentPhiRef = useRef(0);
    const targetPhiRef = useRef<number | null>(null);
    const dragRef = useRef<{ startX: number; startPhi: number } | null>(null);
    const hoveringCanvasRef = useRef(false);
    // Only the id: the rAF loop resolves the entry from `entriesRef` each
    // frame, so tooltip contents can't go stale when entries change.
    const hoveredEntryIdRef = useRef<string | null>(null);
    const lastCenteredEntryIdRef = useRef<string | null>(null);

    // Latest entries/labeler for the loop and handlers, without effect
    // re-runs.
    const entriesRef = useRef(entries);
    entriesRef.current = entries;
    const getCountryLabelRef = useRef(getCountryLabel);
    getCountryLabelRef.current = getCountryLabel;

    // Reactive (unlike a one-time matchMedia read) so OS-level toggles take
    // effect; mirrored into a ref so the rAF loop picks up changes without
    // tearing down and recreating the WebGL globe.
    const prefersReducedMotion = usePrefersReducedMotion();
    const prefersReducedMotionRef = useRef(prefersReducedMotion);
    prefersReducedMotionRef.current = prefersReducedMotion;

    // Stale-result guard and debounce-lite memory for async country lookups.
    const countryLookupSeqRef = useRef(0);
    const lastLookupCoordsRef = useRef<[number, number] | null>(null);

    // Country centroids ([lat, lng] by alpha-2), loaded once. Mirrored into a
    // ref so the rAF loop can resolve locations without re-running the globe
    // effect when they arrive.
    const [centroids, setCentroids] = useState<ReadonlyMap<
      string,
      [number, number]
    > | null>(null);
    const centroidsRef = useRef(centroids);
    centroidsRef.current = centroids;

    // Either the tooltip from canvas pointer hit-testing, or the one anchored
    // to an externally hovered entry (positioned each frame by the rAF loop);
    // see ChoroplethGlobeTooltip.source for the precedence rule.
    const [tooltip, setTooltip] = useState<ChoroplethGlobeTooltip | null>(null);

    // Serialized so the effect only re-runs when contents change, not on every
    // render (the input object is rebuilt by the parent each render).
    const choroplethKey = JSON.stringify(choroplethInput);

    useEffect(() => {
      const input: ChoroplethGlobeInput = JSON.parse(choroplethKey);
      let cancelled = false;
      generateChoroplethTexture({
        filledColorRange: input.filledColorRange,
        missingAlpha: input.missingAlpha,
        missingColor: input.missingColor,
        valuesByAlpha2: new Map(input.valuesByAlpha2),
      })
        .then((texture) => {
          if (cancelled) {
            return;
          }
          textureRef.current = texture;
          globeRef.current?.updateTexture(texture);
        })
        .catch(() => {
          // Texture generation requires a 2D canvas context, which some
          // environments lack; the globe still renders its base surface.
        });
      return () => {
        cancelled = true;
      };
    }, [choroplethKey]);

    useEffect(() => {
      let cancelled = false;
      getCountryCentroids()
        .then((loadedCentroids) => {
          if (!cancelled) {
            setCentroids(loadedCentroids);
          }
        })
        .catch(() => {
          // Without centroids, entry hover/click navigation and the initial
          // rotate-to-top are skipped; the globe still renders and rotates.
        });
      return () => {
        cancelled = true;
      };
    }, []);

    // Rotates to center the top-magnitude entry when data first resolves, and
    // re-centers when the top entry changes after data updates. Centroids load
    // async, so the effect retries when they arrive if the location wasn't
    // yet available. Rotation is skipped (but the id is still recorded) while
    // the user is actively interacting, to avoid yanking the view
    // unexpectedly.
    const topEntryId = entries[0]?.id;
    useEffect(() => {
      if (!topEntryId) {
        return;
      }
      if (topEntryId === lastCenteredEntryIdRef.current) {
        return;
      }
      const location = centroids?.get(entriesRef.current[0].alpha2);
      if (!location) {
        // Centroids still loading; don't record the id so the effect retries
        // when they arrive.
        return;
      }
      lastCenteredEntryIdRef.current = topEntryId;
      if (
        dragRef.current !== null ||
        hoveringCanvasRef.current ||
        hoveredEntryIdRef.current !== null
      ) {
        // User is interacting: record the id but skip rotating to avoid
        // yanking the view at a surprising moment.
        return;
      }
      targetPhiRef.current = targetPhiForLongitude(
        currentPhiRef.current,
        location[1]
      );
    }, [topEntryId, centroids]);

    useImperativeHandle(ref, () => {
      const rotateToEntry = (id: string) => {
        const entry = entriesRef.current.find((e) => e.id === id);
        const location = entry ? centroids?.get(entry.alpha2) : undefined;
        if (location) {
          targetPhiRef.current = targetPhiForLongitude(
            currentPhiRef.current,
            location[1]
          );
        }
      };
      return {
        clearHoveredEntry: () => {
          hoveredEntryIdRef.current = null;
        },
        hoverEntry: (id: string) => {
          if (entriesRef.current.some((e) => e.id === id)) {
            hoveredEntryIdRef.current = id;
            rotateToEntry(id);
          }
        },
        navigateToEntry: rotateToEntry,
      };
    }, [centroids]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      // Cap the DPR: above 2x, the per-frame fragment cost grows quadratically
      // for no perceptible gain on a dotted globe.
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      let animationFrame: number | null = null;

      // The renderer returns a no-op globe when WebGL is unavailable (e.g.
      // software rendering disabled), so this cannot throw. The no-op globe's
      // project/unproject report non-visible/null, so tooltips and navigation
      // degrade to no-ops too.
      const globe = createGlobe(canvas, {
        devicePixelRatio,
        width: size,
        height: size,
        phi: currentPhiRef.current,
        theta: 0.2,
        dark: isDarkMode ? 1 : 0,
        diffuse: 1.2,
        mapSamples: 16_000,
        mapBrightness: 6,
        // The sphere occupies 80% of the canvas at scale 1; zoom in so it
        // nearly fills the canvas for legibility (its soft outer glow still
        // fits at 1.2).
        scale: 1.2,
        baseColor: isDarkMode ? [0.1, 0.1, 0.15] : [1, 1, 1],
        glowColor: isDarkMode ? [0.08, 0.08, 0.15] : [0.85, 0.85, 0.9],
      });
      globeRef.current = globe;
      if (textureRef.current) {
        globe.updateTexture(textureRef.current);
      }

      // The entry-anchored tooltip wins over pointer hit-testing while an
      // entry is hovered; pointer updates must never clobber it.
      const showPointerTooltip = (
        next: Omit<ChoroplethGlobeTooltip, 'source'>
      ) => {
        setTooltip((prev) =>
          prev?.source === 'entry' ? prev : { source: 'pointer', ...next }
        );
      };
      const clearPointerTooltip = () => {
        setTooltip((prev) => (prev?.source === 'pointer' ? null : prev));
      };

      // Positions the hovered-entry tooltip at the entry's projected location,
      // hiding it while the location faces away from the viewer. The entry is
      // resolved from the latest entries each frame, so a data refresh
      // mid-hover updates the tooltip. Only calls setState when the tooltip
      // meaningfully moves or its content changes.
      let shownHoveredEntry: ChoroplethGlobeTooltip | null = null;
      const syncHoveredEntryTooltip = () => {
        const hoveredId = hoveredEntryIdRef.current;
        const hovered =
          hoveredId === null
            ? undefined
            : entriesRef.current.find((e) => e.id === hoveredId);
        const location = hovered
          ? (centroidsRef.current?.get(hovered.alpha2) ?? null)
          : null;
        const hideTooltip = () => {
          if (shownHoveredEntry !== null) {
            shownHoveredEntry = null;
            setTooltip((prev) => (prev?.source === 'entry' ? null : prev));
          }
        };
        if (!hovered || !location) {
          hideTooltip();
          return;
        }
        const projected = globe.project(location);
        if (!projected.visible) {
          hideTooltip();
          return;
        }
        // clientWidth/clientHeight avoid a layout-forcing
        // getBoundingClientRect in this once-per-frame path (the canvas has
        // no borders or transforms, so they match its rect).
        const x = projected.x * canvas.clientWidth;
        const y = projected.y * canvas.clientHeight;
        if (
          shownHoveredEntry === null ||
          Math.abs(shownHoveredEntry.x - x) > 1 ||
          Math.abs(shownHoveredEntry.y - y) > 1 ||
          shownHoveredEntry.label !== hovered.label ||
          shownHoveredEntry.formattedValue !== hovered.formattedValue
        ) {
          shownHoveredEntry = {
            formattedValue: hovered.formattedValue,
            label: hovered.label,
            source: 'entry',
            x,
            y,
          };
          setTooltip(shownHoveredEntry);
        }
      };

      let lastRenderedPhi = currentPhiRef.current;
      const render = () => {
        let phi = currentPhiRef.current;
        // While dragging, phi comes from the pointermove handler (the target
        // was cleared on pointerdown), so the loop leaves it untouched.
        if (!dragRef.current) {
          if (targetPhiRef.current !== null) {
            const step = stepPhiTowardTarget(phi, targetPhiRef.current);
            phi = step.phi;
            if (step.done) {
              targetPhiRef.current = null;
            }
          } else if (
            !hoveringCanvasRef.current &&
            hoveredEntryIdRef.current === null &&
            !prefersReducedMotionRef.current
          ) {
            phi += AUTO_ROTATE_PHI_PER_FRAME;
          }
        }
        currentPhiRef.current = phi;
        if (phi !== lastRenderedPhi) {
          globe.update({ phi });
          lastRenderedPhi = phi;
        }
        syncHoveredEntryTooltip();
        animationFrame = window.requestAnimationFrame(render);
      };
      animationFrame = window.requestAnimationFrame(render);

      // Hover: unproject the pointer to [lat, lng] and resolve the country
      // under it. The polygon hit test is async, so a sequence counter
      // discards stale results, and lookups are skipped while the coordinates
      // stay near the previous lookup.
      const handleCountryHover = (input: { x: number; y: number }) => {
        const { x, y } = input;
        const coords = globe.unproject(
          x / canvas.clientWidth,
          y / canvas.clientHeight
        );
        if (!coords) {
          countryLookupSeqRef.current++;
          lastLookupCoordsRef.current = null;
          clearPointerTooltip();
          return;
        }
        const [lat, lng] = coords;
        const last = lastLookupCoordsRef.current;
        if (
          last &&
          Math.abs(last[0] - lat) < COUNTRY_LOOKUP_MIN_DEGREES &&
          Math.abs(last[1] - lng) < COUNTRY_LOOKUP_MIN_DEGREES
        ) {
          // Same neighborhood: keep the current pointer tooltip following the
          // pointer without re-running the async country lookup, bailing out
          // (no re-render) for sub-pixel movement.
          setTooltip((prev) =>
            prev === null ||
            prev.source === 'entry' ||
            (Math.abs(prev.x - x) <= 1 && Math.abs(prev.y - y) <= 1)
              ? prev
              : { ...prev, x, y }
          );
          return;
        }
        lastLookupCoordsRef.current = [lat, lng];
        const seq = ++countryLookupSeqRef.current;
        getCountryAtCoordinates(lng, lat)
          .then((alpha2) => {
            if (seq !== countryLookupSeqRef.current) {
              return;
            }
            if (!alpha2) {
              clearPointerTooltip();
              return;
            }
            const entry = entriesRef.current.find((e) => e.alpha2 === alpha2);
            if (entry) {
              showPointerTooltip({
                formattedValue: entry.formattedValue,
                label: entry.label,
                x,
                y,
              });
              return;
            }
            // Countries without a data row get a name-only tooltip.
            const label = getCountryLabelRef.current(alpha2);
            if (label) {
              showPointerTooltip({ formattedValue: null, label, x, y });
            } else {
              clearPointerTooltip();
            }
          })
          .catch(() => {
            clearPointerTooltip();
          });
      };

      const onCanvasPointerEnter = () => {
        hoveringCanvasRef.current = true;
      };
      const onCanvasPointerLeave = () => {
        hoveringCanvasRef.current = false;
        countryLookupSeqRef.current++;
        lastLookupCoordsRef.current = null;
        clearPointerTooltip();
      };
      const onPointerDown = (event: PointerEvent) => {
        dragRef.current = {
          startPhi: currentPhiRef.current,
          startX: event.clientX,
        };
        targetPhiRef.current = null;
        countryLookupSeqRef.current++;
        clearPointerTooltip();
        canvas.style.cursor = 'grabbing';
      };
      const onCanvasPointerMove = (event: PointerEvent) => {
        if (dragRef.current) {
          return;
        }
        // offsetX/offsetY are relative to the canvas (its padding box, which
        // has no border/padding), avoiding a getBoundingClientRect per move.
        handleCountryHover({ x: event.offsetX, y: event.offsetY });
      };
      // Drag continues even when the pointer leaves the canvas, so the drag
      // handlers listen on window.
      const onWindowPointerMove = (event: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) {
          return;
        }
        currentPhiRef.current =
          drag.startPhi + (event.clientX - drag.startX) / 100;
      };
      const onWindowPointerUp = () => {
        dragRef.current = null;
        canvas.style.cursor = 'grab';
      };
      canvas.addEventListener('pointerenter', onCanvasPointerEnter);
      canvas.addEventListener('pointerleave', onCanvasPointerLeave);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onCanvasPointerMove);
      window.addEventListener('pointermove', onWindowPointerMove);
      window.addEventListener('pointerup', onWindowPointerUp);

      return () => {
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
        }
        canvas.removeEventListener('pointerenter', onCanvasPointerEnter);
        canvas.removeEventListener('pointerleave', onCanvasPointerLeave);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onCanvasPointerMove);
        window.removeEventListener('pointermove', onWindowPointerMove);
        window.removeEventListener('pointerup', onWindowPointerUp);
        globe.destroy();
        globeRef.current = null;
      };
    }, [size, isDarkMode]);

    return (
      <div
        className={className}
        style={{
          aspectRatio: '1',
          maxWidth: '100%',
          position: 'relative',
          width: size,
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            cursor: 'grab',
            display: 'block',
            height: '100%',
            touchAction: 'none',
            width: '100%',
          }}
        />
        {tooltip ? renderTooltip?.(tooltip) : null}
      </div>
    );
  }
);

export default ChoroplethGlobe;
