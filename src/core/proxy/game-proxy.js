const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';

// Lightweight interceptor: rewrites poki domain URLs via fetch/XHR + element src/href setters + MO
var GAME_INTERCEPTOR = `<script>(function(){
var gp="games.poki.com";
var gdp=["gdn.poki.com","poki-gdn.com","game-cdn.poki.com","api.poki.com","devs-api.poki.com","a.poki.com","ay.delivery"];
var pp="/game-proxy/gdn-proxy/";
function rw(u){if(!u||typeof u!=="string")return u;
if(u.indexOf("/game-proxy/")===0)return u;
for(var i=0;i<gdp.length;i++){if(u.indexOf(gdp[i])!==-1)
return pp+u.replace(/https?:\\/\\//,"").replace(/^\\/\\//,"")}
if(u.indexOf(gp)!==-1)return u.replace(/https?:\\/\\/games\\.poki\\.com/,"/game-proxy");
return u}
var of=window.fetch;window.fetch=function(u,o){
return of(rw(typeof u==="string"?u:u&&u.url)||u,o)};
var ox=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(m,u,a){
arguments[1]=rw(u)||u;return ox.apply(this,arguments)};
function op(p,pr){var d=Object.getOwnPropertyDescriptor(p,pr);
if(d&&d.set){Object.defineProperty(p,pr,{get:d.get,
set:function(v){return d.set.call(this,rw(v)||v)},configurable:true})}}
op(HTMLScriptElement.prototype,"src");
op(HTMLIFrameElement.prototype,"src");
op(HTMLImageElement.prototype,"src");
op(HTMLSourceElement.prototype,"src");
op(HTMLLinkElement.prototype,"href");
function fixEl(n){if(n.nodeType!==1)return;
if(n.src){var s=rw(n.src);if(s!==n.src)n.src=s}
if(n.href){var h=rw(n.href);if(h!==n.href)n.href=h}
var els=n.querySelectorAll&&n.querySelectorAll("[src],[href]");
if(els){for(var i=0;i<els.length;i++){
if(els[i].src){var s2=rw(els[i].src);if(s2!==els[i].src)els[i].src=s2}
if(els[i].href){var h2=rw(els[i].href);if(h2!==els[i].href)els[i].href=h2}}}}
var mo=new MutationObserver(function(ms){
for(var i=0;i<ms.length;i++){var ns=ms[i].addedNodes;
for(var j=0;j<ns.length;j++)fixEl(ns[j])}
});
mo.observe(document.documentElement||document.body,{childList:true,subtree:true});
})();</script>`;

