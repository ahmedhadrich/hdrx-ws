'use client';

import { useEffect, useRef } from 'react';
import { isScreenVisible, onScreenVisibility } from '@/components/three/screenVisibility';

// ---------------------------------------------------------------------------
// Glass display shader — the screen's surface, drawn over the HUD.
// Pattern lifted from CRT-in-a-TV sites, modernised: no scanlines. Instead the
// glass gets a window reflection,
// an occasional light sweep, a faint refresh band, a pointer glare and grain.
// Output is premultiplied alpha: white adds light, alpha alone darkens.
// ---------------------------------------------------------------------------
const VERT = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uDark;
uniform float uRadius;
uniform float uMotion;

// Arithmetic hash (Dave Hoskins). The classic sin() hash bands into vertical
// streaks at mediump precision on large pixel coordinates.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);


  // No edge darkening or rim highlight: on the 3D display they read as flares down the sides

  // Window reflection: two slanted soft streaks, upper right
  float s = p.x + p.y * 0.35;
  float streak = smoothstep(0.09, 0.0, abs(s - 0.42)) * 0.7
               + smoothstep(0.035, 0.0, abs(s - 0.6)) * 0.45;
  streak *= smoothstep(-0.45, 0.4, p.y);

  // Light sweep: crosses once every 11s, idle the rest of the cycle
  float cycle = mod(uTime, 11.0) / 11.0;
  float sweepX = mix(-0.9 * aspect, 0.9 * aspect, smoothstep(0.0, 0.3, cycle));
  float sweep = smoothstep(0.22, 0.0, abs(p.x - p.y * 0.55 - sweepX)) * step(cycle, 0.3) * uMotion;

  // Refresh band rolling down, very faint
  float roll = smoothstep(0.1, 0.0, abs(uv.y - (1.0 - fract(uTime * 0.05)))) * uMotion;

  // Pointer glare
  vec2 pp = (uPointer - 0.5) * vec2(aspect, 1.0);
  float glare = exp(-dot(p - pp, p - pp) * 5.0);

  float light = streak * 0.028 + sweep * 0.045 + roll * 0.018 + glare * 0.035;
  float shade = 0.0;

  float g = (hash(gl_FragCoord.xy + floor(fract(uTime * 7.0) * 97.0) * 17.0) - 0.5) * mix(0.05, 0.08, uDark);
  light += max(g, 0.0);
  shade += max(-g, 0.0);

  gl_FragColor = vec4(vec3(light), clamp(light + shade, 0.0, 1.0));
}
`;

interface Props {
  dark: boolean;
  reducedMotion: boolean;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[GlassShader]', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function GlassShader({ dark, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef(dark);

  useEffect(() => {
    darkRef.current = dark;
  }, [dark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    // No WebGL: the CSS glass still reads as glass, the shader is a bonus.
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      pointer: gl.getUniformLocation(prog, 'uPointer'),
      dark: gl.getUniformLocation(prog, 'uDark'),
      radius: gl.getUniformLocation(prog, 'uRadius'),
      motion: gl.getUniformLocation(prog, 'uMotion'),
    };

    // Soft effects only: no need for full retina resolution
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      // Layout size: the screen may be CSS-warped onto the 3D display
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Match the CSS display corner radius, expressed in shader units (height = 1)
      const radiusPx = parseFloat(getComputedStyle(canvas).borderTopLeftRadius) || 0;
      gl.uniform1f(u.radius, height > 0 ? radiusPx / height : 0);
      if (reducedMotion) draw(0);
    };

    const pointer = { x: 0.7, y: 0.75, tx: 0.7, ty: 0.75 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width;
      pointer.ty = 1 - (e.clientY - r.top) / r.height;
    };

    const draw = (t: number) => {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.pointer, pointer.x, pointer.y);
      gl.uniform1f(u.dark, darkRef.current ? 1 : 0);
      gl.uniform1f(u.motion, reducedMotion ? 0 : 1);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const start = performance.now();
    // 30 fps is plenty for grain and a slow sweep (film runs at 24), and halves the
    // full-display redraws the browser has to composite through the 3D warp
    const FRAME_MS = 1000 / 30;
    let last = -Infinity;
    const loop = (ts: number) => {
      if (!document.hidden && ts - last >= FRAME_MS - 1) {
        last = ts;
        draw((performance.now() - start) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    // Only loop while the screen can be seen: in 3D mode the overlay is hidden during the
    // intro and while zoomed out, and a full-display shader at 60 fps is wasted there.
    // The clock keeps running from `start`, so the sweep and band resume in phase.
    const run = (visible: boolean) => {
      cancelAnimationFrame(raf);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    let stopListening = () => {};
    if (reducedMotion) {
      draw(0);
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      run(isScreenVisible());
      stopListening = onScreenVisibility(run);
    }

    return () => {
      cancelAnimationFrame(raf);
      stopListening();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="mbp__shader" aria-hidden="true" />;
}
