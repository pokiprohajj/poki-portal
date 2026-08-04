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

// Evict enough keys (oldest first) to drop current size back under the cap.
function enforceSizeLimit() {
  if (currentSizeBytes <= MAX_SIZE_BYTES) return;
  // Evict oldest keys across both caches until we're under the limit
  const htmlKeys = htmlCache.keys();
  const assetKeys = assetCache.keys();
  let guard = 0;
  while (currentSizeBytes > MAX_SIZE_BYTES && (htmlKeys.length || assetKeys.length) && guard++ < 2000) {
    if (htmlKeys.length) {
      const k = htmlKeys.shift();
      const v = htmlCache.get(k);
      if (v !== undefined) currentSizeBytes -= calcSize(v);
      htmlCache.del(k);
    }
    if (assetKeys.length) {
      const k = assetKeys.shift();
      const v = assetCache.get(k);
      if (v !== undefined) currentSizeBytes -= calcSize(v);
      assetCache.del(k);
    }
  }
}

function trackSize(key, value, cache) {
  const prev = cache.get(key);
  if (prev) currentSizeBytes -= calcSize(prev);
  const size = calcSize(value);
  currentSizeBytes += size;

  enforceSizeLimit();
}

// Memory-pressure watchdog: if the Node process RSS approaches the container
// limit, aggressively flush caches to avoid Railway OOM crashes. Checks every
// 5s (fast enough to react to traffic bursts). Threshold defaults to ~60% of
// 512MB (Railway hobby) unless overridden.
const MEMORY_THRESHOLD_BYTES = parseInt(process.env.MEMORY_THRESHOLD_MB, 10) || 300; // ~0.6 * 512MB

function flushAll() {
  const hk = htmlCache.keys();
  hk.forEach(k => htmlCache.del(k));
  const ak = assetCache.keys();
  ak.forEach(k => assetCache.del(k));
  currentSizeBytes = 0;
}

let watchdogStarted = false;
function startWatchdog() {
  if (watchdogStarted) return;
  watchdogStarted = true;
  setInterval(() => {
    try {
      const rssMb = process.memoryUsage().rss / 1024 / 1024;
      const heapMb = process.memoryUsage().heapUsed / 1024 / 1024;
      const heapTotal = process.memoryUsage().heapTotal / 1024 / 1024;
      const externMb = process.memoryUsage().external / 1024 / 1024;
      // Log every ~60s to build a memory profile in production logs
      const now = Math.floor(Date.now() / 1000);
      if (!global.__memLogLast || now - global.__memLogLast >= 60) {
        global.__memLogLast = now;
        console.log(`[MEM] rss=${rssMb.toFixed(0)}MB heap=${heapMb.toFixed(0)}/${heapTotal.toFixed(0)} external=${externMb.toFixed(0)} cache=${(currentSizeBytes / 1024 / 1024).toFixed(1)}MB`);
      }
      if (rssMb > MEMORY_THRESHOLD_BYTES) {
        console.log(`[MEMORY] RSS ${rssMb.toFixed(0)}MB > threshold ${MEMORY_THRESHOLD_BYTES}MB — flushing caches`);
        flushAll();
        if (global.gc) {
          try { global.gc(); } catch (e) {}
        }
      }
    } catch (e) {}
  }, 5000);
}
startWatchdog();

// NodeCache deletes keys on TTL expiry but doesn't report it — our manual byte
// counter would drift upward forever and never reclaim. Recompute periodically.
setInterval(() => {
  let total = 0;
  for (const k of htmlCache.keys()) {
    const v = htmlCache.get(k);
    if (v !== undefined) total += calcSize(v);
  }
  for (const k of assetCache.keys()) {
    const v = assetCache.get(k);
    if (v !== undefined) total += calcSize(v);
  }
  currentSizeBytes = total;
  enforceSizeLimit();
}, 60000);

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

  flush() {
    flushAll();
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
