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

async function fetchSource(path, visitorUA) {
  const normalizedPath = (!path || path === '/') ? '/' : normalizeGamePath(path);
  const url = `${config.sourceOrigin}${normalizedPath}`;
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

  // Phase 3: Restore functional references that were over-replaced
  // CDN domain
  result = result.replace(/BrowserGamesHQ-cdn/gi, 'poki-cdn');
  // Chunk names (React lazy-loaded components)
  result = result.replace(/app-components-contentTypes-BrowserGamesHQKids-tsx/gi, 'app-components-contentTypes-PokiKids-tsx');
  // JS variable names (must stay as original for the Poki SPA)
  result = result.replace(/isBrowserGamesHQAnalyticsEnabled/gi, 'isPokiAnalyticsEnabled');
  result = result.replace(/BrowserGamesHQGTM/gi, 'pokiGTM');
  result = result.replace(/__BrowserGamesHQData/gi, '__pokiData');
  result = result.replace(/BrowserGamesHQPlayground/gi, 'pokiPlayground');
  result = result.replace(/BrowserGamesHQ\.com\//gi, 'poki.com/');
  result = result.replace(/"BrowserGamesHQ\.com"/gi, '"poki.com"');
  result = result.replace(/'BrowserGamesHQ\.com'/gi, "'poki.com'");
  // Functional subdomain URLs (CDN, API, ads, etc.)
  result = result.replace(/games\.browsergameshq/gi, 'games.poki');
  result = result.replace(/api\.browsergameshq/gi, 'api.poki');
  result = result.replace(/a\.browsergameshq/gi, 'a.poki');
  result = result.replace(/ads\.browsergameshq/gi, 'ads.poki');
  result = result.replace(/gdn\.browsergameshq/gi, 'gdn.poki');
  result = result.replace(/devs-api\.browsergameshq/gi, 'devs-api.poki');
  result = result.replace(/poki-auth\.browsergameshq/gi, 'poki-auth.poki');
  result = result.replace(/user-vault\.browsergameshq/gi, 'user-vault.poki');
  result = result.replace(/ay\.delivery/gi, 'ay.delivery');
  // Legal name (Poki B.V. is the actual company — not our brand)
  result = result.replace(/BrowserGamesHQ\s*B\.\s*V\./gi, 'Poki B.V.');
  result = result.replace(/BrowserGamesHQ\.nl/gi, 'Poki.nl');
  // Google Play store IDs
  result = result.replace(/com\.browsergameshq\.playground/gi, 'com.poki.playground');
  // Trustpilot & Crunchbase (third-party sites referencing Poki)
  result = result.replace(/\/review\/browsergameshq\.com/gi, '/review/poki.com');
  result = result.replace(/\/organization\/BrowserGamesHQ/gi, '/organization/poki');
  // SimilarWeb
  result = result.replace(/\/website\/browsergameshq\.com/gi, '/website/poki.com');

  // Phase 4: Fix email addresses
  result = result.replace(/hello\s*@\s*browsergameshq/i, 'hello@poki');
  result = result.replace(/hajjoutiforskype\s*@/i, 'hajjoutiforskype@');

  // Phase 5: Restore window.context blocks
  result = result.replace(/___WINDOW_CTX_(\d+)___/g, (_, n) => {
    return ctxBlocks[parseInt(n)];
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

  // Phase 7: Restore JSON-LD brand fields (name, legalName, etc.) that were over-replaced
  // Note: The global replace already changed them to BrowserGamesHQ, which is correct
  // But we need to make sure the Organization name, legalName, slogan, email are correct
  // (They already are after the global replace - BrowserGamesHQ is correct)

  // Phase 8: Client-side fix for React Helmet override — NO reference to "poki.com" in the script
  const canonicalFix = '<script>document.addEventListener("DOMContentLoaded",function(){var c=document.querySelector(\'link[rel="canonical"]\'),d="' + config.domain + '";if(c&&!c.href.includes(d))c.href=c.href.replace(/https?:\\/\\/[^\\/]+/,"https://"+d);[].forEach.call(document.querySelectorAll(\'meta[content*="BrowserGamesHQ"]\'),function(m){var v=m.getAttribute("content");if(v&&v.indexOf("http")===0&&!v.includes(d))m.setAttribute("content",v.replace(/https?:\\/\\/[^\\/]+/,"https://"+d))})});</script>';

  if (sourcePath && sourcePath.match(/\/c\/contact/i)) {
    const contactEmailFix = '<script>document.addEventListener("DOMContentLoaded",function(){var mo=new MutationObserver(function(){var e=document.querySelector(\'a[href*="hello@"]\');if(e&&!e.href.includes("hajjoutiforskype"))e.href="mailto:hajjoutiforskype@gmail.com";var n=document.createTreeWalker(document.body,4);while(n.nextNode()){if(n.currentNode.nodeValue&&n.currentNode.nodeValue.includes("hello@poki"))n.currentNode.nodeValue=n.currentNode.nodeValue.replace(/hello\s*@\s*poki\s*\.\s*com/gi,"hajjoutiforskype@gmail.com")}mo.disconnect()});mo.observe(document.body,{childList:true,subtree:true,characterData:true})});</script>';
    result = result.replace('</body>', contactEmailFix + '</body>');
  }

  result = result.replace('</body>', canonicalFix + '</body>');

  return result;
}

function detectDevice(ua) {
  if (!ua) return 'desktop';
  var d = ua.toLowerCase();
  if (d.indexOf('ipad') !== -1 || (d.indexOf('android') !== -1 && d.indexOf('mobile') === -1)) return 'tablet';
  if (d.indexOf('mobile') !== -1 || d.indexOf('iphone') !== -1 || d.indexOf('ipod') !== -1 || d.indexOf('blackberry') !== -1) return 'mobile';
  return 'desktop';
}

async function handlePageRequest(req, res) {
  const sourcePath = req.path;
  const deviceType = detectDevice(req.headers['user-agent']);

  const cacheKey = `html:${deviceType}:${sourcePath}`;
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
    let html = await fetchSource(sourcePath, req.headers['user-agent']);

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

router.get('*', handlePageRequest);

module.exports = router;
