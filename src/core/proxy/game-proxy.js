const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';

// Lightweight interceptor: rewrites gdn.poki.com URLs via fetch/XHR + element src/href setters
var GAME_INTERCEPTOR = '<script>(function(){' +
  'var h=["gdn.poki.com","poki-gdn.com"];var pp="/game-proxy/gdn-proxy/";' +
  'function rw(u){if(!u||typeof u!=="string")return u;' +
  'for(var i=0;i<h.length;i++){if(u.indexOf(h[i])!==-1)' +
  'return pp+u.replace(/https?:\\\/\\\//,"").replace(/^\\\/\\\//,"")}return u}' +
  'var of=window.fetch;window.fetch=function(u,o){' +
  'return of(rw(typeof u==="string"?u:u&&u.url)||u,o)};' +
  'var ox=XMLHttpRequest.prototype.open;' +
  'XMLHttpRequest.prototype.open=function(m,u,a){' +
  'arguments[1]=rw(u)||u;return ox.apply(this,arguments)};' +
  'function op(p,pr){var d=Object.getOwnPropertyDescriptor(p,pr);' +
  'if(d&&d.set){Object.defineProperty(p,pr,{get:d.get,' +
  'set:function(v){return d.set.call(this,rw(v)||v)},configurable:true})}}' +
  'op(HTMLScriptElement.prototype,"src");' +
  'op(HTMLIFrameElement.prototype,"src");' +
  'op(HTMLImageElement.prototype,"src");' +
  'op(HTMLSourceElement.prototype,"src");' +
  'op(HTMLLinkElement.prototype,"href");' +
  '})();</script>';

// Proxy gdn.poki.com / poki-gdn.com assets with correct referrer
router.get('/gdn-proxy/:subdomain(*)', async (req, res) => {
  const fullPath = req.params.subdomain + (req._parsedUrl.search || '');
  const cacheKey = `gdn:${fullPath}`;

  const cached = cache.getAsset(cacheKey);
  if (cached) {
    res.set({ 'X-Cache': 'HIT', 'Access-Control-Allow-Origin': '*', 'Content-Type': cached.contentType });
    return res.send(Buffer.from(cached.body, 'base64'));
  }

  try {
    const url = `https://${fullPath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: true,
    });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    });

    cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
    res.send(body);
  } catch (err) {
    console.error(`[GDN PROXY ERROR] ${fullPath}: ${err.message}`);
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

      // Bypass anti-embedding check: if(top===self||...) → if(true||...)
      html = html.replace(/if\s*\(\s*top\s*===\s*self/g, 'if(true');

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
