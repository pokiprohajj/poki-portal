const fetch = require('node-fetch');
(async () => {
  for (const p of ['/en/g/drift-boss', '/en/g/retro-bowl', '/en', '/en/g/subway-surfers', '/en/g/temple-run-2']) {
    try {
      const r = await fetch('https://poki.com' + p, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      const t = await r.text();
      console.log(p, '->', (t.length / 1024 / 1024).toFixed(2) + 'MB', 'status', r.status);
    } catch (e) { console.log(p, 'ERR', e.message); }
  }
})();