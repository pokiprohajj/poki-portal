process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason && reason.message ? reason.message : reason);
});

const config = require('./config');
const blogRouter = require('./blog');
const proxyRouter = require('./core/proxy/router');
const analyticsTracker = require('./analytics/tracker');
const analyticsDashboard = require('./analytics/dashboard');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const session = require('express-session');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Session is ONLY needed for the /admin dashboard. Mounting it globally with the
// default MemoryStore leaked one in-memory session per visitor (no cleanup for 24h)
// — the root cause of Railway OOM after hours of production traffic.
app.use('/admin', session({
  secret: process.env.SESSION_SECRET || 'p0k1_p0rt4l_s3ss10n_s3cr3t',
  resave: false,
  saveUninitialized: false,
  name: 'admin_sid',
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 },
}));

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
  res.set('X-Sitemap', `https://${config.domain}/sitemap.xml`);
  res.set('Link', `<https://${config.domain}/sitemap.xml>; rel="sitemap"`);
  next();
});

// Client-side page beacon (SPA navigation tracking + tab-close disconnect)
function handleBeacon(id, page, disconnect, req, res) {
  if (disconnect) {
    if (id) analyticsTracker.untrack(id);
  } else if (id && !page) {
    analyticsTracker.ping(id);
  } else if (id && page) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null;
    const country = req.headers['cf-ipcountry'] || req.headers['x-geo-country'] || null;
    const ua = req.headers['user-agent'] || '';
    const device = analyticsTracker._detectDevice(ua);
    const bot = analyticsTracker.detectBot(ua);
    // DON'T use req.headers['referer'] — beacon requests come from the site itself,
    // so the referrer would be the current page URL, not the external source.
    // The real external referrer is captured by the server middleware on initial page load
    // and merged into the UUID session via trackPage().
    const referrer = null;
    const campaign = analyticsTracker._detectCampaign(req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    analyticsTracker.trackPage(id, page, country, device, bot, referrer, campaign, ip);
  }
  res.status(204).end();
}
app.post('/t', (req, res) => handleBeacon(req.body?.id, req.body?.page, req.body?.disconnect, req, res));
app.get('/t', (req, res) => handleBeacon(req.query?.id, req.query?.page, req.query?.disconnect, req, res));

