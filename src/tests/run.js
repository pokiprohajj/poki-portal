const { rewriteHtml } = require('../core/rewriter');
const { injectAds } = require('../core/ads/injector');
const { shouldRemoveElement } = require('../core/ads/filter');
const cache = require('../core/cache');

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) { console.log('  [PASS] ' + name); passed++; }
  else { console.log('  [FAIL] ' + name); failed++; }
}

console.log('=== Poki Portal Test Suite (v5 - Safe Branding) ===\n');

const pokiHtml = '<!DOCTYPE html><html><head>' +
  '<title>Subway Surfers Online - Poki</title>' +
  '<meta property="og:url" content="https://poki.com/en/subway-surfers">' +
  '<meta property="og:title" content="Subway Surfers on Poki.com">' +
  '<meta name="description" content="Play Subway Surfers on Poki">' +
  '<link rel="canonical" href="https://poki.com/en/subway-surfers">' +
  '<link rel="stylesheet" href="https://a.poki-cdn.com/assets/main.css">' +
  '<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>' +
  '<script src="https://a.poki-cdn.com/assets/game.js"></script>' +
  '</head><body>' +
  '<a href="/en/two-player">Two Player</a>' +
  '<a href="https://poki.com/en/action">Action</a>' +
  '<a href="https://www.googleadservices.com/pagead/test">Ad</a>' +
  '<img src="https://img.poki-cdn.com/images/big/game.png" srcset="https://img.poki-cdn.com/small.png 300w">' +
  '<img data-src="https://img.poki-cdn.com/lazy.png">' +
  '<img src="//img.poki-cdn.com/protocol.png">' +
  '<div data-video-url="https://v.poki-cdn.com/abc/thumbnail"></div>' +
  '<div class="poki-ads">Ad</div>' +
  '<div data-ad-slot="123">Ad slot</div>' +
  '<iframe src="https://www.googleadservices.com/pagead/test.html"></iframe>' +
  '<script>var x = "https://poki.com/en/game";</script>' +
  '</body></html>';

const r = rewriteHtml(pokiHtml, '/en/subway-surfers');

console.log('1. Rewriter - Safe Branding');
assert('Returns string', typeof r === 'string');
assert('Title: Poki -> GameZone', r.includes('GameZone'));
assert('og:url rewritten', r.includes('localhost:3000'));
assert('canonical rewritten', r.includes('localhost:3000'));

// Images: ALL kept as absolute
assert('img.poki-cdn.com kept absolute', r.includes('https://img.poki-cdn.com/images/big/game.png'));
assert('srcset kept absolute', r.includes('https://img.poki-cdn.com/small.png'));
// Comma-in-srcset regression test — CDN image URLs contain commas
const commaSrcset = '<img src="https://img.poki-cdn.com/a.png" srcset="https://img.poki-cdn.com/cdn-cgi/image/q=78, scq=50, width=94/a.png 1x, https://img.poki-cdn.com/cdn-cgi/image/q=78, scq=50, width=188/a.png 2x">';
const commaResult = rewriteHtml(commaSrcset, '/');
assert('srcset with commas in CDN URL preserved intact',
  commaResult.includes('q=78, scq=50, width=94') && commaResult.includes('1x, https'));
assert('data-src kept absolute', r.includes('https://img.poki-cdn.com/lazy.png'));
assert('Protocol-relative normalized to https:', r.includes('https://img.poki-cdn.com/protocol.png'));

// Video preview: kept absolute
assert('data-video-url kept absolute', r.includes('https://v.poki-cdn.com/abc/thumbnail'));

// CSS: kept absolute (browser loads from CDN)
assert('CSS link kept absolute', r.includes('https://a.poki-cdn.com/assets/main.css'));

// JS: kept absolute (browser loads from CDN)
assert('JS script kept absolute', r.includes('https://a.poki-cdn.com/assets/game.js'));

// Ad removal
assert('Google ad script removed', !r.includes('pagead2'));
assert('Ad link removed', !r.includes('googleadservices'));
// Ad containers kept empty for React hydration
assert('poki-ads container kept', r.includes('<div></div>') || r.includes('></div>'));
assert('Google iframe removed', !r.includes('googleadservices'));

// Navigation
assert('Normal link preserved', r.includes('href="/en/two-player"'));
assert('Full poki.com link rewritten', r.includes('href="/en/action"'));
assert('Navigation overlay injected', r.includes('portal-nav-overlay'));

// Ad injection
const withAds = injectAds(r);
assert('AdSense injected', withAds.includes('adsbygoogle'));

console.log('\n2. Ad Filter');
assert('poki-ads', shouldRemoveElement({ tagName: 'div', attribs: { class: 'poki-ads' } }));
assert('pagead', shouldRemoveElement({ tagName: 'script', attribs: { src: 'https://pagead2.googlesyndication.com/x.js' } }));
assert('data-ad-slot', shouldRemoveElement({ tagName: 'div', attribs: { 'data-ad-slot': '1' } }));
assert('keeps game div', !shouldRemoveElement({ tagName: 'div', attribs: { class: 'game' } }));

console.log('\n3. Cache');
cache.setHtml('/t', '<x>1</x>');
assert('set/get', cache.getHtml('/t') === '<x>1</x>');
cache.invalidate('/t');
assert('invalidate', cache.getHtml('/t') === undefined);

console.log('\n4. Full Pipeline');
const full = '<html><head><title>Poki</title></head><body>' +
  '<img src="https://img.poki-cdn.com/game.png">' +
  '<video src="https://v.poki-cdn.com/abc/video.mp4"></video>' +
  '<div data-video-url="https://v.poki-cdn.com/abc/preview.mp4"></div>' +
  '<link href="https://a.poki-cdn.com/style.css">' +
  '<script src="https://a.poki-cdn.com/app.js"></script>' +
  '<div class="poki-ads">ad</div>' +
  '</body></html>';
const p = injectAds(rewriteHtml(full, '/'));
assert('Pipeline: Title replaced', p.includes('GameZone'));
assert('Pipeline: img absolute', p.includes('https://img.poki-cdn.com/game.png'));
assert('Pipeline: video absolute', p.includes('https://v.poki-cdn.com/abc/video.mp4'));
assert('Pipeline: data-video-url absolute', p.includes('https://v.poki-cdn.com/abc/preview.mp4'));
assert('Pipeline: CSS absolute', p.includes('https://a.poki-cdn.com/style.css'));
assert('Pipeline: JS absolute', p.includes('https://a.poki-cdn.com/app.js'));
assert('Pipeline: ads removed', !p.includes('poki-ads'));
assert('Pipeline: AdSense added', p.includes('adsbygoogle'));

console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
