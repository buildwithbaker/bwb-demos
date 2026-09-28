/* BwB template sites - shared page script. Loaded with `defer` from every page.
   It lives in a file, not inline, so each page's Content-Security-Policy can say
   script-src 'self' with no 'unsafe-inline'. */
(function () {
  'use strict';

  /* Web fonts load without blocking first render: the stylesheet ships as
     media="print" and is switched on here. A <noscript> copy covers JS-off. */
  var sheets = document.querySelectorAll('link[data-async-css]');
  for (var i = 0; i < sheets.length; i++) {
    sheets[i].media = 'all';
  }

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
