// GLSL for the room behind the MacBook.

// Dusk sky seen through the openings: shore teal overhead, warm bone horizon,
// a soft accent-coloured glow around the sun.
export const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  // Keeps the openings from blowing out to flat white against the dark room
  uniform float uExposure;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uTop, smoothstep(0.02, 0.55, h));
    float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
    col += uSun * (pow(s, 24.0) * 1.4 + pow(s, 4.0) * 0.35);
    gl_FragColor = vec4(col * uExposure, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Dust motes drifting through the light. Motion lives in the vertex shader so
// the CPU never touches the buffer.
export const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vFade;
  void main() {
    vec3 p = position;
    float t = uTime * (0.05 + aSeed * 0.07);
    p.x += sin(t + aSeed * 31.0) * 0.6;
    p.y += mod(t * 0.6 + aSeed * 9.0, 6.0) - 3.0;
    p.z += cos(t * 0.8 + aSeed * 17.0) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.4 + aSeed) / -mv.z;
    // fade in and out over each vertical loop
    vFade = sin(fract((t * 0.6 + aSeed * 9.0) / 6.0) * 3.14159);
    gl_Position = projectionMatrix * mv;
  }
`;

export const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vFade * 0.28;
    gl_FragColor = vec4(uColor, a);
  }
`;

// Film finish over the whole room: radial colour fringe, vignette, warm lift,
// animated grain (stepped at ~24fps so it reads as film, not noise).
export const postVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const postFragment = /* glsl */ `
  uniform sampler2D tScene;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uGrain;
  uniform float uFringe;
  // Colour lift of the film stock, set per accent by RoomScene's atmosphere
  uniform vec3 uLift;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 d = vUv - 0.5;
    d.x *= uRes.x / uRes.y;
    float r2 = dot(d, d);

    vec2 off = (vUv - 0.5) * r2 * uFringe;
    vec3 col;
    col.r = texture2D(tScene, vUv + off).r;
    col.g = texture2D(tScene, vUv).g;
    col.b = texture2D(tScene, vUv - off).b;

    col *= mix(1.0, 0.55, smoothstep(0.22, 1.0, r2));
    col = col * uLift + vec3(0.006, 0.004, 0.0);

    float frame = floor(uTime * 24.0);
    float g = hash(vUv * uRes + frame * 17.0) - 0.5;
    // grain shows most in the mid-tones, like film
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col += g * uGrain * (0.35 + lum * (1.0 - lum) * 2.6);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
