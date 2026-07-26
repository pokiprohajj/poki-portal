class AnalyticsTracker {
  constructor() {
    this.visits = [];
    this.sseClients = new Set();
    this.MAX_VISITS = 10000;
    this.WINDOW_MINUTES = 5;
  }

  track(req) {
    try {
      const visit = {
        timestamp: Date.now(),
        page: req.path || '/',
        country: req.headers['cf-ipcountry'] || req.headers['x-geo-country'] || 'Unknown',
        device: this._detectDevice(req.headers['user-agent'] || ''),
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown',
        referer: req.headers['referer'] || '',
        method: req.method,
      };
      this.visits.push(visit);
      this._prune();
      this._broadcast(visit);
    } catch (e) {
      // silently fail — never affect the request
    }
  }

  _detectDevice(ua) {
    if (!ua) return 'Unknown';
    const lua = ua.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(lua)) return 'Tablet';
    if (/(mobile|iphone|ipod|android.*mobile|blackberry|windows phone)/i.test(lua)) return 'Mobile';
    return 'Desktop';
  }

  _prune() {
    const cutoff = Date.now() - this.WINDOW_MINUTES * 60 * 1000;
    this.visits = this.visits.filter(v => v.timestamp > cutoff);
    if (this.visits.length > this.MAX_VISITS) {
      this.visits = this.visits.slice(-this.MAX_VISITS / 2);
    }
  }

  getActiveVisitors(minutes) {
    const m = minutes || this.WINDOW_MINUTES;
    const cutoff = Date.now() - m * 60 * 1000;
    const recent = this.visits.filter(v => v.timestamp > cutoff);
    return {
      total: recent.length,
      unique: new Set(recent.map(v => v.ip)).size,
      byPage: this._groupBy(recent, 'page'),
      byCountry: this._groupBy(recent, 'country'),
      byDevice: this._groupBy(recent, 'device'),
      recent: recent.slice(-50).reverse(),
    };
  }

  _groupBy(arr, key) {
    const result = {};
    arr.forEach(v => {
      const k = v[key] || 'Unknown';
      result[k] = (result[k] || 0) + 1;
    });
    return Object.entries(result)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ label: k, count: v }));
  }

  _broadcast(visit) {
    const stats = this.getActiveVisitors();
    const data = JSON.stringify({ type: 'new_visit', visit, stats });
    for (const client of this.sseClients) {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (e) {
        this.sseClients.delete(client);
      }
    }
  }

  addSSEClient(res) {
    this.sseClients.add(res);
    const stats = this.getActiveVisitors();
    res.write(`data: ${JSON.stringify({ type: 'init', stats })}\n\n`);
  }

  removeSSEClient(res) {
    this.sseClients.delete(res);
  }
}

module.exports = new AnalyticsTracker();
