/* BwB template sites - "open now" line (Gate 2 item 3). Loaded with `defer` on home pages.
   Base hours come from the page's JSON-LD `openingHours` (schema.org form: "Mo-Fr 07:00-17:00",
   "Mo-Sa 09:00-18:00, Su 10:00-16:00", or an array of those). Seasons and closed days come from
   <script type="application/json" id="hours-rules">, written by merge.py from the hours_rules
   intake key: {"seasons":[{"from":"06-01","to":"08-31","hours":"Mo-Su 06:00-15:00"}],
   "closed":["thanksgiving","christmas"]}. A season or closed day may be a MM-DD date or a named
   holiday (newyear, memorial, july4, labor, thanksgiving, christmas-eve, christmas,
   newyears-eve); named holidays are computed for each year, so nothing goes stale.
   It writes the answer into every [data-hours-now] element:
     "Open now · closes 5pm" / "Closed · opens 7am" / "Closed · opens 7am Mon"
   The clock is the BUSINESS's, America/Chicago unless the element carries data-hours-tz, never
   the visitor's. data-hours-kind="calls" words it for a phone line ("Answering calls · until
   8pm" / "Calls back at 8am"). Day names, never "tomorrow": the longest answer must fit 320px.
   Layout: each target owns its own line in the page CSS, so the answer never re-wraps anything.
   Failure is loud and safe: if the hours or the rules cannot be read, it logs an error to the
   console and leaves the placeholder, with the static hours beside it as the fallback - the same
   page a visitor gets with JavaScript off. It never guesses. */
