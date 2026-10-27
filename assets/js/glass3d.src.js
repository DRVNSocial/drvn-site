/* =========================================================
   DRVN hero: 3D dispersed-glass objects
   - 3 to 5 objects, a different random selection on every visit
   - real refraction/dispersion/iridescence (three.js physical material)
   - float + idle spin; tilt toward the cursor; grab to spin with inertia;
     click to pop-spin. Paused when the hero is off screen.
   ========================================================= */
import * as THREE from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const heroHost = document.getElementById('heroStickers');
const heroSec = document.getElementById('hero');
if (!window.WebGLRenderingContext) document.documentElement.classList.add('gem-fail');
if (heroHost && heroSec && window.WebGLRenderingContext) {
  try { init({ host: heroHost, area: heroSec, hero: true, titleSel: '.hero__title .ch', titleEl: '.hero__title', video: '.hero__video' }); }
  catch (e) { document.documentElement.classList.add('gem-fail'); heroHost.dataset.g3dError = e.message; console.error('glass3d', e); dispatchEvent(new Event('drvn:glass-ready')); }
}

// ---------- the finale: the same glass emojis rise up with the scroll and stay for the footer
const finHost = document.getElementById('finaleGlass'), finSec = document.getElementById('contact');
if (finHost && finSec && window.WebGLRenderingContext) {
  let started = false;
  const smooth = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const start = () => {
    if (started) return; started = true;
    try {
      init({
        host: finHost, area: finSec, hero: false, titleSel: '.finale__title .ch', titleEl: null, video: null,
        floor: innerWidth < 760 ? .3 : .6,
        zones: innerWidth < 760 ? [{ x0: .1, x1: .4, y0: .1, y1: .2 }, { x0: .6, x1: .9, y0: .1, y1: .2 }]
                                : [{ x0: .08, x1: .2, y0: .18, y1: .5 }, { x0: .8, x1: .92, y0: .18, y1: .5 }],
        count: innerWidth < 760 ? 3 : 4,
        rise: () => {                                   // 1.15 screens below → in place as the title arrives (68–88% of the scroll)
          const r = finSec.getBoundingClientRect(), p = -r.top / Math.max(1, r.height - innerHeight);
          return (1 - smooth((p - .68) / .2)) * 1.15;
        }
      });
    } catch (e) { finHost.dataset.g3dError = e.message; console.error('glass3d finale', e); }
  };
  // build it ahead of time (idle, after the hero has settled) or when the section gets close, whichever is first
  new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { rootMargin: '150% 0px' }).observe(finSec);
  addEventListener('drvn:gems', () => (window.requestIdleCallback || setTimeout)(start, { timeout: 2000 }), { once: true });
}

