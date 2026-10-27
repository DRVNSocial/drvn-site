/* Insight index: same FLIP filter as the Work page */
(() => {
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const cards = $$('.ic'), empty = document.getElementById('igEmpty'), chips = $$('.wfilter button');
  let busy = false;
  chips.forEach(b => b.addEventListener('click', () => {
    if (busy || b.classList.contains('is-on')) return; busy = true;
    chips.forEach(c => c.classList.toggle('is-on', c === b));
    const f = b.dataset.f;
    const first = new Map(cards.map(c => [c, c.getBoundingClientRect()])), wasOn = new Map(cards.map(c => [c, !c.classList.contains('is-hidden')]));
    let n = 0;
    cards.forEach(c => { const on = !f || (c.dataset.tags || '').includes(f); c.classList.toggle('is-hidden', !on); if (on) n++; });
    if (empty) empty.hidden = n > 0;
    cards.forEach(c => {
      const on = !c.classList.contains('is-hidden'), was = wasOn.get(c), a = first.get(c);
      c.classList.remove('is-moving'); c.style.transition = 'none';
      if (on && was) { const z = c.getBoundingClientRect(); c.style.transform = `translate(${a.left - z.left}px,${a.top - z.top}px)`; }
      else if (on && !was) { c.style.transform = 'scale(.92)'; c.style.opacity = '0'; }
    });
    void document.body.offsetWidth;
    cards.forEach(c => { c.classList.add('is-moving'); c.style.transition = ''; c.style.transform = ''; c.style.opacity = ''; });
    setTimeout(() => { cards.forEach(c => c.classList.remove('is-moving')); busy = false; }, 750);
    dispatchEvent(new Event('scroll'));
  }));
})();
