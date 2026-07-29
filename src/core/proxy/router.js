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
  let result = html;

  // NEVER touch window.context — the Poki SPA needs site.domain="poki.com" for API URLs
  const ctxMarker = '___WINDOW_CTX___';
  result = result.replace(/window\.context\s*=\s*\{[^}]+?\};/g, (match) => {
    return match.replace(/window\.context/g, ctxMarker);
  });

  // 1. Replace "Poki" brand text in JSON-LD structured data (critical for Google rich results)
  result = result.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, (match) => {
    return match
      .replace(/["\']Poki["\']/g, '"BrowserGamesHQ"')
      .replace(/["\']Poki B\.V\.["\']/g, '"BrowserGamesHQ"')
      .replace(/["\']Poki\s*(?:is|games|Kids|the|com)[^"\'.,]*?["\']/gi, (m) => {
        return m.replace(/Poki/gi, 'BrowserGamesHQ');
      })
      .replace(/"@type":"Organization"[^}]*?"name":"[^"]*"/g, (m) => {
        return m.replace(/"name":"[^"]*"/, '"name":"BrowserGamesHQ"');
      })
      .replace(/"legalName":"[^"]*"/g, '"legalName":"BrowserGamesHQ"')
      .replace(/"brand"[^}]*?"name":"[^"]*"/g, (m) => {
        return m.replace(/"name":"[^"]*"/, '"name":"BrowserGamesHQ"');
      })
      .replace(/"slogan":"[^"]*"/g, '"slogan":"Let the world play"')
      .replace(/"email":"[^"]*"/g, '"email":"hajjoutiforskype@gmail.com"')
      .replace(/hello@poki\.com/gi, 'hajjoutiforskype@gmail.com')
      .replace(/"sameAs":\[[^\]]+\]/g, (m) => {
        return m.replace(/https?:\/\/(?:www\.)?(?:facebook|twitter|linkedin|youtube|tiktok|instagram)\.com[^",]*/gi, (url) => {
          if (url.includes('facebook.com/Poki')) return url.replace(/\/[^/]+$/, '/BrowserGamesHQ');
          if (url.includes('twitter.com/Poki')) return url.replace(/\/[^/]+$/, '/BrowserGamesHQ');
          if (url.includes('youtube.com/poki') || url.includes('youtube.com/Poki')) return url.replace(/\/[^/]+$/, '/@BrowserGamesHQ');
          if (url.includes('tiktok.com/@poki_games')) return url.replace(/@[^/]+$/, '@browsergameshq');
          if (url.includes('instagram.com/poki__games')) return url.replace(/\/[^/]+$/, '/browsergameshq');
          return url;
        });
      });
  });

  // 2. Replace "Poki" to "BrowserGamesHQ" in ALL visible text (h1, h2, p, li, span, div, strong, etc.)
  // Skip script tags and style tags to avoid breaking functionality
  const textBlocks = result.split(/(<script[^>]*>[\s\S]*?<\/script>|<style[^>]*>[\s\S]*?<\/style>)/gi);
  for (let i = 0; i < textBlocks.length; i += 2) {
    textBlocks[i] = textBlocks[i]
      .replace(/(?<=>|\s|^)Poki(?=<|\s|[.,!?;:]|$)/g, 'BrowserGamesHQ')
      .replace(/(?<=>|\s|^)poki(?=<|\s|[.,!?;:]|$)/g, 'BrowserGamesHQ');
  }
  result = textBlocks.join('');

  // 3. Replace Poki in <title> tags
  result = result.replace(/<title[^>]*>[^<]*<\/title>/gi, (match) => {
    return match.replace(/Poki/gi, 'BrowserGamesHQ').replace(/poki/gi, 'BrowserGamesHQ');
  });

  // 4. Replace Poki domains in meta content URLs
  result = result.replace(/(<meta[^>]*content="[^"]*?https?:\/\/)(?:[^\/]*?)poki\.com([^"]*?"[^>]*>)/gi, '$1' + config.domain + '$2');
  result = result.replace(/(<meta[^>]*content=")((?!https?:\/\/)[^"]*?)Poki([^"]*?">)/gi, '$1$2BrowserGamesHQ$3');
  result = result.replace(/(<meta[^>]*content=")((?!https?:\/\/)[^"]*?)poki([^"]*?">)/gi, '$1$2browsergameshq$3');

  // 5. Replace in <link rel="canonical">
  result = result.replace(/(<link[^>]*rel="canonical"[^>]*href="[^"]*?)poki\.com([^"]*?"[^>]*>)/gi, '$1' + config.domain + '$2');

  // 6. Replace PokiKids in attributes
  result = result.replace(/(title|aria-label|alt)="([^"]*?)PokiKids([^"]*?)"/gi, (m, attr, before, after) => {
    return attr + '="' + before + 'BrowserGamesHQKids' + after + '"';
  });

  // 7. Replace in visible text attributes
  result = result.replace(/title="Poki"/gi, 'title="BrowserGamesHQ"');
  result = result.replace(/title="Poki\.com"/gi, 'title="BrowserGamesHQ"');
  result = result.replace(/aria-label="Poki"/gi, 'aria-label="BrowserGamesHQ"');
  result = result.replace(/aria-label="Poki\.com"/gi, 'aria-label="BrowserGamesHQ"');
  result = result.replace(/alt="Poki"/gi, 'alt="BrowserGamesHQ"');
  result = result.replace(/alt="Poki\.com"/gi, 'alt="BrowserGamesHQ"');

  // 8. Replace social media links pointing to Poki accounts
  result = result.replace(/href="https?:\/\/(?:www\.)?facebook\.com\/Poki[^"]*"/gi, 'href="https://facebook.com/BrowserGamesHQ"');
  result = result.replace(/href="https?:\/\/(?:www\.)?twitter\.com\/Poki[^"]*"/gi, 'href="https://twitter.com/BrowserGamesHQ"');
  result = result.replace(/href="https?:\/\/(?:www\.)?youtube\.com\/(?:c\/)?poki[^"]*"/gi, 'href="https://youtube.com/@BrowserGamesHQ"');
  result = result.replace(/href="https?:\/\/(?:www\.)?tiktok\.com\/@poki_games[^"]*"/gi, 'href="https://tiktok.com/@browsergameshq"');
  result = result.replace(/href="https?:\/\/(?:www\.)?instagram\.com\/poki__games[^"]*"/gi, 'href="https://instagram.com/browsergameshq"');
  result = result.replace(/href="https?:\/\/linkedin\.com\/company\/poki[^"]*"/gi, 'href="https://linkedin.com/company/browsergameshq"');
  result = result.replace(/href="https?:\/\/about\.poki[^"]*"/gi, 'href="https://browsergameshq.com/about"');

  // 9. Restore window.context
  result = result.replace(new RegExp(ctxMarker, 'g'), 'window.context');

  // 10. Fix canonical & meta tags that React Helmet overrides from window.context
  const canonicalFix = '<script>document.addEventListener("DOMContentLoaded",function(){var c=document.querySelector(\'link[rel="canonical"]\');if(c&&c.href.indexOf("poki.com")>0)c.href=c.href.replace(/https?:\\/\\/[^\\/]+/,"https://'+config.domain+'");var d="'+config.domain+'";[].forEach.call(document.querySelectorAll(\'meta[content*="Poki"],meta[content*="poki"]\'),function(m){var v=m.getAttribute("content");if(v.indexOf("http")===0&&v.indexOf("poki.com")>0)m.setAttribute("content",v.replace(/https?:\\/\\/[^\\/]+/,"https://"+d));else if(v.indexOf("http")!==0)m.setAttribute("content",v.replace(/Poki\.com/gi,d).replace(/Poki/gi,"BrowserGamesHQ").replace(/poki/gi,"browsergameshq"))})});</script>';

  // 11. Replace contact email on contact pages
  if (sourcePath && sourcePath.match(/\/c\/contact/i)) {
    const contactEmailFix = '<script>document.addEventListener("DOMContentLoaded",function(){var mo=new MutationObserver(function(){var e=document.querySelector(\'a[href*="hello@poki.com"]\');if(e)e.href=e.href.replace("hello@poki.com","hajjoutiforskype@gmail.com");var n=document.createTreeWalker(document.body,4);var r=[];while(n.nextNode()){if(n.currentNode.nodeValue&&n.currentNode.nodeValue.indexOf("hello@poki.com")!==-1)r.push(n.currentNode)}for(var i=0;i<r.length;i++){r[i].nodeValue=r[i].nodeValue.replace(/hello@poki\.com/gi,"hajjoutiforskype@gmail.com")}if(!r.length)return;mo.disconnect()});mo.observe(document.body,{childList:true,subtree:true,characterData:true})});</script>';
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
