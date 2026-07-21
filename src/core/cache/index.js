const NodeCache = require('node-cache');
const config = require('../../config');

const htmlCache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkPeriod,
  useClones: false,
  maxKeys: 500,
});

const assetCache = new NodeCache({
  stdTTL: 86400,
  checkperiod: 3600,
  useClones: false,
  maxKeys: 2000,
});

let currentSizeBytes = 0;
const MAX_SIZE_BYTES = config.cache.maxCacheSizeMb * 1024 * 1024;

function trackSize(key, value, cache) {
  const prev = cache.get(key);
  if (prev) {
    currentSizeBytes -= (typeof prev === 'string' ? Buffer.byteLength(prev, 'utf8') : 0);
  }
  const size = typeof value === 'string' ? Buffer.byteLength(value, 'utf8') : 0;
  currentSizeBytes += size;

  if (currentSizeBytes > MAX_SIZE_BYTES) {
    const keys = cache.keys().slice(0, 50);
    keys.forEach(k => {
      const v = cache.get(k);
      if (v) currentSizeBytes -= Buffer.byteLength(v, 'utf8');
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
