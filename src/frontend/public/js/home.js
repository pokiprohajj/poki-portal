(function () {
  'use strict';

  /* ---------- Skeleton: reveal images when loaded ---------- */
  function initSkeletons() {
    document.querySelectorAll('.game-card-thumb img').forEach(function (img) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () {
          img.classList.add('loaded');
        });
        img.addEventListener('error', function () {
          img.classList.add('loaded');
        });
      }
    });
  }

  /* ---------- Carousel arrows (desktop) ---------- */
  function initCarousels() {
    document.querySelectorAll('.carousel-wrap').forEach(function (wrap) {
      var track = wrap.querySelector('.carousel-track');
      var prev = wrap.querySelector('.carousel-prev');
      var next = wrap.querySelector('.carousel-next');
      if (!track) return;

      function scrollByCards(dir) {
        var card = track.querySelector('.game-card');
        var amount = card ? (card.offsetWidth + 16) * 3 : wrap.offsetWidth * 0.8;
        track.scrollBy({ left: dir * amount, behavior: 'smooth' });
      }

      if (prev) prev.addEventListener('click', function () { scrollByCards(-1); });
      if (next) next.addEventListener('click', function () { scrollByCards(1); });

      var isDown = false, startX = 0, startScroll = 0;
      track.addEventListener('mousedown', function (e) {
        isDown = true;
        startX = e.pageX;
        startScroll = track.scrollLeft;
        track.style.cursor = 'grabbing';
      });
      window.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        var walk = (e.pageX - startX) * 1.2;
        track.scrollLeft = startScroll - walk;
      });
      window.addEventListener('mouseup', function () {
        isDown = false;
        track.style.cursor = '';
      });
    });
  }

  /* ---------- Search + category filter ---------- */
  function applyFilter() {
    var query = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase().trim();
    var activeCat = document.querySelector('.cat-pill.active');
    var cat = activeCat ? activeCat.getAttribute('data-cat') : 'all';

    var cards = document.querySelectorAll('.game-card');
    var visible = 0;
    cards.forEach(function (card) {
      var title = (card.getAttribute('data-title') || '').toLowerCase();
      var category = (card.getAttribute('data-category') || '').toLowerCase();
      var matchesQuery = !query || title.indexOf(query) !== -1;
      var matchesCat = cat === 'all' || category === cat.toLowerCase();
      if (matchesQuery && matchesCat) {
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

  document.addEventListener('DOMContentLoaded', function () {
    initSkeletons();
    initCarousels();
    initSearch();
    initFavorites();
  });
})();
