(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => c ? [...c.querySelectorAll(s)] : [];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  let uid = 0;
  const fmtN = (v, dec) => dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-GB');   // 6000 -> 6,000

  /* ---------------------------------------------------------
     EMOJI LIBRARY — custom glossy "sticker" emojis (SVG)
     --------------------------------------------------------- */
  const gloss = (cx, cy, rx, ry, r = -30, o = .55) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${cx} ${cy})" fill="#fff" opacity="${o}"/>`;

  const EMOJI = {
    fire: (i) => `<svg viewBox="0 0 100 100"><defs>
      <linearGradient id="f1${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E8290B"/><stop offset=".55" stop-color="#FF7A00"/><stop offset="1" stop-color="#FFC93C"/></linearGradient>
      <linearGradient id="f2${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF9F1C"/><stop offset="1" stop-color="#FFF3B0"/></linearGradient></defs>
      <path d="M50 3C57 22 75 30 79 52C83 77 68 97 50 97C29 97 15 82 17 60C19 44 30 37 32 22C40 31 43 39 43 46C49 33 53 19 50 3Z" fill="url(#f1${i})"/>
      <path d="M50 50C57 60 65 66 65 78C65 89 58 95 50 95C41 95 35 88 35 79C35 70 42 66 44 57C47 61 48 63 48 66C50 60 52 56 50 50Z" fill="url(#f2${i})"/>
      ${gloss(36, 56, 4, 13, 18, .4)}</svg>`,

    heart: (i) => `<svg viewBox="0 0 100 100"><defs>
      <radialGradient id="h1${i}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF8AA0"/><stop offset=".5" stop-color="#F0203F"/><stop offset="1" stop-color="#A3082A"/></radialGradient></defs>
      <path d="M50 90C19 69 5 53 5 34C5 19 16 9 30 9C39 9 46 14 50 21C54 14 61 9 70 9C84 9 95 19 95 34C95 53 81 69 50 90Z" fill="url(#h1${i})"/>
      ${gloss(29, 27, 13, 7, -35, .6)}${gloss(80, 30, 3, 5, 20, .35)}</svg>`,

    shades: (i) => `<svg viewBox="0 0 100 100"><defs>
      <radialGradient id="s1${i}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#FFE98A"/><stop offset=".6" stop-color="#FFC21A"/><stop offset="1" stop-color="#F08C00"/></radialGradient>
      <linearGradient id="s2${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#333"/><stop offset="1" stop-color="#000"/></linearGradient></defs>
      <circle cx="50" cy="50" r="46" fill="url(#s1${i})"/>
      ${gloss(33, 22, 16, 8, -25, .55)}
      <path d="M12 37H88V43C86 43 85 44 84.5 46L82 56C80.5 63 75 66 68 66H64C57 66 52.5 62 51.5 55L50.8 50H49.2L48.5 55C47.5 62 43 66 36 66H32C25 66 19.5 63 18 56L15.5 46C15 44 14 43 12 43Z" fill="url(#s2${i})"/>
      <path d="M24 44L30 44M60 44L66 44" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      <path d="M33 75Q50 86 67 75" stroke="#7A3E00" stroke-width="4.5" stroke-linecap="round" fill="none"/></svg>`,

    eyes: (i) => `<svg viewBox="0 0 100 100"><defs>
      <radialGradient id="e1${i}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#F1F1F1"/><stop offset="1" stop-color="#C9C9C9"/></radialGradient></defs>
      <ellipse cx="29" cy="50" rx="21" ry="31" fill="url(#e1${i})" stroke="#1a1a1a" stroke-width="2.5"/>
      <ellipse cx="71" cy="50" rx="21" ry="31" fill="url(#e1${i})" stroke="#1a1a1a" stroke-width="2.5"/>
      <g class="pupil" data-cx="29" data-cy="56"><circle cx="29" cy="56" r="10" fill="#111"/><circle cx="32" cy="52" r="3.2" fill="#fff"/></g>
      <g class="pupil" data-cx="71" data-cy="56"><circle cx="71" cy="56" r="10" fill="#111"/><circle cx="74" cy="52" r="3.2" fill="#fff"/></g></svg>`,

    hundred: (i) => `<svg viewBox="0 0 100 100"><defs>
      <linearGradient id="c1${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A5A"/><stop offset="1" stop-color="#C8102E"/></linearGradient></defs>
      <text x="50" y="60" text-anchor="middle" font-family="N27, Arial Black, Arial" font-weight="700" font-style="italic" font-size="52" letter-spacing="-2" fill="url(#c1${i})">100</text>
      <path d="M12 71Q50 64 90 69" stroke="url(#c1${i})" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M16 83Q50 77 86 81" stroke="url(#c1${i})" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`,

    rocket: (i) => `<svg viewBox="0 0 100 100"><defs>
      <linearGradient id="r1${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#BFC5CF"/></linearGradient>
      <linearGradient id="r2${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A5A"/><stop offset="1" stop-color="#C8102E"/></linearGradient>
      <linearGradient id="r3${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FF6A00"/></linearGradient></defs>
      <g transform="rotate(40 50 50)">
      <path d="M41 66Q50 102 59 66Z" fill="url(#r3${i})"/>
      <path d="M35 50L20 71L35 67Z M65 50L80 71L65 67Z" fill="url(#r2${i})"/>
      <path d="M50 6C65 19 69 40 66 66H34C31 40 35 19 50 6Z" fill="url(#r1${i})"/>
      <path d="M50 6C58 13 62 21 64 29H36C38 21 42 13 50 6Z" fill="url(#r2${i})"/>
      <circle cx="50" cy="44" r="9" fill="#2E7BFF" stroke="#fff" stroke-width="3.5"/>${gloss(47, 41, 3, 2, -30, .7)}
      </g></svg>`,

    play: (i) => `<svg viewBox="0 0 100 100"><defs>
      <linearGradient id="p1${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9B6BFF"/><stop offset="1" stop-color="#FF4FA3"/></linearGradient></defs>
      <rect x="6" y="14" width="88" height="72" rx="24" fill="url(#p1${i})"/>
      <path d="M20 22H80Q88 22 88 30" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".45"/>
      <path d="M41 33L67 50L41 67Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>`,

    bolt: (i) => `<svg viewBox="0 0 100 100"><defs>
      <linearGradient id="b1${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF07A"/><stop offset="1" stop-color="#FFAE00"/></linearGradient></defs>
      <path d="M60 4L18 56H46L38 96L82 40H54L64 4Z" fill="url(#b1${i})" stroke="#E08A00" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M56 12L30 48" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></svg>`,

    chart: (i) => `<svg viewBox="0 0 100 100"><defs>
      <linearGradient id="g1${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4BEA8A"/><stop offset="1" stop-color="#0A9F50"/></linearGradient></defs>
      <rect x="8" y="8" width="84" height="84" rx="24" fill="url(#g1${i})"/>
      <path d="M22 18H74Q84 18 84 28" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".4"/>
      <polyline points="22,70 40,52 54,61 77,35" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M62 33H79V50" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

    clapper: (i) => `<svg viewBox="0 0 100 100"><defs>
      <linearGradient id="k1${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#0d0d0d"/></linearGradient></defs>
      <rect x="10" y="40" width="80" height="50" rx="8" fill="url(#k1${i})"/>
      <rect x="10" y="40" width="80" height="13" fill="#fff"/>
      <path d="M18 40L28 53H38L28 40Z M42 40L52 53H62L52 40Z M66 40L76 53H86L76 40Z" fill="#111"/>
      <g transform="rotate(-16 12 38)"><rect x="10" y="22" width="80" height="14" rx="3" fill="#fff"/>
      <path d="M16 22L26 36H36L26 22Z M40 22L50 36H60L50 22Z M64 22L74 36H84L74 22Z" fill="#111"/></g>
      <path d="M20 64H60M20 74H48" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/></svg>`
  };
  const KEYS = Object.keys(EMOJI);
  const emoji = (name) => EMOJI[name](++uid);

  // hydrate all emoji placeholders
  $$('[data-emoji]').forEach(el => { el.innerHTML = emoji(el.dataset.emoji); });

  // GLASS EMOJIS: the 3D glass icons, baked by glass3d.js into wobbling filmstrips and played with CSS.
  // Until they're ready they stay hidden; if WebGL isn't available the old flat stickers show instead.
  const GEM_FALLBACK = { heart: 'heart', smiley: 'eyes', bolt: 'bolt', bubble: 'heart', rocket: 'rocket', asterisk: 'fire', cursor: 'play', at: 'hundred', hashtag: 'hundred', bell: 'fire', plane: 'rocket' };
  const GEMS = Object.keys(GEM_FALLBACK);
  const gem = (name) => `<i class="gem" style="--g:var(--gem-${name});animation-delay:${(-Math.random() * 3).toFixed(2)}s"><span class="gem__fb">${emoji(GEM_FALLBACK[name] || 'heart')}</span></i>`;
  $$('[data-gem]').forEach(el => { el.innerHTML = gem(el.dataset.gem); });

  /* ---------------------------------------------------------
     SPLIT TEXT (letters)
     --------------------------------------------------------- */
  $$('.split').forEach((el, li) => {
    const txt = el.textContent;
    { const t = el.closest('.glow-title'); if (t) li = [...t.querySelectorAll('.split')].indexOf(el); }   // stagger restarts for each title
    el.textContent = '';
    let ci = 0;
    txt.split(' ').forEach((word, wi) => {
      if (wi) { const sp = document.createElement('span'); sp.className = 'sp'; el.appendChild(sp); ci++; }
      const w = document.createElement('span'); w.className = 'wd';
      [...word].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.transitionDelay = (li * 120 + ci++ * 34) + 'ms'; w.appendChild(s); });
      el.appendChild(w);
    });
  });
  /* ---------------------------------------------------------
     OPENING SEQUENCE
     --------------------------------------------------------- */
  const root = document.documentElement;
  const titleIn = () => { const t = $('.hero__title'); if (!t || t.classList.contains('is-in')) return; t.classList.add('is-in'); setTimeout(() => t.classList.add('is-settled'), 1800); };   // settled: lines stop clipping, so the scroll blur can bleed
  if (!root.classList.contains('intro')) {
    requestAnimationFrame(() => setTimeout(titleIn, 150));
  } else {
    scrollTo(0, 0);
    const timers = [], at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const svg = $('#navLogo svg'), logo = $('#navLogo');
    const paths = $$('path', svg).map(p => ({ p, x: p.getBBox().x })).sort((a, b) => a.x - b.x);
    const caret = document.createElement('span'); caret.className = 'logo-caret'; logo.appendChild(caret);
    const caretTo = i => {                     // caret sits just after the last typed letter (measured on screen)
      const lr = logo.getBoundingClientRect(), sc = lr.width / logo.offsetWidth || 1;   // undo the bar's pop-in scale
      caret.style.left = (i < 0 ? 0 : (paths[i].p.getBoundingClientRect().right - lr.left) / sc + 3) + 'px';
    };
    caretTo(-1);
    let done = false;
    const finish = () => {                     // also used to skip
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      paths.forEach(o => o.p.style.opacity = '');
      root.classList.remove('intro-1', 'intro-center'); root.classList.add('intro-2', 'intro-4', 'intro-go');
      titleIn(); dispatchEvent(new Event('drvn:lift')); dispatchEvent(new Event('drvn:intro'));
      setTimeout(() => { root.classList.remove('intro', 'intro-2', 'intro-4', 'intro-go'); caret.remove(); dispatchEvent(new Event('resize')); }, 1600);
    };
    const begin = () => {
    // 1 — type "DRVN", beat, "SOCIAL"
    caret.classList.add('is-typing');
    const typeNext = i => {
      if (done) return;
      if (i >= paths.length) { caret.classList.remove('is-typing'); return at(900, rest); }   // caret blinks: "enter"
      paths[i].p.style.opacity = 1; caretTo(i);
      // human rhythm: uneven keystrokes, the odd hesitation, a proper pause at the "space" before SOCIAL
      let gap = 55 + Math.random() * 150;
      if (Math.random() < 0.22) gap += 90 + Math.random() * 160;
      if (i === 3) gap = 320 + Math.random() * 200;
      at(gap, () => typeNext(i + 1));
    };
    at(350, () => typeNext(0));
    const rest = () => {
      // 2a — the compact bar rises to the top, and the header video starts fading in with it
      root.classList.remove('intro-center'); dispatchEvent(new Event('drvn:lift'));
      // 2b — once it lands, it opens into the full nav and Start Project grows out of its circle, together
      at(1150, () => { root.classList.remove('intro-1'); root.classList.add('intro-2'); });
      // 3 — headline animates in as the nav opens
      at(1450, titleIn);
      // 4 — everything else fades up
      at(2250, () => { root.classList.add('intro-4'); dispatchEvent(new Event('drvn:intro')); });
      at(3650, () => { done = true; paths.forEach(o => o.p.style.opacity = ''); root.classList.remove('intro', 'intro-2', 'intro-4', 'intro-go'); caret.remove(); dispatchEvent(new Event('resize')); });
    };
    // skip on any intent to interact
    };
    let started = false;
    // black screen until the 3D icons are ready, then the bar pops in, then typing starts
    const go = () => { if (started || done) return; started = true; root.classList.add('intro-go'); at(650, begin); };
    addEventListener('drvn:glass-ready', () => requestAnimationFrame(go), { once: true });
    at(1400, go);
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, () => { if (root.classList.contains('intro-1')) finish(); }, { once: true, passive: true }));
  }

  // Splitting headlines into one span per letter switches off the font's kerning,
  // so measure each pair with the real font and add the kern back as a margin.
  function rekern() {
    const cv = document.createElement('canvas').getContext('2d');
    if ('fontKerning' in cv) cv.fontKerning = 'normal';
    cv.font = 'italic 700 200px N27';
    const w = s => cv.measureText(s).width;
    $$('.split').forEach(el => {
      cv.font = `italic ${getComputedStyle(el).fontWeight} 200px N27`;   // measure kerning in the word's own weight
      const chars = $$('.ch, .sp', el);
      chars.forEach((c, i) => {
        const n = chars[i + 1];
        // each letter carries .22em of right padding (room for the italic overhang while it animates, see .split .ch);
        // the margin takes that back out again so the advance width is unchanged
        if (!c.classList.contains('ch')) { c.style.marginRight = ''; return; }
        if (!n || !n.classList.contains('ch')) { c.style.marginRight = '-.22em'; return; }
        const a = c.textContent.toUpperCase(), b = n.textContent.toUpperCase();
        const k = w(a + b) - w(a) - w(b);                    // negative = pull together
        c.style.marginRight = (k / 200 - 0.22).toFixed(4) + 'em';
      });
    });
  }
  (document.fonts ? Promise.all([document.fonts.load('italic 700 100px N27'), document.fonts.load('italic 300 100px N27')]).then(rekern) : Promise.resolve()).catch(() => {});


  /* ---------------------------------------------------------
     CURSOR
     --------------------------------------------------------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  const cursor = $('.cursor');
  if (finePointer && cursor) {
    document.body.classList.add('has-cursor');
    const dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    const r = { x: mouse.x, y: mouse.y };
    addEventListener('pointermove', e => { if (!mouse.active) { r.x = e.clientX; r.y = e.clientY; cursor.classList.add('is-live'); } mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; dot.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; }, { passive: true });
    (function loop() { r.x = lerp(r.x, mouse.x, .18); r.y = lerp(r.y, mouse.y, .18); ring.style.transform = `translate3d(${r.x}px,${r.y}px,0)`; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; cursor.classList.add('is-label'); cursor.classList.toggle('is-glyph', /^[←→]$/.test(t.dataset.cursor)); }
      else cursor.classList.remove('is-label', 'is-glyph');
      cursor.classList.toggle('is-grab', !!e.target.closest('.sticker'));
      cursor.classList.toggle('is-dark', !!e.target.closest('[data-nav="light"], .pillar, .nav__sheet') && !e.target.closest('.phone, .react-btn, .lw__panel'));
      // anything clickable: the ring opens up a touch
      cursor.classList.toggle('is-link', !t && !!e.target.closest('a[href], button, [role="button"], input, select, textarea, label[for], summary'));
    });
  } else {
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
  }

  /* ---------------------------------------------------------
     GLASS NAV — refraction map, specular light, sliding lens
     --------------------------------------------------------- */
  const nav = $('#nav'), glass = $('#navGlass'), lens = $('#navLens'), tabsWrap = $('#navTabs');
  const isChromium = !!(navigator.userAgentData && navigator.userAgentData.brands.some(b => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand)));

  // Displacement map for a horizontal glass rod (a pill seen from above).
  // Middle: gently magnified. Edges: a squeezed view of what's just beyond the rod,
  // exactly like looking through a cylinder of glass. Monotonic, so it never folds,
  // and top/bottom are perfect mirror images. The map covers an area PAD px larger than
  // the pill so the glass can "see" past its own edge (clipped back to the pill in CSS).
  const PAD = 24;
  // position the three map pieces for the element's current (possibly animating) width
  function placeMap(filter) {
    const p = filter._parts, el = filter._el; if (!p) return;
    const W = el.offsetWidth + PAD * 2, cap = filter._cap;
    p.l.setAttribute('x', 0); p.l.setAttribute('width', cap);
    p.m.setAttribute('x', cap - 1); p.m.setAttribute('width', Math.max(1, W - cap * 2 + 2));
    p.r.setAttribute('x', W - cap); p.r.setAttribute('width', cap);
  }
  function buildRefractionMap(el = glass, filter = $('#glass-refract')) {
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    const W = w + PAD * 2, H = h + PAD * 2;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
    const r = h / 2, reach = 0.6;                       // rim samples 0.6r beyond the edge
    const A = 0.75, B = (1 + reach) - A;                // f(t) = A t + B t^5, f(1) = 1 + reach
    let maxOff = 0;
    const offs = new Float32Array(W * H * 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const px = x + .5 - W / 2, py = y + .5 - H / 2;
      const sx = Math.max(Math.abs(px) - (w / 2 - r), 0), dx = sx * Math.sign(px), dy = py;
      const len = Math.hypot(dx, dy);
      let ox = 0, oy = 0;
      if (len > 0 && len <= r) {
        const t = len / r, f = A * t + B * Math.pow(t, 5);
        const off = r * (f - t);                         // <0 near middle (magnify), >0 at rim (look beyond)
        ox = dx / len * off; oy = dy / len * off;
      }
      const k = (y * W + x) * 2; offs[k] = ox; offs[k + 1] = oy;
      maxOff = Math.max(maxOff, Math.abs(ox), Math.abs(oy));
    }
    for (let i = 0, n = W * H; i < n; i++) {
      const k = i * 4;
      d[k] = 128 + offs[i * 2] / maxOff * 127; d[k + 1] = 128 + offs[i * 2 + 1] / maxOff * 127; d[k + 2] = 128; d[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // slice: the ends hold all the curvature; the middle only bends vertically, so one column can stretch to any width
    const cap = Math.min(PAD + Math.ceil(r) + 1, Math.floor(W / 2) - 1);
    const slice = (sx, sw) => { const s = document.createElement('canvas'); s.width = sw; s.height = H; s.getContext('2d').drawImage(c, sx, 0, sw, H, 0, 0, sw, H); return s.toDataURL(); };
    let parts = filter._parts;
    if (!parts) {
      const NS = 'http://www.w3.org/2000/svg', old = filter.querySelector('feImage');
      const mk = res => { const f = document.createElementNS(NS, 'feImage'); f.setAttribute('preserveAspectRatio', 'none'); f.setAttribute('result', res); f.setAttribute('y', 0); return f; };
      parts = filter._parts = { l: mk('mL'), m: mk('mM'), r: mk('mR'), merge: document.createElementNS(NS, 'feMerge') };
      parts.merge.setAttribute('result', 'map');
      ['mM', 'mL', 'mR'].forEach(n => { const mn = document.createElementNS(NS, 'feMergeNode'); mn.setAttribute('in', n); parts.merge.appendChild(mn); });
      old.replaceWith(parts.l); parts.l.after(parts.m); parts.m.after(parts.r); parts.r.after(parts.merge);
    }
    parts.l.setAttribute('href', slice(0, cap)); parts.r.setAttribute('href', slice(W - cap, cap)); parts.m.setAttribute('href', slice(Math.floor(W / 2), 1));
    [parts.l, parts.m, parts.r].forEach(f => f.setAttribute('height', H));
    filter._cap = cap; filter._el = el;
    placeMap(filter);
    // scale so a full-strength pixel moves exactly maxOff px; G/B a touch further = colour fringe
    const base = maxOff / (127 / 255);
    filter.querySelectorAll('feDisplacementMap').forEach((m, i) => m.setAttribute('scale', (base * [1, 1.1, 1.22][i]).toFixed(1)));
  }
  if (isChromium && !reduce) {
    glass.classList.add('is-refract');
    buildRefractionMap();
    glass.addEventListener('transitionend', e => { if (e.propertyName === 'width' || e.propertyName === 'height') buildRefractionMap(); });
    let follow = 0;
    const followWidth = () => { placeMap($('#glass-refract')); follow = requestAnimationFrame(followWidth); };
    glass.addEventListener('transitionrun', e => { if (e.propertyName === 'width' && !follow) follow = requestAnimationFrame(followWidth); });
    glass.addEventListener('transitionend', e => { if (e.propertyName === 'width') { cancelAnimationFrame(follow); follow = 0; } });
    glass.addEventListener('transitioncancel', e => { if (e.propertyName === 'width') { cancelAnimationFrame(follow); follow = 0; } });
    addEventListener('resize', () => { clearTimeout(buildRefractionMap.t); buildRefractionMap.t = setTimeout(() => buildRefractionMap(), 150); });
  }

  glass.addEventListener('pointermove', e => {
    const b = glass.getBoundingClientRect();
    const lx = e.clientX - b.left, ly = e.clientY - b.top;
    glass.style.setProperty('--mx', lx + 'px');
    glass.style.setProperty('--my', ly + 'px');
    const ang = Math.atan2(ly - b.height / 2, lx - b.width / 2) * 180 / Math.PI;
    glass.style.setProperty('--rim-a', (ang + 180 + 45) + 'deg');
    glass.style.setProperty('--hue-a', (lx / b.width * 360) + 'deg');
  });

  const tabs = $$('.nav__tab');
  // wrap each label so the bold width can be reserved (no layout shift on the active tab)
  tabs.forEach(t => { if (!t.dataset.label) { const l = t.dataset.label = t.textContent.trim(); t.innerHTML = `<span class="tab__roll"><span>${l}</span><span aria-hidden="true">${l}</span></span>`; } });
  let activeTab = tabs[0];
  function moveLens(t) {
    if (!t || !lens) return;
    if (lens.dataset.x && +lens.dataset.x !== t.offsetLeft) {
      lens.classList.add('is-moving'); clearTimeout(moveLens.t);
      moveLens.t = setTimeout(() => lens.classList.remove('is-moving'), 260);
    }
    lens.dataset.x = t.offsetLeft;
    lens.style.width = t.offsetWidth + 'px';
    lens.style.transform = `translateX(${t.offsetLeft}px)`;
  }
  tabs.forEach(t => t.addEventListener('pointerenter', () => moveLens(t)));
  tabsWrap?.addEventListener('pointerleave', () => activeTab && moveLens(activeTab));
  addEventListener('load', () => moveLens(activeTab));
  document.fonts?.ready.then(() => moveLens(activeTab));
  moveLens(activeTab);

  // Start Project: glow follows the cursor around the rim and drifts slowly while hovered
  /* ---------------------------------------------------------
     BUTTONS — one system site-wide
     white  (.btn--light)            -> same build + behaviour as Start Project
     outline (.btn--glass/.btn--line) -> same liquid glass as the nav, label rolls + glows
     --------------------------------------------------------- */
  const PLUS = '<svg class="cta__plus" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const labelOf = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/[↗→▶]/g, '').replace(/\s+/g, ' ').trim();
  $$('.btn--light').forEach(b => {
    const l = labelOf(b);
    b.classList.remove('btn', 'btn--light'); b.classList.add('nav__cta', 'is-btn'); b.removeAttribute('data-cursor');
    b.innerHTML = `<span class="cta__halo" aria-hidden="true"></span><span class="cta__bg" aria-hidden="true"></span><span class="cta__ring" aria-hidden="true"></span><span class="cta__roll"><span>${l}</span><span aria-hidden="true">${l}</span></span>${PLUS}`;
  });
  let gid = 0;
  $$('.btn--glass, .btn--line').forEach(b => {
    const l = labelOf(b), icon = b.querySelector('.btn__play');
    b.classList.remove('btn', 'btn--glass', 'btn--line'); b.classList.add('gbtn'); b.removeAttribute('data-cursor');
    b.innerHTML = `<span class="nav__refract" aria-hidden="true"></span><span class="nav__sheen" aria-hidden="true"></span><span class="nav__rim" aria-hidden="true"></span><span class="nav__frost" aria-hidden="true"></span>${icon ? icon.outerHTML : ''}<span class="gbtn__label"><span class="tab__roll"><span>${l}</span><span aria-hidden="true">${b.dataset.alt || l}</span></span></span>`;
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect(), lx = e.clientX - r.left, ly = e.clientY - r.top;
      b.style.setProperty('--mx', lx + 'px'); b.style.setProperty('--my', ly + 'px');
      b.style.setProperty('--rim-a', (Math.atan2(ly - r.height / 2, lx - r.width / 2) * 180 / Math.PI + 225) + 'deg');
      b.style.setProperty('--hue-a', (lx / r.width * 360) + 'deg');
    });
    if (isChromium && !reduce) {
      const f = $('#glass-refract').cloneNode(true); f.id = 'glass-refract-' + (++gid); f.querySelector('feImage').removeAttribute('id');
      $('#glass-refract').parentNode.appendChild(f);
      const build = () => buildRefractionMap(b, f);
      b.querySelector('.nav__refract').style.backdropFilter = `url(#${f.id}) saturate(150%) brightness(1.08)`;
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
      addEventListener('resize', () => { clearTimeout(b._t); b._t = setTimeout(build, 200); });
    }
  });

  $$('.nav__cta').forEach(navCta => {
    if (!finePointer) return;
    let hover = false, ang = 0, target = 0, raf = 0;
    const tick = t => {
      ang += ((target + t * .03) - ang) * .12;           // ease toward cursor angle + slow drift
      navCta.style.setProperty('--ga', ang.toFixed(1) + 'deg');
      if (hover || Math.abs(target + t * .03 - ang) > .5) raf = requestAnimationFrame(tick); else raf = 0;
    };
    navCta.addEventListener('pointermove', e => {
      const b = navCta.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      navCta.style.setProperty('--cx', x + 'px'); navCta.style.setProperty('--cy', y + 'px');
      // put the bright blue/cyan seam of the gradient where the cursor is
      target = Math.atan2(y - b.height / 2, x - b.width / 2) * 180 / Math.PI + 90 - 25 - performance.now() * .03;
    });
    navCta.addEventListener('pointerenter', () => { hover = true; if (!raf) raf = requestAnimationFrame(tick); });
    navCta.addEventListener('pointerleave', () => { hover = false; });
  });
  // logo always goes home; on the homepage itself it glides back to the top
  $('#navLogo')?.addEventListener('click', e => {
    const onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (onHome) { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', location.pathname); }
  });
  const setMenu = open => { nav.classList.toggle('is-open', open); document.documentElement.classList.toggle('is-menu-open', open); $('#navBurger')?.setAttribute('aria-expanded', open); $('#navBurger')?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  $('#navBurger')?.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__sheet a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width:901px)').addEventListener?.('change', e => { if (e.matches) setMenu(false); });

  /* ---------------------------------------------------------
     HERO STICKERS — parallax, cursor repel, drag & fling, pop
     --------------------------------------------------------- */
  const field = $('#heroStickers'), hero = $('#hero');
  const stickers = $$('.sticker', field).map((el, i) => {
    const size = +el.dataset.size || 0;
    if (size) { el.style.width = size + 'px'; el.style.height = size + 'px'; }
    return {
      el, size, depth: +el.dataset.depth || 1, px: +el.dataset.x / 100, py: +el.dataset.y / 100,
      hx: 0, hy: 0, hvx: 0, hvy: 0, x: 0, y: 0, vx: 0, vy: 0, rot: (i % 2 ? 1 : -1) * (el.classList.contains('chip') ? 4 : 6 + i * 2), r: 0,
      phase: Math.random() * 6.28, drag: false, pupils: $$('.pupil', el), placed: false
    };
  });
  let FW = 0, FH = 0;
  function layoutStickers() {
    if (!field) return;
    FW = field.offsetWidth; FH = field.offsetHeight;
    const small = FW < 700;
    stickers.forEach((s, i) => {
      const scale = small ? .62 : FW < 1100 ? .8 : 1;
      if (s.size) { s.el.style.width = s.el.style.height = (s.size * scale) + 'px'; }
      s.w = s.el.offsetWidth; s.h = s.el.offsetHeight;
      if (!s.placed) { s.hx = s.px * FW; s.hy = s.py * FH + 80; s.placed = true; }
      s.hx = clamp(s.hx, 0, FW - s.w); s.hy = clamp(s.hy, 70, FH - s.h);
      s.el.style.display = small && (s.py > .45 || i > 6) && !s.el.classList.contains('chip') ? 'none' : '';
    });
  }
  layoutStickers();
  addEventListener('resize', layoutStickers);

  function burst(x, y, host, kind) {
    const set = kind === 'heart' ? ['heart', 'heart', 'heart'] : ['heart', 'smiley', 'bolt', 'asterisk', 'bubble', 'rocket'];
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('div');
      b.className = 'burst';
      const sz = 22 + Math.random() * 22;
      b.style.cssText = `left:${x - sz / 2}px;top:${y - sz / 2}px;width:${sz}px;height:${sz}px`;
      b.innerHTML = gem(set[i % set.length]);
      host.appendChild(b);
      const a = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 120;
      b.animate([
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist - 40}px) scale(1) rotate(${(Math.random() - .5) * 120}deg)`, opacity: 1, offset: .6 },
        { transform: `translate(${Math.cos(a) * dist * 1.2}px,${Math.sin(a) * dist + 60}px) scale(.8) rotate(${(Math.random() - .5) * 200}deg)`, opacity: 0 }
      ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => b.remove();
    }
  }

  stickers.forEach(s => {
    let sx, sy, ox, oy, lx, ly, lt, moved;
    s.el.addEventListener('pointerdown', e => {
      e.preventDefault();
      s.el.setPointerCapture(e.pointerId);
      s.drag = true; moved = 0; s.el.classList.add('is-drag');
      const fb = field.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = e.clientX - fb.left - s.hx; oy = e.clientY - fb.top - s.hy;
      lx = e.clientX; ly = e.clientY; lt = performance.now(); s.hvx = s.hvy = 0;
    });
    s.el.addEventListener('pointermove', e => {
      if (!s.drag) return;
      const fb = field.getBoundingClientRect(), now = performance.now(), dt = Math.max(16, now - lt);
      s.hx = e.clientX - fb.left - ox; s.hy = e.clientY - fb.top - oy;
      s.hvx = (e.clientX - lx) / dt * 16; s.hvy = (e.clientY - ly) / dt * 16;
      s.vx += (e.clientX - lx) * .15;   // jelly lag
      lx = e.clientX; ly = e.clientY; lt = now;
      moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
    });
    const end = e => {
      if (!s.drag) return;
      s.drag = false; s.el.classList.remove('is-drag');
      if (moved < 6) {
        s.el.classList.remove('is-pop'); void s.el.offsetWidth; s.el.classList.add('is-pop');
        burst(s.hx + s.x + s.w / 2, s.hy + s.y + s.h / 2, field, s.el.dataset.emoji);
        s.hvx = s.hvy = 0;
      }
    };
    s.el.addEventListener('pointerup', end);
    s.el.addEventListener('pointercancel', end);
  });

  let heroVisible = true;
  if (hero) new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

  (function stickerLoop(t) {
    if (field && heroVisible && !reduce) {
      const fb = field.getBoundingClientRect();
      const mx = mouse.x - fb.left, my = mouse.y - fb.top;
      const ncx = (mouse.x / innerWidth - .5), ncy = (mouse.y / innerHeight - .5);
      for (const s of stickers) {
        // home inertia after a fling
        if (!s.drag) {
          s.hx += s.hvx; s.hy += s.hvy; s.hvx *= .93; s.hvy *= .93;
          if (s.hx < 0 || s.hx > FW - s.w) { s.hvx *= -.6; s.hx = clamp(s.hx, 0, FW - s.w); }
          if (s.hy < 70 || s.hy > FH - s.h - 50) { s.hvy *= -.6; s.hy = clamp(s.hy, 70, FH - s.h - 50); }
        }
        // targets: parallax + repel
        let tx = -ncx * 70 * s.depth, ty = -ncy * 50 * s.depth;
        if (mouse.active && !s.drag) {
          const cx = s.hx + s.w / 2, cy = s.hy + s.h / 2, dx = cx - mx, dy = cy - my, d = Math.hypot(dx, dy), R = 190;
          if (d < R && d > 0) { const p = Math.pow(1 - d / R, 2) * 140; tx += dx / d * p; ty += dy / d * p; }
        }
        if (s.drag) { tx = 0; ty = 0; }
        s.vx = (s.vx + (tx - s.x) * .07) * .84; s.vy = (s.vy + (ty - s.y) * .07) * .84;
        s.x += s.vx; s.y += s.vy;
        const bob = Math.sin(t * .0011 + s.phase) * 9;
        const tr = s.rot + clamp(s.vx * 1.8, -25, 25);
        s.r = lerp(s.r, tr, .15);
        const ry = clamp(ncx * 30 * s.depth, -30, 30), rx = clamp(-ncy * 20 * s.depth, -20, 20);
        s.el.style.transform = `translate3d(${s.hx + s.x}px,${s.hy + s.y + bob}px,0) perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${s.r}deg) scale(${s.drag ? 1.15 : 1})`;
        // eyes follow the cursor
        if (s.pupils.length) {
          const svg = s.el.firstChild, b = svg.getBoundingClientRect();
          s.pupils.forEach(p => {
            const pcx = b.left + (+p.dataset.cx / 100) * b.width, pcy = b.top + (+p.dataset.cy / 100) * b.height;
            const a = Math.atan2(mouse.y - pcy, mouse.x - pcx), m = Math.min(1, Math.hypot(mouse.x - pcx, mouse.y - pcy) / 200);
            p.setAttribute('transform', `translate(${Math.cos(a) * 8 * m} ${Math.sin(a) * 14 * m - 4})`);
          });
        }
      }
    } else if (reduce) {
      stickers.forEach(s => s.el.style.transform = `translate3d(${s.hx}px,${s.hy}px,0) rotate(${s.rot}deg)`);
    }
    requestAnimationFrame(stickerLoop);
  })(0);

  /* ---------------------------------------------------------
     MANIFESTO — wrap words for scroll-lit effect
     --------------------------------------------------------- */
  const mText = $('#manifestoText'), mMore = $('.manifesto__more');
  const mUnits = [];
  if (mText) {
    const nodes = [...mText.childNodes];
    mText.textContent = '';
    nodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { mText.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w'; w.textContent = part; mText.appendChild(w); mUnits.push(w);
        });
      } else { mText.appendChild(n); mUnits.push(n); }
    });
  }

  /* ---------------------------------------------------------
     SCROLL ENGINE — one rAF, read once, write many
     --------------------------------------------------------- */
  const heroMedia = $('#heroMedia'), heroTitle = $('.hero__title');
  const heroLines = $$('.hero__title .line');
  const glowLines = $$('.hero__title .line, .finale__title .line, .glow-title .line');
  // glow strength eases in/out (JS-driven so it's smooth everywhere)
  let glowRaf = 0;
  let gx = -1e4, gy = -1e4;
  const glowTick = () => {
    let busy = false;
    glowLines.forEach(l => {
      const t = l._on ? 1 : 0; l._gl = (l._gl || 0) + (t - (l._gl || 0)) * 0.1;
      if (Math.abs(t - l._gl) > 0.004) busy = true; else l._gl = t;
      (l._ch || (l._ch = $$('.ch', l))).forEach(c => {
        const r = c.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - gx, r.top + r.height / 2 - gy);
        const target = l._gl * Math.max(0, 1 - d / 260) ** 1.4;
        c._e = (c._e || 0) + (target - (c._e || 0)) * 0.25;
        if (Math.abs(target - c._e) > 0.003) busy = true;
        c.style.setProperty('--e', c._e.toFixed(3));
      });
    });
    glowRaf = busy ? requestAnimationFrame(glowTick) : 0;
  };
  if (finePointer) addEventListener('pointermove', e => {
    gx = e.clientX; gy = e.clientY; if (!glowRaf) glowRaf = requestAnimationFrame(glowTick);
    glowLines.forEach(l => {
      const sp = l.querySelector('.split'), r = sp.getBoundingClientRect(), pad = 70;
      const on = e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
      l._on = on;
    });
  }, { passive: true });
  const manifesto = $('#manifesto'), bandRows = $$('.band__row'), bandEmojis = $$('.band__emoji');
  // phones: the scroll-linked band stuttered, so it becomes a continuous marquee (content doubled for a seamless loop)
  if (innerWidth < 900) bandRows.forEach(row => { row.innerHTML += row.innerHTML; row.classList.add('band__row--marq'); if (+row.dataset.speed < 0) row.classList.add('is-rev'); row.style.setProperty('--dur', (row.scrollWidth / 90).toFixed(1) + 's'); });
  const lightSecs = $$('[data-nav="light"]');
  const navLogo = $('#navLogo'), logoSocial = $('#logoSocial');
  // scroll-spy: only tabs that point at a section on this page
  const spy = tabs.map(t => { const h = t.getAttribute('href'); return { t, s: h.startsWith('#') ? $(h) : null }; }).filter(o => o.s);
  let lastY = -1, slideTarget = 0, slideCur = 0;

  function onScroll() {
    const y = scrollY, vh = innerHeight, vw = innerWidth;
    // headline drift: glide toward the scroll-driven target every frame
    if (Math.abs(slideTarget - slideCur) > 0.3) { slideCur += (slideTarget - slideCur) * 0.085; heroTitle.style.setProperty('--slide', slideCur.toFixed(1)); }
    if (y !== lastY) {
      lastY = y;
      nav.classList.toggle('is-scrolled', y > 40);
      // logo: full wordmark at the top; SOCIAL slides left and tucks under DRVN as you scroll
      if (navLogo) {
        if (innerWidth < 900) nav.classList.toggle('is-tucked', y > 60);   // phones: a CSS tween (scroll events are too sparse on iOS to drive it per-frame)
        else {
          const lp = clamp(y / 260, 0, 1), e = lp * lp * (3 - 2 * lp);
          navLogo.style.setProperty('--vbw', (688.62 - (688.62 - 346) * e).toFixed(2));
          logoSocial.style.transform = `translateX(${(-372 * e).toFixed(1)}px)`;  // far enough that the L's foot clears the N
        }
      }
      const navMid = 46;
      nav.classList.toggle('is-light', !nav.classList.contains('is-open') && lightSecs.some(s => { const r = s.getBoundingClientRect(); return r.top <= navMid && r.bottom >= navMid; }));

      // hero: media recedes into a rounded card, title drifts up
      const hp = clamp(y / vh, 0, 1);
      if (!reduce) {
        // video stays locked full-bleed to the frame (no shrink/rounding on scroll)
        // top line exits left, bottom line exits right; fully off screen by ~70% of the hero
        // headline: words fade out one after another, top to bottom (Where → Content → Meets → Conversion)
        heroLines.forEach((l, i) => {
          const t = clamp((hp - (0.03 + i * 0.085)) / 0.16, 0, 1), e = t * t * (3 - 2 * t);
          l.style.setProperty('--fo', e.toFixed(3));
        });
        if (field) field.style.transform = `translate3d(0,${-hp * 260}px,0)`;
      }

      // manifesto: light words progressively
      if (manifesto && mUnits.length) {
        const r = manifesto.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - vh), 0, 1);
        const n = Math.floor(p * 1.12 * mUnits.length);
        mUnits.forEach((u, i) => u.classList.toggle('on', i < n));
        mMore?.classList.toggle('is-on', n >= mUnits.length);
      }

      // kinetic band: scroll-linked horizontal motion
      bandRows.forEach(row => {
        if (row.classList.contains('band__row--marq')) return;   // phones: CSS marquee instead
        const r = row.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (vh - r.top) / (vh + r.height);
        const sp = +row.dataset.speed;
        row.style.transform = `translate3d(${(sp < 0 ? -p * 40 : -40 + p * 40)}%,0,0)`;
      });
      bandEmojis.forEach((e, i) => e.style.setProperty('--r', (y * .25 * (i % 2 ? 1 : -1)) + 'deg'));

      // active tab
      // highlight the tab for the section in view; none if the section has no tab
      let current = null;
      spy.forEach(({ t, s }) => { const r = s.getBoundingClientRect(); if (r.top < vh * .45 && r.bottom > vh * .45) current = t; });
      if (current !== activeTab) { activeTab?.classList.remove('is-active'); activeTab = current; activeTab?.classList.add('is-active'); }
    }
    requestAnimationFrame(onScroll);
  }
  requestAnimationFrame(onScroll);

  /* ---------------------------------------------------------
     REVEALS + COUNTERS
     --------------------------------------------------------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    const n = e.target.querySelector('[data-count]');
    if (n) countUp(n);
    io.unobserve(e.target);
  }), { threshold: innerWidth < 900 ? .08 : .2, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], .cta__title .split').forEach(el => io.observe(el));

  function countUp(el) {
    const end = +el.dataset.count, dec = +el.dataset.dec || 0, suf = el.dataset.suffix || '', pre = el.dataset.prefix || '', dur = 1800, t0 = performance.now();
    (function tick(t) {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + fmtN(end * e, dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* Auto count-up for every stat figure (homepage panels, work cards, case-study stats).
     Parses e.g. "£2.35", "11.8M+", "12,500+", "<7", "98%", "10p" into prefix / number / suffix. */
  (function autoCount() {
    const els = $$('.lw__stat b, .wc__stat b, .cs-stats b, .pj-stats b, [data-countup]').filter(el => !el.closest('[data-count]') && !el.hasAttribute('data-count'));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = els.map(el => {
      const txt = el.textContent.trim(), m = txt.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
      if (!m) return null;
      const raw = m[2].replace(/,/g, ''), dec = (raw.split('.')[1] || '').length;
      const it = { el, pre: m[1], end: parseFloat(raw), dec, suf: m[3], comma: m[2].includes(','), done: false };
      if (!reduce) el.textContent = it.pre + fmt(it, 0) + it.suf;
      el.style.fontVariantNumeric = 'tabular-nums';
      return it;
    }).filter(Boolean);
    // reserve each number's final width (measured once the display font is in) so the copy beside it never reflows
    const lock = () => items.forEach(it => { if (it.done) return; const el = it.el, cur = el.textContent; el.textContent = it.pre + fmt(it, it.end) + it.suf; const w = el.getBoundingClientRect().width; el.textContent = cur; if (w) { if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'; el.style.minWidth = Math.ceil(w) + 'px'; } });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(lock);
    function fmt(it, v) {
      if (it.dec) return v.toFixed(it.dec);
      const r = Math.round(v);
      return it.comma || r >= 10000 ? r.toLocaleString('en-GB') : String(r);
    }
    if (reduce || !items.length) return;
    const run = it => {
      if (it.done) return; it.done = true;
      const dur = 1100, t0 = performance.now(), delay = (+it.el.dataset.countDelay || 0);
      (function tick(t) {
        const p = clamp((t - t0 - delay) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        it.el.textContent = it.pre + fmt(it, it.end * e) + it.suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };
    // stagger figures that sit together in one group
    items.forEach(it => { const g = it.el.closest('.lw__stats, .cs-stats, .pj-stats'); if (g) it.el.dataset.countDelay = [...g.querySelectorAll('b')].indexOf(it.el) * 120; });
    const cio = new IntersectionObserver(es => es.forEach(e => {
      const it = items.find(i => i.el === e.target); if (!it) return;
      if (!e.isIntersecting) {   // skipped past it (fast jump / anchor link): just show the final figure
        if (e.boundingClientRect.bottom < 0) { it.done = true; it.el.textContent = it.pre + fmt(it, it.end) + it.suf; cio.unobserve(e.target); }
        return;
      }
      run(it);
      cio.unobserve(e.target);
    }), { threshold: .2, rootMargin: '0px 0px -6% 0px' });
    items.forEach(it => cio.observe(it.el));
  })();

  // viewfinder timecode
  const tc = $('#tc');
  if (tc) { let f = 0; setInterval(() => { f++; const fr = f % 25, s = Math.floor(f / 25); tc.textContent = `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`; }, 40); }

  /* ---------------------------------------------------------
     FEED — live reactions + phone tilt + tap to react
     --------------------------------------------------------- */
  const reactions = $('#reactions'), phones = $('#phones');
  const REACT = ['heart', 'heart', 'smiley', 'heart', 'bolt', 'bubble', 'heart', 'asterisk'];
  function floatReaction(x) {
    const r = document.createElement('div');
    r.className = 'reaction';
    r.style.left = x + 'px';
    r.innerHTML = gem(REACT[Math.floor(Math.random() * REACT.length)]);
    reactions.appendChild(r);
    const drift = (Math.random() - .5) * 120, h = phones.offsetHeight * (.55 + Math.random() * .35);
    r.animate([
      { transform: 'translate(0,0) scale(.2)', opacity: 0 },
      { transform: `translate(${drift * .3}px,${-h * .2}px) scale(1.1)`, opacity: 1, offset: .15 },
      { transform: `translate(${drift}px,${-h}px) scale(.8) rotate(${drift / 4}deg)`, opacity: 0 }
    ], { duration: 2600 + Math.random() * 1400, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = () => r.remove();
  }
  let feedVisible = false;
  if (phones) {
    new IntersectionObserver(([e]) => { feedVisible = e.isIntersecting; }).observe(phones);
    if (!reduce) setInterval(() => { if (feedVisible && document.visibilityState === 'visible') floatReaction(Math.random() * phones.offsetWidth * .9); }, 520);
  }
  const reactBtn = $('#reactBtn'), reactCount = $('#reactCount');
  let rc = 1204;
  reactBtn?.addEventListener('click', () => {
    rc++; reactCount.textContent = rc.toLocaleString('en-GB');
    for (let i = 0; i < 5; i++) setTimeout(() => floatReaction(phones.offsetWidth * (.2 + Math.random() * .6)), i * 70);
    const b = reactBtn.getBoundingClientRect(), host = reactBtn.closest('.feed'), hb = host.getBoundingClientRect();
    burst(b.left - hb.left + 30, b.top - hb.top + 29, host, 'heart');
  });

  /* ---------------------------------------------------------
     REEL MODAL
     --------------------------------------------------------- */
  // showreel: the new reel is in the edit, so the button stays but rolls to "Coming soon" (hover on desktop, tap on touch)
  const reelBtn = $('#playReel');
  if (reelBtn) { let t; reelBtn.addEventListener('click', e => { e.preventDefault(); reelBtn.classList.add('is-alt'); clearTimeout(t); t = setTimeout(() => reelBtn.classList.remove('is-alt'), 1600); }); }
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* =========================================================
     CLIENT STRIP — name pill follows the cursor over a logo
     ========================================================= */
  (() => {
    const tip = document.querySelector('.client-tip'), strip = document.querySelector('.ticker');
    if (!tip || !strip || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const txt = tip.firstElementChild; tip.dataset.ready = 1;
    let x = -200, y = -200, tx = x, ty = y, raf = 0, on = false, cur = null;
    const loop = () => {
      x += (tx - x) * .28; y += (ty - y) * .28;
      tip.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = (on || Math.abs(tx - x) + Math.abs(ty - y) > .3) ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    strip.addEventListener('pointermove', e => {
      const li = e.target.closest('li[data-client]');
      tx = e.clientX; ty = e.clientY;
      if (!on) { x = tx; y = ty; }
      if (li !== cur) { cur = li; if (li) txt.textContent = li.dataset.client; }
      on = !!li; tip.classList.toggle('is-on', on); kick();
    }, { passive: true });
    strip.addEventListener('pointerleave', () => { on = false; cur = null; tip.classList.remove('is-on'); kick(); });
  })();

  /* =========================================================
     LATEST WORK — collapsing client panels
     ========================================================= */
  (() => {
    const track = $('#lwTrack'); if (!track) return;
    const panels = $$('.lw__panel', track), N = panels.length;
    let cur = 0;
    const set = i => {
      cur = (i + N) % N;
      panels.forEach((p, k) => {
        let d = k - cur; if (d > N / 2) d -= N; if (d < -N / 2) d += N;          // circular distance
        const a = Math.abs(d);
        p.classList.toggle('d0', a === 0); if (a === 0 && p.dataset.href) p.setAttribute('data-cursor', 'View'); else p.removeAttribute('data-cursor'); p.classList.toggle('d1', a === 1); p.classList.toggle('d2', a === 2);
        p.classList.toggle('v', a <= 2);
        p.style.order = d + N;
        p.setAttribute('aria-hidden', a > 2 ? 'true' : 'false');
        p.tabIndex = a === 0 ? 0 : -1;
      });
    };
    set(Math.max(0, panels.findIndex(p => /WPS/.test(p.getAttribute('aria-label') || ''))));   // open on the Porsche
    $('#lwPrev')?.addEventListener('click', () => set(cur - 1));
    $('#lwNext')?.addEventListener('click', () => set(cur + 1));
    panels.forEach((p, k) => p.addEventListener('click', e => { if (k !== cur) set(k); else if (p.dataset.href) location.href = p.dataset.href; }));
    track.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') set(cur - 1); if (e.key === 'ArrowRight') set(cur + 1); });
    // swipe / drag
    let sx = null;
    track.addEventListener('pointerdown', e => { sx = e.clientX; });
    addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) set(cur + (dx < 0 ? 1 : -1)); });
  })();

  /* =========================================================
     FINALE — phones drift up past five headline stats (each blurs in,
     counts up with the scroll, blurs out), then "Let's make some noise"
     arrives and the footer locks up underneath it
     ========================================================= */
  (() => {
    const sec = $('#contact'), title = $('#finaleTitle'), foot = $('#finaleFoot'), bar = $('#finaleBar'); if (!sec || !title || !foot) return;
    // each phone owns a window of the scroll [start, end]; it rises from below the frame to just past the top.
    // windows overlap so there are always phones on screen, and the last ones leave as the title arrives
    const PATH = { fp5: [-.06, .22], fp1: [-.05, .38], fp3: [.05, .5], fp6: [.16, .42], fp2: [.2, .62], fp7: [.36, .62], fp4: [.3, .74], fp8: [.48, .9], fp9: [.56, .91] };
    const ph = $$('.fphone', sec).map(el => { const k = [...el.classList].find(c => PATH[c]); return { el, w: PATH[k] || [0, .6], v: $('video', el), front: !!el.closest('.finale__layer--front') }; });
    const stats = $$('.fstat', sec).map(el => ({ el, n: $('.fstat__n', el), end: parseFloat(el.dataset.count), dec: +el.dataset.dec || 0, suf: el.dataset.suffix || '', pre: el.dataset.prefix || '' }));
    const lines = $$('.line', title);
    const smooth = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
    const RUN = .66;                                              // phones + stats take the first 66% of the scroll
    let mx = 0, smx = 0, on = false, tH = 0, fH = 0, bH = 0;
    const measure = () => { tH = title.offsetHeight; fH = foot.offsetHeight; bH = bar ? bar.offsetHeight : 0; };
    measure(); addEventListener('resize', measure); document.fonts?.ready.then(measure);
    if (finePointer) sec.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; }, { passive: true });
    const tick = () => {
      if (!on) return;
      const r = sec.getBoundingClientRect(), vh = innerHeight;
      const p = -r.top / Math.max(1, r.height - vh);
      smx += (mx - smx) * .08;
      ph.forEach(o => {
        const t = (p - o.w[0]) / (o.w[1] - o.w[0]), hgt = o.el.offsetHeight;
        const y = vh * 1.04 + (-hgt - vh * .04 - vh * 1.04) * Math.min(1.2, Math.max(-.1, t)), x = smx * (o.front ? -40 : 18);
        o.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      });
      // stats: one at a time, each owns an equal slice of the run. The first starts while the section is
      // still scrolling into view (insight about halfway out of frame), so the screen never sits empty
      const S0 = -(vh * (innerWidth < 900 ? .7 : .5)) / Math.max(1, r.height - vh), W = (RUN - .03 - S0) / stats.length;   // phones: first stat starts earlier
      stats.forEach((s, i) => {
        const t = (p - S0 - i * W) / W;                           // 0 → 1 across this stat's slice
        const fin = smooth(t / .22), fout = i === stats.length - 1 ? smooth((t - .78) / .22) : smooth((t - .8) / .2);
        const vis = Math.min(fin, 1 - fout), fo = 1 - vis;
        s.el.style.opacity = vis.toFixed(3);
        s.el.style.filter = fo > .01 ? `blur(${(fo * 16).toFixed(1)}px)` : 'none';
        s.el.style.transform = `translate(-50%,-50%) translate3d(0,${((t < .5 ? 1 : -1) * fo * 24).toFixed(1)}px,0)`;
        if (!isNaN(s.end)) { const c = smooth((t - .12) / .5); s.n.textContent = s.pre + fmtN(s.end * c, s.dec) + s.suf; }
      });
      // title arrives line by line, then the lock-up
      lines.forEach((l, i) => { const k = smooth((p - (RUN - .02) - i * .03) / .07); l.style.setProperty('--fo', (1 - k).toFixed(3)); });
      // lock-up: title + CTA settle as one group in the centre of the frame; the thin footer bar slides up to the bottom edge
      const q = smooth((p - .76) / .14), gap = Math.max(20, vh * .04);
      const G = tH + gap + fH, gTop = (vh - G) / 2;
      const cy = vh / 2 + (gTop + tH / 2 - vh / 2) * q;
      title.style.transform = `translate(-50%,-50%) translate3d(0,${(cy - vh / 2).toFixed(1)}px,0)`;
      const fy = (vh + 40) + (gTop + tH + gap - (vh + 40)) * q;
      foot.style.transform = `translate3d(-50%,${fy.toFixed(1)}px,0)`;
      if (bar) bar.style.transform = `translate3d(0,${((1 - q) * (bH + 20)).toFixed(1)}px,0)`;
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      ph.forEach(o => { if (!o.v) return; if (on && !reduce) { if (o.v.preload === 'none') o.v.preload = 'auto'; o.v.play().catch(() => {}); } else o.v.pause(); });
      if (on) { measure(); title.classList.add('is-in'); requestAnimationFrame(tick); }
    }, { rootMargin: '200px 0px' }).observe(sec);
    // "Start project" links land on the finished lock-up
    $$('a[href="#contact"]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); nav?.classList.remove('is-open'); document.documentElement.classList.remove('is-menu-open');
      const alt = $('.pfoot--home'); if (alt && getComputedStyle(sec).display === 'none') { alt.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
      const r = sec.getBoundingClientRect(); scrollTo({ top: scrollY + r.top + r.height - innerHeight, behavior: reduce ? 'auto' : 'smooth' });
    }));
  })();

  /* =========================================================
     HERO VIDEO — the team walks in and the lights come on, played once
     from the moment the search bar lifts, then it holds on the final frame.
     A black veil lifts in step with the video's own clock, so the fade
     can never jump, even if the first frames arrive late.
     ========================================================= */
  (() => {
    const v = $('#heroVideo'), veil = $('#heroFade'); if (!v) return;
    v.loop = false;
    if (reduce) { v.poster = v.dataset.endPoster; v.preload = 'none'; root.classList.add('no-veil'); return; }   // no motion: just the finished shot
    const FADE = 3.2;                                                             // seconds of footage over which it rises from black
    const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.cos(Math.PI * t)) / 2;  // gentle in and out
    let started = false, bailed = false;
    const step = () => {
      if (bailed) return;
      const k = ease(v.currentTime / FADE);
      if (veil) veil.style.opacity = (1 - k).toFixed(4);
      if (k < 1 && !(v.currentTime === 0 && v.paused && v.error)) requestAnimationFrame(step);
    };
    const go = () => {
      if (started) return; started = true; v.currentTime = 0; v.playbackRate = 1;
      const bail = () => { if (v.currentTime > 0) return; bailed = true; v.poster = v.dataset.endPoster; if (veil) { veil.style.transition = 'opacity 1.6s ease'; veil.style.opacity = 0; } };
      v.play().catch(bail);
      requestAnimationFrame(step);
      setTimeout(bail, 5000);                                                       // never stuck on black if the video can't play
    };
    if (root.classList.contains('intro')) {
      addEventListener('drvn:lift', go, { once: true });                         // play + fade as the search bar lifts
      v.preload = 'auto'; v.load();                                              // buffer while the logo is typing out
    } else go();
    setTimeout(go, 9000);                                                          // safety net
    // when it ends the browser simply holds the last frame (no loop attribute)
  })();

  /* film noise over the whole page (same recipe as macmillan.studio): every CSS pixel gets a black
     dot of random strength (0–10% opacity, half of theirs), re-rolled ~30 times a second. Built from a few pre-made
     tiles drawn at random offsets each frame, so it costs almost nothing. */
  (() => {
    const cv = document.createElement('canvas'); cv.className = 'page-noise'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const cx = cv.getContext('2d'), T = 256, tiles = [];
    for (let k = 0; k < 5; k++) {
      const c = document.createElement('canvas'); c.width = c.height = T;
      const x = c.getContext('2d'), d = x.createImageData(T, T);
      for (let i = 3; i < d.data.length; i += 4) d.data[i] = Math.random() * 0.1 * 255;   // black, alpha 0–0.1 (half the MacMillan strength)
      x.putImageData(d, 0, 0); tiles.push(cx.createPattern(c, 'repeat'));
    }
    const size = () => { const r = cv.getBoundingClientRect(); cv.width = Math.ceil(r.width || innerWidth); cv.height = Math.ceil(Math.max(r.height, innerHeight, (visualViewport && visualViewport.height) || 0)); };   // 1 noise dot per CSS pixel, sized to the full (large) viewport so iOS toolbars never leave a gap
    size(); addEventListener('resize', size); addEventListener('orientationchange', () => setTimeout(size, 300));
    const FRAME = 33;   // same grain cadence on phones as desktop (phones no longer run live WebGL, so there is headroom)
    let k = 0, last = 0;
    const draw = () => {
      k = (k + 1 + (Math.random() * (tiles.length - 1) | 0)) % tiles.length;
      cx.clearRect(0, 0, cv.width, cv.height);
      cx.save(); cx.translate(-Math.random() * T | 0, -Math.random() * T | 0); cx.fillStyle = tiles[k]; cx.fillRect(0, 0, cv.width + T, cv.height + T); cx.restore();
    };
    draw();
    if (reduce) return;
    const loop = now => { if (document.hidden) return; if (now - last > FRAME) { last = now; draw(); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(loop); });
  })();

  /* =========================================================
     TESTIMONIALS — quotes write themselves in, story-style timer
     ========================================================= */
  (() => {
    const stage = $('#tqStage'); if (!stage) return;
    const qs = $$('.tq', stage), bars = $$('.tq__bar'), now = $('#tqNow'), N = qs.length, DUR = 5000;
    let cur = 0, t0 = performance.now(), paused = false, visible = false, pausedAt = 0;
    const show = i => {
      const prev = qs[cur]; cur = (i + N) % N;
      if (prev !== qs[cur]) { prev.classList.remove('is-on'); prev.classList.add('is-out'); prev.setAttribute('aria-hidden', 'true'); setTimeout(() => prev.classList.remove('is-out'), 900); }
      setTimeout(() => { qs[cur].classList.add('is-on'); qs[cur].setAttribute('aria-hidden', 'false'); }, prev !== qs[cur] ? 380 : 0);
      bars.forEach((b, k) => { b.classList.toggle('is-done', k < cur); b.querySelector('i').style.setProperty('--p', k < cur ? 1 : 0); });
      if (now) now.textContent = String(cur + 1).padStart(2, '0');
      t0 = performance.now();
    };
    const tick = n => {
      if (visible && !paused && !reduce) {
        const p = Math.min(1, (n - t0) / (qs[cur]._dur || (qs[cur]._dur = Math.min(13000, Math.max(DUR, 3500 + qs[cur].textContent.trim().split(/\s+/).length * 70)))));
        bars[cur]?.querySelector('i').style.setProperty('--p', p.toFixed(4));
        if (p >= 1) show(cur + 1);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    $('#tqPrev')?.addEventListener('click', () => show(cur - 1));
    $('#tqNext')?.addEventListener('click', () => show(cur + 1));
    bars.forEach((b, k) => b.addEventListener('click', () => show(k)));
    const sec = $('#testimonials');
    let sx = null;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; });
    addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });
    new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was) { t0 = performance.now(); show(cur); } }, { threshold: .35 }).observe(sec);
  })();

  /* footer clock — live time in South Wales (Europe/London, so it flips to BST automatically) */
  (() => {
    const els = $$('.clock__t'); if (!els.length) return;   // every clock on the page (the homepage has one per CTA variant)
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' });
    const tick = () => {
      const p = Object.fromEntries(fmt.formatToParts(new Date()).map(x => [x.type, x.value]));
      els.forEach(el => {
        const h = $('[data-h]', el), m = $('[data-m]', el), sx = $('[data-s]', el), z = $('[data-z]', el); if (!h) return;
        h.textContent = p.hour === '24' ? '00' : p.hour; m.textContent = p.minute; sx.textContent = p.second;
        z.textContent = (p.timeZoneName || 'GMT').replace('GMT+1', 'BST');
        el.classList.add('is-tick'); setTimeout(() => el.classList.remove('is-tick'), 350);
      });
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
  })();

  /* cookie tab — appears quietly after the intro, remembers the choice */
  (() => {
    const el = $('#consent'); if (!el) return;
    let saved = null; try { saved = localStorage.getItem('drvn-consent'); } catch (e) {}
    if (saved) return;
    el.hidden = false;
    setTimeout(() => el.classList.add('is-on'), root.classList.contains('intro') ? 6000 : 1500);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-consent]'); if (!b) return;
      try { localStorage.setItem('drvn-consent', b.dataset.consent); } catch (er) {}
      window.dispatchEvent(new CustomEvent('drvn:consent', { detail: b.dataset.consent }));   // hook analytics / pixel here later
      el.classList.remove('is-on'); setTimeout(() => el.remove(), 600);
    });
  })();

  /* inner pages: the bottom CTA plays in like the homepage finale once it's properly on screen — lines blur/lift in
     one after another, then the copy + button rise. Resets when it leaves so it plays again. */
  (() => {
    const sec = $('.pfoot'); if (!sec) return;
    new IntersectionObserver(([e]) => sec.classList.toggle('is-in', e.isIntersecting), { threshold: 0.45 }).observe($('.pfoot__in', sec) || sec);
  })();

  /* podcast posts: swap the poster for the YouTube player on click (nothing loads from YouTube until then) */
  // Instagram post: poster first, the official embed only loads when someone clicks it
  $$('.post__ig-ph[data-ig]').forEach(el => {
    const go = () => { if (el.querySelector('iframe')) return; const f = document.createElement('iframe'); f.src = el.dataset.ig; f.title = 'Instagram post'; f.allow = 'autoplay; encrypted-media'; f.setAttribute('allowfullscreen', ''); f.scrolling = 'no'; el.appendChild(f); el.classList.add('is-live'); };
    el.addEventListener('click', go); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  // post video in the big lightbox player (Vimeo); native cursor comes back while it's open
  $$('.post__embed[data-vimeo-lb]').forEach(el => {
    const lb = $('#pjLb'), stage = lb && $('.pj-lb__stage', lb); if (!lb) return;
    const close = () => { lb.classList.remove('is-open'); document.documentElement.classList.remove('is-lb-open'); document.documentElement.style.overflow = ''; setTimeout(() => { lb.hidden = true; stage.innerHTML = ''; }, 300); };
    const open = () => {
      stage.innerHTML = `<iframe src="https://player.vimeo.com/video/${el.dataset.vimeoLb}?autoplay=1&dnt=1&title=0&byline=0&portrait=0" title="The Turning Tide" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      lb.hidden = false; document.documentElement.classList.add('is-lb-open'); document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => lb.classList.add('is-open')); $('.pj-lb__x', lb).focus();
    };
    el.addEventListener('click', open);
    $('.pj-lb__x', lb).addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb || e.target === stage) close(); });
    addEventListener('keydown', e => { if (!lb.hidden && e.key === 'Escape') close(); });
  });
  $$('.post__embed[data-vimeo]').forEach(el => el.addEventListener('click', () => {
    const f = document.createElement('iframe'); f.src = `https://player.vimeo.com/video/${el.dataset.vimeo}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`; f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = 'The Turning Tide';
    el.appendChild(f); el.querySelector('.post__play')?.remove();
  }, { once: true }));
  $$('.post__embed[data-yt]').forEach(el => el.addEventListener('click', () => {
    const f = document.createElement('iframe'); f.src = `https://www.youtube-nocookie.com/embed/${el.dataset.yt}?autoplay=1&rel=0`; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = 'DRVN Social Podcast';
    el.appendChild(f); el.querySelector('.post__play')?.remove();
  }, { once: true }));
})();
