const fetch = require('node-fetch');

(async () => {
  const r = await fetch('https://poki.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const html = await r.text();
  const jsUrls = html.match(/https:\/\/a\.poki-cdn\.com\/assets\/[^"'\s]+\.js/g) || [];

  console.log('=== JS files known to contain domain logic ===\n');

  for (const url of jsUrls) {
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
      const text = await resp.text();
      const name = url.split('/').pop();

      // Search for domain/hostname location checks
      const patterns = [];

      // window.location.hostname / window.location.host
      const hostPatterns = text.match(/.{0,40}(?:hostname|location\.host|document\.domain).{0,60}(?:poki|===|!==|==).{0,60}/gi) || [];
      hostPatterns.forEach(p => patterns.push({ type: 'HOST_CHECK', text: p }));

      // window.context.site.domain checks
      const siteDomain = text.match(/.{0,60}(?:site\.domain|siteDomain|site_domain).{0,80}/gi) || [];
      siteDomain.forEach(p => patterns.push({ type: 'SITE_DOMAIN', text: p }));

      // "localhost" references (development checks)
      const localhost = text.match(/.{0,80}localhost.{0,80}/gi) || [];
      if (localhost.length) {
        const relevant = localhost.filter(p => p.includes('hostname') || p.includes('location') || p.includes('origin') || p.includes('check') || p.includes('domain'));
        relevant.forEach(p => patterns.push({ type: 'LOCALHOST', text: p }));
      }

      // Check for any "isPoki" or "isPokiDomain" patterns
      const isPoki = text.match(/.{0,30}isPoki.{0,60}/gi) || [];
      isPoki.forEach(p => patterns.push({ type: 'IS_POKI', text: p }));

      if (patterns.length) {
        console.log(`${name}:`);
        patterns.slice(0, 10).forEach(p => console.log(`  [${p.type}] ${p.text.replace(/\n/g, ' ').trim().slice(0, 250)}`));
        console.log();
      }
    } catch {}
  }

  // Also check for any JS that compares hostname with site domain
  console.log('\n=== COMPARISON: hostname vs site.domain ===\n');
  for (const url of jsUrls) {
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
      const text = await resp.text();
      const name = url.split('/').pop();
      const matches = text.match(/.{0,50}(?:hostname|location\.host).{0,50}(?:site\.domain|siteDomain|context\.site).{0,80}/gi) || [];
      if (matches.length) {
        console.log(`${name}:`);
        matches.slice(0, 5).forEach(m => console.log(`  ${m.replace(/\n/g, ' ').trim().slice(0, 300)}`));
        console.log();
      }
    } catch {}
  }

})().catch(e => console.error('FATAL:', e.message));
