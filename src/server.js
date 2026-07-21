const config = require('./config');
const proxyRouter = require('./core/proxy/router');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

app.use(compression());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  frameguard: false,
  referrerPolicy: { policy: 'unsafe-url' },
}));

app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('X-Frame-Options');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.use('/static', express.static(path.join(__dirname, 'frontend/public'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  res.send(`google.com, pub-7128312414229788, DIRECT, f08c47fec0942fa0\n`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://${config.domain}/sitemap.xml\n`);
});

app.get('/sitemap.xml', async (req, res) => {
  const cacheHeaders = { 'Cache-Control': 'public, max-age=86400' };
  res.set(cacheHeaders);
  res.type('application/xml');

  const pages = ['', 'games', 'categories'].map(p =>
    `  <url>\n    <loc>https://${config.domain}/${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
  ).join('\n');

  const gamePages = [
    '/en/new-games', '/en/top-rated', '/en/multiplayer', '/en/action-games',
    '/en/puzzle-games', '/en/racing-games', '/en/sports-games', '/en/adventure-games',
    '/en/casual-games', '/en/strategy-games', '/en/io-games',
  ];
  const gameUrls = gamePages.map(p =>
    `  <url>\n    <loc>https://${config.domain}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`
  ).join('\n');

  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages}\n${gameUrls}\n</urlset>`);
});

app.use('/proxy-media', require('./core/proxy/media'));
app.use('/game-proxy', require('./core/proxy/game-proxy'));

app.use('/', proxyRouter);

app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);
  if (!res.headersSent) {
    res.status(502).send('Service temporarily unavailable.');
  }
});

app.listen(config.port, () => {
  console.log(`[Poki Portal] Running on port ${config.port}`);
  console.log(`[Poki Portal] Domain: ${config.domain}`);
  console.log(`[Poki Portal] Source: ${config.sourceDomain}`);
  console.log(`[Poki Portal] Env: ${config.nodeEnv}`);
});

module.exports = app;
