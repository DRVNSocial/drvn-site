/* Contact form: validate, save the enquiry to DRVN's Google Sheet, then show the full-screen thank-you.
   The Sheet side is a small Google Apps Script web app (see DRVN_Enquiries_AppsScript.gs). Until its URL is set
   below, the form falls back to the old behaviour: a pre-filled email to hello@drvn.social. */
(() => {
  const ENDPOINT = '';   // Google Apps Script web-app URL, e.g. https://script.google.com/macros/s/XXXX/exec
  const f = document.getElementById('cform'); if (!f) return;
  const err = document.getElementById('cformErr'), btn = f.querySelector('[type=submit]');
  const thanks = document.getElementById('cthanks'), thanksName = document.getElementById('cthanksName');
  const opened = Date.now();
  // spam trap: a field people never see, which bots fill in
  const hp = document.createElement('div'); hp.className = 'cform__hp'; hp.setAttribute('aria-hidden', 'true');
  hp.innerHTML = '<label>Leave this empty<input type="text" name="company_url" tabindex="-1" autocomplete="off"></label>';
  f.appendChild(hp);

  const showThanks = first => {
    if (first) thanksName.textContent = `Thanks for your enquiry, ${first}.`;
    thanks.hidden = false; document.documentElement.classList.add('is-thanks');
    requestAnimationFrame(() => requestAnimationFrame(() => thanks.classList.add('is-on')));
    thanks.tabIndex = -1; thanks.focus({ preventScroll: true });   // screen readers land on the message; no focus ring on a button
    f.reset();
  };
  const setBusy = on => { f.classList.toggle('is-busy', on); btn.disabled = on; btn.setAttribute('aria-busy', String(on)); };

  f.addEventListener('submit', async e => {
    e.preventDefault();
    if (f.classList.contains('is-busy')) return;
    const d = new FormData(f), miss = [];
    if (!d.get('name')?.trim()) miss.push('your name');
    if (!d.get('business')?.trim()) miss.push('your business name');
    const em = d.get('email')?.trim(); if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) miss.push('a valid email');
    if (!d.get('consent')) miss.push('consent to be contacted');
    f.querySelectorAll('[required]').forEach(i => i.closest('.field, .cform__consent')?.classList.toggle('is-bad', i.type === 'checkbox' ? !i.checked : !i.value.trim()));
    if (miss.length) { err.textContent = 'Please add ' + miss.join(', ') + '.'; err.hidden = false; return; }
    err.hidden = true;
    const first = String(d.get('name')).trim().split(/\s+/)[0];
    const services = d.getAll('services');

    if (!ENDPOINT) {   // not connected to the Sheet yet: hand over to the visitor's email app, as before
      if (window.fbq) fbq('track', 'Lead');
      const lines = [
        `Name: ${d.get('name')}${d.get('role') ? ' (' + d.get('role') + ')' : ''}`,
        `Business: ${d.get('business')}`, d.get('website') && `Website/social: ${d.get('website')}`,
        d.get('industry') && `Industry: ${d.get('industry')}`, d.get('budget') && `Monthly budget: ${d.get('budget')}`,
        `Email: ${em}`, d.get('phone') && `Phone: ${d.get('phone')}`,
        services.length && `Interested in: ${services.join(', ')}`, '', d.get('message') || ''
      ].filter(x => x !== false && x !== null && x !== undefined && x !== '' || x === '');
      location.href = `mailto:hello@drvn.social?subject=${encodeURIComponent('New enquiry: ' + d.get('business'))}&body=${encodeURIComponent(lines.join('\n'))}`;
      showThanks(first); return;
    }

    // bots: filled the hidden field, or submitted faster than a person could type. Pretend it worked, save nothing.
    if (d.get('company_url') || Date.now() - opened < 3000) { showThanks(first); return; }
    const payload = {
      name: d.get('name'), role: d.get('role'), business: d.get('business'), website: d.get('website'),
      industry: d.get('industry'), budget: d.get('budget'), email: em, phone: d.get('phone'),
      services, message: d.get('message'), consent: !!d.get('consent'), page: location.href, hp: d.get('company_url') || ''
    };
    setBusy(true);
    try {
      // text/plain keeps this a "simple" request, which Apps Script accepts from another site without extra setup
      const r = await fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'not saved');
      if (window.fbq) fbq('track', 'Lead');   // only once the enquiry is definitely saved
      showThanks(first);
    } catch (x) {
      err.innerHTML = 'Sorry, that didn’t send. Please try again, or email us at <a href="mailto:hello@drvn.social">hello@drvn.social</a>.';
      err.hidden = false;
    } finally { setBusy(false); }
  });
  f.addEventListener('input', e => e.target.closest('.is-bad')?.classList.remove('is-bad'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && thanks && !thanks.hidden) location.href = '/'; });
})();
