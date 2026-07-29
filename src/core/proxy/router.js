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
  // Phase 1: Save window.context blocks — the Poki SPA needs site.domain="poki.com" for API URLs
  const ctxBlocks = [];
  let result = html.replace(/window\.context[\s\S]*?(?=<\/script>)/g, (match) => {
    ctxBlocks.push(match);
    return '___WINDOW_CTX_' + (ctxBlocks.length - 1) + '___';
  });

  // Phase 2: Replace ALL "Poki" with "BrowserGamesHQ" (case-insensitive)
  result = result.replace(/Poki/gi, 'BrowserGamesHQ');

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

  // Phase 4: Fix email addresses
  result = result.replace(/hello\s*@\s*browsergameshq/i, 'hello@poki');
  result = result.replace(/hajjoutiforskype\s*@/i, 'hajjoutiforskype@');

  // Phase 5: Restore window.context blocks (also replace Poki branding in them, but keep domain=poki.com)
  result = result.replace(/___WINDOW_CTX_(\d+)___/g, (_, n) => {
    let block = ctxBlocks[parseInt(n)];
    block = block.replace(/Poki/gi, 'BrowserGamesHQ');
    block = block.replace(/"domain"\s*:\s*"BrowserGamesHQ\.com"/gi, '"domain":"poki.com"');
    block = block.replace(/"domain_title"\s*:\s*"BrowserGamesHQ\.com"/gi, '"domain_title":"Poki.com"');
    return block;
  });

  // Phase 6: Replace social URLs with our brand handles (case-insensitive)
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

  // Phase 8: Replace navigation logo span with img tag
  result = result.replace(/<span[^>]*role="img"[^>]*aria-label="BrowserGamesHQ"[^>]*style="--icon-src:[^"]*"[^>]*><\/span>/gi, '<img src="/static/img/logo.svg" alt="BrowserGamesHQ" style="display:inline-block;height:22px;width:auto;max-width:80px;object-fit:contain;vertical-align:middle">');

  // Phase 8b: Strip SPA scripts for contact page (SPA crashes on our domain, serve static HTML only)
  if (sourcePath && sourcePath.match(/\/c\/contact/i)) {
    result = result.replace(/<title[^>]*>[^<]*<\/title>/, '<title>Contact BrowserGamesHQ</title>');
    result = result.replace(/<script[\s>][\s\S]*?<\/script>/gi, '');
    const contactCard = '<div style="max-width:800px;margin:0 auto 60px;padding:40px;background:#1a1a2e;border-radius:16px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif"><h2 style="font-size:24px;margin:0 0 8px;color:#fff">Contact BrowserGamesHQ</h2><p style="font-size:15px;color:#a0a0c0;margin:0 0 20px;line-height:1.5">Reach out via email for support or inquiries.</p><a href="mailto:hajjoutiforskype@gmail.com" style="display:inline-block;padding:12px 24px;background:#6c5ce7;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Email Us</a><a href="/en" style="display:inline-block;margin-left:12px;padding:12px 24px;background:#2d2d44;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Browse Games</a></div>';
    result = result.replace('</body>', contactCard + '</body>');
  }

  // Phase 8c: Client-side fix for React Helmet override — NO reference to "poki.com" in the script
  const canonicalFix = '<script>document.addEventListener("DOMContentLoaded",function(){var c=document.querySelector(\'link[rel="canonical"]\'),d="' + config.domain + '",re=/https?:\\/\\/[^\\/]+/i;if(c&&!c.href.toLowerCase().includes(d))c.href=c.href.replace(re,"https://"+d);[].forEach.call(document.querySelectorAll(\'meta[content*="BrowserGamesHQ"],meta[content*="browsergameshq"]\'),function(m){var v=m.getAttribute("content");if(v&&v.indexOf("http")===0&&!v.toLowerCase().includes(d))m.setAttribute("content",v.replace(re,"https://"+d))})});</script>';

  result = result.replace('</body>', canonicalFix + '</body>');

  // Phase 9: Client-side mutation observer to replace Poki text loaded by SPA from API
  const pokiRx = 'Poki';
  const domFix = '<script>document.addEventListener("DOMContentLoaded",function(){var r=/Poki/gi;function x(){var n=document.createTreeWalker(document.body,4);while(n.nextNode()){var e=n.currentNode.parentNode;if(e&&(e.nodeName==="SCRIPT"||e.nodeName==="STYLE"||e.nodeName==="TEXTAREA"))continue;var v=n.currentNode.nodeValue||"";if(v.indexOf("' + pokiRx + '")>=0&&!v.match(/["\']/)&&!v.match(/\.(com|net|org|io)\b/i))n.currentNode.nodeValue=v.replace(r,function(m,i,t){var p=t.slice(Math.max(0,i-1),i),f=t.slice(i+m.length,i+m.length+5);return p.match(/[a-z._"\'=]/i)?m:f.match(/^\.(com|net|org|io)\b/i)?m:"BrowserGamesHQ"})}}x();var o=new MutationObserver(x);o.observe(document.body,{childList:true,subtree:true,characterData:true});setTimeout(function(){o.disconnect()},3e4)});</script>';
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
  const sourcePath = req.path;
  const deviceType = detectDevice(req.headers['user-agent']);
  const host = req.hostname || '';
  const sourceOrigin = SUBDOMAIN_SOURCE[host] || ROUTE_SOURCE[sourcePath];

  const cacheKey = `html:${deviceType}:${sourcePath}:${host}`;
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

    html = cleanPokiBranding(html, sourcePath);

    html = rewriteHtml(html, sourcePath);

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

router.get('*', handlePageRequest);

module.exports = router;
