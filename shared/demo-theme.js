/* BwB demo-theme.js — v1.0 | DEMOS ONLY, never ship on paid client sites.
   Floating "Try your colors" panel: preset palettes + custom picker.
   Applies via CSS custom properties on <html>; auto-darkens/lightens any
   picked color until it passes WCAG 4.5:1 on the page background, so a
   prospect can never make the demo unreadable. Persists across demo pages. */
(function () {
  'use strict';

  var PRESETS = [
    ['Terracotta', '#A34A26'],
    ['Forest', '#2F5D3A'],
    ['Lake Blue', '#23617A'],
    ['Plum', '#5B4A68'],
    ['Burgundy', '#7C2D3A'],
    ['Copper', '#9C5A1E'],
    ['Teal', '#1F6E6B'],
    ['Charcoal', '#3C4043']
  ];
  var STORE_KEY = 'bwb-demo-theme';

  /* ---- color math ---- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function rgb2hex(r) {
    return '#' + r.map(function (c) {
      c = Math.max(0, Math.min(255, Math.round(c)));
      return ('0' + c.toString(16)).slice(-2);
    }).join('');
  }
  function mix(a, b, t) { /* t = share of b */
    var A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * t; }));
  }
  function lum(h) {
    var r = hex2rgb(h).map(function (c) {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2];
  }
  function contrast(a, b) {
    var x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }
  function darkenUntil(c, bg, target) {
    var out = c, i = 0;
    while (contrast(out, bg) < target && i < 40) { out = mix(out, '#000000', 0.06); i++; }
    return out;
  }
  function lightenUntil(c, bg, target) {
    var out = c, i = 0;
    while (contrast(out, bg) < target && i < 40) { out = mix(out, '#FFFFFF', 0.06); i++; }
    return out;
  }

  /* ---- theme application ---- */
  function pageBg() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
    return v && v[0] === '#' ? v : '#FFFFFF';
  }
  function apply(hex, save) {
    var bg = pageBg();
    var safe = darkenUntil(hex, bg, 4.5);           /* links / prices / labels on light bg */
    var root = document.documentElement.style;
    root.setProperty('--color-primary', safe);
    root.setProperty('--color-primary-dark', mix(safe, '#000000', 0.25));
    root.setProperty('--color-border', mix(hex, '#DDD3C2', 0.82));
    root.setProperty('--color-surface', mix(hex, bg, 0.94));
    /* light accent used on dark bands (t2 labels; harmless elsewhere) */
    root.setProperty('--t2-terra-lt', lightenUntil(hex, '#2A211B', 4.5));
    if (save !== false) {
      try { localStorage.setItem(STORE_KEY, hex); } catch (e) { /* demo still works per-page */ }
    }
    var note = document.getElementById('bwb-theme-note');
    if (note) note.textContent = safe.toLowerCase() === hex.toLowerCase()
      ? 'Showing ' + hex.toUpperCase()
      : 'Showing ' + hex.toUpperCase() + ' (auto-adjusted for readability)';
  }
  function reset() {
    ['--color-primary', '--color-primary-dark', '--color-border', '--color-surface', '--t2-terra-lt']
      .forEach(function (p) { document.documentElement.style.removeProperty(p); });
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    var note = document.getElementById('bwb-theme-note');
    if (note) note.textContent = 'Showing the template default';
  }

  /* ---- UI ---- */
  var css =
    '#bwb-theme-btn{position:fixed;right:16px;bottom:16px;z-index:9999;display:inline-flex;align-items:center;gap:8px;' +
    'padding:10px 16px;min-height:44px;font:600 15px/1.2 system-ui,sans-serif;color:#fff;background:#1F1B16;' +
    'border:2px solid #fff;border-radius:999px;cursor:pointer;box-shadow:0 4px 14px rgb(0 0 0/.35)}' +
    '#bwb-theme-btn:focus-visible{outline:3px solid #E5A075;outline-offset:2px}' +
    '#bwb-theme-panel{position:fixed;right:16px;bottom:72px;z-index:9999;width:min(320px,calc(100vw - 32px));' +
    'background:#FFFDF8;color:#2A211B;border:1px solid #C9BCA4;border-radius:10px;box-shadow:0 12px 32px rgb(0 0 0/.3);' +
    'padding:16px;font:400 14px/1.45 system-ui,sans-serif}' +
    '#bwb-theme-panel[hidden]{display:none}' +
    '#bwb-theme-panel h2{margin:0 0 4px;font:600 16px/1.2 system-ui,sans-serif}' +
    '#bwb-theme-panel p{margin:0 0 10px;color:#5C5347}' +
    '#bwb-theme-swatches{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}' +
    '.bwb-swatch{display:flex;align-items:center;gap:8px;padding:8px 10px;min-height:40px;font:600 13px/1.2 system-ui,sans-serif;' +
    'color:#2A211B;background:#fff;border:1px solid #C9BCA4;border-radius:8px;cursor:pointer;text-align:left}' +
    '.bwb-swatch:hover{border-color:#2A211B}' +
    '.bwb-swatch:focus-visible{outline:3px solid #A34A26;outline-offset:2px}' +
    '.bwb-dot{width:18px;height:18px;border-radius:50%;flex:none;border:1px solid rgb(0 0 0/.2)}' +
    '#bwb-theme-custom{display:flex;align-items:center;gap:10px;margin-bottom:12px}' +
    '#bwb-theme-custom input{width:44px;height:44px;padding:2px;border:1px solid #C9BCA4;border-radius:8px;background:#fff;cursor:pointer}' +
    '#bwb-theme-note{font-size:12px;color:#5C5347;margin:0 0 10px}' +
    '#bwb-theme-reset{padding:8px 12px;min-height:40px;font:600 13px/1.2 system-ui,sans-serif;background:none;' +
    'border:1px solid #C9BCA4;border-radius:8px;cursor:pointer;color:#2A211B}' +
    '#bwb-theme-reset:hover{border-color:#2A211B}';

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.id = 'bwb-theme-btn';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'bwb-theme-panel');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
      '<circle cx="7" cy="7" r="3" fill="#E5A075"/><circle cx="14" cy="9" r="3" fill="#8FBF9F"/>' +
      '<circle cx="9" cy="14" r="3" fill="#9DB8D2"/></svg>Try your colors';

    var panel = document.createElement('div');
    panel.id = 'bwb-theme-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Try this site in your colors');
    panel.innerHTML =
      '<h2>See it in your colors</h2>' +
      '<p>Pick a preset or use your exact brand color.</p>' +
      '<div id="bwb-theme-swatches"></div>' +
      '<div id="bwb-theme-custom"><input type="color" id="bwb-theme-picker" value="#A34A26" aria-label="Pick a custom brand color">' +
      '<label for="bwb-theme-picker"><strong>Your exact color</strong><br>Tap the swatch to pick</label></div>' +
      '<p id="bwb-theme-note">Showing the template default</p>' +
      '<button type="button" id="bwb-theme-reset">Back to default</button>';

    var grid = panel.querySelector('#bwb-theme-swatches');
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bwb-swatch';
      b.innerHTML = '<span class="bwb-dot" style="background:' + p[1] + '"></span>' + p[0];
      b.addEventListener('click', function () {
        apply(p[1]);
        panel.querySelector('#bwb-theme-picker').value = p[1];
      });
      grid.appendChild(b);
    });

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      if (!open) panel.querySelector('.bwb-swatch').focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) {
        panel.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
    panel.querySelector('#bwb-theme-picker').addEventListener('input', function (e) { apply(e.target.value); });
    panel.querySelector('#bwb-theme-reset').addEventListener('click', reset);

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    /* re-apply a saved choice as the prospect browses page to page */
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved) apply(saved, false);
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