// Proxy gdn.poki.com / poki-gdn.com assets + API calls (including POST/PUT)
router.all('/gdn-proxy/:subdomain(*)', async (req, res) => {
  try {
    const fullPath = req.params.subdomain + (req._parsedUrl ? (req._parsedUrl.search || '') : '');
    const cacheKey = `gdn:${fullPath}`;

    // Only cache GET requests; skip cache for POST/PUT/etc
    const isGet = req.method === 'GET';

    if (isGet) {
      const cached = cache.getAsset(cacheKey);
      if (cached) {
        res.set({ 'X-Cache': 'HIT', 'Access-Control-Allow-Origin': '*', 'Content-Type': cached.contentType });
        return res.send(Buffer.from(cached.body, 'base64'));
      }
    }

    const url = `https://${fullPath}`;
    const fetchOpts = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: false,
    };

    // Forward request body and content-type for POST/PUT/etc
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.headers['content-type']) fetchOpts.headers['Content-Type'] = req.headers['content-type'];
      if (req.body) fetchOpts.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(url, fetchOpts);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': isGet ? 'public, max-age=86400' : 'no-store',
      'X-Cache': 'MISS',
    });

    // For HTML responses from gdn.poki.com, also bypass anti-embedding checks
    // and inject the GAME_INTERCEPTOR (catches PokiSDK checks in inner game HTML)
    if (isGet && contentType.includes('text/html')) {
      let html = body.toString('utf-8');

      // Server-side: rewrite game-cdn.poki.com URLs through our proxy
      // (otherwise the Poki SDK bootloader loads unproxied and detects embedding)
      html = html.replace(/https?:\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });

      html = html.replace(/if\s*\(\s*((?:window\.)?(?:top|self))\s*(={2,3}|!==?)\s*((?:window\.)?(?:self|top))/g, function(m, a, op, b) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      html = html.replace(/if\s*\(\s*window\s*(={2,3}|!==?)\s*window\.top/g, function(m, op) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      var headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        html = html.replace(headMatch[0], headMatch[0] + GAME_INTERCEPTOR);
      }
      cache.setAsset(cacheKey, { body: Buffer.from(html).toString('base64'), contentType }, 86400);
      return res.send(html);
    }

    // For JavaScript responses (Poki SDK core), apply anti-embedding bypass
    if (isGet && (contentType.includes('javascript') || contentType.includes('application/x-javascript') || contentType.includes('text/javascript') || req.path.endsWith('.js'))) {
      let js = body.toString('utf-8');
      js = js.replace(/if\s*\(\s*((?:window\.)?(?:top|self))\s*(={2,3}|!==?)\s*((?:window\.)?(?:self|top))/g, function(m, a, op, b) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      js = js.replace(/if\s*\(\s*window\s*(={2,3}|!==?)\s*window\.top/g, function(m, op) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      cache.setAsset(cacheKey, { body: Buffer.from(js).toString('base64'), contentType }, 86400);
      return res.send(js);
    }

    if (isGet) {
      cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
    }
    res.send(body);
  } catch (err) {
    console.error(`[GDN PROXY ERROR] ${req.method} ${req.path}: ${err.message}`);
    res.status(502).send('Asset temporarily unavailable.');
  }
});

// Proxy games.poki.com — patch embed HTML + handle API calls (POST/PUT to savegame etc)
router.all('*', async (req, res) => {
  const gamePath = req.path;
  const isGet = req.method === 'GET';
  const cacheKey = `game:${gamePath}`;

  if (isGet) {
    const cachedHtml = cache.getHtml(cacheKey);
    if (cachedHtml) {
      res.set({ 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=600' });
      return res.send(cachedHtml);
    }
  }

  try {
    const url = `${GAME_ORIGIN}${gamePath}`;
    const fetchOpts = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: true,
    };

    // Forward request body and content-type for POST/PUT/etc
    if (!isGet && req.method !== 'HEAD') {
      if (req.headers['content-type']) fetchOpts.headers['Content-Type'] = req.headers['content-type'];
      if (req.body) fetchOpts.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(url, fetchOpts);

    const upstreamContentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    const cacheControl = isGet ? 'public, max-age=600' : 'no-store';
    res.set({
      'Content-Type': upstreamContentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
      'X-Cache': 'MISS',
    });

    if (isGet && upstreamContentType.includes('text/html')) {
      let html = body.toString('utf-8');

      // Server-side: rewrite all gdn.poki.com / poki-gdn.com / game-cdn.poki.com URLs to go through gdn-proxy
      // This catches URLs in <script src>, <link href>, inline scripts, document.write(), etc.
      html = html.replace(/https?:\/\/[^"'\s<>]*gdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/https?:\/\/[^"'\s<>]*poki-gdn\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/https?:\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      // Also handle protocol-relative URLs
      html = html.replace(/\/\/[^"'\s<>]*gdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*poki-gdn\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });

      // Bypass anti-embedding check: catch all top/self comparisons
      html = html.replace(/if\s*\(\s*((?:window\.)?(?:top|self))\s*(={2,3}|!==?)\s*((?:window\.)?(?:self|top))/g, function(m, a, op, b) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      html = html.replace(/if\s*\(\s*window\s*(={2,3}|!==?)\s*window\.top/g, function(m, op) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });

      var headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        html = html.replace(headMatch[0], headMatch[0] + GAME_INTERCEPTOR);
      }

      cache.setHtml(cacheKey, html);
      return res.send(html);
    }

    if (isGet) {
      cache.setAsset(cacheKey, { body: body.toString('base64'), contentType: upstreamContentType }, 86400);
    }
    res.send(body);
  } catch (err) {
    console.error(`[GAME PROXY ERROR] ${req.method} ${gamePath}: ${err.message}`);
    res.status(502).send('Game temporarily unavailable.');
  }
});

module.exports = router;
