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
  - **Categories**: Action, Puzzle, Racing, Sports, Multiplayer, Dress Up, Car Games, and more

## Key Links
- [Homepage](https://browsergameshq.com/)
- [Blog](https://browsergameshq.com/blog)
- [Multiplayer Games](https://browsergameshq.com/en/multiplayer)
- [Action Games](https://browsergameshq.com/en/action)
- [Puzzle Games](https://browsergameshq.com/en/puzzle)
- [Racing Games](https://browsergameshq.com/en/racing)
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
  // Phase A: Indexable core only — 64 URLs (homepage + 8 cats + 4 trust + /blog/ + 10 pilot games + 25 Strong + 15 enriched)
  // lastmod reflects REAL significant modification (no stableDate pseudo-random mass-bump)
  const staticLastmod = '2026-08-28';
  const pilotLastmod = '2026-08-31';

  const pages = [''].map(p =>
    `  <url>\n    <loc>https://${config.domain}/${p}</loc>\n    <lastmod>${staticLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
  ).join('\n');

  const categoryPages = [
    '/en/popular', '/en/action', '/en/puzzle', '/en/racing',
    '/en/sports', '/en/multiplayer', '/en/dress-up', '/en/car',
  ];
  const categoryUrls = categoryPages.map(p =>
    `  <url>\n    <loc>https://${config.domain}${p}</loc>\n    <lastmod>${staticLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`
  ).join('\n');

  // Only 10 pilot games (enriched) — not all 147
  const pilotGames = ['subway-surfers','temple-run-2','drift-boss','rainbow-obby','murder','gobattle2','hide-and-paint','tag','minefun-io','retro-bowl'];
  const gamePageUrls = pilotGames.map(s =>
    `  <url>\n    <loc>https://${config.domain}/en/g/${s}</loc>\n    <lastmod>${pilotLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`
  ).join('\n');

  // Only 40 blog posts: 25 Strong (actual present) + 15 enriched pilot
  const allPosts = require('./blog/posts');
  const strongSlugs = ['temple-run-2-holi-festival-walkthrough','why-browser-games-are-making-comeback','temple-run-2-spooky-summit-walkthrough','improve-endless-runner-skills','browsergameshq-your-new-gaming-hub','play-free-games-without-download','best-puzzle-games-browser','best-multiplayer-games-browser','why-browser-games-wont-load','browser-games-for-low-end-pc','how-browser-games-have-evolved','drive-mad-all-tracks-guide','monster-tracks-upgrade-guide','murder-all-cases-walkthrough','apple-worm-all-levels-guide','browser-games-for-grandparents','games-to-play-when-internet-slow','games-for-competitive-friends','subway-surfers-faq','retro-bowl-faq','ultimate-guide-free-browser-games','how-to-get-better-at-any-video-game','best-free-online-games-no-download-2026','browser-games-vs-downloadable-games-comparison','gobattle2-complete-guide'];
  const enriched15 = ['retro-bowl-how-to-play-online','retro-bowl-tips-and-strategies','retro-bowl-advanced-guide','drift-boss-how-to-play-online','drift-boss-tips-and-strategies','drift-boss-advanced-guide','monkey-mart-how-to-play-online','monkey-mart-tips-and-strategies','stickman-hook-how-to-play-online','stickman-hook-tips-and-strategies','blocky-blast-puzzle-how-to-play-online','blocky-blast-puzzle-tips-and-strategies','level-devil-how-to-play-online','level-devil-tips-and-strategies','slope-how-to-play-online'];
  const keepSlugs = new Set([...strongSlugs, ...enriched15]);
  const blogUrls = allPosts.filter(p=>keepSlugs.has(p.slug)).map(p =>
    `  <url>\n    <loc>https://${config.domain}/blog/${p.slug}</loc>\n    <lastmod>${p.slug.startsWith('retro-bowl')||p.slug.startsWith('drift-boss')||p.slug.startsWith('monkey-mart')||p.slug.startsWith('stickman-hook')||p.slug.startsWith('blocky-blast')||p.slug.startsWith('level-devil')||p.slug.startsWith('slope-') ? pilotLastmod : p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
  ).join('\n');

  const blogIndexUrl = `  <url>\n    <loc>https://${config.domain}/blog/</loc>\n    <lastmod>${staticLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`;

  // Trust pages
  const trustPageUrls = ['/about', '/privacy-policy', '/contact', '/terms-of-service'].map(p =>
    `  <url>\n    <loc>https://${config.domain}${p}</loc>\n    <lastmod>${staticLastmod}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.2</priority>\n  </url>`
  ).join('\n');

  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages}\n${categoryUrls}\n${gamePageUrls}\n${blogIndexUrl}\n${blogUrls}\n${trustPageUrls}\n</urlset>`);
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

// 301 redirects for legacy routes — BEFORE proxy catch-all
app.get('/en/privacy-policy', (req, res) => res.redirect(301, '/privacy-policy'));
app.get('/en/about-us', (req, res) => res.redirect(301, '/about'));
app.get('/en/about-us/', (req, res) => res.redirect(301, '/about'));

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
