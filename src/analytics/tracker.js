const BOTS = [
  { re: /googlebot/i, name: 'Google' },
  { re: /bingbot|bingpreview/i, name: 'Microsoft Bing' },
  { re: /slurp|yahoo/i, name: 'Yahoo' },
  { re: /duckduckbot/i, name: 'DuckDuckGo' },
  { re: /baiduspider/i, name: 'Baidu' },
  { re: /yandexbot/i, name: 'Yandex' },
  { re: /sogou/i, name: 'Sogou' },
  { re: /facebookexternalhit|facebookcatalog/i, name: 'Facebook' },
  { re: /twitterbot/i, name: 'Twitter' },
  { re: /linkedinbot/i, name: 'LinkedIn' },
  { re: /pinterestbot|pinterest/i, name: 'Pinterest' },
  { re: /discordbot/i, name: 'Discord' },
  { re: /slackbot/i, name: 'Slack' },
  { re: /telegrambot/i, name: 'Telegram' },
  { re: /whatsapp/i, name: 'WhatsApp' },
  { re: /applebot/i, name: 'Apple' },
  { re: /semrushbot/i, name: 'SemRush' },
  { re: /ahrefsbot/i, name: 'Ahrefs' },
  { re: /majestic/i, name: 'Majestic' },
  { re: /dotbot/i, name: 'DotBot' },
  { re: /rogerbot/i, name: 'Moz' },
  { re: /exabot/i, name: 'ExaBot' },
  { re: /crawler|spider|bot|scan|fetch/i, name: 'Unknown Bot' },
];

function detectBot(ua) {
  if (!ua) return null;
  for (const b of BOTS) {
    if (b.re.test(ua)) return b.name;
  }
  return null;
}

class LiveTracker {
  constructor() {
    this.sessions = new Map();
    this.TIMEOUT_MS = 12000;
    this._pruneInterval = setInterval(() => this._prune(), 3000);
  }

  track(req) {
    try {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
      const page = req.path || '/';
      const country = req.headers['cf-ipcountry'] || req.headers['x-geo-country'] || 'Unknown';
      const ua = req.headers['user-agent'] || '';
      const device = this._detectDevice(ua);
      const bot = detectBot(ua);

      // Don't track admin
      if (page.startsWith('/admin')) return;

      this.sessions.set(ip, {
        ip,
        page,
        country,
        device,
        bot,
        lastSeen: Date.now(),
      });
    } catch (e) {
      // silently fail
    }
  }

  _detectDevice(ua) {
    if (!ua) return 'Unknown';
    const l = ua.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(l)) return 'Tablet';
    if (/(mobile|iphone|ipod|android.*mobile|blackberry|windows phone)/i.test(l)) return 'Mobile';
    return 'Desktop';
  }

  _prune() {
    const cutoff = Date.now() - this.TIMEOUT_MS;
    for (const [ip, session] of this.sessions) {
      if (session.lastSeen < cutoff) {
        this.sessions.delete(ip);
      }
    }
  }

  getActive() {
    this._prune();
    return Array.from(this.sessions.values()).map(s => ({
      country: s.country,
      page: s.page,
      device: s.device,
      bot: s.bot,
      lastSeen: s.lastSeen,
    }));
  }

  getCount() {
    this._prune();
    return this.sessions.size;
  }
}

module.exports = new LiveTracker();
