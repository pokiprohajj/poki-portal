const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';
const GDN_ORIGIN = 'https://gdn.poki.com';

// Proxy gdn.poki.com subdomain assets
router.get('/gdn-proxy/:subdomain(*)', async (req, res) => {
  const subdomainPath = req.params.subdomain;
  const cacheKey = `gdn:${subdomainPath}`;

  const cached = cache.getAsset(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', cached.contentType);
    return res.send(Buffer.from(cached.body, 'base64'));
  }

  try {
    const url = `https://${subdomainPath}`;
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

    cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400);
    res.send(body);
  } catch (err) {
    console.error(`[GDN PROXY ERROR] ${subdomainPath}: ${err.message}`);
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
      'Cache-Control': 'public, max-age=300',
      'X-Cache': 'MISS',
    });

    if (contentType.includes('text/html')) {
      let html = body.toString('utf-8');
      // Rewrite gdn.poki.com and poki-gdn.com URLs to go through our proxy
      html = html.replace(/https?:\/\/([a-zA-Z0-9.-]+\.(?:gdn\.poki\.com|poki-gdn\.com)(\/[^\s"'<>&]*)?)/g,
        '/game-proxy/gdn-proxy/$1');
      html = html.replace(/\/\/([a-zA-Z0-9.-]+\.(?:gdn\.poki\.com|poki-gdn\.com)(\/[^\s"'<>&]*)?)/g,
        '/game-proxy/gdn-proxy/$1');
      // Inject referrer override
      html = html.replace('</head>',
        '<script>' +
        'try{Object.defineProperty(document,"referrer",{get:function(){return "https://poki.com/"}})}catch(e){}' +
        'try{Object.defineProperty(document,"domain",{get:function(){return "poki.com"}})}catch(e){}' +
        '</script></head>');
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
