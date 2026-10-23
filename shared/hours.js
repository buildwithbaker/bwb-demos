/* BwB template sites - "open now" line (Gate 2 item 3). Loaded with `defer` on home pages.
   It reads the hours the page already publishes in its JSON-LD `openingHours`
   (schema.org form: "Mo-Fr 07:00-17:00", "Mo-Sa 09:00-18:00, Su 10:00-16:00", or an array
   of those) and writes the answer into every [data-hours-now] element:
     "Open now · closes 5pm" / "Closed · opens 7am" / "Closed · opens 7am Mon"
   The clock is the BUSINESS's, America/Chicago unless the element carries data-hours-tz,
   never the visitor's. data-hours-kind="calls" words it for a phone line instead of a
   door ("Answering calls · until 8pm" / "Calls back at 8am").
   Layout: each target owns its own line in the page CSS, so swapping the placeholder text
   for the answer never re-wraps anything around it. If anything fails - no JSON-LD, hours
   it cannot read, no Intl time zone support - the placeholder text stays, and the static
   hours next to it are the fallback, exactly as with JavaScript off. */
(function () {
  'use strict';
  var targets = document.querySelectorAll('[data-hours-now]');
  if (!targets.length) return;

  var DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  function nowIn(tz) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var day = NAMES.indexOf(o.weekday);
    if (day < 0) throw new Error('weekday');
    return { day: day, min: (+o.hour % 24) * 60 + +o.minute };
  }

  function clock(min) {
    min = ((min % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60, h12 = h % 12 || 12;
    if (h === 12 && m === 0) return 'noon';
    if (h === 0 && m === 0) return 'midnight';
    return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + (h < 12 ? 'am' : 'pm');
  }

  function answer(week, now, calls) {
    /* open now? today's intervals, then yesterday's that run past midnight */
    var y = (now.day + 6) % 7, i, iv;
    for (i = 0; i < week[now.day].length; i++) {
      iv = week[now.day][i];
      if (now.min >= iv[0] && now.min < iv[1]) return status(true, iv[1], calls);
    }
    for (i = 0; i < week[y].length; i++) {
      iv = week[y][i];
      if (iv[1] > 1440 && now.min < iv[1] - 1440) return status(true, iv[1], calls);
    }
    /* next opening in the coming 7 days */
    for (var k = 0; k < 8; k++) {
      var d = (now.day + k) % 7, best = null;
      week[d].forEach(function (v) {
        if ((k > 0 || v[0] > now.min) && (best === null || v[0] < best)) best = v[0];
      });
      if (best !== null) {
        /* a day name, never "tomorrow": five characters shorter, which keeps the longest
           answer on one line at 320px */
        var when = k === 0 ? '' : ' ' + NAMES[d];
        return calls ? 'Calls back at ' + clock(best) + when : 'Closed · opens ' + clock(best) + when;
      }
    }
    return null;
  }

  function status(open, close, calls) {
    return calls ? 'Answering calls · until ' + clock(close) : 'Open now · closes ' + clock(close);
  }

  var week = parse(readSpec());
  if (!week) return;

  function paint() {
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      try {
        var text = answer(week, nowIn(el.getAttribute('data-hours-tz') || 'America/Chicago'),
          el.getAttribute('data-hours-kind') === 'calls');
        if (text && el.textContent !== text) el.textContent = text;
      } catch (e) { /* no time zone support: keep the placeholder */ }
    }
  }
  paint();
  setInterval(paint, 60000);
})();
