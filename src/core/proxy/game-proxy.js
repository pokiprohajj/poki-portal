const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';

// Lightweight interceptor for game HTML from gdn.poki.com
// Only rewrites asset URLs - no referrer spoofing needed since we skip the embed page
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
  'var mo=new MutationObserver(function(m){' +
  'for(var i=0;i<m.length;i++){var t=m[i].addedNodes;' +
  'for(var j=0;j<t.length;j++){var n=t[j];if(n.nodeType!==1)continue;' +
  '["src","href"].forEach(function(a){var v=n.getAttribute(a);' +
  'if(v){var r=rw(v);if(r!==v)n.setAttribute(a,r)}})}}});' +
  'mo.observe(document.documentElement,{childList:true,subtree:true});' +
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

    // For game HTML, inject lightweight asset rewriter
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

// Proxy games.poki.com — extract gameUri and redirect to game directly
router.get('*', async (req, res) => {
  const gamePath = req.path;
  const cacheKey = `game:${gamePath}`;

  // Check HTML cache for redirect target
  const cachedRedirect = cache.getAsset(cacheKey + ':redirect');
  if (cachedRedirect) {
    res.set('X-Cache', 'HIT');
    return res.redirect(302, cachedRedirect.body);
  }

  const cachedHtml = cache.getHtml(cacheKey);
  if (cachedHtml) {
    res.set({ 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'HIT' });
    return res.send(cachedHtml);
  }

  try {
    const url = `${GAME_ORIGIN}${gamePath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
        'Accept': '*/*',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: true,
    });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    if (contentType.includes('text/html')) {
      const html = body.toString('utf-8');

      // Try to extract gameUri from PARAMS — this is the actual game URL on gdn.poki.com
      const gameUriMatch = html.match(/"gameUri"\s*:\s*"([^"]+)"/);
      if (gameUriMatch) {
        const gameUri = gameUriMatch[1].replace(/\\u002F/g, '/');
        try {
          const parsed = new URL(gameUri);
          const gdnHost = parsed.hostname;
          const gdnPath = parsed.pathname + parsed.search;
          const redirectPath = `/game-proxy/gdn-proxy/${gdnHost}${gdnPath}`;

          // Cache the redirect for 1 hour
          cache.setAsset(cacheKey + ':redirect', { body: redirectPath, contentType: 'text/plain' }, 3600);
          console.log(`[GAME REDIRECT] ${gamePath} -> ${redirectPath}`);
          return res.redirect(302, redirectPath);
        } catch (e) {
          console.error(`[GAME REDIRECT ERROR] Invalid gameUri: ${gameUri}`);
        }
      }

      // Fallback: serve embed HTML with referrer override + cookie
      let patched = html;
      var headMatch = patched.match(/<head[^>]*>/i);
      if (headMatch) {
        patched = patched.replace(headMatch[0],
          headMatch[0] +
          '<script>' +
          'try{Object.defineProperty(document,"referrer",{get:function(){return "https://poki.com/"}})}catch(e){}' +
          'try{document.cookie="poki=1; path=/"}catch(e){}' +
          'try{window.top=window}catch(e){}' +
          '</script>' + GAME_INTERCEPTOR);
      }

      cache.setHtml(cacheKey, patched);
      res.set({ 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'MISS', 'Cache-Control': 'public, max-age=600' });
      return res.send(patched);
    }

    cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
    res.set({ 'Content-Type': contentType, 'X-Cache': 'MISS' });
    res.send(body);
  } catch (err) {
    console.error(`[GAME PROXY ERROR] ${gamePath}: ${err.message}`);
    res.status(502).send('Game temporarily unavailable.');
  }
});

module.exports = router;
