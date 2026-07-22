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

function cleanPokiBranding(html) {
  let result = html;

  // ONLY replace visible branding — never touch window.context or internal JSON data
  // The Poki SPA needs site.domain="poki.com" to construct API URLs and game embeds

  // Replace in <title> tags only
  result = result.replace(/<title[^>]*>[^<]*<\/title>/gi, (match) => {
    return match.replace(/Poki/gi, 'GameZone').replace(/poki/gi, 'GameZone');
  });

  // Replace in meta tags (content attributes) — visible to search engines / social
  result = result.replace(/(<meta[^>]*content="[^"]*?)Poki\.com([^"]*?"[^>]*>)/gi, '$1GameZone$2');
  result = result.replace(/(<meta[^>]*content="[^"]*?)Poki([^"]*?"[^>]*>)/gi, '$1GameZone$2');
  result = result.replace(/(<meta[^>]*content="[^"]*?)poki([^"]*?"[^>]*>)/gi, '$1gamezone$2');

  // Replace in <link rel="canonical"> — visible to search engines
  result = result.replace(/(<link[^>]*rel="canonical"[^>]*href="[^"]*?)poki\.com([^"]*?"[^>]*>)/gi, '$1' + 'poki.com' + '$2');

  // Replace PokiKids in visible text attributes only (NOT in src/href URLs)
  result = result.replace(/(title|aria-label|alt)="([^"]*?)PokiKids([^"]*?)"/gi, (m, attr, before, after) => {
    return attr + '="' + before + 'PortalKids' + after + '"';
  });

  // Replace in visible text attributes
  result = result.replace(/title="Poki"/gi, 'title="GameZone"');
  result = result.replace(/title="Poki\.com"/gi, 'title="GameZone"');
  result = result.replace(/aria-label="Poki"/gi, 'aria-label="GameZone"');
  result = result.replace(/aria-label="Poki\.com"/gi, 'aria-label="GameZone"');
  result = result.replace(/alt="Poki"/gi, 'alt="GameZone"');
  result = result.replace(/alt="Poki\.com"/gi, 'alt="GameZone"');

  // Replace in inline <script> that contains visible brand text (NOT window.context)
  // Only target script tags that have visible text, skip window.context entirely
  result = result.replace(/<script[^>]*>([^<]*(?:Poki\.com|Poki\.io)[^<]*)<\/script>/gi, (match, content) => {
    // Skip if this is the window.context script
    if (content.includes('window.context')) return match;
    return match
      .replace(/Poki\.com/gi, 'GameZone')
      .replace(/Poki\.io/gi, 'GameZone');
  });

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

    html = cleanPokiBranding(html);

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
  <title>Page Not Found - GameZone</title>
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
  <title>Service Temporarily Unavailable - GameZone</title>
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

router.get('*', handlePageRequest);

module.exports = router;
