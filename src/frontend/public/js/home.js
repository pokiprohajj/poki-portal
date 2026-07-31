(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Skeleton: reveal images when loaded ---------- */
  function initSkeletons() {
    document.querySelectorAll('.game-card-thumb img').forEach(function (img) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () { img.classList.add('loaded'); });
        img.addEventListener('error', function () { img.classList.add('loaded'); });
      }
    });
  }

  /* ---------- Sticky header: strengthen on scroll ---------- */
  function initHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Scroll reveal (progressive fade-up) ---------- */
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

  /* ---------- Carousel arrows + drag (desktop) ---------- */
  function initCarousels() {
    document.querySelectorAll('.carousel-wrap').forEach(function (wrap) {
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
        var walk = (e.pageX - startX) * 1.2;
        track.scrollLeft = startScroll - walk;
      });
      window.addEventListener('mouseup', function () {
        isDown = false;
        track.classList.remove('is-dragging');
      });
    });
  }

  /* ---------- Search filter ---------- */
  function applyFilter() {
    var query = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase().trim();
    var cards = document.querySelectorAll('.game-card');
    var visible = 0;
    cards.forEach(function (card) {
      var title = (card.getAttribute('data-title') || '').toLowerCase();
      var matches = !query || title.indexOf(query) !== -1;
      if (matches) {
        card.style.display = '';
        visible++;
      } else {
        card.style.display = 'none';
      }
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

  /* ---------- Favorite button (UI only) ---------- */
  function initFavorites() {
    document.querySelectorAll('.card-fav').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('active');
      });
    });
  }

  /* ---------- Touch: open play overlay on tap ---------- */
  function initTouchReveal() {
    if (!window.matchMedia || !window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.game-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        var fav = e.target.closest('.card-fav');
        if (fav) return;
        if (card.dataset.tapped) { window.location.href = card.getAttribute('href'); return; }
        e.preventDefault();
        card.dataset.tapped = '1';
        card.classList.add('touch-open');
        setTimeout(function () { delete card.dataset.tapped; }, 700);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSkeletons();
    initHeader();
    initReveal();
    initCarousels();
    initSearch();
    initFavorites();
    initTouchReveal();
  });
})();
