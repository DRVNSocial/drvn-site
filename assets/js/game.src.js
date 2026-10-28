/* DRVN Invaders: the footer Easter egg. Desktop only. Hover the footer logo (DRVN rolls to PLAY), click, and the page drops
   away into a small camera-vs-icons shooter on the footer's hairline. Everything here is self-contained: sprites are drawn
   from text maps, sounds are synthesised, the falling icons are the site's own baked glass filmstrips. */
(() => { try {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || innerWidth < 901) return;
  const bars = [...document.querySelectorAll('.finale__bar')]; if (!bars.length) return;
  const ROOT = (document.querySelector('script[src*="game.js"]')?.getAttribute('src') || '').replace(/assets\/js\/game\.js.*$/, '');
  const html = document.documentElement;
  const GEM = n => new URL(ROOT + 'assets/img/gems/' + n + '.webp', location.href).href;   // absolute: a url() inside an inline custom property resolves against the stylesheet in Chrome

const LETTERS = [
  ['P', 0, 40.9, 'M6.47109 0H27.3911C36.2427 0 40.8103 6.09073 39.0971 14.7522L38.3363 18.5591C36.528 27.6485 31.9128 33.3113 20.92 33.3113H0L6.47109 0ZM31.9128 18.5591L32.6735 14.7522C33.9113 8.51882 30.675 6.04318 26.2024 6.04318H11.706L7.61382 27.2665H22.1102C26.5828 27.2665 30.675 24.7925 31.9128 18.5575V18.5591Z'],
  ['L', 37.3, 66.5, 'M43.8565 0H57.2758C62.9862 0 66.4127 3.902 66.4127 7.61382C66.4127 14.6095 62.3205 19.7002 54.1837 19.7002H47.57L57.5267 27.2468C57.8283 27.4763 58.1972 27.5993 58.5759 27.5993H64.5371V33.3096H58.0874C54.9461 33.3096 53.5673 32.644 51.1867 30.6455L45.1911 25.6958L43.7155 33.3096H37.3871L43.8565 0ZM54.1345 13.7521C57.7037 13.7521 59.6072 12.0388 59.6072 8.70736C59.6072 7.18427 58.6563 5.94809 56.038 5.94809H49.0423L47.5192 13.7521H54.1329H54.1345Z'],
  ['A', 68, 95.7, 'M68.0702 0H74.5413L74.2085 32.121L88.6983 0H95.6465L80.3467 33.3096H68.0702V0Z'],
  ['Y', 90.5, 124, 'M96.9713 0H109.248L111.532 32.3587L117.814 0H124L117.529 33.3096H104.965L102.919 1.18863L96.686 33.3096H90.5002L96.9713 0Z'],
];
function buildLogo(a) {
  const S = 78 / 124;
  a.innerHTML = LETTERS.map(([p, x0, x1, d]) => `<span class="lt" style="left:${(x0 * S).toFixed(1)}px;width:${((x1 - x0) * S).toFixed(1)}px"><span class="lt__roll"><span><svg viewBox="${x0} 0 ${x1 - x0} 34" width="${((x1 - x0) * S).toFixed(1)}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg></span><span class="p">${p}</span></span></span>`).join('');
}

  // ---- footer set-up: every bar gets the rolling logo and its game-mode cells (hidden until play) ----
  const STAR = '';
  bars.forEach(bar => {
    const home = bar.querySelector('.finale__home'); if (!home) return;
    home.classList.add('gi-logo'); home.setAttribute('aria-label', 'DRVN. Play a game'); buildLogo(home);
    home.addEventListener('click', e => { e.preventDefault(); (G.on || G.over) ? quit(false) : start(bar); });
    const brand = bar.querySelector('.finale__brand'); brand && brand.insertAdjacentHTML('beforeend', '<div class="gi-help gi-g"><span><b>&larr; &rarr;</b> MOVE</span><span><b>SPACE</b> SHOOT</span><span><b>ESC</b> QUIT</span><span><b>M</b> SOUND <i class="gi-snd" aria-hidden="true"></i></span></div>');
    const links = bar.querySelector('.finale__links'); links && links.insertAdjacentHTML('beforeend', `<div class="gi-lives gi-g" aria-label="Lives">${[0, 1, 2].map(i => `<i style="animation-delay:${(-i * .8).toFixed(1)}s"></i>`).join('')}</div>`);   // the heart strip only loads once a game starts
    const clock = bar.querySelector('.clock'); clock && clock.insertAdjacentHTML('beforeend', '<div class="gi-score gi-g"><span class="k">Score</span><span class="v">000000</span><span class="hi">HI <span class="hiv">000000</span></span><span class="pt"><i></i></span></div>');
  });
  // ---- the game layer: fixed over the page, ending at the top of the footer ----
  const gi = document.createElement('div'); gi.className = 'gi'; gi.id = 'gi';
  gi.innerHTML = `<div class="gi-hud gi-hud--tl"><span class="k">DRVN INVADERS</span><br><span class="big">WAVE <span id="giWave">01</span></span><br><span class="k">MEMORY</span><br><span class="big" id="giAmmo">24 / 24</span></div>
  <div class="gi-hud gi-hud--tr"><span class="k">NEXT CAMERA</span><br><span class="big" id="giNextAt">800</span><br><span class="k" id="giNextName">OSMO POCKET 4</span></div>
  <div class="gi-msg" id="giMsg" hidden></div><div id="giStage"></div>
  <div class="gi-player" id="giPlayer"><span class="cage" aria-hidden="true"></span><span class="shadow"></span></div>`;
  document.body.appendChild(gi);
  const screen = gi, stage = gi.querySelector('#giStage'), player = gi.querySelector('#giPlayer'), msg = gi.querySelector('#giMsg');
  const waveEl = gi.querySelector('#giWave'), ammoEl = gi.querySelector('#giAmmo'), nextAt = gi.querySelector('#giNextAt'), nextName = gi.querySelector('#giNextName');
  let bar = null, logo = null, scoreEl = null, scoreV = null, hiV = null, pt = null, lives = [], dropped = [];
  const fit = () => { if (bar) gi.style.bottom = bar.offsetHeight + 'px'; };
  function bind(b) {
    bar = b; logo = b.querySelector('.gi-logo'); scoreEl = b.querySelector('.gi-score'); scoreV = scoreEl.querySelector('.v'); hiV = scoreEl.querySelector('.hiv'); pt = scoreEl.querySelector('.pt i'); lives = [...b.querySelectorAll('.gi-lives i')];
    hiV.textContent = fmt(G.hi);
  }
  // entering: lock the page, pin the footer, drop the CTA pieces, fade the chrome
  function enter() {
    lives.forEach(i => { if (!i.classList.contains('gem')) { i.className = 'gem'; i.style.setProperty('--g', `url(${GEM('heart')})`); } });
    fit(); bar.classList.add('gi-bar'); html.classList.add('gi-on'); gi.classList.add('is-on');
    const sec = bar.parentElement;
    dropped = [...sec.querySelectorAll('.finale__title .line, .pfoot__in .line, #finaleFoot > *, .pfoot__foot > *')];
    dropped.forEach((el, i) => { el.classList.add('gi-drop'); el.style.setProperty('--gd', (i * .08) + 's'); el.style.setProperty('--gr', (i % 2 ? -5 : 4) + 'deg'); });
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('gi-dropped')));
  }
  function leave() {
    html.classList.remove('gi-dropped'); gi.classList.remove('is-on');
    setTimeout(() => { html.classList.remove('gi-on'); bar.classList.remove('gi-bar'); dropped.forEach(el => { el.classList.remove('gi-drop'); el.style.removeProperty('--gd'); el.style.removeProperty('--gr'); }); dropped = []; }, 950);
  }

