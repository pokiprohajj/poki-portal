const pokiImport = require('./posts/poki-import');
const original = require('./posts/original');
const tips = require('./posts/tips');
const lists = require('./posts/lists');
const comparisons = require('./posts/comparisons');
const evergreen = require('./posts/evergreen');
const challenges = require('./posts/challenges');
const bulk = require('./posts/bulk');
const bulk2 = require('./posts/bulk2');
const bulk3 = require('./posts/bulk3');
const bulk4 = require('./posts/bulk4');
const bulk5 = require('./posts/bulk5');
const bulk6 = require('./posts/bulk6');
const pillar = require('./posts/pillar');
const bulk7 = require('./posts/bulk7');
const bulk7Extra = require('./posts/bulk7-extra');
const seo1 = require('./posts/seo1');
const seo2 = require('./posts/seo2');
const seo3 = require('./posts/seo3');
const seo4 = require('./posts/seo4');
const seo5 = require('./posts/seo5');
const seo6 = require('./posts/seo6');

const all = [].concat(pokiImport, original, tips, lists, comparisons, evergreen, challenges, bulk, bulk2, bulk3, bulk4, bulk5, bulk6, pillar, bulk7, bulk7Extra, seo1, seo2, seo3, seo4, seo5, seo6);

// Deduplicate by slug — keep first occurrence, drop later duplicates.
// Duplicate slugs waste crawl budget and create sitemap/canonical confusion.
const seen = new Set();
const deduped = [];
for (const p of all) {
  if (seen.has(p.slug)) continue;
  seen.add(p.slug);
  deduped.push(p);
}

module.exports = deduped;
