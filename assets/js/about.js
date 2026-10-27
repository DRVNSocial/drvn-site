/* About page */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* FAQ accordion: one open at a time, heights animate so one closes as the next opens */
  const qs = [...document.querySelectorAll('.qa')];
  const setH = (q, open) => { const a = q.querySelector('.qa__a'); a.style.height = open ? a.scrollHeight + 'px' : '0px'; q.classList.toggle('is-open', open); q.querySelector('.qa__q').setAttribute('aria-expanded', open); };
  qs.forEach(q => { setH(q, q.classList.contains('is-open')); q.querySelector('.qa__q').addEventListener('click', () => { const open = !q.classList.contains('is-open'); qs.forEach(o => setH(o, o === q && open)); }); });
  addEventListener('resize', () => qs.forEach(q => { if (q.classList.contains('is-open')) q.querySelector('.qa__a').style.height = q.querySelector('.qa__a').scrollHeight + 'px'; }));

  /* hero stills: slow crossfade, story-style bars underneath */
  const box = document.getElementById('abCycle');
  if (box) {
    const imgs = [...box.querySelectorAll('.ab-hero__img')], bars = box.querySelector('.ab-hero__bars'), DUR = 4200;
    if (imgs.length > 1) {
      imgs.forEach((_, k) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i></i>'; b.addEventListener('click', () => go(k)); bars.appendChild(b); });
      let i = 0, t0 = performance.now(), raf = 0;
      const go = n => { imgs[i].classList.remove('is-on'); i = (n + imgs.length) % imgs.length; imgs[i].classList.add('is-on'); [...bars.children].forEach((b, k) => { b.classList.toggle('is-done', k < i); b.classList.toggle('is-on', k === i); b.style.setProperty('--p', k < i ? 1 : 0); }); t0 = performance.now(); };
      const tick = now => { const p = Math.min(1, (now - t0) / DUR); bars.children[i].style.setProperty('--p', p.toFixed(3)); if (p >= 1 && !reduce && document.visibilityState === 'visible') go(i + 1); raf = requestAnimationFrame(tick); };
      box.querySelectorAll('.ab-hero__hit').forEach(h => h.addEventListener('click', () => go(i + +h.dataset.dir)));
      go(0); if (!reduce) raf = requestAnimationFrame(tick);
    } else bars.remove();
  }

  /* how we work: the stack is pinned; scrolling through the section advances the stage and the progress line */
  const sec = document.getElementById('stages'); if (!sec) return;
  const stages = [...sec.querySelectorAll('.stage')], fill = document.getElementById('stagesFill'), dots = [...sec.querySelectorAll('.stages__line i')], N = stages.length;
  let cur = -1;
  const line = sec.querySelector('.stages__line'), head = document.getElementById('stagesHead'), pct = document.getElementById('stagesPct');
  const setLineW = () => line.style.setProperty('--line-w', line.clientWidth + 'px'); setLineW(); addEventListener('resize', setLineW);
  // click a milestone: scroll to the point where that stage takes over
  dots.forEach((d, j) => d.addEventListener('click', () => { const top = sec.offsetTop + (sec.offsetHeight - innerHeight) * (j / (N - 1)) * 0.78 + 2; scrollTo({ top, behavior: 'smooth' }); }));
  const ripple = d => { d.classList.remove('is-hit'); void d.offsetWidth; d.classList.add('is-hit'); };
  const show = k => { if (k === cur) return; const fwd = k > cur; cur = k; if (fwd) ripple(dots[k]); stages.forEach((s, j) => { s.classList.toggle('is-on', j === k); s.classList.toggle('is-past', j < k); s.querySelectorAll('video').forEach(v => { if (j === k) { if (!v.src && !v.currentSrc) v.load(); v.play().catch(() => {}); } else v.pause(); }); }); dots.forEach((d, j) => d.classList.toggle('is-on', j <= k)); };
  const draw = () => {
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    const raw = Math.min(1, Math.max(0, -r.top / (r.height - vh)));         // 0..1 through the pinned run
    const p = Math.min(1, raw / 0.78);                                        // the line completes at 78%; the last 22% is a hold on Analytics
    fill.style.transform = `scaleX(${p})`; line.style.setProperty('--p', p); if (pct) pct.textContent = Math.round(p * 100) + '%';
    // the dots sit at 0, 25, 50, 75, 100% of the line: a stage only takes over once the fill has reached its dot
    show(Math.min(N - 1, Math.floor(p * (N - 1) + 0.0001)));
  };
  addEventListener('scroll', draw, { passive: true }); addEventListener('resize', draw); draw();
})();