function init(cfg) {
  const host = cfg.host, hero = cfg.area;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth < 760;

  // ---------- renderer / scene / camera
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { document.documentElement.classList.add('gem-fail'); return; }
  const MOB = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(MOB ? 1 : Math.min(devicePixelRatio, 1.5));          // sharp enough for glass, far cheaper than 2x; phones render at 1x
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = MOB ? 0.35 : 0.5;   // refraction buffer at half res (lower on phones)
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement;
  cv.className = 'glass3d';
  host.appendChild(cv);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // ---------- studio environment in the DRVN glass palette (blue / violet / cyan / amber)
  const makeEnv = (r) => {
  const pmrem = new THREE.PMREMGenerator(r);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x05060c);
  const panel = (w, h, color, intensity, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); env.add(m);
  };
  // bright strip lights give the crisp white/cyan edge highlights; coloured fills give the blue/violet body
  // neutral studio: white strip lights for crisp edge highlights, soft grey fills, no coloured light,
  // so any colour you see comes from dispersion at the refracting edges (like the nav)
  panel(12, 0.45, 0xffffff, 5, [0, 5.5, 2], [0, 0, 0]);
  panel(0.45, 9, 0xffffff, 3.2, [-6.5, 0, 3], [0, 0, 0]);
  panel(0.35, 7, 0xffffff, 3.2, [6.5, 1, 4], [0, 0, 0]);
  panel(8, 6, 0x9aa0aa, 0.6, [-7, 0, -1], [0, 0, 0]);
  panel(8, 6, 0x9aa0aa, 0.6, [7, 0.5, -1], [0, 0, 0]);
  panel(6, 2, 0xffffff, 1.2, [0, -5.5, 3], [0, 0, 0]);
  const tex = pmrem.fromScene(env, 0.035).texture; pmrem.dispose(); return tex;
  };
  scene.environment = makeEnv(renderer);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 6); scene.add(key);

  // ---------- glass material (one per object so each can have its own tint)
  const TINTS = [0x3550ff, 0x6a3dff, 0x2c9dff, 0x9a4dff, 0x4466ff];
  const glass = () => new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.14,           // light frost, like the nav
    transmission: 1, thickness: 1.1, ior: 1.5, dispersion: 16, // strong colour split, but only where the light bends (edges)
    attenuationColor: 0xffffff, attenuationDistance: Infinity,  // no tint: clear glass
    iridescence: 0.25, iridescenceIOR: 1.3, iridescenceThicknessRange: [200, 600],
    clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 1, envMapIntensity: 1.2
  });

  // ---------- what the glass refracts: a live copy of the hero behind it (video + shade + headline).
  // Drawn only into three's transmission buffer (invisible in the normal pass), so the glass
  // genuinely bends the real headline and showreel like the references.
  const video = cfg.video ? document.querySelector(cfg.video) : null;
  const titleChars = () => [...document.querySelectorAll(cfg.titleSel)];
  const bc = document.createElement('canvas'), bx = bc.getContext('2d');
  let videoOK = null, BS = 0.35; const snapCache = new Map(); host._bc = bc;   // backdrop drawn at ~1/3 res: refraction softens it anyway
  const backTex = new THREE.CanvasTexture(bc);
  backTex.colorSpace = THREE.SRGBColorSpace; backTex.generateMipmaps = false; backTex.minFilter = THREE.LinearFilter;
  const backMat = new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false, depthWrite: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backMat);
  back.renderOrder = -10;
  back.onBeforeRender = r => { backMat.colorWrite = r.getRenderTarget() !== null; };   // transmission pass only
  scene.add(back);
  let metrics = null, glyphs = [], glyphsDirty = true, introUntil = cfg.hero ? performance.now() + 2600 : 0;
  const markDirty = () => { glyphsDirty = true; };
  if (cfg.hero) addEventListener('drvn:intro', () => { introUntil = performance.now() + 2200; glyphsDirty = true; });   // headline animates in after the opening sequence
  addEventListener('scroll', markDirty, { passive: true });
  addEventListener('resize', markDirty);
  document.fonts?.ready.then(markDirty);
  const titleEl = cfg.titleEl ? document.querySelector(cfg.titleEl) : null; let lastSlide = null;
  function measureGlyphs() {
    const chars = titleChars(); if (!chars.length) { glyphs = []; return; }
    const hr = host.getBoundingClientRect(), cs = getComputedStyle(chars[0]), fs = parseFloat(cs.fontSize);
    bx.font = `italic 700 ${fs * BS}px N27`;
    if (!metrics || metrics.fs !== fs) { const m = bx.measureText('H'); metrics = { fs, a: m.fontBoundingBoxAscent / BS, d: m.fontBoundingBoxDescent / BS }; }
    const lh = parseFloat(cs.lineHeight) || fs * 0.82, animating = performance.now() < introUntil;
    glyphs = chars.map(c => {
      const r = c.getBoundingClientRect();
      return { w: getComputedStyle(c).fontWeight, ch: c.textContent.toUpperCase(), x: (r.left - hr.left) * BS, y: (r.top + (lh - (metrics.a + metrics.d)) / 2 + metrics.a - hr.top) * BS, o: (animating ? +getComputedStyle(c).opacity : 1) * +getComputedStyle(c.closest('.line') || c).opacity * (c.closest('.is-frost') && !document.documentElement.classList.contains('hero-left') ? 0.4 : 1) };
    });
    glyphs.font = bx.font;
    glyphsDirty = false;
  }
  // ---------- page painter: a faithful-enough copy of whatever is under each glass object
  // (section backgrounds, images, playing videos, text), so the refraction matches the page.
  // Only the patch around each visible object is painted; everything else stays black.
  const bgOf = el => { const c = getComputedStyle(el).backgroundColor; const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const v = m[1].split(',').map(parseFloat); return v.length > 3 && v[3] === 0 ? null : c; };
  const imgOf = el => { const cs = getComputedStyle(el), m = /url\(["']?([^"')]+)/.exec(cs.backgroundImage); if (!m) return null; let im = snapCache.get(m[1]); if (!im) { im = new Image(); im.src = m[1]; snapCache.set(m[1], im); } if (!im.complete || !im.naturalWidth) return null; const bp = cs.backgroundPosition.split(' '); let px = parseFloat(bp[0]) / 100, py = parseFloat(bp[1]) / 100; if (isNaN(px)) px = .5; if (isNaN(py)) py = .5; return { im, px, py, size: cs.backgroundSize }; };
  function drawCover(src, sw, sh, r, px, py, hr, size) {
    let sc = Math.max(r.width / sw, r.height / sh); if (size && /%$/.test(size) && size !== '100%') sc = r.width * parseFloat(size) / 100 / sw;
    const dw = sw * sc, dh = sh * sc, x = r.left - hr.left + (r.width - dw) * px, y = r.top - hr.top + (r.height - dh) * py;
    bx.save(); bx.beginPath(); bx.rect((r.left - hr.left) * BS, (r.top - hr.top) * BS, r.width * BS, r.height * BS); bx.clip();
    try { bx.drawImage(src, x * BS, y * BS, dw * BS, dh * BS); } catch (e) {}
    bx.restore();
  }
  function paintPage() {
    const hr = host.getBoundingClientRect(), R = sizePx * 1.6;
    objs.forEach(o => {
      if (o.off) return;
      const x0 = Math.max(0, o.p.x - R), y0 = Math.max(0, o.p.y - R), x1 = Math.min(W, o.p.x + R), y1 = Math.min(H, o.p.y + R);
      if (x1 <= x0 || y1 <= y0) return;
      // elements under the patch: sample a 3x3 grid of points and gather their ancestor chains, painted in document order
      const seen = new Set(), list = [];
      for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
        const px = x0 + (x1 - x0) * (gx + .5) / 3, py = y0 + (y1 - y0) * (gy + .5) / 3;
        let el = document.elementFromPoint(px, py);
        const chain = [];
        while (el && el !== document.documentElement) { if (el === host || host.contains(el) || el.classList.contains('cursor') || el.classList.contains('page-noise')) { el = el.parentElement; continue; } chain.unshift(el); el = el.parentElement; }
        chain.forEach(e => { if (!seen.has(e)) { seen.add(e); list.push(e); }
          // a stack of absolutely-positioned layers (crossfading images): hit-testing only returns the top one, so add its visible siblings too
          [...e.children].forEach(c => { if (seen.has(c) || c.tagName !== 'DIV' && c.tagName !== 'IMG' && c.tagName !== 'VIDEO') return; const cs = getComputedStyle(c); if (cs.position === 'absolute' && +cs.opacity > 0 && cs.visibility !== 'hidden') { seen.add(c); list.push(c); } });
        });
      }
      list.sort((p, q) => p === q ? 0 : (p.compareDocumentPosition(q) & 4) ? -1 : 1);   // document order: parents/earlier first
      bx.save(); bx.beginPath(); bx.rect(x0 * BS, y0 * BS, (x1 - x0) * BS, (y1 - y0) * BS); bx.clip();
      list.forEach(el => {
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return;
        const bg = bgOf(el); if (bg) { bx.fillStyle = bg; bx.fillRect((r.left - hr.left) * BS, (r.top - hr.top) * BS, r.width * BS, r.height * BS); }
        if (el.tagName === 'VIDEO' && el.readyState >= 2) { drawCover(el, el.videoWidth, el.videoHeight, r, .5, .5, hr); return; }
        if (el.tagName === 'IMG' && el.complete && el.naturalWidth) { bx.globalAlpha = +cs.opacity; try { bx.drawImage(el, (r.left - hr.left) * BS, (r.top - hr.top) * BS, r.width * BS, r.height * BS); } catch (e) {} bx.globalAlpha = 1; return; }
        const bi = imgOf(el); if (bi) { bx.globalAlpha = +cs.opacity; drawCover(bi.im, bi.im.naturalWidth, bi.im.naturalHeight, r, bi.px, bi.py, hr, bi.size); bx.globalAlpha = 1; }
        // text: direct text nodes only (children paint themselves)
        if (el.childNodes.length && !/^(SVG|CANVAS|VIDEO|IMG)$/.test(el.tagName)) {
          const col = cs.color, fs = parseFloat(cs.fontSize); if (fs < 9) return;
          bx.font = `${cs.fontStyle} ${cs.fontWeight} ${fs * BS}px ${cs.fontFamily}`; bx.fillStyle = col; bx.textBaseline = 'alphabetic'; bx.globalAlpha = +cs.opacity;
          const range = document.createRange();
          el.childNodes.forEach(n => {
            if (n.nodeType !== 3 || !n.textContent.trim()) return;
            range.selectNodeContents(n);
            [...range.getClientRects()].forEach(rr => { if (rr.bottom < y0 || rr.top > y1) return; const t = n.textContent.trim(); bx.save(); bx.beginPath(); bx.rect((rr.left - hr.left) * BS, (rr.top - hr.top) * BS, rr.width * BS, rr.height * BS); bx.clip(); bx.fillText(cs.textTransform === 'uppercase' ? t.toUpperCase() : t, (rr.left - hr.left) * BS, (rr.bottom - hr.top - rr.height * .22) * BS); bx.restore(); });
          });
          bx.globalAlpha = 1;
        }
      });
      bx.restore();
    });
  }
  function drawBackdrop() {
    const w = bc.width, h = bc.height;
    bx.fillStyle = '#000'; bx.fillRect(0, 0, w, h);
    if (videoOK !== false && video && video.readyState >= 2) {
      const hr = host.getBoundingClientRect(), vr = video.getBoundingClientRect(), vw = video.videoWidth, vh = video.videoHeight;
      const sc = Math.max(vr.width / vw, vr.height / vh), dw = vw * sc, dh = vh * sc;
      bx.drawImage(video, (vr.left - hr.left + (vr.width - dw) / 2) * BS, (vr.top - hr.top + (vr.height - dh) / 2) * BS, dw * BS, dh * BS);
      if (videoOK === null) {                           // one-off check that frames can be used (CORS)
        try { bx.getImageData(0, 0, 1, 1); videoOK = true; } catch (e) { videoOK = false; bx.fillStyle = '#000'; bx.fillRect(0, 0, w, h); }
      }
    }
    const veil = cfg.hero ? document.getElementById('heroFade') : null;   // the glass sees the same rise-from-black as the page
    if (veil) { const vo = +getComputedStyle(veil).opacity; if (vo > 0.002) { bx.globalAlpha = vo; bx.fillStyle = '#0a0a0a'; bx.fillRect(0, 0, w, h); bx.globalAlpha = 1; } }
    bx.fillStyle = shade; bx.fillRect(0, 0, w, h);
    if (!cfg.hero && !cfg.snap) {                     // finale: soft studio light-bars, only ever seen through the glass
      bx.save(); bx.globalAlpha = .8; bx.filter = `blur(${Math.round(w * .012)}px)`; bx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) { bx.save(); bx.translate(w * (i / 5), 0); bx.rotate(-0.5); bx.fillRect(-w * .012, -h, w * .024 * (1 + (i % 3)), h * 3); bx.restore(); }
      bx.restore(); bx.filter = 'none';
    }
    // page-wide instance: paint what's actually under the glass — the project images (or their playing loop)
    if (cfg.snap) paintPage();
    const sl = titleEl ? titleEl.style.getPropertyValue('--slide') : '';
    if (sl !== lastSlide) { lastSlide = sl; glyphsDirty = true; }
    if (glyphsDirty || performance.now() < introUntil) measureGlyphs();
    if (glyphs.length) {
      bx.font = glyphs.font; bx.fillStyle = '#fff'; bx.textBaseline = 'alphabetic';
      let fw = null;
      for (const g of glyphs) { if (g.o < 0.02) continue; if (g.w !== fw) { fw = g.w; bx.font = glyphs.font.replace(/ 700 /, ` ${fw} `); } bx.globalAlpha = g.o; bx.fillText(g.ch, g.x, g.y); }
      bx.globalAlpha = 1;
    }
    backTex.needsUpdate = true;
  }
  let shade = '#0000';
  function buildShade() {           // same darkening as .hero__shade, built once per resize
    if (!cfg.hero) { shade = '#0000'; return; }
    const g = bx.createLinearGradient(0, 0, 0, bc.height);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.28, 'rgba(0,0,0,0)'); g.addColorStop(.45, 'rgba(0,0,0,0)'); g.addColorStop(.86, 'rgba(10,10,10,.82)'); g.addColorStop(1, '#0a0a0a');
    shade = g;
  }

  // ---------- shapes (each normalised to ~2 units across)
  // smooth the rounded edges, but keep big flat faces perfectly flat (no shading streaks across them)
  const soften = g => {
    g = toCreasedNormals(g, Math.PI / 2.2);
    const pos = g.attributes.position, nor = g.attributes.normal, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      n.subVectors(b, a).cross(c.clone().sub(a)).normalize();
      if (Math.abs(n.z) > 0.9995) { const sz = Math.sign(nor.getZ(i) + nor.getZ(i + 1) + nor.getZ(i + 2)) || 1; for (let k = 0; k < 3; k++) nor.setXYZ(i + k, 0, 0, sz); }
    }
    nor.needsUpdate = true; return g;
  };
  const THIN = 0.5;   // overall thickness of the extruded icons
  const ext = (shape, depth = 0.5, bevel = 0.18) => {
    let g = new THREE.ExtrudeGeometry(shape, { depth: depth * THIN, bevelEnabled: true, bevelThickness: bevel * THIN, bevelSize: bevel * 0.7, bevelSegments: 12, curveSegments: 36 });
    g = soften(g);
    g.center(); return g;
  };
  const roundPoly = (pts, r) => {             // polygon with rounded corners
    const s = new THREE.Shape(), n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const a = new THREE.Vector2().subVectors(p0, p1).normalize(), b = new THREE.Vector2().subVectors(p2, p1).normalize();
      const q0 = p1.clone().addScaledVector(a, r), q1 = p1.clone().addScaledVector(b, r);
      i ? s.lineTo(q0.x, q0.y) : s.moveTo(q0.x, q0.y);
      s.quadraticCurveTo(p1.x, p1.y, q1.x, q1.y);
    }
    s.closePath(); return s;
  };
  const V = (x, y) => new THREE.Vector2(x, y);
  const fit = (g, size = 2) => { g.computeBoundingBox(); const b = g.boundingBox, m = Math.max(b.max.x - b.min.x, b.max.y - b.min.y); g.scale(size / m, size / m, size / m); g.center(); ['uv', 'uv1'].forEach(k => g.hasAttribute(k) && g.deleteAttribute(k)); return g; };

  // helpers for shapes with cut-outs and merged parts
  const circ = (x, y, r, cw = false) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, cw); return p; };
  const ell = (x, y, rx, ry) => { const p = new THREE.Path(); p.absellipse(x, y, rx, ry, 0, Math.PI * 2, true); return p; };
  const rrect = (x, y, w, h, r) => { const s = new THREE.Shape(); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const clean = g => { const n = g.index ? g.toNonIndexed() : g; Object.keys(n.attributes).forEach(k => k !== 'position' && k !== 'normal' && n.deleteAttribute(k)); n.morphAttributes = {}; n.clearGroups(); return n; };
  const merge = gs => fit(mergeGeometries(gs.map(clean)));

  // social set: generic icons (no platform trademarks), plus the cursor and asterisk
  const SHAPES = {
    heart: () => {
      const s = new THREE.Shape();
      s.moveTo(0, -0.95); s.bezierCurveTo(-0.2, -0.75, -1.1, -0.25, -1.1, 0.3); s.bezierCurveTo(-1.1, 0.85, -0.45, 1.05, 0, 0.55);
      s.bezierCurveTo(0.45, 1.05, 1.1, 0.85, 1.1, 0.3); s.bezierCurveTo(1.1, -0.25, 0.2, -0.75, 0, -0.95);
      return fit(ext(s, 0.55, 0.24));
    },
    smiley: () => {
      // thin glass disc with raised features: big eyes and a thick smile that catch the light
      const face = new THREE.Shape(); face.absarc(0, 0, 1, 0, Math.PI * 2, false);
      const disc = ext(face, 0.26, 0.2);
      const eye = x => { const g = new THREE.SphereGeometry(0.15, 40, 28); g.scale(0.85, 1.35, 0.6); g.translate(x, 0.3, 0.17); return g; };
      const arc = new THREE.EllipseCurve(0, 0.02, 0.56, 0.5, Math.PI * 1.17, Math.PI * 1.83, false);
      const smile = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc.getPoints(40).map(p => new THREE.Vector3(p.x, p.y, 0.17))), 80, 0.1, 24, false);
      const ends = [arc.getPoint(0), arc.getPoint(1)].map(p => new THREE.SphereGeometry(0.1, 24, 16).translate(p.x, p.y, 0.17));
      return merge([disc, eye(-0.36), eye(0.36), smile, ...ends]);
    },
    at: () => {
      const path = new THREE.CatmullRomCurve3([[0.42, 0.42], [0.42, -0.08], [0.56, -0.34], [0.86, -0.26], [1.02, 0.1], [0.94, 0.58], [0.55, 0.94], [0, 1.04], [-0.56, 0.88], [-0.96, 0.36], [-0.98, -0.3], [-0.62, -0.82], [0, -1.02], [0.5, -0.92]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
      const tail = new THREE.TubeGeometry(path, 160, 0.13, 18, false);
      const ring = new THREE.TorusGeometry(0.36, 0.13, 18, 64); ring.translate(0.04, 0.1, 0);
      const caps = [new THREE.SphereGeometry(0.13, 18, 12).translate(0.42, 0.42, 0), new THREE.SphereGeometry(0.13, 18, 12).translate(0.5, -0.92, 0)];
      return merge([tail, ring, ...caps]);
    },
    // every corner rounded; extrusions use a deep bevel so cross-sections are pillowy, not boxy
    cursor: () => fit(ext(roundPoly([V(0, 0), V(0, -1.55), V(0.38, -1.18), V(0.66, -1.78), V(0.92, -1.64), V(0.64, -1.06), V(1.12, -1.06)], 0.07), 0.38, 0.13)),
    hashtag: () => {
      const bar = (w, h, x, y, skew) => { const g = ext(roundPoly([V(-w / 2 + skew, h / 2), V(w / 2 + skew, h / 2), V(w / 2 - skew, -h / 2), V(-w / 2 - skew, -h / 2)], 0.13), 0.3, 0.16); g.translate(x, y, 0); return g; };
      return merge([bar(0.32, 2.1, -0.38, 0, 0.12), bar(0.32, 2.1, 0.42, 0, 0.12), bar(2.1, 0.32, 0.02, 0.4, 0), bar(2.1, 0.32, -0.02, -0.4, 0)]);
    },
    bubble: () => {
      const b = new THREE.Shape();
      b.moveTo(-0.75, -0.6); b.lineTo(-0.62, -0.6); b.quadraticCurveTo(-0.66, -0.82, -0.86, -1.0); b.quadraticCurveTo(-0.92, -1.06, -0.84, -1.04);
      b.quadraticCurveTo(-0.45, -0.94, -0.22, -0.6); b.lineTo(0.75, -0.6);
      b.quadraticCurveTo(1.15, -0.6, 1.15, -0.2); b.lineTo(1.15, 0.52); b.quadraticCurveTo(1.15, 0.92, 0.75, 0.92);
      b.lineTo(-0.75, 0.92); b.quadraticCurveTo(-1.15, 0.92, -1.15, 0.52); b.lineTo(-1.15, -0.2); b.quadraticCurveTo(-1.15, -0.6, -0.75, -0.6);
      [-0.5, 0, 0.5].forEach(x => b.holes.push(circ(x, 0.16, 0.13, true)));
      return fit(ext(b, 0.36, 0.22));
    },
    bell: () => {
      const prof = new THREE.SplineCurve([[0.001, 1.0], [0.16, 0.96], [0.4, 0.78], [0.58, 0.4], [0.64, -0.05], [0.74, -0.42], [0.96, -0.6], [1.02, -0.7], [0.95, -0.78], [0.001, -0.78]].map(([x, y]) => V(x, y)));
      const shell = new THREE.LatheGeometry(prof.getPoints(90), 96);
      const knob = new THREE.SphereGeometry(0.13, 32, 20); knob.translate(0, 1.04, 0);
      const clapper = new THREE.SphereGeometry(0.21, 40, 24); clapper.translate(0, -0.92, 0);
      return merge([shell, knob, clapper]);
    },
    bolt: () => fit(ext(roundPoly([V(0.38, 1.25), V(-0.72, -0.08), V(-0.06, -0.08), V(-0.36, -1.25), V(0.76, 0.18), V(0.1, 0.18)], 0.2), 0.36, 0.26)),
    plane: () => {
      // folded paper plane: two wings with a dihedral and a centre keel, each a thin panel with soft edges
      const panel = (A, B, C, t = 0.05) => {
        A = new THREE.Vector3(...A); B = new THREE.Vector3(...B); C = new THREE.Vector3(...C);
        const u = B.clone().sub(A).normalize(), n = new THREE.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A)).normalize(), v = new THREE.Vector3().crossVectors(n, u);
        const b2 = V(B.clone().sub(A).dot(u), 0), c2 = V(C.clone().sub(A).dot(u), C.clone().sub(A).dot(v));
        const g = new THREE.ExtrudeGeometry(roundPoly([V(0, 0), b2, c2], 0.06), { depth: t, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 6, curveSegments: 16 });
        g.translate(0, 0, -t / 2); soften(g);
        g.applyMatrix4(new THREE.Matrix4().makeBasis(u, v, n).setPosition(A));
        return g;
      };
      const N = [1.15, 0, 0], T = [-0.95, 0.02, 0];
      return merge([
        panel(N, [-1.05, 0.22, -0.95], T),
        panel(N, T, [-1.05, 0.22, 0.95]),
        panel(N, [-0.9, -0.42, -0.06], T, 0.04),
        panel(N, T, [-0.9, -0.42, 0.06], 0.04)
      ]);
    },
    rocket: () => {
      // sleek: slim tapered body, three swept fins, small porthole
      const prof = new THREE.SplineCurve([[0.001, 1.3], [0.12, 1.12], [0.24, 0.7], [0.28, 0.1], [0.25, -0.55], [0.17, -0.82], [0.001, -0.86]].map(([x, y]) => V(x, y)));
      const body = new THREE.LatheGeometry(prof.getPoints(100), 80);
      const port = new THREE.SphereGeometry(0.09, 28, 18); port.scale(1, 1, 0.55); port.translate(0, 0.45, 0.25);
      const fin = new THREE.Shape(); fin.moveTo(0, 0.05); fin.quadraticCurveTo(0.22, -0.2, 0.34, -0.72); fin.quadraticCurveTo(0.36, -0.82, 0.26, -0.78); fin.quadraticCurveTo(0.12, -0.7, 0, -0.62); fin.lineTo(0, 0.05);
      const fins = [0, 1, 2].map(i => { const f = new THREE.ExtrudeGeometry(fin, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 8, curveSegments: 24 }); soften(f); f.translate(0.2, -0.2, -0.015); f.rotateY(i * Math.PI * 2 / 3 + Math.PI / 2); return f; });
      return merge([body, port, ...fins]);
    },
    asterisk: () => {
      const parts = [];
      for (let i = 0; i < 3; i++) { const c = new THREE.CapsuleGeometry(0.17, 1.6, 8, 18); c.rotateZ(i * Math.PI / 3); parts.push(c); }
      return merge(parts);
    },
  };

  // ---------- pick 3-5 at random, every visit
  const keys = Object.keys(SHAPES).sort(() => Math.random() - 0.5);
  const showAll = location.hash === '#glass-all';            // preview every icon: add #glass-all to the URL
  const count = cfg.count || (showAll ? Object.keys(SHAPES).length : small() ? 3 : 3 + Math.floor(Math.random() * 3));
  // anchor slots (viewport fractions) spread around and in front of the headline
  // anchor slots (viewport fractions): two-plus always sit in front of the headline, the rest float above it
  // start clustered over the headline: random spots in the central zone of the hero, spaced so they don't overlap
  const heroLeft = document.documentElement.classList.contains('hero-left');
  const TEXTZONE = small() ? { x0: 0.15, x1: 0.6, y0: 0.52, y1: 0.66 } : { x0: 0.06, x1: 0.3, y0: 0.5, y1: 0.68 };
  const ZONE = heroLeft     // headline is bottom-left: scatter them anywhere across the frame
    ? (small() ? { x0: 0.12, x1: 0.88, y0: 0.18, y1: 0.5 } : { x0: 0.08, x1: 0.92, y0: 0.2, y1: 0.68 })
    : small() ? { x0: 0.18, x1: 0.82, y0: 0.24, y1: 0.58 } : { x0: 0.26, x1: 0.74, y0: 0.24, y1: 0.7 };
  const aspect = (host.clientWidth || innerWidth) / (host.clientHeight || innerHeight);
  const SLOTS = [];
  for (let tries = 0; SLOTS.length < Math.max(5, count) && tries < 400; tries++) {
    // left-aligned headline: the first one always sits over the text (bottom left), the rest scatter across the frame
    const Z = cfg.zones ? cfg.zones[SLOTS.length % cfg.zones.length] : (heroLeft && !SLOTS.length ? TEXTZONE : ZONE);
    const p = [Z.x0 + Math.random() * (Z.x1 - Z.x0), Z.y0 + Math.random() * (Z.y1 - Z.y0)];
    const minD = heroLeft && !cfg.zones ? (tries < 250 ? 0.3 : 0.2) : (tries < 250 ? 0.2 : 0.14);   // spread wide; relax if crowded
    if (cfg.page || SLOTS.every(q => Math.hypot((p[0] - q[0]) * aspect, p[1] - q[1]) > minD)) SLOTS.push(p);
  }
  while (SLOTS.length < Math.max(5, count)) { const Z = cfg.zones ? cfg.zones[SLOTS.length % cfg.zones.length] : { x0: .3, x1: .7, y0: .3, y1: .65 }; SLOTS.push([Z.x0 + Math.random() * (Z.x1 - Z.x0), Z.y0 + Math.random() * (Z.y1 - Z.y0)]); }
  if (showAll && cfg.hero) { SLOTS.length = 0; Object.keys(SHAPES).forEach((k, i) => SLOTS.push([0.08 + (i % 7) * 0.14, i < 7 ? 0.28 : 0.64])); keys.sort(); }
  const objs = [];
  for (let i = 0; i < count; i++) {
    const name = keys[i];
    const mesh = new THREE.Mesh(SHAPES[name](), glass());
    const g = new THREE.Group(); g.add(mesh); scene.add(g);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - .5) * 0.9, (Math.random() - .5) * 1.2, (Math.random() - .5) * 0.8));
    mesh.quaternion.copy(q);
    objs.push({
      name, g, mesh, slot: SLOTS[i], depth: 0.6 + Math.random() * 0.8, phase: Math.random() * 6.28,
      scale: 0.9 + Math.random() * 0.3,
      spin: new THREE.Vector3((Math.random() - .5) * 0.2, (Math.random() > .5 ? 1 : -1) * (0.25 + Math.random() * 0.2), 0).multiplyScalar(MOB ? 0.5 : 1), // idle rad/s (gentler on phones)
      av: new THREE.Vector3(),      // angular velocity from interaction (rad/s)
      pop: 0, hover: 0, p: { x: 0, y: 0 }, v: { x: 0, y: 0 }, home: { x: 0, y: 0 }, placed: false
    });
  }

  // ---------- sizing: world units per pixel at z = 0
  let W = 1, H = 1, unit = 1, sizePx = 120, pvx = 0, pvy = 0, ppx = 0, ppy = 0;
  function resize() {
    W = host.clientWidth || innerWidth; H = host.clientHeight || innerHeight;
    renderer.setSize(W, H, false); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    unit = viewH / H;
    const zB = -3, dist = camera.position.z - zB, bh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    back.position.set(0, 0, zB); back.scale.set(bh * camera.aspect, bh, 1);
    bc.width = Math.max(2, Math.round(W * BS)); bc.height = Math.max(2, Math.round(H * BS)); metrics = null; glyphsDirty = true; buildShade();
    const px = Math.min(Math.max(H * 0.15, 90), 190) * (small() ? 0.8 : 1);   // object size in px
    sizePx = px;
    objs.forEach(o => {
      if (cfg.page) { const D = Math.max(document.documentElement.scrollHeight, H * 2); o.home = { x: o.slot[0] * W, y: o.slot[1] * D }; o.p = { x: o.home.x, y: o.home.y - scrollY }; o.placed = true; }
      else { o.home = { x: o.slot[0] * W, y: o.slot[1] * H }; if (!o.placed) { o.p = { ...o.home }; o.placed = true; } }
      o.g.scale.setScalar(px * unit / 2 * o.scale);
    });
  }
  resize(); addEventListener('resize', resize); if (cfg.page) addEventListener('load', () => setTimeout(resize, 300), { once: true });

  // ---------- pointer interaction
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pointer = { x: W / 2, y: H / 2, in: false };
  let drag = null, lastX = 0, lastY = 0, lastT = 0, moved = 0;
  const local = e => { const r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const pick = (x, y) => {
    ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(objs.map(o => o.mesh), false)[0];
    return hit ? objs.find(o => o.mesh === hit.object) : null;
  };
  hero.addEventListener('pointermove', e => {
    const p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.in = true;
    if (drag) {
      const now = performance.now(), dt = Math.max(8, now - lastT) / 1000;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; moved += Math.hypot(dx, dy);
      // trackball: horizontal drag spins about Y, vertical about X
      drag.av.set(dy * 0.012 / dt * 0.6, dx * 0.012 / dt * 0.6, 0);
      const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.012);
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.012);
      drag.mesh.quaternion.premultiply(qy).premultiply(qx);
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    } else {
      const o = pick(p.x, p.y);
      objs.forEach(x => x.hovered = x === o);
      hero.style.cursor = o ? 'grab' : '';
      document.querySelector('.cursor')?.classList.toggle('is-grab', !!o);
    }
  });
  hero.addEventListener('pointerleave', () => { pointer.in = false; objs.forEach(x => x.hovered = false); });
  hero.addEventListener('pointerdown', e => {
    if (e.target.closest('a,button')) return;
    const p = local(e), o = pick(p.x, p.y);
    if (!o) return;
    e.preventDefault(); hero.setPointerCapture?.(e.pointerId);
    drag = o; moved = 0; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    o.av.set(0, 0, 0); hero.style.cursor = 'grabbing';
  });
  const release = () => {
    if (!drag) return;
    if (moved < 5) { drag.pop = 1; drag.av.set((Math.random() - .5) * 4, (Math.random() > .5 ? 1 : -1) * 14, 0); }   // click: quick spin
    drag = null; hero.style.cursor = '';
  };
  hero.addEventListener('pointerup', release); hero.addEventListener('pointercancel', release);

  // ---------- loop (only while the hero is visible)
  let visible = true, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(tick); } }).observe(hero);
  const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), axis = new THREE.Vector3();
  let lastInput = 0, lastDraw = 0, lastBack = 0, warmDone = false;
  let lastSY = scrollY;
  if (cfg.hero) addEventListener('drvn:glass-ready', () => { warmDone = true; }, { once: true });
  addEventListener('pointermove', () => { lastInput = performance.now(); }, { passive: true });
  addEventListener('scroll', () => { lastInput = performance.now(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) { last = performance.now(); requestAnimationFrame(tick); } });
  function tick(now) {
    if (!visible || document.hidden) return;
    if (warmDone && document.documentElement.classList.contains('intro-1')) { requestAnimationFrame(tick); return; }
    const active = drag || now - lastInput < 1500 || glyphsDirty;
    if ((!active || MOB) && now - lastDraw < 32) { requestAnimationFrame(tick); return; }   // idle: ~30fps is plenty for a slow float; phones always cap at 30 so scrolling stays smooth
    lastDraw = now;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
    const nx = pointer.x / W - 0.5, ny = pointer.y / H - 0.5;
    // cursor velocity (px/s), smoothed
    pvx += ((pointer.x - ppx) / Math.max(dt, 1e-3) - pvx) * 0.25; pvy += ((pointer.y - ppy) / Math.max(dt, 1e-3) - pvy) * 0.25; ppx = pointer.x; ppy = pointer.y;
    const top = 90, pad = sizePx * 0.55, rise = cfg.rise ? cfg.rise() : 0;
    // page-wide instance: the objects drift against the scroll (deeper ones move more), then ease back toward home
    if (cfg.scroll) { const sy = scrollY, dy = sy - lastSY; lastSY = sy; if (dy) objs.forEach(o => { o.p.y -= dy * cfg.scroll * o.depth; }); }
    // page mode: each object is anchored to a spot on the document, so it scrolls past like the rest of the page
    // (a touch of parallax from depth), and is skipped entirely while off screen
    if (cfg.page) { const sy = scrollY; objs.forEach(o => { const ay = o.home.y - sy * (0.85 + o.depth * 0.12); o.p.y += (ay + (o.drift || 0) - o.p.y) * 0.5; o.off = o.p.y < -sizePx * 2 || o.p.y > H + sizePx * 2; }); }
    objs.forEach(o => {
      // ---- flee: push away from the cursor, harder when it's coming at them
      let fx = 0, fy = 0;
      if (pointer.in && !drag) {
        const dx = o.p.x - pointer.x, dy = o.p.y - pointer.y, d = Math.hypot(dx, dy) || 1, R = sizePx * 2.1;
        if (d < R) {
          const fall = Math.pow(1 - d / R, 2), toward = Math.max(0, -(pvx * dx + pvy * dy) / d);   // cursor speed toward this object
          const f = fall * (2600 + toward * 9); o.moved = true;
          fx += dx / d * f; fy += dy / d * f;
        }
      }
      // ---- keep a little space from each other
      objs.forEach(q => { if (q === o) return; const dx = o.p.x - q.p.x, dy = o.p.y - q.p.y, d = Math.hypot(dx, dy) || 1, m = sizePx * 1.05; if (d < m) { const f = (1 - d / m) * 1800; fx += dx / d * f; fy += dy / d * f; } });
      // ---- soft walls inside the hero, and a very weak pull home so they settle somewhere sensible
      if (o.p.x < pad) fx += (pad - o.p.x) * 30; if (o.p.x > W - pad) fx -= (o.p.x - (W - pad)) * 30;
      if (!cfg.page) { if (o.p.y < top + pad) fy += (top + pad - o.p.y) * 30; const floorY = cfg.floor ? H * cfg.floor : H - pad - 60; if (o.p.y > floorY) fy -= (o.p.y - floorY) * 30; }   // finale: keep clear of the footer
      if (cfg.page) { fx += (o.home.x - o.p.x) * 0.6; o.drift = (o.drift || 0) + fy * dt * 0.02; o.drift *= Math.exp(-1.5 * dt); fy = 0; }
      else if (!o.moved) { fx += (o.home.x - o.p.x) * 0.35; fy += (o.home.y - o.p.y) * 0.35; }
      // ---- integrate with damping (a glide, not a snap)
      o.v.x = (o.v.x + fx * dt) * Math.exp(-1.8 * dt); o.v.y = (o.v.y + fy * dt) * Math.exp(-1.8 * dt);
      const sp = Math.hypot(o.v.x, o.v.y), max = 1400; if (sp > max) { o.v.x *= max / sp; o.v.y *= max / sp; }
      if (o !== drag) { o.p.x += o.v.x * dt; o.p.y += o.v.y * dt; }
      // being shoved makes them tumble: spin axis perpendicular to the push
      if (o !== drag && (fx || fy)) { o.av.x += fy * 0.0016 * dt * 60 / 60; o.av.y += fx * 0.0016 * dt * 60 / 60; }
      // ---- finale: scroll-linked rise into place; physics only takes over once they've arrived
      if (rise > 0.002) { o.p.x = o.home.x; o.p.y = o.home.y + rise * H; o.v.x = o.v.y = 0; o.moved = false; }
      // ---- float + slight parallax, then place in 3D
      const bob = reduce ? 0 : Math.sin(t * 0.9 + o.phase) * 10;
      o.g.visible = !o.off;
      o.g.position.set((o.p.x - W / 2 - nx * 30 * o.depth) * unit, (H / 2 - o.p.y - bob + ny * 20 * o.depth) * unit, o.depth);
      // whole object leans toward the cursor
      tmpE.set(ny * 0.5 * o.depth, nx * 0.7 * o.depth, 0); tmpQ.setFromEuler(tmpE); o.g.quaternion.slerp(tmpQ, 0.06);
      // spin: idle + interaction inertia
      if (o !== drag) {
        o.av.multiplyScalar(Math.pow(0.2, dt)); if (o.av.length() > 9) o.av.setLength(9);                    // inertia decays over ~1s
        const sp = reduce ? 0 : 1;
        const w = new THREE.Vector3().copy(o.spin).multiplyScalar(sp).add(o.av);
        const ang = w.length() * dt;
        if (ang > 1e-5) { axis.copy(w).normalize(); tmpQ.setFromAxisAngle(axis, ang); o.mesh.quaternion.premultiply(tmpQ); }
      }
      // hover/pop scale
      o.hover += ((o.hovered || o === drag ? 1 : 0) - o.hover) * 0.15;
      o.pop *= Math.pow(0.02, dt);
      o.mesh.scale.setScalar(1 + o.hover * 0.08 + Math.sin(o.pop * Math.PI) * 0.18);
    });
    // phones repaint the page backdrop at ~12fps (it is the expensive part); desktop every frame
    try { if (!MOB || now - lastBack > 80 || drag) { drawBackdrop(); lastBack = now; } renderer.render(scene, camera); } catch (e) { host.dataset.g3dError = 'frame: ' + e.message; return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  if (!cfg.hero) { host.dataset.g3d = objs.map(o => o.name).join(','); renderer.compile(scene, camera); return; }
  window.__glass3d = { objs: objs.map(o => o.name), renderer };
  host.dataset.g3d = objs.map(o => o.name).join(',');
  // tell the opening sequence the heavy lifting (shader compile) is done
  renderer.compile(scene, camera);
  // ready once a few real frames (incl. the transmission pass) have rendered
  let warm = 0; const warmUp = () => { if (++warm < 4) requestAnimationFrame(warmUp); else dispatchEvent(new Event('drvn:glass-ready')); }; requestAnimationFrame(warmUp);
  bakeGems();
  let frames = 0; const fc = () => { frames++; host.dataset.g3dFrames = frames; if (frames < 600) requestAnimationFrame(fc); }; requestAnimationFrame(fc);

  /* ---------- GLASS EMOJIS for the rest of the site
     Each icon is rendered once, after the opening sequence, into a short "wobble" filmstrip
     (24 frames of a gentle turn back and forth). The page then plays those strips with CSS
     (steps()), so every emoji below the hero is real glass but costs nothing to animate. */
  function bakeGems() {
    const BIG = new Set((document.documentElement.dataset.gemBig || '').split(',').filter(Boolean));
    const F = 24, mob = innerWidth < 760;
    const sizeFor = n => BIG.has(n) ? (mob ? 220 : 300) : (mob ? 120 : 160);
    let r2;
    const start = () => {
      try {
        r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      } catch (e) { document.documentElement.classList.add('gem-fail'); return; }
      r2.setPixelRatio(1);
      if ('transmissionResolutionScale' in r2) r2.transmissionResolutionScale = 1;
      r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = THREE.ACESFilmicToneMapping; r2.toneMappingExposure = 1.05;
      r2.setClearColor(0x000000, 0);
      const sc = new THREE.Scene(); sc.environment = makeEnv(r2);
      const k2 = new THREE.DirectionalLight(0xffffff, 1.6); k2.position.set(3, 5, 6); sc.add(k2);
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0, 9);
      // what the glass bends: a soft studio card (dark, with a few bright light-bars), transmission pass only
      const bcv = document.createElement('canvas'); bcv.width = bcv.height = 256; const g2 = bcv.getContext('2d');
      // studio card: deep grey with hard-ish white softbox bars, so the glass shows bright, moving refractions
      const gr = g2.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#6a6f7c'); gr.addColorStop(.5, '#2b2e36'); gr.addColorStop(1, '#585c68');
      g2.fillStyle = gr; g2.fillRect(0, 0, 256, 256);
      const bar = (x, y, w, h, rot, a, blur) => { g2.save(); g2.translate(x, y); g2.rotate(rot); g2.filter = `blur(${blur}px)`; g2.fillStyle = `rgba(255,255,255,${a})`; g2.beginPath(); g2.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2); g2.fill(); g2.restore(); };
      bar(128, 70, 420, 26, -0.5, 1, 4);           // diagonal softbox streaks that cross behind the icon
      bar(128, 150, 420, 12, -0.5, .9, 2);
      bar(150, 205, 420, 30, -0.5, .55, 8);
      bar(60, 128, 16, 300, 0.05, .7, 3);          // vertical edge light
      bar(200, 128, 10, 300, -0.05, .6, 2);
      g2.filter = 'none';
      const bt = new THREE.CanvasTexture(bcv); bt.colorSpace = THREE.SRGBColorSpace;
      const bm = new THREE.MeshBasicMaterial({ map: bt, toneMapped: false, depthWrite: false });
      const bk = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), bm); bk.position.z = -3; bk.renderOrder = -10;
      const dbg = /gemdbg/.test(location.hash);
      bk.onBeforeRender = r => { bm.colorWrite = dbg || r.getRenderTarget() !== null; };
      sc.add(bk);
      const only = ((location.hash.match(/gems=([\w,]+)/) || [])[1] || '').split(',').filter(Boolean);   // #gems=heart,rocket bakes only those (testing)
      const names = only.filter(n => SHAPES[n]).length ? only.filter(n => SHAPES[n]) : Object.keys(SHAPES), jobs = [];
      names.forEach(n => jobs.push(n));
      const out = {};
      let cur = null, i = 0;
      const step = () => {
        if (document.hidden) { setTimeout(step, 200); return; }
        const t0 = performance.now();
        while (performance.now() - t0 < 7) {               // a few frames per tick, never long enough to jank
          if (!cur) {
            if (!jobs.length) { finish(); return; }
            const n = jobs.shift(), S = sizeFor(n);
            r2.setSize(S, S, false);
            const mat = glass(); mat.roughness = 0.06; mat.thickness = 1.4;
            const mesh = new THREE.Mesh(SHAPES[n](), mat);
            const grp = new THREE.Group(); grp.add(mesh); sc.add(grp);
            grp.scale.setScalar(1.55);
            const strip = document.createElement('canvas'); strip.width = S * F; strip.height = S;
            cur = { n, S, mesh, grp, strip, ctx: strip.getContext('2d') }; i = 0;
          }
          // ease back and forth: frame k sits at -cos(pi k / (F-1)) of the swing
          const u = -Math.cos(Math.PI * i / (F - 1));
          cur.mesh.rotation.set(0.12 + u * 0.1, u * 0.62, u * -0.05);
          r2.render(sc, cam);
          cur.ctx.drawImage(r2.domElement, i * cur.S, 0);
          if (++i >= F) {
            const c = cur; cur = null; sc.remove(c.grp); c.mesh.geometry.dispose(); c.mesh.material.dispose();
            out[c.n] = c.strip;
          }
        }
        setTimeout(step, 16);
      };
      const finish = () => {
        const root = document.documentElement, ns = Object.keys(out); let left = ns.length;
        ns.forEach(n => out[n].toBlob(b => {
          if (b) root.style.setProperty('--gem-' + n, `url(${URL.createObjectURL(b)})`);
          if (--left === 0) { root.classList.add('gem-ready'); dispatchEvent(new Event('drvn:gems')); try { r2.dispose(); r2.forceContextLoss(); } catch (e) {} }
        }, 'image/webp', 0.92));
      };
      step();
    };
    // bake once the opening sequence is over, so it never competes with it
    // and after the header video has finished, so the bake never steals frames from it
    let fired = false;
    const go = () => {
      const v = document.getElementById('heroVideo');
      const run = () => { if (fired) return; fired = true; (window.requestIdleCallback || setTimeout)(start, { timeout: 1500 }); };
      if (!v || v.ended || matchMedia('(prefers-reduced-motion: reduce)').matches) return run();
      v.addEventListener('ended', () => setTimeout(run, 400), { once: true });
      setTimeout(run, 15000);
    };
    const root = document.documentElement;
    if (!root.classList.contains('intro') || root.classList.contains('intro-4')) setTimeout(go, 600);
    else { const mo = new MutationObserver(() => { if (root.classList.contains('intro-4') || !root.classList.contains('intro')) { mo.disconnect(); setTimeout(go, 1600); } }); mo.observe(root, { attributes: true, attributeFilter: ['class'] }); }
  }
}

