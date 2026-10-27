/* Contact form: validate, then hand the enquiry to the visitor's email app as a pre-filled message.
   (Swap the submit handler for the live site's form service at launch: Webflow Forms, Formspree, etc.) */
(() => {
  const f = document.getElementById('cform'); if (!f) return;
  const err = document.getElementById('cformErr'), done = document.getElementById('cformDone');
  f.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(f), miss = [];
    if (!d.get('name')?.trim()) miss.push('your name');
    if (!d.get('business')?.trim()) miss.push('your business name');
    const em = d.get('email')?.trim(); if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) miss.push('a valid email');
    if (!d.get('consent')) miss.push('consent to be contacted');
    f.querySelectorAll('[required]').forEach(i => i.closest('.field, .cform__consent')?.classList.toggle('is-bad', i.type === 'checkbox' ? !i.checked : !i.value.trim()));
    if (miss.length) { err.textContent = 'Please add ' + miss.join(', ') + '.'; err.hidden = false; return; }
    err.hidden = true;
    const services = d.getAll('services');
    const lines = [
      `Name: ${d.get('name')}${d.get('role') ? ' (' + d.get('role') + ')' : ''}`,
      `Business: ${d.get('business')}`, d.get('website') && `Website/social: ${d.get('website')}`,
      d.get('industry') && `Industry: ${d.get('industry')}`, d.get('budget') && `Monthly budget: ${d.get('budget')}`,
      `Email: ${em}`, d.get('phone') && `Phone: ${d.get('phone')}`,
      services.length && `Interested in: ${services.join(', ')}`, '', d.get('message') || ''
    ].filter(x => x !== false && x !== null && x !== undefined && x !== '' || x === '');
    location.href = `mailto:hello@drvn.social?subject=${encodeURIComponent('New enquiry: ' + d.get('business'))}&body=${encodeURIComponent(lines.join('\n'))}`;
    f.querySelectorAll('fieldset, .cform__consent, .cform__foot').forEach(el => el.hidden = true);
    done.hidden = false; done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  f.addEventListener('input', e => e.target.closest('.is-bad')?.classList.remove('is-bad'));
})();
