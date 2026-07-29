const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');
const { rewriteHtml } = require('../rewriter');
const { injectAds } = require('../ads/injector');

const router = express.Router();

function getRandomUA() {
  return config.userAgents[Math.floor(Math.random() * config.userAgents.length)];
}

function normalizeGamePath(path) {
  // Strip trailing numeric game IDs from game page URLs
  // e.g. /en/g/subway-surfers/818075 -> /en/g/subway-surfers
  const match = path.match(/^(\/en\/g\/[^/]+)\/\d+$/);
  if (match) return match[1];
  return path;
}

async function fetchSource(path, visitorUA, sourceOrigin) {
  const normalizedPath = (!path || path === '/') ? '/' : normalizeGamePath(path);
  const url = `${sourceOrigin || config.sourceOrigin}${normalizedPath}`;
  const userAgent = visitorUA || getRandomUA();

  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
    timeout: 15000,
    compress: true,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Non-HTML response: ${contentType}`);
  }

  const html = await response.text();

  if (!response.ok && !html.includes('window.context')) {
    throw new Error(`Source responded with ${response.status}: ${response.statusText}`);
  }

  return html;
}

function cleanPokiBranding(html, sourcePath) {
  // Phase 1: Replace "Poki" with "BrowserGamesHQ" OUTSIDE <script> tags only
  // (Preserves INITIAL_STATE, JS identifiers, inline scripts for React hydration)
  var parts = html.split(/(<script[\s>][\s\S]*?<\/script>)/gi);
  for (var i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/Poki/gi, 'BrowserGamesHQ');
  }
  var result = parts.join('');

  // Phase 3: Restore ONLY functional references that the Poki SPA needs to work
  // CDN domain (must stay as poki-cdn for assets to load)
  result = result.replace(/BrowserGamesHQ-?cdn/gi, 'poki-cdn');
  // Chunk names (React lazy-loaded components — must match actual CDN files)
  result = result.replace(/BrowserGamesHQKids-tsx/gi, 'PokiKids-tsx');
  // JS variable names (must stay original for the Poki SPA)
  result = result.replace(/isBrowserGamesHQAnalyticsEnabled/gi, 'isPokiAnalyticsEnabled');
  result = result.replace(/BrowserGamesHQGTM/gi, 'pokiGTM');
  result = result.replace(/__BrowserGamesHQData/gi, '__pokiData');
  result = result.replace(/BrowserGamesHQPlayground/gi, 'pokiPlayground');
  // SPA bot/geo variable names (JS bundles reference window.pokiBotScore, not window.BrowserGamesHQBotScore)
  result = result.replace(/window\.BrowserGamesHQBotScore/gi, 'window.pokiBotScore');
  result = result.replace(/window\.BrowserGamesHQBotVerified/gi, 'window.pokiBotVerified');
  result = result.replace(/window\.BrowserGamesHQCountry/gi, 'window.pokiCountry');
  result = result.replace(/window\.BrowserGamesHQRegion/gi, 'window.pokiRegion');
  result = result.replace(/window\.isBrowserGamesHQPlayground/gi, 'window.isPokiPlayground');
  // JSON keys in INITIAL_STATE (must match what the JS reducer expects)
  result = result.replace(/"BrowserGamesHQBotScore"/gi, '"pokiBotScore"');
  result = result.replace(/"BrowserGamesHQBotVerified"/gi, '"pokiBotVerified"');
  result = result.replace(/"BrowserGamesHQAnalytics"/gi, '"pokiAnalytics"');
  // Domain field in __pokiData JSON — must be poki.com for API calls
  result = result.replace(/"domain"\s*:\s*"BrowserGamesHQ\.com"/gi, '"domain":"poki.com"');
  result = result.replace(/\\"domain\\"\s*:\s*\\"BrowserGamesHQ\.com\\"/gi, '\\"domain\\":\\"poki.com\\"');
  result = result.replace(/"domain_title"\s*:\s*"BrowserGamesHQ\.com"/gi, '"domain_title":"Poki.com"');
  result = result.replace(/\\"domain_title\\"\s*:\s*\\"BrowserGamesHQ\.com\\"/gi, '\\"domain_title\\":\\"Poki.com\\"');
  // Functional subdomains (CDN, API, etc — must stay as poki for asset loading)
  result = result.replace(/(games|api|a|ads|gdn|devs-api|poki-auth|user-vault)\.browsergameshq/gi, '$1.poki');
  // Also restore stand-alone games.browsergameshq.com URLs (sometimes the dot before subdomain is missing due to encoding)
  result = result.replace(/games\.browsergameshq\.com/gi, 'games.poki.com');
  // About subdomain — restore for link rewriting in later phase
  result = result.replace(/about\.browsergameshq/gi, 'about.poki');
  // S3 bucket name for about.poki.com assets
  result = result.replace(/about-BrowserGamesHQ-assets/gi, 'about-poki-assets');
  // About page logo SVG filenames (poki-logo-*.svg on about.poki.com)
  result = result.replace(/\/assets\/img\/BrowserGamesHQ-logo/gi, '/assets/img/poki-logo');
  // SVG icon filenames (must stay poki.svg — the actual file on CDN)
  result = result.replace(/\/icons\/ui\/BrowserGamesHQ\.svg/gi, '/icons/ui/poki.svg');
  // Legal name (Poki B.V. is the actual company entity)
  result = result.replace(/BrowserGamesHQ\s*B\.\s*V\./gi, 'Poki B.V.');
  result = result.replace(/BrowserGamesHQ\.nl/gi, 'Poki.nl');
  // Fix URL casing: BrowserGamesHQ.com → browsergameshq.com (lowercase domain in URLs)
  result = result.replace(/https?:\/\/BrowserGamesHQ\.com/gi, (m) => m.toLowerCase());

  // Restore Poki SDK storage keys + JS identifiers (BrowserGamesHQ_xxx → poki_xxx)
  result = result.replace(/BrowserGamesHQ_([a-z]+)/gi, 'poki_$1');
  // Restore Poki SDK camelCase identifiers (BrowserGamesHQFooBar → pokiFooBar)
  result = result.replace(/BrowserGamesHQ([A-Z][a-zA-Z0-9]*)/gi, 'poki$1');
  // Restore analytics + tracking domains (t.poki.io, etc.)
  result = result.replace(/t\.browsergameshq\.io/gi, 't.poki.io');
  // Restore Poki SDK domain allow-list (all Poki TLDs used in SDK validation)
  result = result.replace(/BrowserGamesHQ\.(co\.(il|id|uk)|com\.br|cz|dk|fi|it|jp|nl|pt|be|by|ch|cn|at|no|se|pl|fr|es|de)/gi, 'poki.$1');

  // Phase 4: Fix email addresses — change from browsergameshq.com to poki.pro
  result = result.replace(/hello\s*@\s*browsergameshq\.com/gi, 'hello@poki.pro');
  result = result.replace(/press\s*@\s*browsergameshq\.com/gi, 'press@poki.pro');
  result = result.replace(/hajjoutiforskype\s*@/i, 'hajjoutiforskype@');

  // Phase 5: Replace social URLs with our brand handles (case-insensitive)
  result = result.replace(/href="https?:\/\/(?:www\.)?facebook\.com\/browsergameshq[^"]*"/gi, 'href="https://www.facebook.com/BrowserGamesHQ"');
  result = result.replace(/href="https?:\/\/(?:www\.)?twitter\.com\/browsergameshq[^"]*"/gi, 'href="https://twitter.com/BrowserGamesHQ"');
  result = result.replace(/href="https?:\/\/(?:www\.)?youtube\.com\/(?:c\/|@)?browsergameshq[^"]*"/gi, 'href="https://www.youtube.com/@BrowserGamesHQ"');
  result = result.replace(/href="https?:\/\/(?:www\.)?tiktok\.com\/@browsergameshq[^"]*"/gi, 'href="https://www.tiktok.com/@browsergameshq"');
  result = result.replace(/href="https?:\/\/(?:www\.)?instagram\.com\/browsergameshq[^"]*"/gi, 'href="https://www.instagram.com/browsergameshq"');
  result = result.replace(/href="https?:\/\/linkedin\.com\/company\/browsergameshq[^"]*"/gi, 'href="https://linkedin.com/company/BrowserGamesHQ"');
  // About / developers / kids / jobs subdomains
  result = result.replace(/href="https?:\/\/(about|developers|kids|jobs)\.browsergameshq\.com([^"]*)"/gi, 'href="https://$1.browsergameshq.com$2"');

  // Phase 7: Rewrite about.poki.com links to browsergameshq.com/en/about-us (global, all pages)
  result = result.replace(/https?:\/\/(?:www\.)?about\.poki\.com/gi, 'https://browsergameshq.com/en/about-us');

  // Phase 8: Replace logo span with img tag (fits container via JS-resize below)
  result = result.replace(/<span[^>]*role="img"[^>]*aria-label="(?:BrowserGamesHQ|poki)"[^>]*style="--icon-src:[^"]*"[^>]*><\/span>/gi, '<img src="/static/img/logo.svg" alt="BrowserGamesHQ" style="height:24px;width:auto;max-width:90px;object-fit:scale-down;vertical-align:middle;display:inline-block">');
  result = result.replace('</head>', '<style>nav a[aria-label="BrowserGamesHQ"],footer a[aria-label="BrowserGamesHQ"]{display:inline-flex!important;align-items:center!important;width:auto!important;padding:0!important;overflow:visible!important}footer button[aria-label*="company page"]{display:inline-flex!important;align-items:center!important;gap:10px!important}</style><script>document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll("nav a[aria-label=\'BrowserGamesHQ\'],footer a[aria-label=\'BrowserGamesHQ\']").forEach(function(a){var p=a.parentElement;if(p){p.style.width="auto";p.style.overflow="visible";p.style.flexShrink="0"}a.style.width="auto";a.style.display="inline-flex";a.style.alignItems="center"});var fb=document.querySelector("footer button[aria-label*=\'company page\']");if(fb){fb.style.display="inline-flex";fb.style.alignItems="center";fb.style.gap="10px"}});</script></head>');

  // Phase 8c: Client-side fix for React Helmet override — NO reference to "poki.com" in the script
  const canonicalFix = '<script>document.addEventListener("DOMContentLoaded",function(){var c=document.querySelector(\'link[rel="canonical"]\'),d="' + config.domain + '",re=/https?:\\/\\/[^\\/]+/i;if(c&&!c.href.toLowerCase().includes(d))c.href=c.href.replace(re,"https://"+d);[].forEach.call(document.querySelectorAll(\'meta[content*="BrowserGamesHQ"],meta[content*="browsergameshq"]\'),function(m){var v=m.getAttribute("content");if(v&&v.indexOf("http")===0&&!v.toLowerCase().includes(d))m.setAttribute("content",v.replace(re,"https://"+d))})});</script>';

  result = result.replace('</body>', canonicalFix + '</body>');

  // Phase 9: Intercept Poki text in API-loaded content via weak polling (avoids blocking React hydration)
  // Runs once on load, then polls to catch SPA-dynamic content after navigation
  const domFix = '<script>document.addEventListener("DOMContentLoaded",function(){var r=/Poki/gi;function x(){try{var n=document.createTreeWalker(document.body,4);while(n.nextNode()){var e=n.currentNode.parentNode;if(e&&(e.nodeName==="SCRIPT"||e.nodeName==="STYLE"||e.nodeName==="TEXTAREA"))continue;var v=n.currentNode.nodeValue||"";if(v.indexOf("Poki")>=0&&!v.match(/["\']/)&&!v.match(/\.(com|net|org|io)\b/i))n.currentNode.nodeValue=v.replace(r,function(m,i,t){var p=t.slice(Math.max(0,i-1),i),f=t.slice(i+m.length,i+m.length+5);return p.match(/[a-z._"\'=]/i)?m:f.match(/^\.(com|net|org|io)\b/i)?m:"BrowserGamesHQ"})}}catch(e){}}x();setInterval(function(){try{x()}catch(e){}},2000);window.addEventListener("popstate",function(){setTimeout(function(){try{x()}catch(e){}},100)})});</script>';
  result = result.replace('</body>', domFix + '</body>');

  return result;
}

function detectDevice(ua) {
  if (!ua) return 'desktop';
  var d = ua.toLowerCase();
  if (d.indexOf('ipad') !== -1 || (d.indexOf('android') !== -1 && d.indexOf('mobile') === -1)) return 'tablet';
  if (d.indexOf('mobile') !== -1 || d.indexOf('iphone') !== -1 || d.indexOf('ipod') !== -1 || d.indexOf('blackberry') !== -1) return 'mobile';
  return 'desktop';
}

const SUBDOMAIN_SOURCE = {
  'about.browsergameshq.com': 'https://about.poki.com',
};

const ROUTE_SOURCE = {
  '/about': 'https://about.poki.com',
  '/en/about-us': 'https://about.poki.com',
};

async function handlePageRequest(req, res) {
  const reqPath = req.path;
  const deviceType = detectDevice(req.headers['user-agent']);
  const host = req.hostname || '';
  const sourceOrigin = SUBDOMAIN_SOURCE[host] || ROUTE_SOURCE[reqPath];

  const isContactPage = reqPath.match(/\/c\/contact/i);
  const sourcePath = reqPath;

  const cacheKey = `html:${deviceType}:${reqPath}:${host}`;
  const cached = cache.getHtml(cacheKey);
  if (cached) {
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'X-Cache': 'HIT',
      'Cache-Control': 'public, max-age=600',
    });
    return res.send(cached);
  }

  try {
    let html = await fetchSource(sourcePath, req.headers['user-agent'], sourceOrigin);

    // Strip meta refresh tags that redirect to poki.com before JS runs
    html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*content\s*=\s*["'][^"']*url\s*=[^"']*poki\.[^"']*["'][^>]*>/gi, '');

    html = cleanPokiBranding(html, reqPath);

    if (isContactPage) {
      html = html.replace(/<title[^>]*>[^<]*<\/title>/, '<title>Contact BrowserGamesHQ</title>');
      html = html.replace(/<\/head>/i, '<meta name="robots" content="index, follow"></head>');
    }

    html = rewriteHtml(html, reqPath);

    html = injectAds(html);

    cache.setHtml(cacheKey, html);

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'X-Cache': 'MISS',
      'Cache-Control': 'public, max-age=600',
      'X-Robots-Tag': 'index, follow',
    });
    res.send(html);
  } catch (err) {
    console.error(`[PROXY ERROR] ${sourcePath}: ${err.message}`);

    if (err.message.includes('404') || err.message.includes('Not Found')) {
      return res.status(404).send(generate404Page());
    }

    return res.status(502).send(generateErrorPage(err.message));
  }
}

function generate404Page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found - BrowserGamesHQ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 6rem; color: #6c5ce7; margin-bottom: 1rem; }
    p { font-size: 1.2rem; color: #a0a0c0; margin-bottom: 2rem; }
    a { display: inline-block; padding: 12px 32px; background: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; transition: background 0.2s; }
    a:hover { background: #5a4bd1; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>Game not found. It may have been moved or removed.</p>
    <a href="/">Back to Home</a>
  </div>
</body>
</html>`;
}