const PAL = { k:'#1e1a24', d:'#33313d', m:'#55535f', h:'#87859a', w:'#d2d0dc', s:'#c9c7d2', S:'#ecebf2', b:'#1f3f6b', B:'#3f7fd6', L:'#a9d5ff', r:'#e0433a', R:'#c4161c', y:'#f2c23e', o:'#c8742a', g:'#4caf6a', t:'#26242e' };
const SPR = {
  // DJI Osmo Action 6: squat rounded box, lens left, front screen right, shutter on top
  action: [
    '.......kkkk...........',
    '......khhhhk..........',
    '...kkkkkkkkkkkkkkkk...',
    '..khhhhhhhhhhhhhhhhk..',
    '.khmmkkkkkmmmmmmmmmmk.',
    'khmmkbbbbbkmmkkkkkkmmk',
    'khmkbLLBBBbkmkwwwwkmmk',
    'khmkbLBBBBbkmkwwwwkrmk',
    'khmkbBBBBBbkmkwwwwkmmk',
    'khmkbbBBBbbkmkwwwwkmmk',
    'khmmkbbbbbkmmkkkkkkmmk',
    'kdmmmkkkkkmmmmmmmmmmdk',
    '.kdddddddddddddddddddk',
    '..kkkkkkkkkkkkkkkkkk..',
  ],
  // DJI Osmo Pocket 4: 1-inch gimbal head on a slim handle with a flip screen and a wheel
  pocket: [
    '......kkkkkk......',
    '.....khhhhhhk.....',
    '....khmkkkkmhk....',
    '....khkbBBbkhk....',
    '....khkbLBbkhk....',
    '....khkbBBbkhk....',
    '....khmkkkkmdk....',
    '.....kdmmmmdk.....',
    '......kkddkk......',
    '.......kdk........',
    '.....kkkddkkk.....',
    '....khhhhhhhhk....',
    '....khmmmmmmhk....',
    '....khkkkkkkhk....',
    '....khkwwwwkhk....',
    '....khkwwwwkhk....',
    '....khkkkkkkhk....',
    '....khmmmmmmhk....',
    '....khmmkkmmhk....',
    '....khmmkrmmhk....',
    '....khmmmmmmhk....',
    '....kdmmmmmmdk....',
    '....kddddddddk....',
    '.....kkkkkkkk.....',
  ],
  // Fujifilm X100VI: silver top plate with dials, viewfinder window, black leatherette, centred lens
  compact: [
    '..kkkk....kkkk..............',
    '.khSShk..khSShk.............',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'kSSSSSSSSSSSSSSSSSSSSSSSSSSk',
    'kskkkksssssssssssssssssssssk',
    'kskLBkssssskkkkkksssssssskyk',
    'ksskkksssskbbbbbbksssssssssk',
    'kttttttttkbBBLLBBbkttttttttk',
    'kttttttttkbBLLBBBbkttttttttk',
    'ktrttttttkbBBBBBBbkttttttttk',
    'kttttttttkbBBBBBbbkttttttttk',
    'ktttttttttkbbbbbbkttttttttmk',
    'kttttttttttkkkkkkttttttttttk',
    'kdttttttttttttttttttttttttdk',
    'kddddddddddddddddddddddddddk',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkk.',
  ],
  // Sony FX3: boxy black body, no hump, XLR top handle, tally light, big lens, grip
  mirrorless: [
    '......kkkkkkkkkkkkkkkkkk............',
    '.....khhhhhhhhhhhhhhhhhhk...........',
    '.....khmmmmmmmmmmmmmmmmmhk..........',
    '.....kkkkkkkmmmmmkkkkkkkkk..........',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'khhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk',
    'krmmmmmmmmmmmmkkkkkkkmmmmmmmmmmmmmmk',
    'kmmkdkdkmmmmkkbbbbbbbkkmmmmmmmkkkmmk',
    'kmmmmmmmmmmkbbBBBBBBBbbkmmmmmmkdkmmk',
    'kmmkdkdkmmkbbBBLLLBBBBbbkmmmmmkdkmmk',
    'kmmmmmmmmmkbBBLLBBBBBBBbkmmmmmkdkmmk',
    'kmmkdkdkmmkbBBLBBBBBBBBbkmmmmmkdkmmk',
    'kmmmmmmmmmkbBBBBBBBBBBBbkmmmmmkdkmrk',
    'kmmkdkdkmmkbbBBBBBBBBBbbkmmmmmkkkmmk',
    'kmmmmmmmmmmkbbBBBBBBBbbkmmmmmmmmmmmk',
    'kdmmmmmmmmmmkkbbbbbbbkkmmmmmmmmmmmdk',
    'kddddddddddddddkkkkkkkddddddddddddddk'.slice(0, 36),
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
  ],
  // RED V-Raptor: the brick, top handle, big mount with lens, red band, side monitor
  cinema: [
    '..........kkkkkkkkkkkkkkkkkk............',
    '.........khhhhhhhhhhhhhhhhhhk...........',
    '.........khmmmmmmmmmmmmmmmmmhk..........',
    '.........kkkkkkkkkkkkkkkkkkkkk..........',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'khhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk',
    'kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmkkkkkkkmk',
    'kmkkkkkkkkmmmmmmkkkkkkkkkkmmmmmkwwwwwkmk',
    'kmkRRRRRRkmmmmkkbbbbbbbbbkkmmmmkwwwwwkmk',
    'kmkRRRRRRkmmmkbbBBBBBBBBBbbkmmmkwwwwwkmk',
    'kmkkkkkkkkmmkbbBBLLLBBBBBBbbkmmkwwwwwkmk',
    'kmmmmmmmmmmmkbBBLLBBBBBBBBBbkmmkkkkkkkmk',
    'kmkdkdkdkdkmkbBBLBBBBBBBBBBbkmmmmmmmmmmk',
    'kmkdkdkdkdkmkbBBBBBBBBBBBBBbkmmmmmmmmmmk',
    'kmkdkdkdkdkmkbbBBBBBBBBBBBbbkmmmmmmmrmmk',
    'kmmmmmmmmmmmmkbbBBBBBBBBBbbkmmmmmmmmmmmk',
    'kmmmmmmmmmmmmmkkbbbbbbbbbkkmmmmmmmmmmmmk',
    'kdmmmmmmmmmmmmmmkkkkkkkkkmmmmmmmmmmmmmdk',
    'kddddddddddddddddddddddddddddddddddddddk',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '......kkkk...................kkkk.......',
    '.....kddddk.................kddddk......',
    '......kkkk...................kkkk.......',
  ],
  // power-ups
  // camera cage: open aluminium frame with a top handle, 1/4-20 holes, and the dark camera body visible inside
  cage: [
    '.....kkkkkkkk.....',
    '....ksssssssSk....',
    '....kskkkkkksk....',
    'kkkkkskkkkkkskkkkk',
    'ksssssssssssssssSk',
    'kskskskskskskskssk',
    'kssssssssssssssssk',
    'ksk..kttttttk..ksk',
    'ksk..kttttttk..ksk',
    'ksk..ktkkkktk..ksk',
    'ksk..ktkBBktk..ksk',
    'ksk..ktkkkktk..ksk',
    'ksk..kttttttk..ksk',
    'kssssssssssssssssk',
    'kskskskskskskskssk',
    'kdssssssssssssssdk',
    'kddddddddddddddddk',
    '.kkkkkkkkkkkkkkkk.',
  ],
  // prime lens: barrel side-on with a ribbed focus ring and the front element on the right
  lens: [
    '........kkkkkkkk......',
    '.....kkkhhhhhhhhkk....',
    '..kkkhmhmhmhmhmhhhkk..',
    '.khhhhmhmhmhmhmhmhhhk.',
    'kmmmmhmhmhmhmhmhmhmkbk',
    'kmkkkmmhmhmhmhmhmhmkbBk',
    'kmkrkmmmmhmhmhmhmhmkBLk',
    'kmkkkmmmmhmhmhmhmhmkBBk',
    'kmmmmmmmmmhmhmhmhmmkbBk',
    'kddddmdmdmdmdmdmdmmkbk',
    '.kdddddmdmdmdmdmdddk..',
    '..kkkdddmdmdmdmdkkk...',
    '.....kkkddddddkk......',
    '........kkkkkkkk......',
  ],
  nd: [
    '...kkkkkkkk...',
    '.kkmmmmmmmmkk.',
    'kmmkkkkkkkkmmk',
    'kmkddddmmmmkmk',
    'kmkdddmmmhhkmk',
    'kmkddmmmhhhkmk',
    'kmkdmmmhhhwkmk',
    'kmkmmmhhhwwkmk',
    'kmmkkkkkkkkmmk',
    '.kkmmmmmmmmkk.',
    '...kkkkkkkk...',
  ],
  battery: [
    '......kkkk......',
    '.....khhhhk.....',
    '.kkkkkhhhhkkkkk.',
    'kggggggggggggggk',
    'kgLLgggggggggggk',
    'kgLggggggggggggk',
    'kggggggggggggggk',
    'kggggggggggggggk',
    'kggggggggggggggk',
    'kggggggggggggggk',
    'kdggggggggggggdk',
    'kddddddddddddddk',
    '.kkkkkkkkkkkkkk.',
  ],
  card: [
    '.kkkkkkkkkk..',
    'kooooooooook.',
    'kooyyyyyyoook',
    'kooyyyyyyoook',
    'koooooooooook',
    'kokokokokokok',
    'kokokokokokok',
    'koooooooooook',
    'kdooooooooodk',
    'kdddddddddddk',
    '.kkkkkkkkkkk.',
  ],
  burst: [
    '.y..y..y.',
    '..y.y.y..',
    '...yyy...',
    'yyy...yyy',
    '...yyy...',
    '..y.y.y..',
    '.y..y..y.',
  ],
  heartlost: [
    '.dd..dd.',
    'dddddddd',
    'dddddddd',
    'dddddddd',
    '.dddddd.',
    '..dddd..',
    '...dd...',
  ],
};
function px(map, s) {
  const h = map.length, w = Math.max(...map.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w * s; c.height = h * s; c.className = 'px';
  const g = c.getContext('2d');
  map.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x * s, y * s, s, s); } }));
  return c;
}

