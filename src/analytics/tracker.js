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

      // Don't track admin
      if (page.startsWith('/admin')) return;

      this.sessions.set(ip, {
        ip,
        page,
        country,
        device,
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
      lastSeen: s.lastSeen,
    }));
  }

  getCount() {
    this._prune();
    return this.sessions.size;
  }
}

module.exports = new LiveTracker();
