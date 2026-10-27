/* Work page: filter chips + hover loopers (preview loops only play here, never on the homepage) */
(() => {
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const cards = $$('.wc'), empty = document.getElementById('wgEmpty');
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  // filters — FLIP: the cards you keep glide to their new spots, the rest shrink away, newcomers grow in
  const chips = $$('.wfilter button');
  let busy = false;
  chips.forEach(b => b.addEventListener('click', () => {
    if (busy || b.classList.contains('is-on')) return; busy = true;
    chips.forEach(c => c.classList.toggle('is-on', c === b));
    const f = b.dataset.f;
    const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
    const wasOn = new Map(cards.map(c => [c, !c.classList.contains('is-hidden')]));
    let n = 0;
    cards.forEach(c => { const on = !f || (c.dataset.tags || '').includes(f); c.classList.toggle('is-hidden', !on); if (on) n++; });
    if (empty) empty.hidden = n > 0;
    cards.forEach(c => {
      const on = !c.classList.contains('is-hidden'), was = wasOn.get(c), a = first.get(c);
      c.classList.remove('is-moving'); c.style.transition = 'none';
      if (on && was) {                                  // stays: start from where it was
        const z = c.getBoundingClientRect();
        c.style.transform = `translate(${a.left - z.left}px,${a.top - z.top}px)`;
      } else if (on && !was) { c.style.transform = 'scale(.92)'; c.style.opacity = '0'; }   // new: grow in
    });
    void document.body.offsetWidth;
    cards.forEach(c => {
      c.classList.add('is-moving'); c.style.transition = '';
      c.style.transform = ''; c.style.opacity = '';
    });
    setTimeout(() => { cards.forEach(c => c.classList.remove('is-moving')); busy = false; }, 750);
    dispatchEvent(new Event('scroll'));
  }));

  // hover loopers: the video src is only attached on first hover, so nothing downloads until it's wanted.
  // If a loop isn't there yet (404), the card just keeps its still.
  if (!fine) return;
  cards.forEach(c => {
    const v = c.querySelector('.wc__loop'); if (!v) return;
    let dead = false;
    v.addEventListener('error', () => { dead = true; c.classList.remove('is-playing'); v.remove(); }, { once: true });
    c.addEventListener('pointerenter', () => {
      if (dead) return;
      if (!v.src) v.src = v.dataset.src;
      const p = v.play(); if (p) p.then(() => c.classList.add('is-playing')).catch(() => {});
    });
    c.addEventListener('pointerleave', () => { c.classList.remove('is-playing'); setTimeout(() => { if (!c.classList.contains('is-playing')) v.pause(); }, 600); });
  });
})();
