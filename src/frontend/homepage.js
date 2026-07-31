const config = require('../config');
const GAMES = require('./games-data');

const HERO_GAME = (() => {
  return GAMES.find((g) => g.slug === 'subway-surfers') || GAMES[0];
})();

const FEATURED_SLUGS = ['retro-bowl', 'gobattle2', 'drift-boss', 'stickman-hook', 'fruit-ninja', 'murder', 'minefun-io', 'talking-tom-gold-run'];
const QUICKPLAY_SLUGS = ['tag', 'hide-and-paint', 'tictactoe', 'eggy-car', 'car-circle', 'blocky-blast-puzzle', 'monkey-mart', 'tunnel-rush'];
const MOBILE_SLUGS = ['subway-surfers', 'talking-tom-gold-run', 'drift-boss', 'hill-climb-racing-lite', 'fruit-ninja', 'blocky-blast-puzzle', 'my-perfect-hotel', 'tunnel-rush'];

const CAROUSELS = [
  { id: 'trending', title: 'Trending Now', slug: null, games: GAMES.slice(0, 16) },
  { id: 'popular', title: 'Popular', slug: '/en/popular', games: GAMES.slice(16, 30) },
  { id: 'action', title: 'Action', slug: '/en/action', games: byCat('Action').slice(0, 12) },
  { id: 'puzzle', title: 'Puzzle', slug: '/en/puzzle', games: byCat('Puzzle').slice(0, 12) },
  { id: 'racing', title: 'Racing', slug: '/en/racing', games: byCat('Racing').slice(0, 12) },
  { id: 'sports', title: 'Sports', slug: '/en/sports', games: byCat('Sports').slice(0, 12) },
  { id: 'multiplayer', title: 'Multiplayer', slug: '/en/multiplayer', games: byCat('Multiplayer').slice(0, 12) },
  { id: 'dressup', title: 'Dress Up', slug: '/en/dress-up', games: byCat('Dress Up').slice(0, 12) },
  { id: 'family', title: 'Family Games', slug: null, games: GAMES.filter((g) => g.family).slice(0, 12) },
  { id: 'quickplay', title: 'Quick Play', slug: null, games: pick(QUICKPLAY_SLUGS) },
  { id: 'editors', title: "Editor's Picks", slug: null, games: pick(FEATURED_SLUGS) },
  { id: 'mobile', title: 'Mobile Favorites', slug: null, games: pick(MOBILE_SLUGS) },
];

function pick(slugs) {
  return slugs.map((s) => GAMES.find((g) => g.slug === s)).filter(Boolean);
}

function tileGame(n) {
  const game = n === 1 ? GAMES.find((g) => g.slug === 'drift-boss') : GAMES.find((g) => g.slug === 'retro-bowl');
  return game ? game.thumb : HERO_GAME.thumb;
}

function byCat(cat) {
  return GAMES.filter((g) => g.category === cat);
}

function gameCard(game, opts) {
  const o = opts || {};
  const size = o.size || 'm';
  return `<a class="game-card game-card-${size}" href="/en/g/${encodeURIComponent(game.slug)}" data-title="${game.title}" data-category="${game.category}" data-slug="${game.slug}">
  <div class="game-card-thumb">
    <img src="${game.thumb}" alt="${game.title} - play free online at BrowserGamesHQ" loading="lazy" width="314" height="314">
    <span class="card-chip">${game.category}</span>
    <span class="card-fav" role="button" aria-label="Add ${game.title} to favorites"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>
    <div class="game-card-overlay">
      <span class="card-play"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
    </div>
  </div>
  <div class="game-card-info">
    <div class="game-card-title">${game.title}</div>
    <div class="game-card-category">${game.category}</div>
    <div class="card-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Instant Play</div>
  </div>
</a>`;
}

function carouselBlock(c) {
  const seeAll = c.slug ? `<a href="${c.slug}" class="see-all">See All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>` : '';
  return `<section class="carousel-section reveal" id="${c.id}">
  <div class="section-header">
    <h2>${c.title}</h2>
    ${seeAll}
  </div>
  <div class="carousel-wrap">
    <button class="carousel-arrow carousel-prev" aria-label="Scroll ${c.title} left" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
    <div class="carousel-track" data-carousel="${c.id}">
      ${c.games.map((g) => gameCard(g)).join('')}
    </div>
    <button class="carousel-arrow carousel-next" aria-label="Scroll ${c.title} right" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
  </div>
</section>`;
}