const TIERS = [
  ['action', 'Osmo Action 6', 0, 'Single shot. One bolt at a time, so pick your targets.', [14], 'OSMO ACTION 6', 24],
  ['pocket', 'Osmo Pocket 4', 800, 'Twin shot. The gimbal keeps two bolts dead straight, slightly faster fire.', [12, 12], 'OSMO POCKET 4', 30],
  ['compact', 'Fujifilm X100VI', 2200, 'Spread. Three bolts in a fan, and the flash lights the screen on each hit.', [10, 16, 10], 'X100VI', 36],
  ['mirrorless', 'Sony FX3', 5000, 'Burst mode. Rapid fire, four bolts wide.', [16, 18, 18, 16], 'SONY FX3', 44],
  ['cinema', 'RED V-Raptor', 10000, 'The rig. A continuous beam under the lens that burns through whatever is above it, plus the burst.', [26], 'RED V-RAPTOR', 56],
];
const ICONS = ['heart', 'smiley', 'at', 'cursor', 'hashtag', 'bubble', 'bell', 'bolt', 'plane', 'rocket', 'asterisk'];
const SND = (() => {
  let ctx, muted = false; try { muted = localStorage.getItem('drvn-inv-mute') === '1'; } catch (e) {}
  const ind = { classList: { toggle(c, v) { document.querySelectorAll('.gi-snd').forEach(e => e.classList.toggle(c, v)); } } }; const paint = () => ind.classList.toggle('is-off', muted);
  paint();
  const ac = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
  const tone = (f, t, type = 'square', vol = .08, slide = 0) => {
    if (muted) return; const c = ac(), o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, n); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), n + t);
    g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(.0001, n + t);
    o.connect(g).connect(c.destination); o.start(n); o.stop(n + t);
  };
  const noise = (t, vol = .12) => {
    if (muted) return; const c = ac(), b = c.createBuffer(1, c.sampleRate * t, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    s.buffer = b; g.gain.value = vol; s.connect(f).connect(g).connect(c.destination); s.start();
  };
  const arp = (notes, step = .07, type = 'square') => notes.forEach((f, i) => setTimeout(() => tone(f, .12, type, .07), i * step * 1000));
  return {
    shoot: () => tone(880, .08, 'square', .05, -500),
    click: () => tone(140, .04, 'square', .04),
    hit: () => { noise(.12); tone(220, .1, 'square', .05, -120); },
    pick: () => arp([523, 659, 784, 1047], .05),
    up: () => arp([392, 523, 659, 784, 1047, 1319], .06),
    hurt: () => arp([330, 262, 196, 131], .09, 'sawtooth'),
    over: () => arp([262, 220, 196, 165, 131, 98], .12, 'sawtooth'),
    start: () => arp([262, 330, 392, 523], .06),
    toggle() { muted = !muted; paint(); try { localStorage.setItem('drvn-inv-mute', muted ? '1' : '0'); } catch (e) {} if (!muted) tone(660, .08); },
    unlock() { try { ac().resume(); } catch (e) {} },
  };
})();

