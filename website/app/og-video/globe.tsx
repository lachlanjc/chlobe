'use client';

import { useEffect, useRef } from 'react';

import { generateChoroplethPalette } from '../../../src/choropleth-palette';
import createGlobe from '../../../src/globe-renderer';
import renewableData from '../../public/data/renewable-electricity-share.json';

const GLOBE_SIZE = 600;
const START_PHI = 4.5;
const RADIANS_PER_FRAME = 0.006;

type CaptureWindow = Window & {
  renderOgVideoFrame?: (frame: number) => void;
};

const OgVideoGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const palette = generateChoroplethPalette({
      filledColorRange: [
        [184, 201, 255],
        [18, 70, 224],
      ],
      missingAlpha: 0.45,
      missingColor: [184, 201, 255],
      valuesByAlpha2: new Map(
        renewableData.entries.map(({ alpha2, value }) => [alpha2, value])
      ),
    });
    const globe = createGlobe(canvas, {
      baseColor: [1, 0.984, 0.953],
      context: { preserveDrawingBuffer: true },
      countryPalette: palette,
      dark: 0,
      devicePixelRatio: 1,
      glowColor: [0.671, 0.945, 0.816],
      height: GLOBE_SIZE,
      mapSamples: 16_000,
      onError: (renderError) => {
        canvas.dataset.error = renderError.message;
      },
      phi: START_PHI,
      scale: 1.1,
      theta: 0.2,
      width: GLOBE_SIZE,
    });
    if (canvas.dataset.error) {
      return () => globe.destroy();
    }

    const captureWindow = window as CaptureWindow;
    captureWindow.renderOgVideoFrame = (frame: number) => {
      if (!Number.isInteger(frame) || frame < 0) {
        throw new Error('Capture frame must be a nonnegative integer');
      }
      globe.update({ phi: START_PHI + frame * RADIANS_PER_FRAME });
    };
    canvas.dataset.ready = 'true';

    return () => {
      delete captureWindow.renderOgVideoFrame;
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      aria-label="Animated country data globe"
      height={GLOBE_SIZE}
      ref={canvasRef}
      // A canvas cannot be replaced by an img; WebGL draws into it.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="img"
      width={GLOBE_SIZE}
    />
  );
};

export { OgVideoGlobe };