(function () {
  'use strict';
  var targets = document.querySelectorAll('[data-hours-now]');
  if (!targets.length) return;

  var DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function fail(why) { if (window.console) console.error('hours.js: ' + why + ' - showing the static hours only'); }

  function readSpec() {
    var blocks = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < blocks.length; i++) {
      try {
        var d = JSON.parse(blocks[i].textContent);
        if (d && d.openingHours) return [].concat(d.openingHours).join(', ');
      } catch (e) { /* malformed block: try the next one */ }
    }
    return '';
  }

  /* week[day] = [[openMin, closeMin], ...]; closeMin may pass 1440 for an after-midnight close */
  function parse(spec) {
    var week = [[], [], [], [], [], [], []], any = false;
    var re = /([A-Z][a-z](?:\s*[-,]\s*[A-Z][a-z])*)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g, m;
    while ((m = re.exec(spec))) {
      var open = +m[2] * 60 + +m[3], close = +m[4] * 60 + +m[5];
      if (close <= open) close += 1440;
      m[1].replace(/\s/g, '').split(',').forEach(function (part) {
        var ends = part.split('-'), a = DAYS.indexOf(ends[0]), b = DAYS.indexOf(ends[1] || ends[0]);
        if (a < 0 || b < 0) return;
        for (var k = 0; k < 7; k++) {
          var day = (a + k) % 7;
          week[day].push([open, close]); any = true;
          if (day === b) break;
        }
      });
    }
    return any ? week : null;
  }

  /* ---- calendar: dates are {y, m, d} with m 1-12; arithmetic through UTC so no zone leaks in */
  function utc(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
  function ymd(dt) { return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), dow: dt.getUTCDay() }; }
  function addDays(day, k) { return ymd(utc(day.y, day.m, day.d + k)); }
  function nthDow(y, m, dow, n) {            /* n-th weekday of a month; n = -1 for the last */
    if (n > 0) { var f = utc(y, m, 1); return 1 + ((dow - f.getUTCDay() + 7) % 7) + 7 * (n - 1); }
    var last = utc(y, m + 1, 0); return last.getUTCDate() - ((last.getUTCDay() - dow + 7) % 7);
  }
  var HOLIDAYS = {
    'newyear': function (y) { return [1, 1]; },
    'memorial': function (y) { return [5, nthDow(y, 5, 1, -1)]; },
    'july4': function (y) { return [7, 4]; },
    'labor': function (y) { return [9, nthDow(y, 9, 1, 1)]; },
    'thanksgiving': function (y) { return [11, nthDow(y, 11, 4, 4)]; },
    'christmas-eve': function (y) { return [12, 24]; },
    'christmas': function (y) { return [12, 25]; },
    'newyears-eve': function (y) { return [12, 31]; }
  };
  function point(token, y) {                 /* a MM-DD date or a holiday name -> month*100+day */
    var md = /^(\d{2})-(\d{2})$/.exec(token);
    if (md) return +md[1] * 100 + +md[2];
    var h = HOLIDAYS[token];
    if (!h) throw new Error('unknown day "' + token + '"');
    var r = h(y); return r[0] * 100 + r[1];
  }

  function rulesFor(raw) {
    var r = { seasons: [], closed: [] };
    if (!raw) return r;
    var j = JSON.parse(raw);
    (j.seasons || []).forEach(function (s) {
      var w = parse(s.hours || '');
      if (!w) throw new Error('season ' + s.from + '..' + s.to + ' has no readable hours');
      point(s.from, 2026); point(s.to, 2026);   /* reject an unknown name now, not in March */
      r.seasons.push({ from: s.from, to: s.to, week: w });
    });
    (j.closed || []).forEach(function (c) { point(c, 2026); r.closed.push(c); });
    return r;
  }

  function weekOn(base, rules, day) {
    var key = day.m * 100 + day.d;
    for (var i = 0; i < rules.closed.length; i++) if (point(rules.closed[i], day.y) === key) return null;
    for (var j = 0; j < rules.seasons.length; j++) {
      var s = rules.seasons[j], a = point(s.from, day.y), b = point(s.to, day.y);
      if (a <= b ? key >= a && key <= b : key >= a || key <= b) return s.week;
    }
    return base;
  }
  function intervalsOn(base, rules, day) { var w = weekOn(base, rules, day); return w ? w[day.dow] : []; }

  function nowIn(tz) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
      weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var day = ymd(utc(+o.year, +o.month, +o.day));
    if (NAMES[day.dow] !== o.weekday) throw new Error('weekday mismatch');
    return { day: day, min: (+o.hour % 24) * 60 + +o.minute };
  }

  function clock(min) {
    min = ((min % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60, h12 = h % 12 || 12;
    if (h === 12 && m === 0) return 'noon';
    if (h === 0 && m === 0) return 'midnight';
    return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + (h < 12 ? 'am' : 'pm');
  }

  function answer(base, rules, now, calls) {
    var today = intervalsOn(base, rules, now.day), yday = intervalsOn(base, rules, addDays(now.day, -1)), i, iv;
    for (i = 0; i < today.length; i++) {
      iv = today[i];
      if (now.min >= iv[0] && now.min < iv[1]) return calls ? 'Answering calls · until ' + clock(iv[1]) : 'Open now · closes ' + clock(iv[1]);
    }
    for (i = 0; i < yday.length; i++) {
      iv = yday[i];
      if (iv[1] > 1440 && now.min < iv[1] - 1440) return calls ? 'Answering calls · until ' + clock(iv[1]) : 'Open now · closes ' + clock(iv[1]);
    }
    for (var k = 0; k < 15; k++) {
      var day = addDays(now.day, k), best = null;
      intervalsOn(base, rules, day).forEach(function (v) {
        if ((k > 0 || v[0] > now.min) && (best === null || v[0] < best)) best = v[0];
      });
      if (best !== null) {
        /* a day name, never "tomorrow": five characters shorter, so the longest answer fits 320px */
        var when = k === 0 ? '' : ' ' + NAMES[day.dow];
        return calls ? 'Calls back at ' + clock(best) + when : 'Closed · opens ' + clock(best) + when;
      }
    }
    return null;
  }

  var base, rules;
  try {
    base = parse(readSpec());
    if (!base) { fail('no readable openingHours in the JSON-LD'); return; }
    var holder = document.getElementById('hours-rules');
    rules = rulesFor(holder ? holder.textContent.trim() : '');
  } catch (e) { fail(e.message); return; }

  function paint() {
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      try {
        var text = answer(base, rules, nowIn(el.getAttribute('data-hours-tz') || 'America/Chicago'),
          el.getAttribute('data-hours-kind') === 'calls');
        if (text && el.textContent !== text) el.textContent = text;
      } catch (e) { fail(e.message); }
    }
  }
  paint();
  setInterval(paint, 60000);
})();
