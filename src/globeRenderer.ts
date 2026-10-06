/**
 * Vendored TypeScript port of the `cobe` WebGL globe library
 * (MIT, https://github.com/shuding/cobe), reduced to the choropleth globe
 * this chart renders and extended with:
 *
 * - Choropleth palette support: each fixed globe dot has a precomputed
 *   country ID, and a tiny dynamic RGBA palette maps those IDs to colors.
 * - Screen projection (`project`): maps a [lat, lng] coordinate (degrees) to
 *   normalized [0, 1] canvas coordinates.
 * - Unprojection (`unproject`): maps normalized [0, 1] canvas coordinates
 *   back to a [lat, lng] coordinate on the sphere, or null if off-globe.
 *
 * Ported from a sibling internal dashboard tool's modified build of cobe.
 * Unlike that build (and stock cobe v2), this port omits the marker and arc
 * pipelines, the built-in dot-texture mode, and the CSS anchor-positioning
 * helper — the chart only needs the choropleth globe itself.
 */

import { DOT_COUNT, DOT_TEXTURE_WIDTH } from './generated-country-data';
import {
  GLOBE_FRAGMENT_SHADER as MINIFIED_GLOBE_FRAGMENT_SHADER,
  GLOBE_VERTEX_SHADER as MINIFIED_GLOBE_VERTEX_SHADER,
} from './generated-globe-shaders';
import { getDotCountryIds } from './worldGeoData';

export interface GlobeOptions {
  width: number;
  height: number;
  phi: number;
  theta: number;
  mapSamples: number;
  baseColor: [number, number, number];
  glowColor: [number, number, number];
  devicePixelRatio: number;
  dark: number;
  offset?: [number, number];
  scale?: number;
  context?: WebGLContextAttributes;
  /** Initial country-ID -> RGBA palette. */
  countryPalette?: Uint8Array;
  onError?: (error: Error) => void;
}

export interface Globe {
  update: (state: Partial<GlobeOptions>) => void;
  destroy: () => void;
  /** Re-uploads the country color palette and re-renders. */
  updatePalette: (palette: Uint8Array) => void;
  /**
   * Projects a [lat, lng] coordinate (degrees) to normalized [0, 1] canvas
   * coordinates at the current phi/theta/scale/offset. `visible` is false
   * when the point is on the far side of the globe.
   */
  project: (location: [number, number]) => {
    x: number;
    y: number;
    visible: boolean;
  };
  /**
   * Inverse-projects normalized [0, 1] canvas coordinates back to a
   * [lat, lng] coordinate (degrees) on the sphere, or null if the point is
   * off the globe.
   */
  unproject: (nx: number, ny: number) => [number, number] | null;
}

const GLOBE_RADIUS = 0.8;
const DOT_TEXTURE_HEIGHT = Math.ceil((DOT_COUNT + 1) / DOT_TEXTURE_WIDTH);

/**
 * Projected locations (tooltip anchors) sit slightly above the globe
 * surface so they don't overlap the shaded land dots.
 */
const PROJECTION_ELEVATION = 0.05;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create WebGL shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const details = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(
      `WebGL shader compilation failed: ${details ?? 'no diagnostic available'}`
    );
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  let fragmentShader: WebGLShader | null = null;
  try {
    fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Unable to create WebGL program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const details = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(
        `WebGL program linking failed: ${details ?? 'no diagnostic available'}`
      );
    }
    return program;
  } finally {
    gl.deleteShader(vertexShader);
    if (fragmentShader) {
      gl.deleteShader(fragmentShader);
    }
  }
}

function getGlobeUniformLocations(
  gl: WebGLRenderingContext,
  program: WebGLProgram
) {
  return {
    baseColor: gl.getUniformLocation(program, 'baseColor'),
    dark: gl.getUniformLocation(program, 'dark'),
    dots: gl.getUniformLocation(program, 'dots'),
    glowColor: gl.getUniformLocation(program, 'glowColor'),
    offset: gl.getUniformLocation(program, 'offset'),
    rotation: gl.getUniformLocation(program, 'rotation'),
    scale: gl.getUniformLocation(program, 'scale'),
    uCountryIds: gl.getUniformLocation(program, 'uCountryIds'),
    uCountryPalette: gl.getUniformLocation(program, 'uCountryPalette'),
    uResolution: gl.getUniformLocation(program, 'uResolution'),
  };
}

