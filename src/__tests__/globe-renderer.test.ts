// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import createGlobe from '../globeRenderer';
import type { GlobeOptions } from '../globeRenderer';

const options: GlobeOptions = {
  baseColor: [1, 1, 1],
  dark: 0,
  devicePixelRatio: 1,
  glowColor: [1, 1, 1],
  height: 200,
  mapSamples: 16_000,
  phi: 0,
  theta: 0,
  width: 200,
};

describe('renderer diagnostics', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reports unavailable WebGL without throwing during mount', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const onError = vi.fn<(error: Error) => void>();
    const globe = createGlobe(document.createElement('canvas'), {
      ...options,
      onError,
    });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'WebGL is unavailable' })
    );
    expect(globe.project([39, -98]).visible).toBeFalsy();
  });

  it('reports shader diagnostics and releases shaders after a fragment failure', () => {
    const context = {
      COMPILE_STATUS: 0x8b_81,
      FRAGMENT_SHADER: 0x8b_30,
      VERTEX_SHADER: 0x8b_31,
      compileShader: vi.fn<(shader: WebGLShader) => void>(),
      createShader: vi.fn<() => object>(() => ({})),
      deleteShader: vi.fn<(shader: WebGLShader) => void>(),
      getShaderInfoLog: vi.fn<() => string>(() => 'invalid fragment shader'),
      getShaderParameter: vi
        .fn<() => boolean>()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false),
      shaderSource: vi.fn<(shader: WebGLShader, source: string) => void>(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as WebGLRenderingContext
    );
    const onError = vi.fn<(error: Error) => void>();
    createGlobe(document.createElement('canvas'), { ...options, onError });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'WebGL shader compilation failed: invalid fragment shader',
      })
    );
    expect(context.deleteShader).toHaveBeenCalledTimes(2);
  });
});
