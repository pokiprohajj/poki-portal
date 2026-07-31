(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORE = 'bghq:continue';

  /* ---------- Storage helpers ---------- */
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; }
  }
  function writeStore(list) {
    try { localStorage.setItem(STORE, JSON.stringify(list.slice(0, 12))); } catch (e) { /* noop */ }
  }

  /* ---------- Skeleton: reveal images when loaded ---------- */
  function initSkeletons(root) {
    (root || document).querySelectorAll('.game-card-thumb img').forEach(function (img) {
      if (img.complete) img.classList.add('loaded');
      else {
        img.addEventListener('load', function () { img.classList.add('loaded'); });
        img.addEventListener('error', function () { img.classList.add('loaded'); });
      }
    });
  }

  /* ---------- Sticky header ---------- */
  function initHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Carousel arrows + drag ---------- */
  function initCarouselWrap(wrap) {
    var track = wrap.querySelector('.carousel-track');
    var prev = wrap.querySelector('.carousel-prev');
    var next = wrap.querySelector('.carousel-next');
    if (!track) return;

    function scrollByCards(dir) {
      var card = track.querySelector('.game-card');
      var amount = card ? (card.offsetWidth + 16) * 3 : wrap.offsetWidth * 0.8;
      track.scrollBy({ left: dir * amount, behavior: REDUCED ? 'auto' : 'smooth' });
    }

    if (prev) prev.addEventListener('click', function () { scrollByCards(-1); });
    if (next) next.addEventListener('click', function () { scrollByCards(1); });

    var isDown = false, startX = 0, startScroll = 0;
    track.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isDown = true;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      track.scrollLeft = startScroll - (e.pageX - startX) * 1.2;
    });
    window.addEventListener('mouseup', function () {
      isDown = false;
      track.classList.remove('is-dragging');
    });
  }

  function initCarousels() {
    document.querySelectorAll('.carousel-wrap').forEach(initCarouselWrap);
  }

  /* ---------- Continue Playing rail (client-side, honest) ---------- */
  function cardFor(game) {
    var g = game || {};
    var video = g.video
      ? '<video class="card-video" src="' + g.video + '" muted loop playsinline preload="none" aria-hidden="true"></video>'
      : '';
    return '<a class="game-card game-card-m" href="/en/g/' + encodeURIComponent(g.slug || '') + '" data-title="' + (g.title || '') + '" data-category="' + (g.category || '') + '" data-slug="' + (g.slug || '') + '">' +
      '<div class="game-card-thumb">' +
      '<img src="' + (g.thumb || '') + '" alt="' + (g.title || '') + '" loading="lazy" width="314" height="314">' +
      video +
      '<span class="card-chip">' + (g.category || '') + '</span>' +
      '<span class="card-fav" role="button" aria-label="Remove from continue playing" aria-pressed="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>' +
      '<div class="game-card-overlay"><span class="card-play"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></div>' +
      '</div>' +
      '<div class="game-card-info"><div class="game-card-title">' + (g.title || '') + '</div><div class="game-card-category">' + (g.category || '') + '</div>' +
      '<div class="card-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Continue</div></div>' +
      '</a>';
  }

  function renderContinue() {
    var section = document.getElementById('continueSection');
    var list = readStore();
    if (!section || !list.length) return;
    section.hidden = false;
    section.innerHTML =
      '<div class="section-header"><h2>Continue Playing</h2></div>' +
      '<div class="carousel-wrap">' +
      '<button class="carousel-arrow carousel-prev" aria-label="Scroll Continue Playing left" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>' +
      '<div class="carousel-track" data-carousel="continue">' + list.map(cardFor).join('') + '</div>' +
      '<button class="carousel-arrow carousel-next" aria-label="Scroll Continue Playing right" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>' +
      '</div>';
    var wrap = section.querySelector('.carousel-wrap');
    if (wrap) initCarouselWrap(wrap);
    initSkeletons(section);
    initCardVideos(section);
    section.classList.add('in-view');
  }

  function rememberGame(card) {
    var slug = card.getAttribute('data-slug');
    var title = card.getAttribute('data-title');
    var category = card.getAttribute('data-category');
    var img = card.querySelector('img');
    var video = card.querySelector('.card-video');
    var thumb = img ? img.getAttribute('src') : '';
    var videoUrl = video ? video.getAttribute('src') : '';
    if (!slug) return;
    var list = readStore().filter(function (g) { return g.slug !== slug; });
    list.unshift({ slug: slug, title: title, category: category, thumb: thumb, video: videoUrl });
    writeStore(list);
  }

  /* ---------- Search filter + floating panel ---------- */
  function applyFilter() {
    var query = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase().trim();
    var cards = document.querySelectorAll('.game-card');
    var visible = 0;
    cards.forEach(function (card) {
      var title = (card.getAttribute('data-title') || '').toLowerCase();
      var matches = !query || title.indexOf(query) !== -1;
      if (matches) { card.style.display = ''; visible++; }
      else { card.style.display = 'none'; }
    });
    var empty = document.getElementById('noResults');
    if (empty) empty.style.display = visible ? 'none' : 'block';
  }

  function initSearch() {
    var input = document.getElementById('searchInput');
    if (!input) return;
    var debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilter, 200);
    });
  }

  /* ---------- Favorite toggle (persisted) ---------- */
  function initFavorites() {
    document.querySelectorAll('.card-fav').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var card = btn.closest('.game-card');
        var wasActive = btn.classList.toggle('active');
        if (card && wasActive) rememberGame(card);
        if (card && !wasActive) {
          var slug = card.getAttribute('data-slug');
          writeStore(readStore().filter(function (g) { return g.slug !== slug; }));
        }
        renderContinue();
      });
    });
  }

  /* ---------- Touch: tap once to reveal, tap again to open ---------- */
  function initTouchReveal() {
    if (!window.matchMedia || !window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.game-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        var fav = e.target.closest('.card-fav');
        if (fav) return;
        if (card.dataset.tapped) {
          rememberGame(card);
          window.location.href = card.getAttribute('href');
          return;
        }
        e.preventDefault();
        card.dataset.tapped = '1';
        card.classList.add('touch-open');
        setTimeout(function () { delete card.dataset.tapped; }, 700);
      });
    });
  }

  /* ---------- Keyboard shortcut: Ctrl/Cmd+K to focus search ---------- */
  function initShortcuts() {
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        var input = document.getElementById('searchInput');
        if (input) { input.focus(); input.select(); }
      }
    });
  }

  /* ---------- Card hover video (like Poki, desktop only) ---------- */
  function initCardVideos(root) {
    if (REDUCED || (window.matchMedia && window.matchMedia('(hover: none)').matches)) return;
    (root || document).querySelectorAll('.game-card').forEach(function (card) {
      var video = card.querySelector('.card-video');
      if (!video) return;
      var enter = function () {
        if (!video.getAttribute('data-primed')) {
          video.setAttribute('data-primed', '1');
          var p = video.play();
          if (p) p.catch(function () {});
        } else {
          video.play().catch(function () {});
        }
      };
      var leave = function () { video.pause(); video.currentTime = 0; };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
    });
  }

  /* ---------- Hero rotation ---------- */
  function initHeroRotation() {
    var section = document.getElementById('heroSection');
    if (!section || REDUCED) return;
    var raw = section.getAttribute('data-rotate');
    if (!raw) return;
    var games;
    try { games = JSON.parse(raw); } catch (e) { return; }
    if (!games || games.length < 2) return;

    var idx = 0;
    var eyebrow = section.querySelector('.hero-eyebrow');
    var title = section.querySelector('h1');
    var playBtn = section.querySelector('.hero-cta .btn-primary');
    var art = document.getElementById('heroArt');
    var preload = new Image();

    function apply(g) {
      if (eyebrow) eyebrow.innerHTML = '<span class="dot"></span>Featured · ' + g.category;
      if (title) title.textContent = g.title;
      if (playBtn) playBtn.setAttribute('href', '/en/g/' + encodeURIComponent(g.slug));
      if (art) {
        art.src = g.thumb;
        art.alt = g.title + ' featured artwork';
        preload.src = g.thumb;
      }
    }

    var timer = null;
    function next() {
      idx = (idx + 1) % games.length;
      section.classList.add('is-rotating');
      setTimeout(function () {
        apply(games[idx]);
        section.classList.remove('is-rotating');
      }, 550);
    }

    function start() { if (!timer) timer = setInterval(next, 7000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    var root = document.documentElement;
    section.addEventListener('mouseenter', stop);
    section.addEventListener('mouseleave', start);
    root.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    start();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSkeletons();
    initHeader();
    initReveal();
    initCarousels();
    renderContinue();
    initSearch();
    initFavorites();
    initTouchReveal();
    initCardVideos();
    initHeroRotation();
    initShortcuts();
  });
})();
