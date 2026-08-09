/**
 * Vendored TypeScript port of the `cobe` WebGL globe library
 * (MIT, https://github.com/shuding/cobe), reduced to the choropleth globe
 * this chart renders and extended with:
 *
 * - Choropleth texture support (the `mapTexture` option plus the
 *   `updateTexture` method): the globe samples an RGBA equirectangular
 *   land-mask texture and blends per-dot choropleth land colors over the
 *   base surface, instead of the stock single-channel dot-brightness
 *   texture.
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

export interface GlobeOptions {
  width: number;
  height: number;
  phi: number;
  theta: number;
  mapSamples: number;
  mapBrightness: number;
  baseColor: [number, number, number];
  glowColor: [number, number, number];
  diffuse: number;
  devicePixelRatio: number;
  dark: number;
  opacity?: number;
  offset?: [number, number];
  scale?: number;
  context?: WebGLContextAttributes;
  /**
   * Initial RGBA choropleth texture (alpha = land mask). Without it the
   * globe renders its base surface until `updateTexture` is called.
   */
  mapTexture?: TexImageSource;
}

export interface Globe {
  update: (state: Partial<GlobeOptions>) => void;
  destroy: () => void;
  /** Re-uploads the choropleth texture and re-renders. */
  updateTexture: (image: TexImageSource) => void;
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

/**
 * Projected locations (tooltip anchors) sit slightly above the globe
 * surface so they don't overlap the shaded land dots.
 */
const PROJECTION_ELEVATION = 0.05;

const GLOBE_VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const GLOBE_FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 offset;
uniform vec2 rotation;
uniform float dots;
uniform float scale;
uniform vec3 baseColor;
uniform vec3 glowColor;
uniform vec4 renderParams;
uniform sampler2D uTexture;

const float sqrt5 = 2.236068;
const float PI = 3.141593;
const float kTau = 6.283185;
const float kPhi = 1.618034;
const float r = 0.8;

float byDots;

mat3 rotate(float theta, float phi) {
  float cx = cos(theta);
  float cy = cos(phi);
  float sx = sin(theta);
  float sy = sin(phi);
  return mat3(
    cy, sy * sx, -sy * cx,
    0.0, cx, sx,
    sy, cy * -sx, cy * cx
  );
}

vec3 nearestFibonacciLattice(vec3 p, out float m) {
  p = p.xzy;

  float k = max(2.0, floor(log2(sqrt5 * dots * PI * (1.0 - p.z * p.z)) * 0.72021));

  vec2 f = floor(pow(kPhi, k) / sqrt5 * vec2(1.0, kPhi) + 0.5);
  vec2 br1 = fract((f + 1.0) * (kPhi - 1.0)) * kTau - 3.883222;
  vec2 br2 = -2.0 * f;
  vec2 sp = vec2(atan(p.y, p.x), p.z - 1.0);
  vec2 c = floor(vec2(br2.y * sp.x - br1.y * (sp.y * dots + 1.0), -br2.x * sp.x + br1.x * (sp.y * dots + 1.0)) / (br1.x * br2.y - br2.x * br1.y));

  float mindist = PI;
  vec3 minip;
  for (float s = 0.0; s < 4.0; s += 1.0) {
    vec2 o = vec2(mod(s, 2.0), floor(s * 0.5));
    float idx = dot(f, c + o);
    if (idx > dots) continue;

    float a = idx, b = 0.0;
    if (a >= 16384.0) a -= 16384.0, b += 0.868872;
    if (a >= 8192.0) a -= 8192.0, b += 0.934436;
    if (a >= 4096.0) a -= 4096.0, b += 0.467218;
    if (a >= 2048.0) a -= 2048.0, b += 0.733609;
    if (a >= 1024.0) a -= 1024.0, b += 0.866804;
    if (a >= 512.0) a -= 512.0, b += 0.433402;
    if (a >= 256.0) a -= 256.0, b += 0.216701;
    if (a >= 128.0) a -= 128.0, b += 0.108351;
    if (a >= 64.0) a -= 64.0, b += 0.554175;
    if (a >= 32.0) a -= 32.0, b += 0.777088;
    if (a >= 16.0) a -= 16.0, b += 0.888544;
    if (a >= 8.0) a -= 8.0, b += 0.944272;
    if (a >= 4.0) a -= 4.0, b += 0.472136;
    if (a >= 2.0) a -= 2.0, b += 0.236068;
    if (a >= 1.0) a -= 1.0, b += 0.618034;

    float theta = fract(b) * kTau;

    float cosphi = 1.0 - 2.0 * idx * byDots;
    float sinphi = sqrt(1.0 - cosphi * cosphi);
    vec3 sample = vec3(cos(theta) * sinphi, sin(theta) * sinphi, cosphi);

    float dist = length(p - sample);

    if (dist < mindist) {
      mindist = dist;
      minip = sample;
    }
  }

  m = mindist;
  return minip.xzy;
}

void main() {
  byDots = 1.0 / dots;

  vec2 invResolution = 1.0 / uResolution;

  vec2 uv = ((gl_FragCoord.xy * invResolution) * 2.0 - 1.0) / scale - offset * vec2(1.0, -1.0) * invResolution;
  uv.x *= uResolution.x * invResolution.y;

  float l = dot(uv, uv);
  float glowFactor = 0.0;

  vec4 color = vec4(0.0);

  if (l <= r*r) {
    float dis;
    vec4 layer = vec4(0.0);
    vec3 p = normalize(vec3(uv, sqrt(r*r - l)));
    mat3 rot = rotate(rotation.y, rotation.x);
    float dotNL = p.z;

    vec3 gP = nearestFibonacciLattice(p * rot, dis);

    float gPhi = asin(gP.y);
    float gTheta = acos(-gP.x / cos(gPhi));
    if (gP.z < 0.0) gTheta = -gTheta;

    // Choropleth texCoord — remapped to [0,1] for CLAMP_TO_EDGE.
    // COBE shifts longitude by -PI (see latLonToVec3), so gTheta=0 in
    // shader-space corresponds to geographic lon 180 (antimeridian).
    // The d3-geo equirectangular texture has lon -180 at x=0, lon 0 at
    // x=0.5, lon 180 at x=1. We need to shift by +0.5 and wrap.
    // gTheta in [-PI, PI] -> geographic lon offset -> x in [0, 1]
    // gPhi   in [-PI/2, PI/2] -> y in [0, 1]  (top = north pole)
    vec2 texCoord = vec2(
      fract(gTheta / kTau + 1.0),
      0.5 - gPhi / PI
    );

    vec4 texSample = texture2D(uTexture, texCoord);

    float dotMask = smoothstep(0.018, 0.0, dis);
    float lighting = pow(dotNL, renderParams.y);

    // Choropleth: texture RGBA — alpha=0 for ocean, alpha=1 for land.
    // GL.LINEAR filtering at coastlines produces smooth alpha gradients
    // instead of harsh edges.
    vec3 texColor = texSample.rgb;
    float isLand = texSample.a;

    // Smooth globe surface (no dots) — used for ocean and between dots.
    float dark = renderParams.z;
    float surfaceBright = mix(pow(dotNL, 0.4), 0.0, dark) + 0.1;
    vec3 surface = baseColor * surfaceBright
      + pow(1.0 - dotNL, 4.0) * glowColor;

    // Land dots: choropleth-colored round dots.
    vec3 landDotColor = mix(
      texColor * 0.85,
      texColor * lighting * 2.5,
      dark
    );

    // Blend: surface everywhere, then overlay land-colored round dots.
    // isLand * dotMask ensures color only appears within round dot shapes
    // that fall on land.
    vec3 result = mix(surface, landDotColor, isLand * dotMask);
    layer += vec4(result, 1.0);

    color += layer * (1.0 + renderParams.w) * 0.5;

    glowFactor = (1.0 - l) * (1.0 - l) * smoothstep(0.0, 1.0, 0.2 / (l - r*r));
  } else {
    float outD = sqrt(0.2 / (l - r*r));
    glowFactor = smoothstep(0.5, 1.0, outD / (outD + 1.0));
  }

  gl_FragColor = color + vec4(glowFactor * glowColor, glowFactor);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function getGlobeUniformLocations(
  gl: WebGLRenderingContext,
  program: WebGLProgram
) {
  return {
    uResolution: gl.getUniformLocation(program, 'uResolution'),
    rotation: gl.getUniformLocation(program, 'rotation'),
    dots: gl.getUniformLocation(program, 'dots'),
    scale: gl.getUniformLocation(program, 'scale'),
    offset: gl.getUniformLocation(program, 'offset'),
    baseColor: gl.getUniformLocation(program, 'baseColor'),
    glowColor: gl.getUniformLocation(program, 'glowColor'),
    renderParams: gl.getUniformLocation(program, 'renderParams'),
    uTexture: gl.getUniformLocation(program, 'uTexture'),
  };
}

const NOOP_GLOBE: Globe = {
  destroy: () => {},
  update: () => {},
  updateTexture: () => {},
  project: () => ({ x: 0, y: 0, visible: false }),
  unproject: () => null,
};

export default function createGlobe(
  canvas: HTMLCanvasElement,
  opts: GlobeOptions
): Globe {
  const contextAttributes: WebGLContextAttributes = {
    alpha: true,
    stencil: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    ...opts.context,
  };
  const glContext =
    canvas.getContext('webgl2', contextAttributes) ??
    canvas.getContext('webgl', contextAttributes);
  if (!glContext) return NOOP_GLOBE;
  // Rebind after the null check so closures below see a non-null context.
  const gl = glContext;

  const devicePixelRatio = opts.devicePixelRatio || 1;
  canvas.width = opts.width * devicePixelRatio;
  canvas.height = opts.height * devicePixelRatio;

  let phi = opts.phi || 0;
  let theta = opts.theta || 0;
  let mapSamples = opts.mapSamples || 10_000;
  let mapBrightness = opts.mapBrightness || 1;
  let baseColor: [number, number, number] = opts.baseColor || [1, 1, 1];
  let glowColor: [number, number, number] = opts.glowColor || [1, 1, 1];
  let diffuse = opts.diffuse || 1;
  let dark = opts.dark || 0;
  let opacity = opts.opacity ?? 1;
  let offset: [number, number] = opts.offset || [0, 0];
  let scale = opts.scale || 1;

  const globeProgram = createProgram(
    gl,
    GLOBE_VERTEX_SHADER,
    GLOBE_FRAGMENT_SHADER
  );
  if (!globeProgram) return NOOP_GLOBE;

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

  // Initialize with a 1x1 opaque placeholder until the real choropleth
  // texture is uploaded via mapTexture or updateTexture.
  const mapTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, mapTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255])
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  function uploadTexture(image: TexImageSource): void {
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
  }

