const config = require('../config');
const { injectAds } = require('../core/ads/injector');

const render = (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-site-verification" content="${config.searchConsoleVerification || ''}">
  <title>BrowserGamesHQ - Play Free Online Games</title>
  <meta name="description" content="Play thousands of free online games on BrowserGamesHQ. No downloads needed. Play instantly on your browser.">
  <meta name="keywords" content="free games, online games, browser games, play games, free online games">
  <meta property="og:title" content="BrowserGamesHQ - Play Free Online Games">
  <meta property="og:description" content="Play thousands of free online games instantly in your browser.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://${config.domain}">
  <link rel="canonical" href="https://${config.domain}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
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
        <input type="text" placeholder="Search games..." id="searchInput">
      </div>
      <nav class="nav-links">
        <a href="/" class="nav-link active">Home</a>
        <a href="/en/new-games" class="nav-link">New</a>
        <a href="/en/top-rated" class="nav-link">Top Rated</a>
      </nav>
    </div>
  </header>

  <section class="hero-section">
    <div class="hero-content">
      <h1>Play <span class="gradient-text">Free Games</span> Instantly</h1>
      <p>Discover thousands of browser games. No downloads, no installs. Just click and play.</p>
    </div>
  </section>

  <section class="category-bar">
    <div class="category-scroll">
      <button class="cat-pill active" data-cat="all">All</button>
      <button class="cat-pill" data-cat="action">Action</button>
      <button class="cat-pill" data-cat="puzzle">Puzzle</button>
      <button class="cat-pill" data-cat="racing">Racing</button>
      <button class="cat-pill" data-cat="sports">Sports</button>
      <button class="cat-pill" data-cat="io">.io</button>
      <button class="cat-pill" data-cat="adventure">Adventure</button>
      <button class="cat-pill" data-cat="casual">Casual</button>
      <button class="cat-pill" data-cat="strategy">Strategy</button>
      <button class="cat-pill" data-cat="multiplayer">Multiplayer</button>
    </div>
  </section>

  <section class="games-section">
    <div class="section-header">
      <h2>Popular Games</h2>
      <a href="/en/games" class="see-all">See All</a>
    </div>
    <div class="games-grid" id="gamesGrid">
      <div class="loading-placeholder">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
  </section>

  <div class="sidebar-ad-area">
    <div id="portal-ad-sidebar-home" class="portal-ad-slot">
      <ins class="adsbygoogle"
           style="display:inline-block;width:300px;height:250px"
           data-ad-client="${config.ads.adsenseClientId}"
           data-ad-slot="${config.ads.slotRectangle}"></ins>
    </div>
  </div>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo">BrowserGamesHQ</span>
        <p>Your destination for free browser games.</p>
      </div>
      <div class="footer-links">
        <h4>Categories</h4>
        <a href="/en/action-games">Action</a>
        <a href="/en/puzzle-games">Puzzle</a>
        <a href="/en/racing-games">Racing</a>
        <a href="/en/sports-games">Sports</a>
      </div>
      <div class="footer-links">
        <h4>Info</h4>
        <a href="/en/about">About</a>
        <a href="/en/privacy-policy">Privacy</a>
        <a href="/en/terms-of-use">Terms</a>
        <a href="/en/contact">Contact</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 BrowserGamesHQ. All rights reserved.</p>
    </div>
  </footer>

  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.ads.adsenseClientId}" crossorigin="anonymous"></script>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  <script src="/static/js/home.js"></script>
</body>
</html>`;

  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=60',
    'X-Robots-Tag': 'index, follow',
  });
  res.send(html);
};

module.exports = { render };