function generateErrorPage(errorMsg) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Temporarily Unavailable - BrowserGamesHQ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; color: #e74c3c; margin-bottom: 1rem; }
    p { font-size: 1.1rem; color: #a0a0c0; margin-bottom: 2rem; }
    a { display: inline-block; padding: 12px 32px; background: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    a:hover { background: #5a4bd1; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Unavailable</h1>
    <p>This page is temporarily unavailable. Please try again in a moment.</p>
    <a href="/">Back to Home</a>
  </div>
</body>
</html>`;
}

router.get('/ads.txt', function (req, res) {
  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'public, max-age=86400',
  });
  res.send('google.com, pub-7128312414229788, DIRECT, f08c47fec0942fa0\n');
});

router.get('/sitemap.xml', async function (req, res) {
  try {
    const response = await fetch('https://poki.com/sitemap.xml', {
      headers: { 'User-Agent': getRandomUA() },
      timeout: 15000,
    });
    let xml = await response.text();
    xml = xml.replace(/https:\/\/poki\.com\//g, 'https://browsergameshq.com/');
    xml = xml.replace(/https:\/\/poki\.com/g, 'https://browsergameshq.com');
    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
    res.send(xml);
  } catch (e) {
    res.status(502).type('text/plain').send('Sitemap unavailable');
  }
});

router.get('/manifest.json', async function (req, res) {
  try {
    const response = await fetch('https://poki.com/manifest.json', {
      headers: { 'User-Agent': getRandomUA() },
      timeout: 10000,
    });
    let json = await response.text();
    json = json.replace(/https:\/\/poki\.com/g, 'https://browsergameshq.com');
    json = json.replace(/"Poki"/g, '"BrowserGamesHQ"');
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(json);
  } catch (e) {
    // Fallback to a simple manifest
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(JSON.stringify({
      name: 'BrowserGamesHQ',
      short_name: 'BrowserGamesHQ',
      start_url: '/',
      display: 'standalone',
      background_color: '#0f0f23',
      theme_color: '#6c5ce7',
    }));
  }
});

// Proxy about.poki.com static assets (CSS, JS, images) for /en/about-us
router.get(['/assets/*', '/g/*'], async (req, res) => {
  try {
    const url = 'https://about.poki.com' + req.path + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    const response = await fetch(url, { headers: { 'User-Agent': getRandomUA() }, timeout: 15000 });
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' });
    res.send(buffer);
  } catch (e) {
    res.status(502).end();
  }
});

router.get('*', function gamesSubdomainRoute(req, res, next) {
  const host = req.hostname || '';
  // If the request came from games.browsergameshq.com subdomain (from Phase 3 miss),
  // rewrite to /game-proxy so the game embed loads correctly
  if (host.match(/^games\./i)) {
    req.url = '/game-proxy' + req.path + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    return require('./game-proxy')(req, res, next);
  }
  // Catch other unhandled browsergameshq subdomains (api, a, ads, etc.) and proxy via media proxy
  if (host.match(/\.browsergameshq\.com$/i) && !host.match(/^(games|about|developers|kids|jobs)\./i)) {
    const targetUrl = 'https://' + host.replace(/\.browsergameshq\.com$/i, '.poki.com') + req.path;
    req.url = '/proxy-media/?url=' + encodeURIComponent(targetUrl);
    return require('./media')(req, res, next);
  }
  handlePageRequest(req, res);
});

module.exports = router;
