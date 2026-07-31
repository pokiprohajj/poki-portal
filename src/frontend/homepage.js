const config = require('../config');
const GAMES = require('./games-data');

const CATEGORIES = [
  { name: 'Action', slug: '/en/action', desc: 'Fast-paced reflex games, run-and-jump challenges, and action-packed combat.' },
  { name: 'Puzzle', slug: '/en/puzzle', desc: 'Brain teasers, logic puzzles, and clever challenges that test your thinking.' },
  { name: 'Racing', slug: '/en/racing', desc: 'High-speed car, bike, and drift racing games with no download required.' },
  { name: 'Sports', slug: '/en/sports', desc: 'Soccer, basketball, penalty shootouts, and more sports games to play online.' },
  { name: 'Multiplayer', slug: '/en/multiplayer', desc: 'Play with friends or other players in competitive online browser games.' },
  { name: 'Strategy', slug: '/en/strategy', desc: 'Plan, build, and outsmart your opponents in deep strategic games.' },
  { name: 'Dress Up', slug: '/en/dress-up', desc: 'Create outfits, style characters, and run your own fashion makeover.' },
  { name: 'Adventure', slug: '/en/adventure', desc: 'Explore new worlds, solve quests, and survive exciting adventures.' },
  { name: 'Car', slug: '/en/car', desc: 'Stunt driving, city driving, and car customization games for car lovers.' },
  { name: '2 Player', slug: '/en/two-player', desc: 'Two-player games to challenge a friend on the same device.' },
  { name: '.io Games', slug: '/en/io', desc: 'Lightweight multiplayer .io games you can jump into and play instantly.' },
  { name: 'All Games', slug: '/en/all-games', desc: 'Browse the complete collection of free online games at BrowserGamesHQ.' },
];

const FEATURED = GAMES.filter((g) =>
  ['subway-surfers', 'retro-bowl', 'gobattle2', 'drift-boss', 'stickman-hook', 'minefun-io', 'fruit-ninja', 'talking-tom-gold-run', 'murder', 'tunnel-rush'].includes(g.slug)
);

function gameCard(game) {
  return `<a class="game-card" href="/en/g/${encodeURIComponent(game.slug)}" data-title="${game.title}" data-category="${game.category}" data-slug="${game.slug}">
  <div class="game-card-thumb"><img src="${game.thumb}" alt="${game.title} - play free online at BrowserGamesHQ" loading="lazy" width="314" height="314"></div>
  <div class="game-card-info"><div class="game-card-title">${game.title}</div><div class="game-card-category">${game.category}</div></div>
</a>`;
}