const NOOP_GLOBE: Globe = {
  destroy: () => {},
  project: () => ({ visible: false, x: 0, y: 0 }),
  unproject: () => null,
  update: () => {},
  updatePalette: () => {},
};

export default function createGlobe(
  canvas: HTMLCanvasElement,
  opts: GlobeOptions
): Globe {
  const contextAttributes: WebGLContextAttributes = {
    alpha: true,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    stencil: false,
    ...opts.context,
  };
  const glContext =
    canvas.getContext('webgl2', contextAttributes) ??
    canvas.getContext('webgl', contextAttributes);
  if (!glContext) {
    opts.onError?.(new Error('WebGL is unavailable'));
    return NOOP_GLOBE;
  }
  // Rebind after the null check so closures below see a non-null context.
  const gl = glContext;

  const devicePixelRatio = opts.devicePixelRatio || 1;
  canvas.width = opts.width * devicePixelRatio;
  canvas.height = opts.height * devicePixelRatio;

  let phi = opts.phi || 0;
  let theta = opts.theta || 0;
  let mapSamples = opts.mapSamples || 10_000;
  let baseColor: [number, number, number] = opts.baseColor || [1, 1, 1];
  let glowColor: [number, number, number] = opts.glowColor || [1, 1, 1];
  let dark = opts.dark || 0;
  let offset: [number, number] = opts.offset || [0, 0];
  let scale = opts.scale || 1;

  let globeProgram: WebGLProgram;
  try {
    globeProgram = createProgram(
      gl,
      MINIFIED_GLOBE_VERTEX_SHADER,
      MINIFIED_GLOBE_FRAGMENT_SHADER
    );
  } catch (error) {
    opts.onError?.(error instanceof Error ? error : new Error(String(error)));
    return NOOP_GLOBE;
  }

  // Fullscreen quad (2 triangles) that the globe fragment shader fills.
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const globeUniforms = getGlobeUniformLocations(gl, globeProgram);
  const globePositionLocation = gl.getAttribLocation(globeProgram, 'aPosition');

  const countryIds = getDotCountryIds();
  const countryIdPixels = new Uint8Array(
    DOT_TEXTURE_WIDTH * DOT_TEXTURE_HEIGHT * 4
  );
  for (let index = 0; index < countryIds.length; index += 1) {
    countryIdPixels[index * 4] = countryIds[index];
    countryIdPixels[index * 4 + 3] = 255;
  }

  const countryIdTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, countryIdTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    DOT_TEXTURE_WIDTH,
    DOT_TEXTURE_HEIGHT,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    countryIdPixels
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const countryPaletteTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, countryPaletteTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  function uploadPalette(palette: Uint8Array): void {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, countryPaletteTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      256,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      palette
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  uploadPalette(opts.countryPalette ?? new Uint8Array(256 * 4));

  function render(state: Partial<GlobeOptions>): void {
    if (state.phi !== undefined) {
      phi = state.phi;
    }
    if (state.theta !== undefined) {
      theta = state.theta;
    }
    if (state.width && state.height) {
      const width = state.width * devicePixelRatio;
      const height = state.height * devicePixelRatio;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    if (state.mapSamples !== undefined) {
      mapSamples = state.mapSamples;
    }
    if (state.baseColor !== undefined) {
      baseColor = state.baseColor;
    }
    if (state.glowColor !== undefined) {
      glowColor = state.glowColor;
    }
    if (state.dark !== undefined) {
      dark = state.dark;
    }
    if (state.offset !== undefined) {
      offset = state.offset;
    }
    if (state.scale !== undefined) {
      scale = state.scale;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(globeProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(globePositionLocation);
    gl.vertexAttribPointer(globePositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(globeUniforms.uResolution, canvas.width, canvas.height);
    gl.uniform2f(globeUniforms.rotation, phi, theta);
    gl.uniform1f(globeUniforms.dots, mapSamples);
    gl.uniform1f(globeUniforms.scale, scale);
    gl.uniform2f(
      globeUniforms.offset,
      offset[0] * devicePixelRatio,
      offset[1] * devicePixelRatio
    );
    gl.uniform3fv(globeUniforms.baseColor, baseColor);
    gl.uniform3fv(globeUniforms.glowColor, glowColor);
    gl.uniform1f(globeUniforms.dark, dark);
    gl.uniform1i(globeUniforms.uCountryIds, 0);
    gl.uniform1i(globeUniforms.uCountryPalette, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, countryIdTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, countryPaletteTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Converts a [lat, lng] coordinate (degrees) into a unit vector on the
   * sphere, in cobe's shader coordinate space (longitude shifted by -PI).
   */
  function latLonToVec3([lat, lon]: [number, number]): [
    number,
    number,
    number,
  ] {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180 - Math.PI;
    const cosLat = Math.cos(latRad);
    return [
      -cosLat * Math.cos(lonRad),
      Math.sin(latRad),
      cosLat * Math.sin(lonRad),
    ];
  }

  function project(location: [number, number]): {
    x: number;
    y: number;
    visible: boolean;
  } {
    const unit = latLonToVec3(location);
    const radius = GLOBE_RADIUS + PROJECTION_ELEVATION;
    const point: [number, number, number] = [
      unit[0] * radius,
      unit[1] * radius,
      unit[2] * radius,
    ];
    const cosTheta = Math.cos(theta);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const sinPhi = Math.sin(phi);
    const rotatedX = cosPhi * point[0] + sinPhi * point[2];
    const rotatedY =
      sinPhi * sinTheta * point[0] +
      cosTheta * point[1] -
      cosPhi * sinTheta * point[2];
    const rotatedZ =
      -sinPhi * cosTheta * point[0] +
      sinTheta * point[1] +
      cosPhi * cosTheta * point[2];
    return {
      visible: rotatedZ >= 0,
      x:
        ((rotatedX / (canvas.width / canvas.height)) * scale +
          (offset[0] * scale * devicePixelRatio) / canvas.width +
          1) /
        2,
      y:
        (-rotatedY * scale +
          (offset[1] * scale * devicePixelRatio) / canvas.height +
          1) /
        2,
    };
  }

  function unproject(nx: number, ny: number): [number, number] | null {
    const aspect = canvas.width / canvas.height;
    const worldX =
      ((nx * 2 - 1 - (offset[0] * scale * devicePixelRatio) / canvas.width) /
        scale) *
      aspect;
    const worldY =
      -(ny * 2 - 1 - (offset[1] * scale * devicePixelRatio) / canvas.height) /
      scale;
    const radialSq = worldX * worldX + worldY * worldY;
    if (radialSq > GLOBE_RADIUS * GLOBE_RADIUS) {
      return null;
    }
    const worldZ = Math.sqrt(GLOBE_RADIUS * GLOBE_RADIUS - radialSq);
    const cosTheta = Math.cos(theta);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const sinPhi = Math.sin(phi);
    // Inverse of the globe rotation applied in `project`.
    const sphereX =
      cosPhi * worldX + sinPhi * sinTheta * worldY - sinPhi * cosTheta * worldZ;
    const sphereY = cosTheta * worldY + sinTheta * worldZ;
    const sphereZ =
      sinPhi * worldX - cosPhi * sinTheta * worldY + cosPhi * cosTheta * worldZ;
    const latRad = Math.asin(sphereY / GLOBE_RADIUS);
    const cosLat = Math.cos(latRad);
    // Undo the -PI longitude shift applied by latLonToVec3.
    const lonShifted =
      ((Math.atan2(sphereZ / cosLat, -sphereX / cosLat) + Math.PI) * 180) /
      Math.PI;
    return [(latRad * 180) / Math.PI, ((lonShifted + 180) % 360) - 180];
  }

  render({});

  return {
    destroy: () => {
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(globeProgram);
      gl.deleteTexture(countryIdTexture);
      gl.deleteTexture(countryPaletteTexture);
    },
    project,
    unproject,
    update: render,
    updatePalette: (palette: Uint8Array) => {
      uploadPalette(palette);
      render({});
    },
  };
}
