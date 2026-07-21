require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  domain: process.env.YOUR_DOMAIN || 'localhost:3000',
  sourceDomain: process.env.SOURCE_DOMAIN || 'poki.com',
  sourceOrigin: `https://${process.env.SOURCE_DOMAIN || 'poki.com'}`,

  ga4Id: process.env.GA4_ID || '',
  searchConsoleVerification: process.env.SEARCH_CONSOLE_VERIFICATION || '',

  ads: {
    adsenseClientId: process.env.ADSENSE_CLIENT_ID || '',
    slotLeaderboard: process.env.ADSENSE_SLOT_LEADERBOARD || '3616266206',
    slotRectangle: process.env.ADSENSE_SLOT_RECTANGLE || '7744193417',
    slotSkyscraper: process.env.ADSENSE_SLOT_SKYSCRAPER || '3025953274',
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD, 10) || 60,
    maxCacheSizeMb: parseInt(process.env.MAX_CACHE_SIZE_MB, 10) || 200,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ],
};

module.exports = config;
