(function () {
  'use strict';

  const GAMES_PER_PAGE = 36;
  let currentPage = 1;

  const CATEGORY_MAP = {
    all: '',
    action: '/en/action-games',
    puzzle: '/en/puzzle-games',
    racing: '/en/racing-games',
    sports: '/en/sports-games',
    io: '/en/io-games',
    adventure: '/en/adventure-games',
    casual: '/en/casual-games',
    strategy: '/en/strategy-games',
    multiplayer: '/en/multiplayer-games',
  };

  const FALLBACK_GAMES = [
    { title: 'Subway Surfers', category: 'Action', thumb: 'https://img.cdn.poki.it/images/big/570d5fd1e7b0f34a410b9acba409f1c2.png' },
    { title: '1010! Puzzle', category: 'Puzzle', thumb: 'https://img.cdn.poki.it/images/big/54d59b123e15d4b5ef3b6a0be525ed1c.png' },
    { title: 'Temple Run 2', category: 'Action', thumb: 'https://img.cdn.poki.it/images/big/3e183ea1f37c77c8e6db6829a65c201d.png' },
    { title: 'Crossy Road', category: 'Casual', thumb: 'https://img.cdn.poki.it/images/big/59e5a6d4e47d4d7eb0660ed4eb5e3319.png' },
    { title: 'Stickman Hook', category: 'Action', thumb: 'https://img.cdn.poki.it/images/big/d45d89020e154a60af37f08200a3b1a1.png' },
    { title: 'Basketball Stars', category: 'Sports', thumb: 'https://img.cdn.poki.it/images/big/02c2b1f013c2f8a1e5e1b503119003d7.png' },
    { title: 'Drift Hunters', category: 'Racing', thumb: 'https://img.cdn.poki.it/images/big/1d5c42bb9a03f82a0e5a6d3682123a34.png' },
    { title: 'Shell Shockers', category: '.io', thumb: 'https://img.cdn.poki.it/images/big/2e252a8f4396001f802b16956098bb63.png' },
    { title: 'Slither.io', category: '.io', thumb: 'https://img.cdn.poki.it/images/big/954a1d525e6d5f93af94ee9f3cf27e88.png' },
    { title: 'Agar.io', category: '.io', thumb: 'https://img.cdn.poki.it/images/big/6a000a448dab8a5daa25e5b26d485c5c.png' },
    { title: 'Moto X3M', category: 'Racing', thumb: 'https://img.cdn.poki.it/images/big/b86520e10e4e2e7d0b8d19c858d9a86f.png' },
    { title: 'Vex 7', category: 'Action', thumb: 'https://img.cdn.poki.it/images/big/005e39415b053c92eb21d3ddfa1db8b3.png' },
    { title: 'Cut the Rope', category: 'Puzzle', thumb: 'https://img.cdn.poki.it/images/big/890e97c8008e7a87589b5f3b76cd9b88.png' },
    { title: 'Fidget Spinner', category: 'Casual', thumb: 'https://img.cdn.poki.it/images/big/fb29e5f01b8c7c3319d7671d7493d277.png' },
    { title: 'Football Heads', category: 'Sports', thumb: 'https://img.cdn.poki.it/images/big/c2f94e5c3e0e7b76ccf3af3656cf7b0b.png' },
    { title: 'Ludo King', category: 'Strategy', thumb: 'https://img.cdn.poki.it/images/big/45c798409f7e5d1be02c4b87d032f1c8.png' },
    { title: 'Zombie Tsunami', category: 'Action', thumb: 'https://img.cdn.poki.it/images/big/3e183ea1f37c77c8e6db6829a65c201d.png' },
    { title: 'Pixel Warfare', category: 'Multiplayer', thumb: 'https://img.cdn.poki.it/images/big/56af4e0ef23e9999091320e573f64741.png' },
    { title: 'Paper.io 2', category: '.io', thumb: 'https://img.cdn.poki.it/images/big/1bcf2f16f2b98c6f7f153c3a1e4edcb6.png' },
    { title: 'Idle Ants', category: 'Casual', thumb: 'https://img.cdn.poki.it/images/big/f96e9b8f205ab509d6d0e38c3c67db69.png' },
    { title: 'Among Us Online', category: 'Multiplayer', thumb: 'https://img.cdn.poki.it/images/big/54d59b123e15d4b5ef3b6a0be525ed1c.png' },
    { title: 'Monkey Banana', category: 'Casual', thumb: 'https://img.cdn.poki.it/images/big/570d5fd1e7b0f34a410b9acba409f1c2.png' },
    { title: 'Traffic Rider', category: 'Racing', thumb: 'https://img.cdn.poki.it/images/big/d45d89020e154a60af37f08200a3b1a1.png' },
    { title: 'Soccer Skills', category: 'Sports', thumb: 'https://img.cdn.poki.it/images/big/02c2b1f013c2f8a1e5e1b503119003d7.png' },
    { title: 'Word Search', category: 'Puzzle', thumb: 'https://img.cdn.poki.it/images/big/954a1d525e6d5f93af94ee9f3cf27e88.png' },
    { title: 'Stickman Castle', category: 'Strategy', thumb: 'https://img.cdn.poki.it/images/big/2e252a8f4396001f802b16956098bb63.png' },
    { title: 'Ninja Legends', category: 'Action', thumb: 'https://img.cdn.poki.it/images/big/b86520e10e4e2e7d0b8d19c858d9a86f.png' },
    { title: 'Ball Merge 2048', category: 'Puzzle', thumb: 'https://img.cdn.poki.it/images/big/1d5c42bb9a03f82a0e5a6d3682123a34.png' },
    { title: 'Drift Boss', category: 'Racing', thumb: 'https://img.cdn.poki.it/images/big/005e39415b053c92eb21d3ddfa1db8b3.png' },
    { title: 'Rolly Legs', category: 'Casual', thumb: 'https://img.cdn.poki.it/images/big/6a000a448dab8a5daa25e5b26d485c5c.png' },
    { title: 'Gun Mayhem', category: 'Multiplayer', thumb: 'https://img.cdn.poki.it/images/big/890e97c8008e7a87589b5f3b76cd9b88.png' },
    { title: 'Rise Up', category: 'Puzzle', thumb: 'https://img.cdn.poki.it/images/big/fb29e5f01b8c7c3319d7671d7493d277.png' },
    { title: 'Bloxd.io', category: '.io', thumb: 'https://img.cdn.poki.it/images/big/45c798409f7e5d1be02c4b87d032f1c8.png' },
    { title: 'Smash Karts', category: 'Racing', thumb: 'https://img.cdn.poki.it/images/big/c2f94e5c3e0e7b76ccf3af3656cf7b0b.png' },
    { title: 'Crazy Cars', category: 'Racing', thumb: 'https://img.cdn.poki.it/images/big/3e183ea1f37c77c8e6db6829a65c201d.png' },
    { title: 'Tunnel Rush', category: 'Action', thumb: 'https://img.cdn.poki.it/images/big/56af4e0ef23e9999091320e573f64741.png' },
  ];

  function renderGameCard(game) {
    return '<a href="/' + encodeURIComponent(game.title.toLowerCase().replace(/\s+/g, '-')) + '" class="game-card">' +
      '<div class="game-card-thumb">' +
      '<img src="' + game.thumb + '" alt="' + game.title + '" loading="lazy">' +
      (game.badge ? '<span class="game-card-badge">' + game.badge + '</span>' : '') +
      '</div>' +
      '<div class="game-card-info">' +
      '<div class="game-card-title">' + game.title + '</div>' +
      '<div class="game-card-category">' + game.category + '</div>' +
      '</div></a>';
  }

  function renderGames(games) {
    var grid = document.getElementById('gamesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    games.forEach(function (game) {
      grid.insertAdjacentHTML('beforeend', renderGameCard(game));
    });
  }

  function shuffleArray(arr) {
    var shuffled = arr.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled;
  }

  function initCategoryFilter() {
    var pills = document.querySelectorAll('.cat-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        var shuffled = shuffleArray(FALLBACK_GAMES);
        renderGames(shuffled);
      });
    });
  }

  function initSearch() {
    var input = document.getElementById('searchInput');
    if (!input) return;
    var debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var query = input.value.toLowerCase().trim();
        if (!query) {
          renderGames(shuffleArray(FALLBACK_GAMES));
          return;
        }
        var filtered = FALLBACK_GAMES.filter(function (g) {
          return g.title.toLowerCase().includes(query) || g.category.toLowerCase().includes(query);
        });
        renderGames(filtered.length ? filtered : FALLBACK_GAMES.slice(0, 8));
      }, 200);
    });
  }

  function initInfiniteScroll() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          currentPage++;
          var more = shuffleArray(FALLBACK_GAMES).slice(0, 8);
          var grid = document.getElementById('gamesGrid');
          if (grid) {
            more.forEach(function (game) {
              grid.insertAdjacentHTML('beforeend', renderGameCard(game));
            });
          }
        }
      });
    }, { threshold: 0.1 });

    var sentinel = document.createElement('div');
    sentinel.id = 'scrollSentinel';
    sentinel.style.height = '1px';
    document.querySelector('.games-section').appendChild(sentinel);
    observer.observe(sentinel);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderGames(shuffleArray(FALLBACK_GAMES));
    initCategoryFilter();
    initSearch();
    initInfiniteScroll();
  });
})();
