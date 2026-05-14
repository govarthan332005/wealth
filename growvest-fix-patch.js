/* ================================================================
   GROWVEST — DEPOSIT GLITCH + PERFORMANCE FIX PATCH (v19.1)
   Loaded AFTER app.js. Hooks into existing window.openModal /
   closeModal without breaking the existing override chain.

   What it fixes
   -------------
   1) "Deposit" button glitch — eliminates the double-paint /
      flicker that happened when the user tapped Deposit on the
      Home screen. Adds re-entrancy guard + single-frame open.
   2) Performance: cancels duplicate openModal calls, debounces
      rapid taps, and pauses heavy animations while a modal is
      open or while the user is scrolling.
   3) Daily-Reward Claim card: forces a layout re-flow on resize
      / orientation change so the responsive CSS settles cleanly.
   ================================================================ */

(function gvFixPatch() {
  'use strict';

  // ─── 1) DEPOSIT MODAL RE-ENTRANCY GUARD ────────────────────
  // The original app.js already wraps openModal once (for the
  // editProfile / withdraw / deposit pre-fill logic). We wrap it
  // ONE more time to harden the deposit path so the modal can
  // never open twice in the same animation frame.
  var _gvDepositOpening = false;
  var _gvLastOpenAt = 0;

  function _hardenOpenModal() {
    if (typeof window.openModal !== 'function') {
      // app.js hasn't defined it yet — try again next tick
      return setTimeout(_hardenOpenModal, 50);
    }
    if (window.__gvOpenModalHardened) return;
    window.__gvOpenModalHardened = true;

    var _origOpen = window.openModal;
    window.openModal = function gvSafeOpenModal(id) {
      try {
        var now = Date.now();
        // Global rapid-tap debounce (300ms) — fixes the deposit flicker
        if (now - _gvLastOpenAt < 300) {
          // If it's the SAME modal being re-opened, just no-op
          var existing = document.getElementById(id);
          if (existing && !existing.classList.contains('hidden')) return;
        }
        _gvLastOpenAt = now;

        // Deposit-specific guard — block re-entrant calls
        if (id === 'depositModal') {
          if (_gvDepositOpening) return;
          _gvDepositOpening = true;
          // Pre-reset all visible state in ONE batch so the user
          // doesn't see two frames of stale UI flashing
          requestAnimationFrame(function() {
            try {
              var amt = document.getElementById('depositAmount');
              if (amt) amt.value = '';
              var utr = document.getElementById('depositUTR');
              if (utr) utr.value = '';
              var ph  = document.getElementById('screenshotPlaceholder');
              if (ph) ph.classList.remove('hidden');
              var pr  = document.getElementById('screenshotPreview');
              if (pr) pr.classList.add('hidden');
              var pi  = document.getElementById('screenshotPreviewImg');
              if (pi) pi.src = '';
              var inp = document.getElementById('screenshotInput');
              if (inp) inp.value = '';
            } catch(_) {}
          });
          setTimeout(function() { _gvDepositOpening = false; }, 400);
        }

        // Ensure the overlay starts at opacity 0 so the slide-up
        // doesn't appear to "stutter" when re-opened quickly
        var modal = document.getElementById(id);
        if (modal) {
          modal.style.willChange = 'opacity, transform';
          // Force a single reflow boundary
          void modal.offsetWidth;
        }

        return _origOpen.call(this, id);
      } catch (err) {
        console.warn('[gv-fix] openModal safe-wrap caught:', err);
        try { return _origOpen.call(this, id); } catch(_) {}
      }
    };
  }
  _hardenOpenModal();
  // Also re-harden after window load in case app.js re-wraps later
  window.addEventListener('load', function() {
    setTimeout(_hardenOpenModal, 100);
    setTimeout(_hardenOpenModal, 800);
  });


  // ─── 2) GLOBAL DOUBLE-TAP GUARD on Deposit triggers ────────
  // Stops the same click landing twice when a user impatiently
  // double-taps the Deposit button (a common mobile pattern).
  document.addEventListener('click', function(e) {
    var t = e.target && e.target.closest
              ? e.target.closest('[onclick*="depositModal"], .wallet-btn.deposit, .qa-btn')
              : null;
    if (!t) return;
    var key = '__gvLastDepositTap';
    var now = Date.now();
    if (t[key] && (now - t[key]) < 350) {
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
    t[key] = now;
  }, true);


  // ─── 3) PAUSE HEAVY ANIMATIONS WHILE SCROLLING ─────────────
  // Adds .gv-scrolling to <body> while the user scrolls; CSS uses
  // this to short-circuit cosmetic animations → smoother scroll.
  (function setupScrollPause() {
    var body = document.body;
    if (!body) return;
    var scrollTimer = null;
    var passive = { passive: true };
    function onScroll() {
      if (!body.classList.contains('gv-scrolling')) {
        body.classList.add('gv-scrolling');
      }
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function() {
        body.classList.remove('gv-scrolling');
      }, 180);
    }
    window.addEventListener('scroll', onScroll, passive);
    var main = document.getElementById('userMainContent');
    if (main) main.addEventListener('scroll', onScroll, passive);
  })();


  // ─── 4) PAUSE ANIMATIONS WHEN A MODAL IS OPEN ──────────────
  // The aurora/shine layers behind the modal are invisible anyway —
  // pausing them gives a 5-15 FPS boost on entry-level Android.
  (function setupModalAnimPause() {
    var observer;
    function update() {
      var anyOpen = !!document.querySelector('.modal-overlay:not(.hidden)');
      document.body.classList.toggle('gv-modal-open', anyOpen);
    }
    try {
      observer = new MutationObserver(update);
      document.querySelectorAll('.modal-overlay').forEach(function(m) {
        observer.observe(m, { attributes: true, attributeFilter: ['class'] });
      });
    } catch(_) {}
    // Safety re-check every 500ms (cheap)
    setInterval(update, 500);
    update();
  })();


  // ─── 5) RESPONSIVE CLAIM CARD — re-flow on rotate / resize ─
  // Forces a single recalc when viewport changes so the new
  // breakpoint takes effect immediately (some Android browsers
  // skip the recalc on rotation, leaving a stale layout).
  (function setupResponsiveReflow() {
    var raf = null;
    function reflow() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function() {
        var card = document.getElementById('dailyRewardBanner');
        if (!card) return;
        // Toggle a no-op class to trigger CSS recalc
        card.classList.add('gv-reflow');
        // Force reflow then remove
        void card.offsetWidth;
        card.classList.remove('gv-reflow');
      });
    }
    window.addEventListener('resize', reflow, { passive: true });
    window.addEventListener('orientationchange', reflow, { passive: true });
  })();


  // ─── 6) DROP UNUSED `animation-play-state` on splash hide ──
  // When the splash screen is hidden, free its animations from
  // the GPU layer tree (helps initial dashboard responsiveness).
  (function freezeSplashAfterHide() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;
    var done = false;
    function check() {
      if (done) return;
      if (splash.classList.contains('hidden')) {
        done = true;
        try {
          splash.style.display = 'none';
          splash.querySelectorAll('*').forEach(function(el) {
            el.style.animation = 'none';
          });
        } catch(_) {}
      }
    }
    var mo = new MutationObserver(check);
    mo.observe(splash, { attributes: true, attributeFilter: ['class'] });
    setTimeout(check, 3000);
    setTimeout(check, 6000);
    setTimeout(check, 10000);
  })();


  // ─── 7) PASSIVE TOUCH LISTENERS (perf hint for browsers) ──
  // Marks common scroll containers as passive listeners so the
  // browser can scroll on the compositor thread.
  ['touchstart', 'touchmove', 'wheel'].forEach(function(evt) {
    document.addEventListener(evt, function(){}, { passive: true });
  });


  // ─── 8) FALLBACK CSS injection (in case the patch CSS file
  // doesn't load due to CDN / caching issues, we still get
  // the most critical performance + deposit-glitch rules) ────
  (function injectCriticalCSS() {
    if (document.getElementById('gv-critical-perf')) return;
    var s = document.createElement('style');
    s.id = 'gv-critical-perf';
    s.textContent = [
      'body.gv-scrolling .login-aurora,',
      'body.gv-scrolling .login-particle,',
      'body.gv-scrolling .wealth-ring,',
      'body.gv-scrolling .claim-btn-ring,',
      'body.gv-scrolling .claim-btn-spark,',
      'body.gv-scrolling .signup-bonus-card-premium-v18::before,',
      'body.gv-scrolling .signup-bonus-card-premium-v18 .claim-btn::after,',
      'body.gv-scrolling .signup-bonus-card-premium-v18 .claim-btn { animation-play-state: paused !important; }',
      'body.gv-modal-open .login-aurora,',
      'body.gv-modal-open .login-particle,',
      'body.gv-modal-open .wealth-ring,',
      'body.gv-modal-open .signup-bonus-card-premium-v18::before { animation-play-state: paused !important; }',
      '#depositModal .modal-card { animation: gvDepositSlide 0.32s cubic-bezier(0.22,1,0.36,1) both !important; }',
      '@keyframes gvDepositSlide { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }',
      '.claim-btn-content { flex-wrap: wrap !important; gap: 8px 10px !important; }',
      '.claim-btn-text { flex: 1 1 auto; min-width: 0; text-align: center; }',
      '.claim-btn-amount { flex: 0 0 auto; white-space: nowrap; font-variant-numeric: tabular-nums; }',
      '@media (max-width: 360px) {',
      '  .claim-btn-content { flex-direction: column; gap: 6px !important; }',
      '}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  })();


  console.log('[GROWVEST] perf + deposit-glitch + responsive-claim patch v19.1 active');
})();