const render = (req, res) => {
  const siteUrl = `https://${config.domain}`;
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-site-verification" content="${config.searchConsoleVerification || 'JdrC1oUAbTyddJDIO7HfqQuEtVcl_pxdiYpCmIU29Ws'}">
  <meta name="msvalidate.01" content="9D9ADF6BB82D31433C1A9AC6236F7F66">
  <title>Free Online Games - Play 1500+ Browser Games Instantly | BrowserGamesHQ</title>
  <meta name="description" content="Play thousands of free online browser games instantly at BrowserGamesHQ. No downloads, no sign-ups. Action, puzzle, racing, sports & more. Updated daily.">
  <meta name="keywords" content="free games, online games, browser games, play games, free online games, BrowserGamesHQ">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${siteUrl}/">
  <meta property="og:site_name" content="BrowserGamesHQ">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free Online Games | BrowserGamesHQ">
  <meta property="og:description" content="Play thousands of free online browser games instantly. No downloads, no sign-ups. Action, puzzle, racing, sports & more.">
  <meta property="og:url" content="${siteUrl}/">
  <meta property="og:image" content="${siteUrl}/static/img/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@BrowserGamesHQ">
  <meta name="twitter:title" content="Free Online Games | BrowserGamesHQ">
  <meta name="twitter:description" content="Play thousands of free online browser games instantly. No downloads, no sign-ups.">
  <meta name="twitter:image" content="${siteUrl}/static/img/og-image.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://img.poki-cdn.com">
  <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">
  <link rel="dns-prefetch" href="//www.googletagmanager.com">
  <link rel="preload" as="image" href="${HERO_GAME.thumb}" fetchpriority="high">
  <link rel="stylesheet" href="/static/css/home.css?v=20260731">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${config.ga4Id || ''}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${config.ga4Id || ''}');
  </script>
  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '2002475273742428');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=2002475273742428&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->
  <script>
  (function(){var k='_bghtid',id=sessionStorage.getItem(k)||(Date.now().toString(36)+Math.random().toString(36).slice(2,6));sessionStorage.setItem(k,id);var g=function(s){try{var d=new Blob(['id='+encodeURIComponent(id)+(s||'')],{type:'application/x-www-form-urlencoded'});navigator.sendBeacon('/t',d)}catch(e){}};g('&page='+encodeURIComponent(location.pathname));setInterval(function(){g('')},8000);var ph=history.pushState,rh=history.replaceState;history.pushState=function(){ph.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};history.replaceState=function(){rh.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};window.addEventListener('popstate',function(){g('&page='+encodeURIComponent(location.pathname))});window.addEventListener('beforeunload',function(){g('&disconnect=1')})})();
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"WebSite","name":"BrowserGamesHQ","url":"${siteUrl}"}
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"BrowserGamesHQ","url":"${siteUrl}","logo":"${siteUrl}/static/img/logo.svg","sameAs":["https://twitter.com/BrowserGamesHQ","https://www.facebook.com/BrowserGamesHQ","https://www.youtube.com/@BrowserGamesHQ"]}
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"CollectionPage","name":"Free Online Games - BrowserGamesHQ","description":"Play thousands of free online browser games instantly. No downloads, no sign-ups.","url":"${siteUrl}/","mainEntity":{"@type":"ItemList","itemListElement":[${GAMES.slice(0, 20).map((g, i) => `{"@type":"ListItem","position":${i + 1},"name":"${g.title}","url":"${siteUrl}/en/g/${g.slug}"}`).join(',')}]}}
  </script>
