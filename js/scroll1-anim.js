/* scroll1-anim.js
 * Scroll-driven animations for the scroll1 skin, ported verbatim-in-spirit from
 * the original bundled DC component's _frame() loop. No React / no dc-runtime.
 * Drives the live DOM (#s1-root) on a 16ms tick + Lenis smooth-scroll callback.
 *
 * Public API:
 *   Scroll1Anim.start()   - begin the loop (idempotent)
 *   Scroll1Anim.pause()   - stop the loop (used while editing)
 *   Scroll1Anim.reveal()  - force every animated element to its shown state
 *   Scroll1Anim.reprime() - clear primed flags so a re-shown DOM re-animates
 */
(function () {
  'use strict';

  var pf = { seen: new WeakSet(), anims: [], radarDone: false, hx: null };
  var loop = null;
  var lenisHooked = false;

  function root() { return document.getElementById('s1-root') || document; }
  function vh() { return window.innerHeight || 800; }
  var eOut3 = function (t) { return 1 - Math.pow(1 - t, 3); };

  function tween(dur, apply) {
    pf.anims.push({ start: performance.now(), dur: dur, apply: apply });
    apply(0);
  }

  // primers / showers (CSS transitions do the actual motion)
  function primeRise(el, dist) { el.style.transition = 'opacity .9s ease, transform .9s cubic-bezier(.16,1,.3,1)'; el.style.opacity = '0'; el.style.transform = 'translateY(' + dist + 'px)'; }
  function primeTeam(el, rot) { el.style.transition = 'opacity .9s ease, transform .95s cubic-bezier(.16,1,.3,1)'; el.style.opacity = '0'; el.style.transform = 'translateY(120px) rotate(' + (rot - 14) + 'deg)'; }
  function showRise(el) { el.style.opacity = '1'; el.style.transform = 'none'; }
  function showTeam(el, rot) { el.style.opacity = '1'; el.style.transform = 'rotate(' + rot + 'deg)'; }
  function primeRadar(g) { g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center'; g.style.transition = 'opacity .6s ease, transform 1.05s cubic-bezier(.16,1,.3,1)'; g.style.opacity = '0'; g.style.transform = 'scale(0.001)'; }
  function showRadar(g) { g.style.opacity = '1'; g.style.transform = 'scale(1)'; }

  var intervals = [];
  function pachinko(el, finalText) {
    var chars = Array.from(finalText || el.textContent);
    el.textContent = '';
    var pool = '가나다라마바사아자차카타파하섹션작은설명력치딩제해결0123456789';
    chars.forEach(function (ch, i) {
      var span = document.createElement('span');
      span.style.display = 'inline-block';
      span.style.transition = 'transform .18s ease, opacity .18s ease';
      span.style.transform = 'translateY(-8px)';
      span.style.opacity = '0.7';
      span.textContent = ch;
      el.appendChild(span);
      var ticks = 12 + i * 7;
      var iv = setInterval(function () {
        if (ticks <= 0) { clearInterval(iv); span.textContent = ch; span.style.transform = 'translateY(0)'; span.style.opacity = '1'; return; }
        span.textContent = pool[(Math.random() * pool.length) | 0];
        span.style.transform = (ticks % 2 === 0 ? 'translateY(-6px)' : 'translateY(6px)');
        ticks--;
      }, 90);
      intervals.push(iv);
    });
  }

  function frame() {
    var r = root();
    var h = vh();
    var now = performance.now();

    // 1) tweens
    if (pf.anims.length) {
      pf.anims = pf.anims.filter(function (a) {
        var t = (now - a.start) / a.dur; if (t > 1) t = 1; a.apply(eOut3(t)); return t < 1;
      });
    }

    // 2) reveal (fade up)
    r.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (!el.__primed) { el.__primed = true; if (el.getBoundingClientRect().top < h * 0.9) { pf.seen.add(el); showRise(el); } else { primeRise(el, 70); } }
      if (pf.seen.has(el)) return;
      if (el.getBoundingClientRect().top < h * 0.88) { pf.seen.add(el); showRise(el); }
    });

    // 3) projects (rise)
    r.querySelectorAll('[data-project]').forEach(function (el) {
      if (!el.__primed) { el.__primed = true; if (el.getBoundingClientRect().top < h * 0.9) { pf.seen.add(el); showRise(el); } else { primeRise(el, 130); } }
      if (pf.seen.has(el)) return;
      if (el.getBoundingClientRect().top < h * 0.9) { pf.seen.add(el); showRise(el); }
    });

    // 4) team work (rise + angle)
    r.querySelectorAll('[data-team]').forEach(function (el) {
      var rot = parseFloat(el.getAttribute('data-rot')) || 0;
      if (!el.__primed) { el.__primed = true; if (el.getBoundingClientRect().top < h * 0.92) { pf.seen.add(el); showTeam(el, rot); } else { primeTeam(el, rot); } }
      if (pf.seen.has(el)) return;
      if (el.getBoundingClientRect().top < h * 0.9) { pf.seen.add(el); showTeam(el, rot); }
    });

    // 5) WORKS count-up
    r.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (!el.__primed) { el.__primed = true; if (el.getBoundingClientRect().top < h * 0.85) { el.textContent = target; pf.seen.add(el); } else { el.textContent = '0'; } }
      if (pf.seen.has(el)) return;
      if (el.getBoundingClientRect().top < h * 0.85) { pf.seen.add(el); tween(1400, function (p) { el.textContent = Math.round(p * target); }); }
    });

    // 5b) WORKS -> AI crossfade
    var wsec = r.querySelector('[data-worksec]');
    if (wsec) {
      var a = wsec.querySelector('[data-panel="a"]');
      var b = wsec.querySelector('[data-panel="b"]');
      if (a && b) {
        var sr = wsec.getBoundingClientRect();
        var total = wsec.offsetHeight - h;
        var p = total > 0 ? (-sr.top) / total : 0; p = Math.max(0, Math.min(1, p));
        var t = (p - 0.35) / 0.25; t = Math.max(0, Math.min(1, t));
        var ease = t * t * (3 - 2 * t);
        a.style.opacity = String(1 - ease); a.style.transform = 'translateY(' + (-ease * 60) + 'px)';
        b.style.opacity = String(ease); b.style.transform = 'translateY(' + ((1 - ease) * 60) + 'px)';
      }
    }

    // 6) radar scale-in + pachinko (once)
    var g = r.querySelector('#radarAnim');
    var wrap = r.querySelector('#radarWrap');
    if (g && wrap) {
      if (!g.__primed) { g.__primed = true; primeRadar(g); }
      if (!pf.radarDone && wrap.getBoundingClientRect().top < h * 0.75) {
        pf.radarDone = true; showRadar(g);
        r.querySelectorAll('[data-pachinko]').forEach(function (el) { pachinko(el, el.textContent); });
      }
    }

    // 6b) hero letters lift
    var hl = r.querySelectorAll('[data-heroletter]');
    if (hl.length) {
      var sy = window.scrollY || window.pageYOffset || 0;
      hl.forEach(function (el, i) {
        var local = Math.max(0, sy - i * 28);
        el.style.transform = 'translateY(' + (-local * 1.25) + 'px)';
        el.style.opacity = Math.max(0, 1 - local / 420);
      });
    }

    // 6c) mobile mockups pin to center
    r.querySelectorAll('[data-mobilemock]').forEach(function (el) {
      var mock = el.parentElement;
      var section = mock.closest('[data-screen-label="Responsive"]');
      if (!section) return;
      var mr = mock.getBoundingClientRect();
      var srr = section.getBoundingClientRect();
      var phoneH = el.offsetHeight;
      var naturalTop = mr.bottom + 44 - phoneH;
      var pinTop = (h - phoneH) / 2;
      var maxTop = srr.bottom - phoneH - 80;
      var targetTop = naturalTop > pinTop ? naturalTop : Math.min(pinTop, maxTop);
      el.style.zIndex = '10'; el.style.willChange = 'transform';
      el.style.transform = 'translateY(' + (targetTop - naturalTop) + 'px)';
    });

    // 6d) typography pop
    r.querySelectorAll('[data-typo]').forEach(function (el, i) {
      if (!el.__primed) {
        el.__primed = true; el.style.transformOrigin = 'left center';
        el.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1) ' + (i * 0.12) + 's, opacity .4s ease ' + (i * 0.12) + 's';
        if (el.getBoundingClientRect().top < h * 0.85) { pf.seen.add(el); el.style.opacity = '1'; el.style.transform = 'none'; }
        else { el.style.opacity = '0'; el.style.transform = 'scale(0.08)'; }
      }
      if (pf.seen.has(el)) return;
      if (el.getBoundingClientRect().top < h * 0.82) { pf.seen.add(el); el.style.opacity = '1'; el.style.transform = 'none'; }
    });

    // 7) POPUP horizontal scrub
    var hsec = r.querySelector('[data-hsec]');
    var track = r.querySelector('[data-htrack]');
    if (hsec && track) {
      var vp = track.parentElement;
      var dist = Math.max(0, track.scrollWidth - vp.clientWidth);
      // Size the pinned section so vertical scroll maps ~1:1 to horizontal travel.
      // (The original was a fixed 520vh tuned for 10 tiles; with a variable tile
      //  count that made scrolling feel glacial — recompute from real track width.)
      var desiredH = h + dist + Math.min(dist, h * 0.4);
      if (Math.abs(hsec.offsetHeight - desiredH) > 4) hsec.style.height = desiredH + 'px';
      var totalH = hsec.offsetHeight - h;
      var top = hsec.getBoundingClientRect().top;
      var pp = totalH > 0 ? (-top) / totalH : 0; pp = Math.max(0, Math.min(1, pp));
      var targetX = -pp * dist;
      if (pf.hx == null || Math.abs(targetX - pf.hx) > dist * 0.6) pf.hx = targetX;
      pf.hx += (targetX - pf.hx) * 0.2;
      track.style.transform = 'translateX(' + pf.hx + 'px)';
    }

    // 8) TEAM WORK staircase — zigzag the cards by index (re-laid only when the
    //    count changes). Restores the staircase look while still supporting
    //    add/remove, which a plain flex row could not.
    var teamCards = r.querySelectorAll('[data-team]');
    if (teamCards.length && pf.teamCount !== teamCards.length) { pf.teamCount = teamCards.length; layoutTeam(r); }
  }

  function layoutTeam(r) {
    var cards = r.querySelectorAll('[data-team]');
    var step = 84, period = 6;
    cards.forEach(function (el, i) {
      var ph = i % period;
      var tri = ph <= period / 2 ? ph : period - ph;   // 0,1,2,3,2,1,0,...
      el.style.marginTop = (tri * step) + 'px';
    });
  }

  function initLenis(tries) {
    if (window.__s1lenis) return;
    if (window.Lenis) {
      try {
        window.__s1lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
        var raf = function (t) { if (window.__s1lenis) { window.__s1lenis.raf(t); requestAnimationFrame(raf); } };
        requestAnimationFrame(raf);
        if (!lenisHooked) { lenisHooked = true; window.__s1lenis.on('scroll', function () { try { frame(); } catch (e) {} }); }
      } catch (e) {}
      return;
    }
    if (tries > 120) return;
    setTimeout(function () { initLenis(tries + 1); }, 50);
  }

  var Scroll1Anim = {
    start: function () {
      if (loop) return;
      initLenis(0);
      loop = setInterval(function () { try { frame(); } catch (e) {} }, 16);
      try { frame(); } catch (e) {}
    },
    pause: function () { if (loop) { clearInterval(loop); loop = null; } },
    // clear primed state so re-shown DOM animates again on next start()
    reprime: function () {
      pf = { seen: new WeakSet(), anims: [], radarDone: false, hx: null, teamCount: -1 };
      root().querySelectorAll('*').forEach(function (el) { if (el.__primed) el.__primed = false; });
    },
    // (re)apply the team staircase — called by the editor after add/remove/enter
    layoutTeam: function () { pf.teamCount = -1; layoutTeam(root()); },
    // force everything to its visible/final state (used while editing)
    reveal: function () {
      var r = root();
      r.querySelectorAll('[data-reveal],[data-project]').forEach(function (el) { el.style.transition = 'none'; showRise(el); });
      r.querySelectorAll('[data-team]').forEach(function (el) { el.style.transition = 'none'; showTeam(el, parseFloat(el.getAttribute('data-rot')) || 0); });
      r.querySelectorAll('[data-typo]').forEach(function (el) { el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; });
      r.querySelectorAll('[data-heroletter]').forEach(function (el) { el.style.transform = 'none'; el.style.opacity = '1'; });
      var g = r.querySelector('#radarAnim'); if (g) { g.style.transition = 'none'; g.style.opacity = '1'; g.style.transform = 'none'; }
      r.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = parseInt(el.getAttribute('data-count'), 10) || el.textContent; });
      var wsec = r.querySelector('[data-worksec]');
      if (wsec) { var a = wsec.querySelector('[data-panel="a"]'); var b = wsec.querySelector('[data-panel="b"]'); if (a) { a.style.opacity = '1'; a.style.transform = 'none'; } if (b) { b.style.opacity = '1'; b.style.transform = 'none'; } }
    }
  };

  window.Scroll1Anim = Scroll1Anim;
})();