  if (opts.mapTexture) {
    uploadTexture(opts.mapTexture);
  }

  function render(state: Partial<GlobeOptions>): void {
    if (state.phi !== undefined) phi = state.phi;
    if (state.theta !== undefined) theta = state.theta;
    if (state.width && state.height) {
      canvas.width = state.width * devicePixelRatio;
      canvas.height = state.height * devicePixelRatio;
    }
    if (state.mapSamples !== undefined) mapSamples = state.mapSamples;
    if (state.mapBrightness !== undefined) mapBrightness = state.mapBrightness;
    if (state.baseColor !== undefined) baseColor = state.baseColor;
    if (state.glowColor !== undefined) glowColor = state.glowColor;
    if (state.diffuse !== undefined) diffuse = state.diffuse;
    if (state.dark !== undefined) dark = state.dark;
    if (state.opacity !== undefined) opacity = state.opacity;
    if (state.offset !== undefined) offset = state.offset;
    if (state.scale !== undefined) scale = state.scale;

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
    gl.uniform4f(
      globeUniforms.renderParams,
      mapBrightness,
      diffuse,
      dark,
      opacity
    );
    gl.uniform1i(globeUniforms.uTexture, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
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
      visible: rotatedZ >= 0,
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
    if (radialSq > GLOBE_RADIUS * GLOBE_RADIUS) return null;
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
    update: render,
    project,
    unproject,
    updateTexture: (image: TexImageSource) => {
      uploadTexture(image);
      render({});
    },
    destroy: () => {
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(globeProgram);
      gl.deleteTexture(mapTexture);
    },
  };
}