// ---------- inner pages: the closing CTA gets its own glass emojis that rise up from the bottom
// of the page as "Let's make some noise" arrives, then float around the button (same idea as the homepage finale)
const ctaHost = document.getElementById('pfootGlass'), ctaSec = ctaHost && ctaHost.closest('.pfoot');
if (ctaHost && ctaSec && window.WebGLRenderingContext && innerWidth >= 760) {   // phones skip the CTA instance: a third WebGL scene is what made the footer stutter
  let started = false;
  const smooth = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const start = () => {
    if (started) return; started = true;
    try {
      init({
        host: ctaHost, area: ctaSec, hero: false, titleSel: '.pfoot .glow-title .ch', titleEl: null, video: null, snap: true,
        floor: innerWidth < 760 ? .55 : .62,
        zones: innerWidth < 760 ? [{ x0: .06, x1: .3, y0: .08, y1: .22 }, { x0: .7, x1: .94, y0: .08, y1: .22 }]
                                : [{ x0: .06, x1: .18, y0: .1, y1: .45 }, { x0: .82, x1: .94, y0: .1, y1: .45 }, { x0: .6, x1: .72, y0: .04, y1: .14 }],
        count: innerWidth < 760 ? 2 : 3,
        rise: () => {                                   // below the fold → in place as the title lands
          const r = ctaSec.getBoundingClientRect(), p = (innerHeight - r.top) / Math.max(1, Math.min(r.height, innerHeight) * 0.9);
          return (1 - smooth((p - .2) / .55)) * 1.1;
        }
      });
      ctaHost.classList.add('is-on');
    } catch (e) { ctaHost.dataset.g3dError = e.message; console.error('glass3d cta', e); }
  };
  new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { rootMargin: '120% 0px' }).observe(ctaSec);
}

// ---------- inner pages: a few glass objects live over the whole page (fixed to the viewport),
// fleeing the cursor like the homepage and drifting with the scroll
const pageHost = document.getElementById('pageGlass');
if (pageHost && window.WebGLRenderingContext) {
  const small = innerWidth < 760;
  try {
    init({
      host: pageHost, area: document.body, hero: false, titleSel: '.__none', titleEl: null, video: null, snap: true,
      count: small ? 3 : 8, page: true,
      zones: Array.from({ length: small ? 3 : 8 }, (_, i) => { const n = small ? 3 : 8; return { x0: i % 2 ? .7 : .04, x1: i % 2 ? .96 : .3, y0: (i + .15) / n, y1: (i + .85) / n }; })
    });
    pageHost.classList.add('is-on');
  } catch (e) { pageHost.dataset.g3dError = e.message; console.error('glass3d page', e); }
}
