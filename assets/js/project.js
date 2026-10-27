/* Project page template: hero loop, long-form previews + player, photo carousel, social rail */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero loop: pause when off screen (saves battery), respect reduced motion
  const hv = $('.pj-hero__vid');
  if (hv) {
    if (reduce) { hv.removeAttribute('autoplay'); hv.pause(); }
    else {
      // phones get the 1080p encode (about a quarter of the weight); everything else the full one
      const src = (innerWidth <= 820 && hv.dataset.srcSm) ? hv.dataset.srcSm : hv.dataset.src;
      if (src && !hv.src) { hv.src = src; hv.load(); hv.play().catch(() => {}); }
      new IntersectionObserver(([e]) => { e.isIntersecting ? hv.play().catch(() => {}) : hv.pause(); }).observe(hv);
    }
  }

  // ---------- lightbox (shared) ----------
  const lb = $('#pjLb'), stage = lb && $('.pj-lb__stage', lb);
  let gallery = [], gi = 0, lastFocus = null;
  const open = () => { lastFocus = document.activeElement; document.documentElement.classList.add('is-lb-open'); lb.hidden = false; requestAnimationFrame(() => lb.classList.add('is-open')); document.documentElement.style.overflow = 'hidden'; $('.pj-lb__x', lb).focus(); };
  const close = () => {
    lb.classList.remove('is-open'); document.documentElement.classList.remove('is-lb-open'); document.documentElement.style.overflow = '';
    setTimeout(() => { lb.hidden = true; stage.innerHTML = ''; $$('.pj-lb__nav', lb).forEach(b => b.remove()); }, 300);
    lastFocus?.focus();
  };
  const showImg = i => { gi = (i + gallery.length) % gallery.length; stage.innerHTML = `<img src="${gallery[gi]}" alt="Photo ${gi + 1} of ${gallery.length}">`; };
  if (lb) {
    $('.pj-lb__x', lb).addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb || e.target === stage) close(); });
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (gallery.length && e.key === 'ArrowRight') showImg(gi + 1);
      if (gallery.length && e.key === 'ArrowLeft') showImg(gi - 1);
    });
  }

  // long-form grid: no orphans — if the small cards leave a single one on the last row of 3, widen first + last
  const small = $$('.lf-grid .lf:not(.lf--feat)');
  if (small.length % 3 === 1 && small.length > 3) { small[0].classList.add('lf--wide'); small[small.length - 1].classList.add('lf--wide'); }
  else if (small.length % 3 === 2) small[small.length - 1].classList.add('lf--wide');

  // featured episode with no local loop: play a muted YouTube preview in the card while it's on screen
  $$('.lf[data-preview="yt"]').forEach(c => {
    const slot = $('.lf__yt', c); if (!slot || reduce) return;
    let made = false;
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || made) return; made = true;
      const id = c.dataset.yt, f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&start=45&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3`;
      f.title = ''; f.tabIndex = -1; f.setAttribute('allow', 'autoplay; encrypted-media'); f.setAttribute('aria-hidden', 'true');
      f.addEventListener('load', () => setTimeout(() => c.classList.add('is-live'), 1800));
      slot.appendChild(f);
    }, { threshold: .35 }).observe(c);
  });

  // ---------- long-form: hover preview loops, click to play on YouTube (nocookie) ----------
  $$('.lf').forEach(c => {
    const v = $('.lf__loop', c);
    if (v && fine) {
      let dead = false;
      v.addEventListener('error', () => { dead = true; v.remove(); }, { once: true });
      c.addEventListener('pointerenter', () => { if (dead) return; if (!v.src) v.src = v.dataset.src; v.play().then(() => c.classList.add('is-playing')).catch(() => {}); });
      c.addEventListener('pointerleave', () => { c.classList.remove('is-playing'); setTimeout(() => v.pause(), 400); });
    }
    c.addEventListener('click', () => {
      const yt = c.dataset.yt, src = c.dataset.src;
      if (!lb) return window.open(yt ? 'https://www.youtube.com/watch?v=' + yt : src, '_blank');
      gallery = [];
      stage.innerHTML = yt
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0" title="${c.getAttribute('aria-label') || 'Video'}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : `<video src="${src}" controls autoplay playsinline poster="${c.querySelector('img')?.currentSrc || ''}"></video>`;
      open();
    });
  });

  // ---------- photography carousel: crossfade, story bars, click either half ----------
  const car = $('#pjCar');
  if (car) {
    const imgs = $$('.pj-car__img', car), bars = $('.pj-car__bars', car), cnt = $('.pj-car__count b', car), DUR = 2800;
    // decode every slide up front: a tap to the next photo must never flash the empty frame while it loads
    imgs.forEach(el => { const m = /url\(["']?([^"')]+)/.exec(el.style.backgroundImage); if (m) { const im = new Image(); im.src = m[1]; } });
    if (imgs.length > 1) {
      imgs.forEach((_, k) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i></i>'; b.setAttribute('aria-label', 'Photo ' + (k + 1)); b.addEventListener('click', () => go(k)); bars.appendChild(b); });
      let i = 0, t0 = performance.now(), vis = false;
      const go = n => {
        imgs[i].classList.remove('is-on'); i = (n + imgs.length) % imgs.length; imgs[i].classList.add('is-on');
        [...bars.children].forEach((b, k) => b.querySelector('i').style.setProperty('--p', k < i ? 1 : 0));
        if (cnt) cnt.textContent = String(i + 1).padStart(2, '0');
        t0 = performance.now();
      };
      const tick = now => {
        if (vis && !reduce && document.visibilityState === 'visible') {
          const p = Math.min(1, (now - t0) / DUR); bars.children[i].querySelector('i').style.setProperty('--p', p.toFixed(3));
          if (p >= 1) go(i + 1);
        } else t0 = now - (parseFloat(bars.children[i].querySelector('i').style.getPropertyValue('--p')) || 0) * DUR;
        requestAnimationFrame(tick);
      };
      $$('.pj-car__hit', car).forEach(h => h.addEventListener('click', () => go(i + +h.dataset.dir)));
      car.tabIndex = 0;
      car.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); });
      let sx = null;
      car.addEventListener('pointerdown', e => { sx = e.clientX; });
      car.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(i + (e.clientX < sx ? 1 : -1)); sx = null; });
      new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { threshold: .4 }).observe(car);
      go(0); requestAnimationFrame(tick);
    } else bars.remove();
  }

  // ---------- social rail: play what's on screen, drag to scroll ----------
  const sos = $$('.so video');
  const sio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && !reduce) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); }
    else v.pause();
  }), { threshold: .4 });
  sos.forEach(v => sio.observe(v));

  // mute / unmute per clip: only one clip has sound at a time; sound drops when the clip leaves the screen
  const mutes = $$('.so__mute');
  const setSound = (btn, on) => {
    const v = btn.parentElement.querySelector('video');
    v.muted = !on; btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', on ? 'Mute' : 'Unmute');
    if (on) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); }
  };
  mutes.forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const on = !b.classList.contains('is-on');
    mutes.forEach(x => { if (x !== b) setSound(x, false); });
    setSound(b, on);
  }));
  mutes.forEach(b => new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && b.classList.contains('is-on')) setSound(b, false); }), { threshold: .3 }).observe(b.parentElement));

  const rail = $('.so-rail');
  if (rail && fine) {
    let x0 = 0, s0 = 0, down = false, moved = false;
    // only capture the pointer once a real drag starts — capturing on pointerdown swallows clicks on the mute buttons
    rail.addEventListener('pointerdown', e => { if (e.button !== 0) return; down = true; moved = false; x0 = e.clientX; s0 = rail.scrollLeft; });
    rail.addEventListener('pointermove', e => {
      if (!down) return; const dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 6) { moved = true; rail.classList.add('is-drag'); try { rail.setPointerCapture(e.pointerId); } catch (_) {} }
      if (moved) rail.scrollLeft = s0 - dx;
    });
    const end = () => { down = false; rail.classList.remove('is-drag'); };
    rail.addEventListener('pointerup', end); rail.addEventListener('pointercancel', end);
    rail.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true); // a drag shouldn't count as a click
  }
})();