// Passive analytics — never blocks, never throws
app.use((req, res, next) => {
  analyticsTracker.track(req);
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

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  res.send(`google.com, pub-7128312414229788, DIRECT, f08c47fec0942fa0\n`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://${config.domain}/sitemap.xml\n`);
});

app.get('/llms.txt', (req, res) => {
  res.type('text/markdown');
  const games = require('./frontend/games-data');
  const gameLines = games
    .map(g => `- [${g.title}](https://browsergameshq.com/en/g/${g.slug}) — ${g.category} game, playable free in the browser`)
    .join('\n');

  const posts = require('./blog/posts');
  const topGuides = posts
    .filter(p => p.slug.endsWith('complete-guide'))
    .slice(0, 40)
    .map(p => `- [${p.title}](https://browsergameshq.com/blog/${p.slug})`)
    .join('\n');

  res.send(`# BrowserGamesHQ

> Play free online games instantly in your browser. No downloads, no hassle — just fun.

## About
BrowserGamesHQ is a free online gaming platform featuring thousands of games across every genre including action, puzzle, racing, sports, strategy, dress-up, multiplayer, and more.

## Content Overview
- **Homepage**: https://browsergameshq.com/ — Browse featured games, categories, and new releases
- **Game Pages**: https://browsergameshq.com/en/g/[game-slug] — Play games directly in your browser
- **Blog**: https://browsergameshq.com/blog — Game guides, tips, reviews, and industry articles
- **Categories**: Action, Puzzle, Racing, Sports, Multiplayer, Dress Up, io Games, 2 Player, Car Games, and more

## Key Links
- [Homepage](https://browsergameshq.com/)
- [Blog](https://browsergameshq.com/blog)
- [New Games](https://browsergameshq.com/en/new-games)
- [Multiplayer Games](https://browsergameshq.com/en/multiplayer)
- [Action Games](https://browsergameshq.com/en/action-games)
- [Puzzle Games](https://browsergameshq.com/en/puzzle-games)
- [Racing Games](https://browsergameshq.com/en/racing-games)
- [Sitemap](https://browsergameshq.com/sitemap.xml)

## Popular Game Guides
${topGuides}

## All Games (${games.length})
${gameLines}

## Trust Pages
- [About](https://browsergameshq.com/about)
- [Contact](https://browsergameshq.com/contact)
- [Privacy Policy](https://browsergameshq.com/privacy-policy)
- [Terms of Service](https://browsergameshq.com/terms-of-service)
`);
});

app.get('/sitemap.xml', (req, res) => {
  const cacheHeaders = { 'Cache-Control': 'public, max-age=86400' };
  res.set(cacheHeaders);
  res.type('application/xml');
  const today = new Date().toISOString().split('T')[0];

  const pages = ['', 'games', 'categories'].map(p =>
    `  <url>\n    <loc>https://${config.domain}/${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
  ).join('\n');

  const gamePages = [
    '/en/new-games', '/en/top-rated', '/en/multiplayer', '/en/action-games',
    '/en/puzzle-games', '/en/racing-games', '/en/sports-games', '/en/adventure-games',
    '/en/casual-games', '/en/strategy-games', '/en/io-games',
  ];
  const gameUrls = gamePages.map(p =>
    `  <url>\n    <loc>https://${config.domain}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`
  ).join('\n');

  // Individual game pages — 147 verified live game URLs (priority 0.9)
  const games = require('./frontend/games-data');
  const gamePageUrls = games
    .map(g => g.slug)
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .map(s =>
      `  <url>\n    <loc>https://${config.domain}/en/g/${s}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`
    ).join('\n');

  const posts = require('./blog/posts');
  const blogUrls = posts.map(p =>
    `  <url>\n    <loc>https://${config.domain}/blog/${p.slug}</loc>\n    <lastmod>${p.date || today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
  ).join('\n');

  const blogIndexUrl = `  <url>\n    <loc>https://${config.domain}/blog/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>https://${config.domain}/blog/popular</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;

  const blogCatUrls = ['guides', 'lists', 'comparisons', 'articles'].map(c =>
    `  <url>\n    <loc>https://${config.domain}/blog/category/${c}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
  ).join('\n');

  // Trust pages (local static — indexable, low priority)
  const trustPageUrls = ['/privacy-policy', '/contact', '/terms-of-service', '/about'].map(p =>
    `  <url>\n    <loc>https://${config.domain}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.2</priority>\n  </url>`
  ).join('\n');

  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages}\n${gameUrls}\n${gamePageUrls}\n${blogIndexUrl}\n${blogCatUrls}\n${blogUrls}\n${trustPageUrls}\n</urlset>`);
});

app.use('/proxy-media', require('./core/proxy/media'));
app.use('/game-proxy', require('./core/proxy/game-proxy'));

// Admin dashboard (real-time analytics)
app.use('/admin', (req, res, next) => {
  if (analyticsDashboard(req, res)) return;
  next();
});

app.use('/', (req, res, next) => {
  if (blogRouter(req, res)) return;
  next();
});
app.use('/', proxyRouter);

app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);
  if (!res.headersSent) {
    res.status(502).send('Service temporarily unavailable.');
  }
});

const server = app.listen(config.port, () => {
  console.log(`[BrowserGamesHQ] Running on port ${config.port}`);
  console.log(`[BrowserGamesHQ] Domain: ${config.domain}`);
  console.log(`[BrowserGamesHQ] Source: ${config.sourceDomain}`);
  console.log(`[BrowserGamesHQ] Env: ${config.nodeEnv}`);
});

server.on('error', (err) => {
  console.error(`[FATAL] Server listen error: ${err.message}`);
  process.exit(1);
});

module.exports = app;