const fmt = n => String(Math.min(999999, n)).padStart(6, '0');

const G = { on: false, over: false, foes: [], bolts: [], drops: [], fx: [], score: 0, hi: 0, lives: 3, wave: 1, tier: 0, kills: 0, ammo: 24, cap: 24, x: 0, vx: 0, keys: {}, cool: 0, spawnT: 0, dropT: 0, shield: false, lensT: 0, ndT: 0, x2T: 0, beamT: 0, t: 0 };
try { G.hi = +localStorage.getItem('drvn-inv-hi') || 0; } catch (e) {}
let sprite = null;
function setAmmo(n) { G.ammo = Math.max(0, Math.min(G.cap, n)); ammoEl.textContent = G.ammo + ' / ' + G.cap; ammoEl.classList.toggle('is-low', G.ammo > 0 && G.ammo <= 5); ammoEl.classList.toggle('is-empty', G.ammo === 0); }
function setTier(i, quiet) {
  G.tier = i; sprite && sprite.remove(); sprite = px(SPR[TIERS[i][0]], 3); player.prepend(sprite);
  G.cap = TIERS[i][6]; setAmmo(G.cap);   // a new camera comes with a fresh card
  const nx = TIERS[i + 1]; nextAt.textContent = nx ? nx[2] : 'MAX'; nextName.textContent = nx ? nx[5] : TIERS[i][5];
  if (!quiet) { player.classList.remove('is-up'); void player.offsetWidth; player.classList.add('is-up'); SND.up(); toast(TIERS[i][5] + ' UNLOCKED'); }
}
function toast(t) { const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; screen.appendChild(e); setTimeout(() => e.remove(), 1700); }
function W() { return screen.clientWidth; }
function H() { return screen.clientHeight; }       // y of the baseline (the layer ends at the footer's top edge)
function placePlayer() { player.style.transform = `translateX(${G.x - sprite.width / 2}px)`; }
function reset() {
  stage.innerHTML = ''; G.foes = []; G.bolts = []; G.drops = []; G.fx = [];
  G.score = 0; G.lives = 3; G.wave = 1; G.kills = 0; G.cool = 0; G.spawnT = .6; G.dropT = 9; G.shield = false; G.lensT = G.ndT = G.x2T = 0; G.t = 0;
  G.x = W() / 2; setTier(0, true); placePlayer(); lives.forEach(l => l.classList.remove('is-lost'));
  scoreV.textContent = fmt(0); waveEl.textContent = '01'; player.classList.remove('is-shield', 'is-up'); scoreEl.classList.remove('is-x2', 'is-timed'); screen.classList.remove('is-nd');
}
// PLAY: the page drops away (about a second), the footer swaps to game mode, then the icons start
function start(b) {
  if (b) bind(b);
  if (G.starting || G.on) return; G.starting = true;
  enter();
  const wasLive = screen.classList.contains('is-live');
  SND.unlock(); reset(); void player.offsetWidth; screen.classList.add('is-live'); logo.classList.add('is-on'); msg.hidden = true; SND.start();
  setTimeout(() => { G.starting = false; G.on = true; G.over = false; last = performance.now(); requestAnimationFrame(loop); }, wasLive ? 150 : 1000);
}
function clear() { G.foes.forEach(f => f.el.remove()); G.bolts.forEach(b => b.el.remove()); G.drops.forEach(d => d.el.remove()); G.foes = []; G.bolts = []; G.drops = []; stage.querySelectorAll('.beam').forEach(b => b.remove()); }
// game over keeps you in game mode with the result up; ESC (or the logo) brings the page back
function quit(dead) {
  G.on = false; G.over = !!dead;
  if (G.score > G.hi) { G.hi = G.score; hiV.textContent = fmt(G.hi); try { localStorage.setItem('drvn-inv-hi', G.hi); } catch (e) {} }
  if (dead) {
    msg.innerHTML = `<b>GAME OVER</b><span>SCORE <span class="y">${fmt(G.score)}</span> &middot; WAVE ${String(G.wave).padStart(2, '0')} &middot; ${TIERS[G.tier][5]}</span><span class="blink">Space to go again &middot; ESC for the site</span>`;
    msg.hidden = false; SND.over(); setTimeout(clear, 400);
  } else {
    G.over = false; msg.hidden = true; screen.classList.remove('is-live', 'is-nd'); logo.classList.remove('is-on'); clear(); leave();
  }
}
const SIZES = [['foe--big', 112, 25, .85], ['', 88, 50, 1], ['foe--sm', 66, 100, 1.25]];
function spawnFoe() {
  const mob = false, si = Math.random() < .25 ? 0 : Math.random() < .35 ? 2 : 1, [cls, size0, pts, spd] = SIZES[si], size = mob ? size0 * .64 : size0;
  const el = document.createElement('b'); el.className = 'foe ' + cls; el.innerHTML = `<i class="gem" style="--g:url(${GEM(ICONS[Math.random() * ICONS.length | 0])});animation-delay:${(-Math.random() * 2.6).toFixed(2)}s"></i>`;
  const f = { el, x: 20 + Math.random() * (W() - size - 40), y: -size, size, pts, v: (62 + G.wave * 13) * spd * (0.85 + Math.random() * .4), sway: (Math.random() - .5) * 40, ph: Math.random() * 6 };
  stage.appendChild(el); G.foes.push(f);
}
function spawnDrop() {
  const low = G.ammo <= G.cap * .3;
  const pool = ['cage', 'lens', 'nd', 'card', 'card'].concat(G.lives < 3 ? ['battery', 'battery'] : []).concat(low ? ['card', 'card', 'card', 'card'] : []);
  const k = pool[Math.random() * pool.length | 0], el = document.createElement('b'); el.className = 'drop'; const c = px(SPR[k], 3); el.appendChild(c);
  const d = { el, k, x: 40 + Math.random() * (W() - 100), y: -c.height, w: c.width, h: c.height, v: 90 };
  stage.appendChild(el); G.drops.push(d);
}
function shoot() {
  if (G.cool > 0) return;
  if (G.ammo <= 0) { G.cool = .25; SND.click(); return; }
  setAmmo(G.ammo - 1);
  const t = G.tier, baseY = H() - sprite.height - 6, x = G.x;
  const add = (dx, vx) => { const el = document.createElement('i'); el.className = 'bolt'; stage.appendChild(el); G.bolts.push({ el, x: x + dx, y: baseY, vx, vy: -720 }); };
  if (t === 0) { add(0, 0); G.cool = .42; }
  else if (t === 1) { add(-8, 0); add(8, 0); G.cool = .34; }
  else if (t === 2) { add(0, 0); add(-10, -170); add(10, 170); G.cool = .3; }
  else { add(-14, 0); add(-5, 0); add(5, 0); add(14, 0); G.cool = .17; }
  SND.shoot();
}
function burstAt(x, y, text, cls) {
  const b = px(SPR.burst, 5); b.className += ' burst'; b.style.transform = ''; b.style.left = (x - b.width / 2) + 'px'; b.style.top = (y - b.height / 2) + 'px'; stage.appendChild(b); setTimeout(() => b.remove(), 340);
  if (text) { const p = document.createElement('span'); p.className = 'pop' + (cls ? ' ' + cls : ''); p.textContent = text; p.style.left = (x + 14) + 'px'; p.style.top = (y - 16) + 'px'; stage.appendChild(p); setTimeout(() => p.remove(), 720); }
}
function addScore(n) { G.score += G.x2T > 0 ? n * 2 : n; scoreV.textContent = fmt(G.score); const nx = TIERS[G.tier + 1]; if (nx && G.score >= nx[2]) setTier(G.tier + 1); }
function killFoe(f, i) { burstAt(f.x + f.size / 2, f.y + f.size / 2, '+' + (G.x2T > 0 ? f.pts * 2 : f.pts)); f.el.remove(); G.foes.splice(i, 1); addScore(f.pts); SND.hit(); if (++G.kills % 10 === 0) { G.wave++; waveEl.textContent = String(G.wave).padStart(2, '0'); toast('WAVE ' + String(G.wave).padStart(2, '0')); } }
function pickDrop(d, i) {
  d.el.remove(); G.drops.splice(i, 1); SND.pick();
  const names = { cage: 'SHIELD UP', lens: 'PRIME LENS', nd: 'ND FILTER', battery: '+1 LIFE', card: 'MEMORY FULL' };
  burstAt(d.x + d.w / 2, d.y + d.h / 2, names[d.k], 'pu');
  if (d.k === 'cage') { G.shield = true; player.classList.add('is-shield'); }
  if (d.k === 'lens') G.lensT = 8;
  if (d.k === 'nd') { G.ndT = 6; screen.classList.add('is-nd'); }
  if (d.k === 'card') setAmmo(G.cap);
  if (d.k === 'battery' && G.lives < 3) { G.lives++; lives[G.lives - 1].classList.remove('is-lost'); }
}
function hurt() {
  if (G.shield) { G.shield = false; player.classList.remove('is-shield'); SND.hit(); toast('SHIELD GONE'); return; }
  G.lives--; lives[G.lives]?.classList.add('is-lost'); SND.hurt(); screen.classList.remove('is-hurt'); void screen.offsetWidth; screen.classList.add('is-hurt');
  if (G.lives <= 0) quit(true);
}
let last = 0, beamEl = null;
function loop(now) {
  if (!G.on) return;
  let dt = Math.min(.05, (now - last) / 1000); last = now; G.t += dt;
  const slow = G.ndT > 0 ? .5 : 1, baseY = H();
  // timers
  if (G.lensT > 0 && (G.lensT -= dt) <= 0) G.lensT = 0;
  if (G.ndT > 0 && (G.ndT -= dt) <= 0) { G.ndT = 0; screen.classList.remove('is-nd'); }
  if (G.x2T > 0 && (G.x2T -= dt) <= 0) G.x2T = 0;
  scoreEl.classList.toggle('is-x2', G.x2T > 0);
  const timed = Math.max(G.lensT / 8, G.ndT / 6, G.x2T / 10); scoreEl.classList.toggle('is-timed', timed > 0); pt.style.setProperty('--p', timed.toFixed(3));
  // player
  const dir = (G.keys.ArrowRight || G.keys.KeyD ? 1 : 0) - (G.keys.ArrowLeft || G.keys.KeyA ? 1 : 0);
  if (G.touchX != null) G.x += (G.touchX - G.x) * Math.min(1, dt * 14); else G.x += dir * 560 * dt;
  G.x = Math.max(sprite.width / 2 + 8, Math.min(W() - sprite.width / 2 - 8, G.x)); placePlayer();
  G.cool -= dt; if (G.keys.Space || G.touchFire) shoot();
  // beam (lens power-up, or the cinema rig)
  const beam = G.lensT > 0 || G.tier === 4;
  if (beam) {
    if (!beamEl) { beamEl = document.createElement('i'); beamEl.className = 'beam'; stage.appendChild(beamEl); }
    beamEl.classList.toggle('beam--lens', G.lensT > 0);
    const bw = G.lensT > 0 ? 14 : 6, top = 0, bh = baseY - sprite.height - 4; beamEl.style.height = bh + 'px'; beamEl.style.transform = `translate(${G.x - bw / 2}px,${top}px)`;
    G.beamT -= dt;
    if (G.beamT <= 0) { // the beam burns the lowest icon in its column
      let best = -1, by = -1; G.foes.forEach((f, i) => { if (f.x < G.x + bw / 2 && f.x + f.size > G.x - bw / 2 && f.y > by) { by = f.y; best = i; } });
      if (best >= 0) { killFoe(G.foes[best], best); G.beamT = G.lensT > 0 ? .12 : .2; }
    }
  } else if (beamEl) { beamEl.remove(); beamEl = null; }
  // spawn
  G.spawnT -= dt * slow; if (G.spawnT <= 0) { spawnFoe(); G.spawnT = Math.max(.32, 1.25 - G.wave * .09) * (0.7 + Math.random() * .6); }
  G.dropT -= dt; if (G.dropT <= 0) { spawnDrop(); G.dropT = (G.ammo <= G.cap * .3 ? 5 : 10) + Math.random() * 6; }
  // bolts
  for (let i = G.bolts.length - 1; i >= 0; i--) {
    const b = G.bolts[i]; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < -20 || b.x < -10 || b.x > W() + 10) { b.el.remove(); G.bolts.splice(i, 1); continue; }
    let hit = false;
    for (let j = G.foes.length - 1; j >= 0; j--) { const f = G.foes[j], pad = f.size * .18; if (b.x > f.x + pad && b.x < f.x + f.size - pad && b.y > f.y + pad && b.y < f.y + f.size - pad) { killFoe(f, j); hit = true; break; } }
    if (!hit) for (let j = G.drops.length - 1; j >= 0; j--) { const d = G.drops[j]; if (b.x > d.x && b.x < d.x + d.w && b.y > d.y && b.y < d.y + d.h) { pickDrop(d, j); hit = true; break; } }
    if (hit) { b.el.remove(); G.bolts.splice(i, 1); continue; }
    b.el.style.transform = `translate(${b.x - 2}px,${b.y}px)`;
  }
  // foes
  for (let i = G.foes.length - 1; i >= 0; i--) {
    const f = G.foes[i]; f.y += f.v * slow * dt; const sx = Math.sin(G.t * 1.3 + f.ph) * f.sway;
    if (f.y + f.size * .8 >= baseY) { burstAt(f.x + f.size / 2, baseY - 10); f.el.remove(); G.foes.splice(i, 1); hurt(); if (!G.on) return; continue; }
    f.el.style.transform = `translate(${f.x + sx}px,${f.y}px)`;
  }
  // drops: fall, catch on the camera, or vanish past the line
  for (let i = G.drops.length - 1; i >= 0; i--) {
    const d = G.drops[i]; d.y += d.v * slow * dt;
    const px0 = G.x - sprite.width / 2, py0 = baseY - sprite.height - 5;
    if (d.y + d.h > py0 && d.x < px0 + sprite.width && d.x + d.w > px0 && d.y < baseY) { pickDrop(d, i); continue; }
    if (d.y > baseY) { d.el.remove(); G.drops.splice(i, 1); continue; }
    d.el.style.transform = `translate(${d.x}px,${d.y}px)`;
  }
  requestAnimationFrame(loop);
}
// input
addEventListener('keydown', e => {
  if (!G.on && !G.over) return;   // at rest the page keeps every key: space scrolls, M types, nothing is swallowed
  if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  G.keys[e.code] = true;
  if (e.code === 'Space' && !G.on && G.over) start();
  if (e.code === 'Escape' && (G.on || G.over)) quit(false);
  if (e.code === 'KeyM') SND.toggle();
});
addEventListener('keyup', e => { G.keys[e.code] = false; });

addEventListener('resize', () => { if (G.on) { G.x = Math.min(G.x, W() - 40); placePlayer(); fit(); } });

  // the first bar on the page is bound up front so hi-score shows; the clicked one takes over on play
  bind(bars.find(b => b.offsetParent) || bars[0]);
  setTier(0, true);
} catch (e) { console.warn('drvn invaders', e); } })();
