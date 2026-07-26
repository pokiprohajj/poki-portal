const tracker = require('./tracker');

const AUTH_TOKEN = process.env.ANALYTICS_TOKEN || 'admin123';

function dashboardRouter(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const token = url.searchParams.get('token');

    if (token !== AUTH_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return true;
    }

    const noCache = { 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0' };

    if (path === '/live/stats' || path === '/admin/live/stats') {
      const visitors = tracker.getActive();
      const count = tracker.getCount();
      res.writeHead(200, { 'Content-Type': 'application/json', ...noCache });
      res.end(JSON.stringify({ count, visitors }));
      return true;
    }

    if (path === '/live' || path === '/admin/live') {
      const visitors = tracker.getActive();
      const count = tracker.getCount();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...noCache });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live View — BrowserGamesHQ</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
body{background:#0a0a1a;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center}
.container{width:100%;max-width:800px;padding:24px}
h1{font-size:22px;color:#6c5ce7;margin-bottom:6px}
.sub{color:#666;font-size:13px;margin-bottom:24px}
.count{font-size:48px;font-weight:800;margin-bottom:24px}
.count span{color:#6c5ce7}
.list{display:flex;flex-direction:column;gap:6px}
.person{display:flex;align-items:center;gap:12px;background:#15152e;border:1px solid #2a2a5e;border-radius:10px;padding:12px 16px;animation:slideIn .3s}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.person .flag{font-size:20px;min-width:30px}
.person .country{font-size:14px;font-weight:600;min-width:40px}
.person .page a{color:#6c5ce7;text-decoration:none}
.person .page a:hover{text-decoration:underline;color:#8b7cf7}
.person .views{font-size:11px;color:#8888aa;min-width:50px;text-align:center;white-space:nowrap}
.person .ref{font-size:11px;padding:2px 8px;border-radius:12px;white-space:nowrap;max-width:100px;overflow:hidden;text-overflow:ellipsis}
.ref-search{background:#1e3a1e;color:#7ddc7d}.ref-social{background:#3a1e3a;color:#dc7ddc}.ref-direct{background:#1e1e3a;color:#7d7ddc}.ref-other{background:#2a2a1e;color:#dcdc7d}
.person .device{font-size:11px;padding:2px 10px;border-radius:12px;min-width:50px;text-align:center}
.d{background:#1e293b;color:#94a3b8}
.m{background:#064e3b;color:#6ee7b7}
.t{background:#1e3a5f;color:#7dd3fc}
.u{background:#1e293b;color:#666}
.bot-badge{font-size:11px;padding:2px 10px;border-radius:12px;white-space:nowrap}
.bot-yes{background:#3b0a0a;color:#f87171;border:1px solid #7f1d1d}
.bot-no{background:#0a3b1a;color:#6ee7b7;border:1px solid #1a4a2a}
.empty{color:#444;text-align:center;padding:60px 20px;font-size:14px}
.empty .big{font-size:48px;margin-bottom:12px}
.removing{animation:fadeOut .3s forwards}
@keyframes fadeOut{to{opacity:0;transform:translateY(8px)}}
</style>
</head>
<body>
<div class="container">
<h1>Live View</h1>
<div class="sub">People on your site right now</div>
<div class="count"><span id="count">${count}</span></div>
<div class="list" id="list">${count === 0 ? '<div class="empty"><div class="big">👀</div>Waiting for visitors...</div>' : visitors.map(v => personHtml(v)).join('')}</div>
</div>
<script>
const TOKEN=${JSON.stringify(token)};
const BASE=location.pathname.replace(/\\/+$/,'');
let currentIds=new Set();
function f(c){if(!c||c==='Unknown'||c==='XX')return '';return[...c.toUpperCase()].map(l=>String.fromCodePoint(0x1F1E6+l.charCodeAt(0)-65)).join('')}
function poll(){fetch(BASE+'/stats?token='+TOKEN,{cache:'no-store'}).then(r=>r.json()).then(d=>{render(d)}).catch(()=>{})}
function pLink(p){return'&nbsp;<a href="https://browsergameshq.com'+p+'" target="_blank" rel="noopener">'+p+'</a>'}
function s(r){if(!r)return'<span class="ref ref-direct">Direct</span>';var l=r.toLowerCase();if(l.includes('google'))return'<span class="ref ref-search">Google</span>';if(l.includes('bing'))return'<span class="ref ref-search">Bing</span>';if(l.includes('yahoo'))return'<span class="ref ref-search">Yahoo</span>';if(l.includes('duckduckgo'))return'<span class="ref ref-search">DuckDuckGo</span>';if(l.includes('yandex'))return'<span class="ref ref-search">Yandex</span>';if(l.includes('baidu'))return'<span class="ref ref-search">Baidu</span>';if(l.includes('facebook')||l.includes('fb.com'))return'<span class="ref ref-social">Facebook</span>';if(l.includes('instagram'))return'<span class="ref ref-social">Instagram</span>';if(l.includes('twitter')||l.includes('x.com'))return'<span class="ref ref-social">Twitter</span>';if(l.includes('linkedin'))return'<span class="ref ref-social">LinkedIn</span>';if(l.includes('pinterest'))return'<span class="ref ref-social">Pinterest</span>';if(l.includes('reddit'))return'<span class="ref ref-social">Reddit</span>';if(l.includes('discord'))return'<span class="ref ref-social">Discord</span>';if(l.includes('telegram'))return'<span class="ref ref-social">Telegram</span>';if(l.includes('whatsapp'))return'<span class="ref ref-social">WhatsApp</span>';if(l.includes('tiktok'))return'<span class="ref ref-social">TikTok</span>';if(l.includes('youtube'))return'<span class="ref ref-social">YouTube</span>';if(l.includes('browsergameshq.com'))return'';try{var h=new URL(r).hostname.replace(/^www\./,'').slice(0,12);return'<span class="ref ref-other" title="'+r.replace(/"/g,'&quot;')+'">'+h+'</span>'}catch(e){return''}}
function render(d){const list=document.getElementById('list');const countEl=document.getElementById('count');countEl.textContent=d.count;const empty=list.querySelector('.empty');if(empty&&d.count>0)empty.remove();const lookup={};list.querySelectorAll('.person').forEach(el=>{lookup[el.dataset.id]=el});const seen=new Set();d.visitors.forEach(v=>{seen.add(v.id);const el=lookup[v.id];if(el){const oldPage=el.querySelector('.page a')||el.querySelector('.page');if(oldPage&&oldPage.innerHTML!==pLink(v.page)){el.querySelector('.page').innerHTML=pLink(v.page);el.querySelector('.page').title=v.page}const oldViews=el.querySelector('.views');if(oldViews)oldViews.textContent=(v.views||1)+' pg'}else{const div=document.createElement('div');div.className='person';div.dataset.id=v.id;div.innerHTML='<span class="flag">'+f(v.country)+'</span><span class="country">'+v.country+'</span><span class="page" title="'+v.page+'">'+pLink(v.page)+'</span><span class="views">'+(v.views||1)+' pg</span><span class="device '+((v.device||'u').toLowerCase().charAt(0))+'">'+(v.device||'?')+'</span>'+s(v.referrer)+'<span class="bot-badge '+(v.bot?'bot-yes':'bot-no')+'">'+(v.bot?'🤖 '+v.bot:'👤 Human')+'</span>';list.appendChild(div)}});Object.keys(lookup).forEach(id=>{if(!seen.has(id)){const el=lookup[id];el.classList.add('removing');setTimeout(()=>{if(el.parentNode)el.remove()},300)}})}
poll();setInterval(poll,2000)
</script>
</body>
</html>`);
      return true;
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal error');
    return true;
  }
  return false;
}

function flagEmoji(code) {
  if (!code || code === 'Unknown' || code === 'XX') return '';
  return [...code.toUpperCase()].map(l => String.fromCodePoint(0x1F1E6 + l.charCodeAt(0) - 65)).join('');
}

function pageHtml(path) {
  return '&nbsp;<a href="https://browsergameshq.com' + path + '" target="_blank" rel="noopener">' + path + '</a>';
}

function sourceLabel(r) {
  if (!r) return '<span class="ref ref-direct">Direct</span>';
  const l = r.toLowerCase();
  if (l.includes('google')) return '<span class="ref ref-search">Google</span>';
  if (l.includes('bing')) return '<span class="ref ref-search">Bing</span>';
  if (l.includes('yahoo')) return '<span class="ref ref-search">Yahoo</span>';
  if (l.includes('duckduckgo')) return '<span class="ref ref-search">DuckDuckGo</span>';
  if (l.includes('yandex')) return '<span class="ref ref-search">Yandex</span>';
  if (l.includes('baidu')) return '<span class="ref ref-search">Baidu</span>';
  if (l.includes('facebook') || l.includes('fb.com')) return '<span class="ref ref-social">Facebook</span>';
  if (l.includes('instagram')) return '<span class="ref ref-social">Instagram</span>';
  if (l.includes('twitter') || l.includes('x.com')) return '<span class="ref ref-social">Twitter</span>';
  if (l.includes('linkedin')) return '<span class="ref ref-social">LinkedIn</span>';
  if (l.includes('pinterest')) return '<span class="ref ref-social">Pinterest</span>';
  if (l.includes('reddit')) return '<span class="ref ref-social">Reddit</span>';
  if (l.includes('discord')) return '<span class="ref ref-social">Discord</span>';
  if (l.includes('telegram')) return '<span class="ref ref-social">Telegram</span>';
  if (l.includes('whatsapp')) return '<span class="ref ref-social">WhatsApp</span>';
  if (l.includes('tiktok')) return '<span class="ref ref-social">TikTok</span>';
  if (l.includes('youtube')) return '<span class="ref ref-social">YouTube</span>';
  if (l.includes('browsergameshq.com')) return '';
  return '<span class="ref ref-other" title="' + r.replace(/"/g,'&quot;') + '">' + new URL(r).hostname.replace(/^www\./, '').slice(0, 12) + '</span>';
}

function personHtml(v) {
  const d = (v.device || 'u').toLowerCase().charAt(0);
  const bot = v.bot;
  return '<div class="person" data-id="' + v.id + '"><span class="flag">' + flagEmoji(v.country) + '</span><span class="country">' + v.country + '</span><span class="page" title="' + v.page + '">' + pageHtml(v.page) + '</span><span class="views">' + (v.views || 1) + ' pg</span><span class="device ' + d + '">' + (v.device || '?') + '</span>' + sourceLabel(v.referrer) + '<span class="bot-badge ' + (bot ? 'bot-yes' : 'bot-no') + '">' + (bot ? '🤖 ' + bot : '👤 Human') + '</span></div>';
}

module.exports = dashboardRouter;
