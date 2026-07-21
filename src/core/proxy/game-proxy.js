const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';

// Proxy all gdn.poki.com / poki-gdn.com requests with correct referrer
router.get('/gdn-proxy/:subdomain(*)', async (req, res) => {
  const fullPath = req.params.subdomain + (req._parsedUrl.search || '');
  const cacheKey = `gdn:${fullPath}`;

  const cached = cache.getAsset(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', cached.contentType);
    return res.send(Buffer.from(cached.body, 'base64'));
  }

  try {
    const url = `https://${fullPath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    });

    // For game HTML from gdn, inject referrer override + parent isolation
    if (contentType.includes('text/html')) {
      var html = body.toString('utf-8');
      html = html.replace('</head>',
        '<script>' +
        'try{Object.defineProperty(document,"referrer",{get:function(){return "https://poki.com/"}})}catch(e){}' +
        'try{Object.defineProperty(document,"domain",{get:function(){return "poki.com"}})}catch(e){}' +
        // Also intercept fetch/XHR/MO for assets within the game HTML
        'var gdnHosts=["gdn.poki.com","poki-gdn.com"];var pp="/game-proxy/gdn-proxy/";' +
        'function rw(u){if(!u)return u;for(var i=0;i<gdnHosts.length;i++){if(u.indexOf(gdnHosts[i])!==-1)return pp+u.replace(/https?:\\\/\\\//,"").replace(/^\\\/\\\//,"")}return u}' +
        'var of=window.fetch;window.fetch=function(u,o){return of(rw(typeof u==="string"?u:u&&u.url)||u,o)};' +
        'var ox=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(m,u,a){arguments[1]=rw(u)||u;return ox.apply(this,arguments)};' +
        'var mo=new MutationObserver(function(m){for(var i=0;i<m.length;i++){for(var j=0;j<m[i].addedNodes.length;j++){var n=m[i].addedNodes[j];if(n.nodeType===1){["src","href"].forEach(function(a){var v=n.getAttribute(a);if(v){var rw2=rw(v);if(rw2!==v)n.setAttribute(a,rw2)}});var q=n.querySelectorAll("[src],[href]");for(var l=0;l<q.length;l++){["src","href"].forEach(function(a){var v=q[l].getAttribute(a);if(v){var rw2=rw(v);if(rw2!==v)q[l].setAttribute(a,rw2)}})}}}}});mo.observe(document.documentElement,{childList:true,subtree:true});' +
        '</script></head>');
      cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
      return res.send(html);
    }

    cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
    res.send(body);
  } catch (err) {
    console.error(`[GDN PROXY ERROR] ${fullPath}: ${err.message}`);
    res.status(502).send('Asset temporarily unavailable.');
  }
});

// Proxy games.poki.com requests
router.get('*', async (req, res) => {
  const gamePath = req.path;
  const cacheKey = `game:${gamePath}`;
  const cachedHtml = cache.getHtml(cacheKey);
  if (cachedHtml) {
    res.set('X-Cache', 'HIT');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'text/html');
    return res.send(cachedHtml);
  }
  const cachedAsset = cache.getAsset(cacheKey);
  if (cachedAsset) {
    res.set('X-Cache', 'HIT');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', cachedAsset.contentType);
    return res.send(Buffer.from(cachedAsset.body, 'base64'));
  }

  try {
    const url = `${GAME_ORIGIN}${gamePath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'public, max-age=600',
      'X-Cache': 'MISS',
    });

    if (contentType.includes('text/html')) {
      let html = body.toString('utf-8');
      // Inject comprehensive API interceptor that rewrites ALL gdn.poki.com URLs
      var interceptor = '<script>' +
      '(function(){' +
      'var gdnHosts=["gdn.poki.com","poki-gdn.com"];' +
      'var proxyPrefix="/game-proxy/gdn-proxy/";' +
      'function rewriteUrl(u){' +
      'if(!u)return u;' +
      'for(var i=0;i<gdnHosts.length;i++){' +
      'if(u.indexOf(gdnHosts[i])!==-1){' +
      'return proxyPrefix+u.replace(/https?:\\\/\\\//,"").replace(/^\\\/\\\//,"");' +
      '}' +
      '}' +
      'return u;' +
      '}' +
      'var origFetch=window.fetch;' +
      'window.fetch=function(u,o){' +
      'var rw=rewriteUrl(typeof u==="string"?u:u&&u.url);' +
      'return origFetch(rw||u,o);' +
      '};' +
      'var origXhr=window.XMLHttpRequest.prototype.open;' +
      'window.XMLHttpRequest.prototype.open=function(m,u,a){' +
      'arguments[1]=rewriteUrl(u)||u;' +
      'return origXhr.apply(this,arguments);' +
      '};' +
      // MutationObserver to catch dynamically added elements with gdn URLs
      // Intercept existing gameframe iframe's src setter (this is the main entry point)
      'var gf=document.getElementById("gameframe");' +
      'if(gf){var _src=gf.getAttribute("src");' +
      'Object.defineProperty(gf,"src",{get:function(){return _src},set:function(v){_src=rewriteUrl(v)||v}});}' +
      // MutationObserver to catch dynamically added elements
      'var mo=new MutationObserver(function(muts){' +
      'for(var i=0;i<muts.length;i++){var m=muts[i];' +
      'if(m.type==="attributes"&&m.attributeName==="src"){' +
      'var rw=rewriteUrl(m.target.getAttribute("src"));' +
      'if(rw)m.target.setAttribute("src",rw);' +
      '}' +
      'for(var j=0;j<m.addedNodes.length;j++){var n=m.addedNodes[j];' +
      'if(n.nodeType===1){' +
      '["src","href"].forEach(function(a){' +
      'var v=n.getAttribute(a);' +
      'if(v){var rw=rewriteUrl(v);if(rw!==v)n.setAttribute(a,rw);}' +
      '});' +
      'var q=n.querySelectorAll("[src],[href]");' +
      'for(var l=0;l<q.length;l++){var el=q[l];' +
      '["src","href"].forEach(function(a){' +
      'var v=el.getAttribute(a);' +
      'if(v){var rw=rewriteUrl(v);if(rw!==v)el.setAttribute(a,rw);}' +
      '});' +
      '}' +
      '}' +
      '}' +
      '}' +
      '});' +
      'mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["src","href"]});' +
      '})();' +
      '</script>';
      // Inject gdn interceptor before </head> along with referrer override
      html = html.replace('</head>',
        '<script>' +
        'try{Object.defineProperty(document,"referrer",{get:function(){return "https://poki.com/"}})}catch(e){}' +
        'try{Object.defineProperty(document,"domain",{get:function(){return "poki.com"}})}catch(e){}' +
        '</script>' + interceptor + '</head>');
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