function categoryCard(cat) {
  return `<a class="category-card" href="${cat.slug}">
  <div class="category-card-name">${cat.name}</div>
  <div class="category-card-desc">${cat.desc}</div>
</a>`;
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
  <link rel="stylesheet" href="/static/css/home.css">
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
  {"@context":"https://schema.org","@type":"CollectionPage","name":"Free Online Games - BrowserGamesHQ","description":"Play thousands of free online browser games instantly. No downloads, no sign-ups.","url":"${siteUrl}/","mainEntity":{"@type":"ItemList","itemListElement":[${FEATURED.map((g, i) => `{"@type":"ListItem","position":${i + 1},"name":"${g.title}","url":"${siteUrl}/en/g/${g.slug}"}`).join(',')}]}}
  </script>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#6c5ce7"/>
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="Inter">G</text>
        </svg>
        <span>BrowserGamesHQ</span>
      </a>
      <div class="search-bar">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search games..." id="searchInput" aria-label="Search games">
      </div>
      <nav class="nav-links">
        <a href="/" class="nav-link active">Home</a>
        <a href="/en/popular" class="nav-link">Popular</a>
        <a href="/en/all-games" class="nav-link">All Games</a>
      </nav>
    </div>
  </header>

  <section class="hero-section">
    <div class="hero-content">
      <h1>Play <span class="gradient-text">Free Online Games</span> Instantly</h1>
      <p class="hero-sub">BrowserGamesHQ is your home for free browser games. No downloads, no installs, no sign-ups — every game runs right in your browser and you can start playing in seconds.</p>
      <div class="hero-cta">
        <a href="#games" class="cta-primary">Play Now</a>
        <a href="#categories" class="cta-secondary">Browse Categories</a>
      </div>
    </div>
  </section>

  <section class="stats-bar" aria-label="Site highlights">
    <div class="stat-item"><div class="stat-value">1500+</div><div class="stat-label">Free Games</div></div>
    <div class="stat-item"><div class="stat-value">100%</div><div class="stat-label">Free to Play</div></div>
    <div class="stat-item"><div class="stat-value">0</div><div class="stat-label">Downloads</div></div>
    <div class="stat-item"><div class="stat-value">12</div><div class="stat-label">Game Categories</div></div>
  </section>

  <section class="intro-section" id="about">
    <div class="intro-inner">
      <h2>What is BrowserGamesHQ?</h2>
      <p>BrowserGamesHQ is a free online gaming platform that brings together thousands of browser games in one place. Whether you love fast action games, tricky puzzles, competitive racing, or relaxing dress-up games, you will find something to play — without ever installing an app.</p>
      <p>Every game on BrowserGamesHQ is playable directly in your web browser on desktop, tablet, and mobile. There is nothing to download and no account to create, so you can go from browsing to playing in a single click. New games are added regularly, and our popular games section makes it easy to discover what players enjoy most right now.</p>
      <p>Our catalog spans action, puzzle, racing, sports, strategy, multiplayer, dress up, adventure, car games, and more. Pick a category below or use the search bar to find a specific game.</p>
    </div>
  </section>

  <section class="category-section" id="categories">
    <div class="section-header">
      <h2>Browse Games by Category</h2>
      <a href="/en/all-games" class="see-all">See All Games</a>
    </div>
    <div class="category-grid">
      ${CATEGORIES.map(categoryCard).join('')}
    </div>
  </section>

  <section class="games-section" id="games">
    <div class="section-header">
      <h2>Popular Games</h2>
      <a href="/en/all-games" class="see-all">See All Games</a>
    </div>
    <div class="category-bar">
      <div class="category-scroll">
        <button class="cat-pill active" data-cat="all">All</button>
        <button class="cat-pill" data-cat="Action">Action</button>
        <button class="cat-pill" data-cat="Puzzle">Puzzle</button>
        <button class="cat-pill" data-cat="Racing">Racing</button>
        <button class="cat-pill" data-cat="Sports">Sports</button>
        <button class="cat-pill" data-cat="Multiplayer">Multiplayer</button>
        <button class="cat-pill" data-cat="Strategy">Strategy</button>
        <button class="cat-pill" data-cat="Dress Up">Dress Up</button>
        <button class="cat-pill" data-cat="Adventure">Adventure</button>
        <button class="cat-pill" data-cat=".io">.io</button>
      </div>
    </div>
    <div class="games-grid" id="gamesGrid">
      ${GAMES.map(gameCard).join('')}
    </div>
    <div id="noResults" class="no-results" style="display:none">No games match your search. Try another keyword or browse all games.</div>
  </section>

  <div class="sidebar-ad-area">
    <div id="portal-ad-sidebar-home" class="portal-ad-slot">
      <ins class="adsbygoogle"
           style="display:inline-block;width:300px;height:250px"
           data-ad-client="${config.ads.adsenseClientId}"
           data-ad-slot="${config.ads.slotRectangle}"></ins>
    </div>
  </div>

  <section class="why-section">
    <div class="section-header">
      <h2>Why Play at BrowserGamesHQ?</h2>
    </div>
    <div class="why-grid">
      <div class="why-card"><div class="why-icon">⚡</div><h3>Play Instantly</h3><p>Every game starts in your browser in seconds. No waiting, no installs.</p></div>
      <div class="why-card"><div class="why-icon">📱</div><h3>Works Everywhere</h3><p>Games run on desktop, tablet, and mobile — whenever you are, however you play.</p></div>
      <div class="why-card"><div class="why-icon">🆓</div><h3>Always Free</h3><p>All games on BrowserGamesHQ are free to play. No subscriptions, no hidden costs.</p></div>
      <div class="why-card"><div class="why-icon">🔄</div><h3>Updated Daily</h3><p>New games are added regularly so there is always something fresh to try.</p></div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo">BrowserGamesHQ</span>
        <p>Free online browser games played instantly. No downloads, no sign-ups — just click and play.</p>
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
        <h4>Popular</h4>
        <a href="/en/popular">Popular Games</a>
        <a href="/en/categories">Categories</a>
        <a href="/blog">Blog</a>
        <a href="/blog/popular">Popular Articles</a>
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
  <script src="/static/js/home.js"></script>
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
