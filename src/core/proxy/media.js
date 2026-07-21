const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const ALLOWED_TYPES = [
  'image/', 'video/', 'audio/',
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  'application/javascript', 'text/javascript',
  'text/css', 'text/plain',
  'application/json',
  'image/svg+xml',
  'application/font-woff', 'application/font-woff2',
  'application/octet-stream',
];

router.get('/', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    decodedUrl = url;
  }

  if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://') && !decodedUrl.startsWith('//')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (decodedUrl.startsWith('//')) {
    decodedUrl = `https:${decodedUrl}`;
  }

  let host;
  try {
    host = new URL(decodedUrl).hostname;
  } catch {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  const blockedHosts = [
    'pagead2.googlesyndication.com',
    'www.googleadservices.com',
    'doubleclick.net',
    'adnxs.com',
    'taboola.com',
    'outbrain.com',
    'criteo.com',
    'amazon-adsystem.com',
    'moatads.com',
  ];
  if (blockedHosts.some(h => host.includes(h))) {
    return res.status(404).send('Not found');
  }

  const cacheKey = `asset:${decodedUrl}`;
  const cached = cache.getAsset(cacheKey);
  if (cached) {
    res.set({
      'Content-Type': cached.contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Cache': 'HIT',
    });
    return res.send(cached.data);
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': config.sourceOrigin,
      },
      redirect: 'follow',
      timeout: 10000,
      compress: false,
    });

    if (!response.ok) {
      return res.status(response.status).send('Upstream error');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    const isAllowed = ALLOWED_TYPES.some(t => contentType.toLowerCase().includes(t));
    if (!isAllowed) {
      return res.status(403).send('Content type not allowed');
    }

    const buffer = await response.buffer();

    if (buffer.length < 5 * 1024 * 1024) {
      cache.setAsset(cacheKey, { data: buffer, contentType }, 86400);
    }

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Cache': 'MISS',
    });
    res.send(buffer);
  } catch (err) {
    console.error(`[MEDIA PROXY ERROR] ${decodedUrl}: ${err.message}`);
    res.status(502).send('Media proxy error');
  }
});

module.exports = router;
