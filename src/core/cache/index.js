const NodeCache = require('node-cache');
const config = require('../../config');

const htmlCache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkPeriod,
  useClones: false,
  maxKeys: 5000,
});

const assetCache = new NodeCache({
  stdTTL: 86400,
  checkperiod: 3600,
  useClones: false,
  maxKeys: 50000,
});

let currentSizeBytes = 0;
const MAX_SIZE_BYTES = config.cache.maxCacheSizeMb * 1024 * 1024;

function calcSize(value) {
  if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
  if (Buffer.isBuffer(value)) return value.length;
  if (value && typeof value === 'object') {
    let total = 0;
    for (const v of Object.values(value)) total += calcSize(v);
    return total;
  }
  return 0;
}

function trackSize(key, value, cache) {
  const prev = cache.get(key);
  if (prev) currentSizeBytes -= calcSize(prev);
  const size = calcSize(value);
  currentSizeBytes += size;

  if (currentSizeBytes > MAX_SIZE_BYTES) {
    const keys = cache.keys().slice(0, 50);
    keys.forEach(k => {
      const v = cache.get(k);
      if (v) currentSizeBytes -= calcSize(v);
      cache.del(k);
    });
  }
}

module.exports = {
  getHtml(key) {
    return htmlCache.get(key);
  },

  setHtml(key, value) {
    trackSize(key, value, htmlCache);
    htmlCache.set(key, value);
  },

  getAsset(key) {
    return assetCache.get(key);
  },

  setAsset(key, value, ttl) {
    trackSize(key, value, assetCache);
    assetCache.set(key, value, ttl || 86400);
  },

  invalidate(pattern) {
    htmlCache.keys().filter(k => k.includes(pattern)).forEach(k => htmlCache.del(k));
  },

  getStats() {
    return {
      htmlKeys: htmlCache.getStats().keys,
      htmlHits: htmlCache.getStats().hits,
      htmlMisses: htmlCache.getStats().misses,
      assetKeys: assetCache.getStats().keys,
      sizeBytes: currentSizeBytes,
      sizeMb: (currentSizeBytes / 1024 / 1024).toFixed(2),
    };
  },
};
