const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';

// Lightweight interceptor: only rewrites gdn.poki.com URLs via fetch/XHR/MO
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

    // For game HTML, inject lightweight asset rewriter only
    if (contentType.includes('text/html')) {
      var html = body.toString('utf-8');
      var headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        html = html.replace(headMatch[0], headMatch[0] + GAME_INTERCEPTOR);
      }
      cache.setAsset(cacheKey, { body: Buffer.from(html), contentType }, 86400);
      return res.send(html);
    }

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

      // Inject at <head> BEFORE any embed page scripts:
      // 1. Override top === self check (anti-embedding bypass)
      // 2. Set poki=1 cookie (backup check)
      // 3. Override document.referrer (backup check)
      // 4. Lightweight fetch/XHR interceptor for gdn.poki.com asset proxying
      var headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        html = html.replace(headMatch[0],
          headMatch[0] +
          '<script>' +
          // Make top === self pass so the embed page thinks it's not in an iframe
          'try{Object.defineProperty(window,"top",{get:function(){return window},configurable:true})}catch(e){}' +
          'try{window.top=window}catch(e){}' +
          // Cookie check backup
          'try{document.cookie="poki=1; path=/"}catch(e){}' +
          // Referrer check backup
          'try{Object.defineProperty(document,"referrer",{get:function(){return "https://poki.com/"}})}catch(e){}' +
          '</script>' + GAME_INTERCEPTOR);
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
