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
  result = result.replace('</head>', '<!--CLEAN:v4-->' + '</head>');

  // 1. Replace in JSON-LD structured data (critical for Google rich results)
  result = result.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, (m) => {
    return m
      .replace(/"@type":"Organization"[^}]*?"name":"[^"]*"/g, (o) => o.replace(/"name":"[^"]*"/, '"name":"BrowserGamesHQ"'))
      .replace(/"legalName":"[^"]*"/g, '"legalName":"BrowserGamesHQ"')
      .replace(/"slogan":"[^"]*"/g, '"slogan":"Let the world play"')
      .replace(/"email":"[^"]*"/g, '"email":"hajjoutiforskype@gmail.com"')
      // WebSite/WebPage name/description that contain "Poki"
      .replace(/"name":"([^"]*)Poki([^"]*)"/gi, (_, b, a) => '"name":"' + b + 'BrowserGamesHQ' + a + '"')
      .replace(/"description":"([^"]*)Poki([^"]*)"/gi, (_, b, a) => '"description":"' + b + 'BrowserGamesHQ' + a + '"')
      // SameAs: replace social media handles case-insensitively + our domain
      .replace(/"sameAs":\[([^\]]*?poki[^\]]*)\]/gi, (sa) => sa
        .replace(/"(https?:\/\/(?:www\.)?(?:facebook|twitter|youtube|tiktok|instagram|linkedin)\.com[^"]*?)poki([^"]*?)"/gi, '"$1BrowserGamesHQ$2"')
        .replace(/"https?:\/\/([a-z0-9-]+\.)?poki\.com([^"]*?)"/gi, (u) => u.replace(/poki\.com/i, 'browsergameshq.com'))
      );
  });

  // 2. Replace Poki brand in visible text content only (between tags, not in attributes/scripts)
  const blocks = result.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/gi);
  for (let i = 0; i < blocks.length; i += 2) {
    // In non-script/style blocks: replace "Poki" brand text in visible elements
    blocks[i] = blocks[i]
      // Replace "Poki" brand word within visible text content (>text<)
      .replace(/>[^<]*Poki[^<]*</gi, (match) => match.replace(/Poki/gi, 'BrowserGamesHQ'))
      // Replace Poki in title, aria-label, alt attributes
      .replace(/(title|aria-label|alt)="(.*?)Poki(.*?)"/gi, (m, attr, b, a) => attr + '="' + b + 'BrowserGamesHQ' + a + '"')
      // Replace Poki in social link hrefs (case-insensitive)
      .replace(/(href="https?:\/\/(?:www\.)?(?:facebook|twitter|youtube|tiktok|instagram|linkedin)\.com[^"]*?)poki([^"]*")/gi, '$1BrowserGamesHQ$2')
      // Replace poki.com in canonical / og:url
      .replace(/(<link[^>]*rel="canonical"[^>]*href="[^"]*?)poki\.com([^"]*")/gi, '$1' + config.domain + '$2')
      .replace(/(<meta[^>]*property="og:url"[^>]*content="[^"]*?)poki\.com([^"]*")/gi, '$1' + config.domain + '$2')
      // Replace poki.com in other meta content URLs
      .replace(/(<meta[^>]*content="https?:\/\/)poki\.com([^"]*")/gi, '$1' + config.domain + '$2')
      // Replace Poki brand in non-URL meta content
      .replace(/(<meta[^>]*content=")((?!https?:\/\/)[^"]*?)Poki([^"]*">)/gi, '$1$2BrowserGamesHQ$3')
      // Replace in <title>
      .replace(/(<title[^>]*>)([^<]*?)Poki([^<]*?)(<\/title>)/gi, '$1$2BrowserGamesHQ$3$4')
      // Replace about/developers/kids/jobs poki.com subdomain hrefs
      .replace(/href="https?:\/\/(about|developers|kids|jobs)\.poki\.com([^"]*)"/gi, 'href="https://$1.browsergameshq.com$2"');
  }
  result = blocks.join('');

  // 3. Fix email in visible text
  result = result.replace(/hello\s*@\s*poki\s*\.\s*com/gi, 'hajjoutiforskype@gmail.com');

  // 4. Client-side fix for React Helmet override (canonical + meta)
  const canonicalFix = '<script>document.addEventListener("DOMContentLoaded",function(){var c=document.querySelector(\'link[rel="canonical"]\');if(c&&c.href.indexOf("poki.com")>0)c.href=c.href.replace(/https?:\\/\\/[^\\/]+/,"https://'+config.domain+'");var d="'+config.domain+'";[].forEach.call(document.querySelectorAll(\'meta[content*="Poki"],meta[content*="poki"]\'),function(m){var v=m.getAttribute("content");if(v.indexOf("http")===0&&v.indexOf("poki.com")>0)m.setAttribute("content",v.replace(/https?:\\/\\/[^\\/]+/,"https://"+d));else v=m.setAttribute("content",v.replace(/Poki/gi,"BrowserGamesHQ"))})});</script>';

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
