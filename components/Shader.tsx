'use client'
import { useEffect, useRef } from 'react'

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`

// Neural-pathway mosaic: ridged noise (the filaments) x soft cloud mass, snapped to square
// tiles and quantised to 6 brightness levels. The cursor bends the grid like a lens, sends
// brain-wave rings through nearby tiles, and makes the green tiles fizz.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r;    // canvas size
uniform float t;   // time
uniform vec2 m;    // cursor (canvas pixels, origin bottom-left)
uniform float k;   // 0..1: is the cursor here?
uniform float en;  // 0..1: how fast it's moving (drives the waves)
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * n(p); p = p * 2.02 + vec2(1.7, 9.2); a *= .5; } return v; }
float ridge(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++){ float x = 1. - abs(2. * n(p) - 1.); v += a * x * x; p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
void main(){
  float size = r.y / 34.;                          // about 34 tile rows on any screen

  // 1. Bend the grid around the cursor: magnify (lens) + ripple outward
  vec2 P = gl_FragCoord.xy;
  vec2 dm = P - m;
  float dist = length(dm);
  float lens = exp(-dist * dist / (r.y * r.y * .0484)) * k;
  float ripple = sin(dist / (r.y * .06) - t * 4.) * size * .3 * lens * (.3 + .7 * en);
  P = P - dm * lens * .3 + dm / max(dist, 1.) * ripple;

  vec2 px = P / size;
  vec2 id = floor(px), f = fract(px);
  vec2 c = (id + .5) * size;                       // everything below is sampled per tile
  vec2 uv = c / r.y;

  // 2. The pathways
  vec2 q = vec2(fbm(uv * 1.6 + vec2(t * .03, 0.)), fbm(uv * 1.6 + vec2(5.2, 1.3) - vec2(t * .025, 0.)));
  float rv = ridge(uv * 2.2 + 1.6 * q + vec2(t * .02, 0.));
  float cloud = fbm(uv * 1.2 + 1.5 * q - vec2(t * .02, 0.));
  vec2 vc = (c / r - .5) * vec2(r.x / r.y, 1.);
  float centre = smoothstep(.05, .6, length(vc));
  float e = clamp(smoothstep(.47, .7, rv) * smoothstep(.3, .55, cloud) * (.25 + .75 * centre) * 1.3, 0., 1.);

  // 3. Brain waves + effervescence near the cursor
  float act = k * (.35 + .65 * en);
  float env = exp(-dist / (r.y * .30));
  float wave = .5 + .5 * sin(dist / (r.y * .045) - t * 3.2);
  float fz = t * 5. + h(id) * 8.;
  float pop = step(.78, h(id + floor(fz))) * (1. - fract(fz));     // short random flashes
  e = clamp(e + act * env * wave * .55 * (.4 + e), 0., 1.);

  float lvl = floor(e * 6.) / 6.;
  vec2 d = abs(f - .5);
  float tile = 1. - smoothstep(.36, .46, max(d.x, d.y));
  float flow = .5 + .5 * sin(rv * 14. - t * 1.2);                  // pulses travelling along pathways
  vec3 green = vec3(.22, 1., .35);
  vec3 col = vec3(.07, .09, .075) + .012 * tile + green * lvl * (.5 + .6 * flow) * tile;
  col += vec3(.55, 1., .7) * pop * act * env * (.25 + lvl) * tile;
  vec2 v = gl_FragCoord.xy / r - .5;
  col *= 1. - dot(v, v) * 1.1;
  gl_FragColor = vec4(col, 1.);
}`

export default function Shader() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const gl = canvas.getContext('webgl', { antialias: false })
    if (!gl) return // the CSS background colour shows instead

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    // One oversized triangle covers the whole screen.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uR = gl.getUniformLocation(prog, 'r')
    const uT = gl.getUniformLocation(prog, 't')
    const uM = gl.getUniformLocation(prog, 'm')
    const uK = gl.getUniformLocation(prog, 'k')
    const uE = gl.getUniformLocation(prog, 'en')

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const SCALE = 0.75 // lower = cooler GPU but softer tile edges; 1 = sharpest
    const start = performance.now()
    let raf = 0

    // Cursor state. tx/ty is where the pointer is; mx/my chases it smoothly.
    let tx = 0, ty = 0, mx = 0, my = 0
    let k = 0, kTarget = 0, en = 0

    const resize = () => {
      canvas.width = Math.max(1, Math.ceil(canvas.clientWidth * SCALE))
      canvas.height = Math.max(1, Math.ceil(canvas.clientHeight * SCALE))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      tx = (e.clientX - rect.left) * (canvas.width / rect.width)
      ty = (rect.bottom - e.clientY) * (canvas.height / rect.height) // GL's y points up
      if (kTarget === 0) { mx = tx; my = ty } // snap on entry so it doesn't fly in from the corner
      kTarget = 1
    }
    const onLeave = () => { kTarget = 0 }
    const onUp = (e: PointerEvent) => { if (e.pointerType === 'touch') onLeave() }

    const draw = (now: number) => {
      const dx = tx - mx, dy = ty - my
      mx += dx * 0.14
      my += dy * 0.14
      k += (kTarget - k) * 0.08
      en = Math.max(en * 0.975, Math.min(1, (Math.hypot(dx, dy) / canvas.height) * 6)) // faster mouse = stronger waves

      gl.uniform2f(uR, canvas.width, canvas.height)
      gl.uniform1f(uT, reduce ? 20 : (now - start) / 1000 + 20)
      gl.uniform2f(uM, mx, my)
      gl.uniform1f(uK, k)
      gl.uniform1f(uE, en)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!reduce) raf = requestAnimationFrame(draw) // browsers pause this in hidden tabs
    }

    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) draw(performance.now()) // static frame needs a manual redraw
    })
    ro.observe(canvas)
    resize()
    raf = requestAnimationFrame(draw)

    if (!reduce) {
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('blur', onLeave)
      document.documentElement.addEventListener('pointerleave', onLeave)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('blur', onLeave)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return <canvas ref={ref} className="shader" aria-hidden="true" />
}
