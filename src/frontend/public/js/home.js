(function () {
  'use strict';

  function getGameCards() {
    return Array.prototype.slice.call(document.querySelectorAll('.game-card'));
  }

  function renderVisible(cards) {
    cards.forEach(function (card) {
      card.style.display = 'block';
    });
  }

  function applyFilter() {
    var query = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase().trim();
    var activeCat = document.querySelector('.cat-pill.active');
    var cat = activeCat ? activeCat.getAttribute('data-cat') : 'all';

    var cards = getGameCards();
    var visible = [];
    cards.forEach(function (card) {
      var title = (card.getAttribute('data-title') || '').toLowerCase();
      var category = (card.getAttribute('data-category') || '').toLowerCase();
      var matchesQuery = !query || title.indexOf(query) !== -1 || category.indexOf(query) !== -1;
      var matchesCat = cat === 'all' || category === cat.toLowerCase();
      if (matchesQuery && matchesCat) {
        card.style.display = 'block';
        visible.push(card);
      } else {
        card.style.display = 'none';
      }
    });

    var empty = document.getElementById('noResults');
    if (empty) empty.style.display = visible.length ? 'none' : 'block';
  }

  function initCategoryFilter() {
    var pills = document.querySelectorAll('.cat-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        applyFilter();
      });
    });
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

  document.addEventListener('DOMContentLoaded', function () {
    renderVisible(getGameCards());
    initCategoryFilter();
    initSearch();
  });
})();
