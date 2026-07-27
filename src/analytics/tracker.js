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
    this.TIMEOUT_MS = 15000;
    this._pruneInterval = setInterval(() => this._prune(), 3000);
  }

  _isPagePath(path) {
    if (path.startsWith('/admin') || path.startsWith('/api/') || path.startsWith('/static/') ||
        path.startsWith('/game-proxy/') || path.startsWith('/proxy-media/') || path.startsWith('/wp-content/') ||
        path.startsWith('/estimate/') || path.startsWith('/-/') ||
        path === '/t' || path === '/adserver' || path === '/favicon.ico' || path === '/health' ||
        path === '/ads.txt' || path === '/robots.txt' || path === '/llms.txt' || path === '/sitemap.xml') return false;
    if (path.includes('.')) return false;
    return true;
  }

  _detectCampaign(query) {
    if (!query) return null;
    const p = new URLSearchParams(query);
    if (p.get('fbclid')) return 'facebook_ad';
    const us = p.get('utm_source');
    if (us) {
      const l = us.toLowerCase();
      if (l.includes('facebook') || l.includes('fb') || l.includes('instagram')) return 'facebook_ad';
      if (l.includes('google') || l.includes('search')) return 'google_ad';
      if (l.includes('twitter') || l.includes('x')) return 'twitter';
      if (l.includes('linkedin')) return 'linkedin';
      if (l.includes('tiktok')) return 'tiktok';
      return us.slice(0, 20);
    }
    return null;
  }

  track(req) {
    try {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
      const page = req.path || '/';
      const fullUrl = req.url || '';
      const query = fullUrl.includes('?') ? fullUrl.slice(fullUrl.indexOf('?')) : '';
      const country = req.headers['cf-ipcountry'] || req.headers['x-geo-country'] || 'Unknown';
      const ua = req.headers['user-agent'] || '';
      const device = this._detectDevice(ua);
      const bot = detectBot(ua);
      const referrer = req.headers['referer'] || null;
      const campaign = this._detectCampaign(query);

      const existing = this.sessions.get(ip);

      // Always update lastSeen for active sessions
      if (existing) {
        existing.country = country;
        existing.device = device;
        existing.bot = bot;
        existing.lastSeen = Date.now();
      }

      if (!this._isPagePath(page)) return;

      const visited = existing ? existing.visited : new Set();
      const views = existing ? existing.views + 1 : 1;
      visited.add(page);

      this.sessions.set(ip, {
        ip,
        page,
        country,
        device,
        bot,
        referrer,
        campaign,
        visited,
        views,
        lastSeen: Date.now(),
      });
    } catch (e) {
      // silently fail
    }
  }

  trackPage(id, page, country, device, bot, referrer, campaign, ip) {
    // If this is a new beacon session and there's an IP-keyed session, merge it to avoid duplicates
    const existing = this.sessions.get(id);
    if (!existing && ip && this.sessions.has(ip)) {
      const ipSession = this.sessions.get(ip);
      country = country || ipSession.country;
      device = device || ipSession.device;
      bot = bot || ipSession.bot;
      referrer = referrer || ipSession.referrer;
      campaign = campaign || ipSession.campaign;
      this.sessions.delete(ip);
    }
    const session = this.sessions.get(id);
    if (session) {
      session.page = page;
      if (country && session.country === 'Unknown') session.country = country;
      if (device && session.device === 'Unknown') session.device = device;
      if (campaign && !session.campaign) session.campaign = campaign;
      session.visited.add(page);
      session.views++;
      session.lastSeen = Date.now();
    } else {
      this.sessions.set(id, {
        ip: id,
        page,
        country: country || 'Unknown',
        device: device || 'Unknown',
        bot: bot || null,
        referrer: referrer || null,
        campaign: campaign || null,
        visited: new Set([page]),
        views: 1,
        lastSeen: Date.now(),
      });
    }
  }

  untrack(id) {
    this.sessions.delete(id);
  }

  ping(id) {
    const s = this.sessions.get(id);
    if (s) s.lastSeen = Date.now();
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
    for (const [id, session] of this.sessions) {
      if (session.lastSeen < cutoff) {
        this.sessions.delete(id);
      }
    }
  }

  getActive() {
    this._prune();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastSeen - a.lastSeen).map(s => ({
      id: s.ip,
      country: s.country,
      page: s.page,
      device: s.device,
      bot: s.bot,
      referrer: s.referrer,
      campaign: s.campaign,
      views: s.views,
      pages: s.visited.size,
      lastSeen: s.lastSeen,
    }));
  }

  getCount() {
    this._prune();
    return this.sessions.size;
  }
}

module.exports = Object.assign(new LiveTracker(), { detectBot });
