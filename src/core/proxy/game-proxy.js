const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';

// Lightweight interceptor: rewrites poki domain URLs via fetch/XHR + element src/href setters + MO
var GAME_INTERCEPTOR = `<script>(function(){
var gp="games.poki.com";var gdp=["gdn.poki.com","poki-gdn.com"];var pp="/game-proxy/gdn-proxy/";
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

// Proxy gdn.poki.com / poki-gdn.com assets with correct referrer
router.get('/gdn-proxy/:subdomain(*)', async (req, res) => {
  try {
    const fullPath = req.params.subdomain + (req._parsedUrl ? (req._parsedUrl.search || '') : '');
    const cacheKey = `gdn:${fullPath}`;

    const cached = cache.getAsset(cacheKey);
    if (cached) {
      res.set({ 'X-Cache': 'HIT', 'Access-Control-Allow-Origin': '*', 'Content-Type': cached.contentType });
      return res.send(Buffer.from(cached.body, 'base64'));
    }

    const url = `https://${fullPath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: false,
    });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    });

    // For HTML responses from gdn.poki.com, also bypass anti-embedding checks
    // and inject the GAME_INTERCEPTOR (catches PokiSDK checks in inner game HTML)
    if (contentType.includes('text/html')) {
      let html = body.toString('utf-8');
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

    cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
    res.send(body);
  } catch (err) {
    console.error(`[GDN PROXY ERROR] ${req.path}: ${err.message}`);
    res.status(502).send('Asset temporarily unavailable.');
  }
});

// Proxy games.poki.com — patch embed HTML so the anti-embedding check passes
router.get('*', async (req, res) => {
  const gamePath = req.path;
  const cacheKey = `game:${gamePath}`;

  const cachedHtml = cache.getHtml(cacheKey);
  if (cachedHtml) {
    res.set({ 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=600' });
    return res.send(cachedHtml);
  }

  try {
    const url = `${GAME_ORIGIN}${gamePath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: true,
    });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600',
      'X-Cache': 'MISS',
    });

    if (contentType.includes('text/html')) {
      let html = body.toString('utf-8');

      // Server-side: rewrite all gdn.poki.com / poki-gdn.com URLs to go through gdn-proxy
      // This catches URLs in <script src>, <link href>, inline scripts, document.write(), etc.
      html = html.replace(/https?:\/\/[^"'\s<>]*gdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/https?:\/\/[^"'\s<>]*poki-gdn\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      // Also handle protocol-relative URLs
      html = html.replace(/\/\/[^"'\s<>]*gdn\.poki\.com[^"'\s<>]*/g, function(match) {
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

    cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
    res.send(body);
  } catch (err) {
    console.error(`[GAME PROXY ERROR] ${gamePath}: ${err.message}`);
    res.status(502).send('Game temporarily unavailable.');
  }
});

module.exports = router;