</head>
<body>
  <header class="site-header" id="siteHeader">
    <div class="header-inner">
      <a href="/" class="logo" aria-label="BrowserGamesHQ home">
        <span class="logo-mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a1 1 0 0 1 1 1v2.6a1 1 0 0 1-.3.7L13.4 12l5.3 4.7a1 1 0 0 1 .3.7V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2.6a1 1 0 0 1 .3-.7L10.6 12 5.3 7.3a1 1 0 0 1-.3-.7V4a1 1 0 0 1 1-1z"/></svg></span>
        <span class="logo-text">BrowserGamesHQ</span>
      </a>
      <nav class="nav-links" aria-label="Main navigation">
        <a href="/" class="nav-link active">Home</a>
        <a href="/en/popular" class="nav-link">Popular</a>
        <a href="/en/all-games" class="nav-link">All Games</a>
        <a href="/blog" class="nav-link">Blog</a>
      </nav>
      <div class="search-bar">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search games..." id="searchInput" aria-label="Search games">
      </div>
    </div>
  </header>

  <main>
    <section class="hero-section" aria-label="Featured game">
      <div class="hero-lights"></div>
      <div class="hero-grain"></div>
      <div class="hero-content">
        <div class="hero-copy">
          <span class="hero-eyebrow"><span class="dot"></span>Featured · ${HERO_GAME.category}</span>
          <h1>${HERO_GAME.title}</h1>
          <p class="hero-sub">Jump into one of the most played browser games in the world — free, no download, no sign-up. Just open and play.</p>
          <div class="hero-cta">
            <a href="/en/g/${encodeURIComponent(HERO_GAME.slug)}" class="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Play Now
            </a>
            <a href="#trending" class="btn btn-secondary">Explore Games</a>
          </div>
          <div class="hero-tags">
            <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Instant Play</span>
            <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Free Forever</span>
            <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>Any Device</span>
          </div>
        </div>
        <div class="hero-art">
          <div class="hero-art-halo"></div>
          <div class="hero-art-frame">
            <img src="${HERO_GAME.thumb}" alt="${HERO_GAME.title} featured artwork" width="314" height="314" fetchpriority="high">
          </div>
          <div class="hero-tile tile-1"><img src="${tileGame(1)}" alt="" aria-hidden="true" loading="lazy"></div>
          <div class="hero-tile tile-2"><img src="${tileGame(2)}" alt="" aria-hidden="true" loading="lazy"></div>
        </div>
      </div>
    </section>

    ${CAROUSELS.map((c, i) => (i === 0 ? carouselBlock(c) + '\n    <section class="carousel-section continue-slot reveal" id="continueSection" hidden></section>' : carouselBlock(c))).join('')}

    <section class="why-section reveal">
      <div class="section-header"><h2>Why BrowserGamesHQ?</h2></div>
      <p class="why-lead">Thousands of free games. No downloads. No sign-ups. Just click and play.</p>
      <div class="why-grid">
        <article class="why-card"><div class="why-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div><h3>Play in Seconds</h3><p>Every game launches straight in your browser.</p></article>
        <article class="why-card"><div class="why-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg></div><h3>Mobile Ready</h3><p>Plays beautifully on any device.</p></article>
        <article class="why-card"><div class="why-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><h3>Always Free</h3><p>100% free. No subscriptions, no paywalls.</p></article>
        <article class="why-card"><div class="why-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9"/><polyline points="21 3 21 9 15 9"/></svg></div><h3>Fresh Daily</h3><p>New titles added to the catalog.</p></article>
      </div>
    </section>
  </main>

  <div id="noResults" class="no-results" style="display:none">No games match your search. Try another keyword or browse <a href="/en/all-games">all games</a>.</div>

  <footer class="site-footer reveal">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo">BrowserGamesHQ</span>
        <p>Free online browser games, played instantly. No downloads, no sign-ups — just click and play.</p>
      </div>
      <div class="footer-links">
        <h4>Categories</h4>
        <a href="/en/action">Action</a>
        <a href="/en/puzzle">Puzzle</a>
        <a href="/en/racing">Racing</a>
        <a href="/en/sports">Sports</a>
        <a href="/en/multiplayer">Multiplayer</a>
        <a href="/en/all-games">All Games</a>
      </div>
      <div class="footer-links">
        <h4>Discover</h4>
        <a href="/en/popular">Popular Games</a>
        <a href="/en/categories">Categories</a>
        <a href="/en/dress-up">Dress Up</a>
        <a href="/en/car">Car Games</a>
        <a href="/blog">Blog</a>
      </div>
      <div class="footer-links">
        <h4>Info</h4>
        <a href="/en/about-us">About</a>
        <a href="/en/privacy-policy">Privacy</a>
        <a href="/en/c/contact">Contact</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 BrowserGamesHQ. All rights reserved. Play free online games instantly.</p>
    </div>
  </footer>

  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.ads.adsenseClientId}" crossorigin="anonymous"></script>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  <script src="/static/js/home.js?v=20260731"></script>
</body>
</html>`;

  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=600',
    'X-Robots-Tag': 'index, follow',
  });
  res.send(html);
};

module.exports = { render };
