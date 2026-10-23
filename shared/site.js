/* BwB template sites - shared page script. Loaded with `defer` from every page.
   It lives in a file, not inline, so each page's Content-Security-Policy can say
   script-src 'self' with no 'unsafe-inline'. */
(function () {
  'use strict';

  /* Mobile menu toggle */
  var t = document.querySelector('.nav-toggle'), n = document.getElementById('site-nav');
  if (!t || !n) return;
  t.addEventListener('click', function () {
    var open = t.getAttribute('aria-expanded') === 'true';
    t.setAttribute('aria-expanded', String(!open));
    n.classList.toggle('is-open', !open);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && t.getAttribute('aria-expanded') === 'true') {
      t.setAttribute('aria-expanded', 'false'); n.classList.remove('is-open'); t.focus();
    }
  });
})();

/* Money-action events (Gate 2 item 10). They are sent only when the page loaded GoatCounter
   (shared/count.js, which merge.py adds when the client has a goatcounter_code); without it
   every line below does nothing. The event names are listed in each template's FILL-MAP.md:
     call            - any tel: link
     <data-track>    - a link carrying data-track="name"
     <form>-start    - first focus inside a form carrying data-track-form="name"
     <form>-request  - that form submitted */
(function () {
  'use strict';
  function send(name) {
    var gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') gc.count({ path: name, title: name, event: true });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="tel:"], [data-track]') : null;
    if (a) send(a.getAttribute('data-track') || 'call');
  });
  Array.prototype.forEach.call(document.querySelectorAll('form[data-track-form]'), function (f) {
    var name = f.getAttribute('data-track-form'), started = false;
    f.addEventListener('focusin', function () {
      if (!started) { started = true; send(name + '-start'); }
    });
    f.addEventListener('submit', function () { send(name + '-request'); });
  });
})();

/* Phone header pin (Gate 2 item 5). Pins the header below 48rem only while it is no taller
   than a quarter of the screen; see the PHONE HEADER block in tokens.css for why. It also
   publishes the header height as --pin-h for scroll-padding-top. */
(function () {
  'use strict';
  var h = document.querySelector('.site-header');
  if (!h || !window.matchMedia) return;
  var root = document.documentElement, phone = window.matchMedia('(max-width: 47.99rem)');
  function fit() {
    var hh = h.offsetHeight;
    root.style.setProperty('--pin-h', hh + 'px');
    root.classList.toggle('pin-header', phone.matches && hh > 0 && hh <= window.innerHeight * 0.25);
  }
  fit();
  window.addEventListener('resize', fit);
  if (phone.addEventListener) phone.addEventListener('change', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(h);
})();

