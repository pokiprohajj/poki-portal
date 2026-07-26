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
      const stats = tracker.getActiveVisitors();
      const recent = tracker.visits ? tracker.visits.slice(-15).reverse() : [];
      res.writeHead(200, { 'Content-Type': 'application/json', ...noCache });
      res.end(JSON.stringify({ stats, recent }));
      return true;
    }

    if (path === '/live' || path === '/admin/live') {
      const stats = tracker.getActiveVisitors();
      const recent = tracker.visits ? tracker.visits.slice(-15).reverse() : [];
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
.container{width:100%;max-width:900px;padding:20px}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}
.top h1{font-size:20px;color:#6c5ce7;font-weight:700}
.top .clock{color:#666;font-size:14px;font-family:monospace}
.counter-row{display:flex;gap:20px;margin-bottom:30px}
.counter{background:linear-gradient(135deg,#1a1a3e,#151530);border-radius:16px;padding:24px;flex:1;text-align:center;border:1px solid #2a2a5e}
.counter .label{font-size:11px;text-transform:uppercase;color:#666;letter-spacing:1px;margin-bottom:6px}
.counter .num{font-size:42px;font-weight:800;color:#fff;line-height:1}
.counter .num.pulse{animation:pulse 1s ease-in-out}
@keyframes pulse{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}
.section{margin-bottom:24px}
.section h2{font-size:13px;text-transform:uppercase;color:#666;letter-spacing:1px;margin-bottom:12px}
.list{display:flex;flex-wrap:wrap;gap:6px}
.tag{background:#1a1a3e;border:1px solid #2a2a5e;border-radius:20px;padding:4px 14px;font-size:13px;display:flex;align-items:center;gap:6px}
.tag .count{color:#6c5ce7;font-weight:700;font-size:11px}
.live-stream{background:#1a1a3e;border-radius:12px;border:1px solid #2a2a5e;padding:16px;height:320px;overflow-y:auto}
.live-stream::-webkit-scrollbar{width:4px}
.live-stream::-webkit-scrollbar-thumb{background:#2a2a5e;border-radius:2px}
.entry{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #1a1a3e;font-size:13px;animation:slideIn .2s}
@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.entry:last-child{border-bottom:none}
.entry .time{color:#555;font-family:monospace;font-size:11px;min-width:60px}
.entry .page{color:#6c5ce7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;flex:1}
.entry .flag{min-width:24px}
.entry .device{font-size:11px;padding:2px 8px;border-radius:10px;min-width:50px;text-align:center}
.dev-d{background:#1e293b;color:#94a3b8}
.dev-m{background:#064e3b;color:#6ee7b7}
.dev-t{background:#1e3a5f;color:#7dd3fc}
.empty-state{color:#444;text-align:center;padding:60px 20px;font-size:14px}
.empty-state .big{font-size:48px;margin-bottom:12px}
</style>
</head>
<body>
<div class="container">
<div class="top"><h1>Live View</h1><span class="clock" id="clock"></span></div>
<div class="counter-row">
<div class="counter"><div class="label">Active Now</div><div class="num" id="c-total">${stats.total}</div></div>
<div class="counter"><div class="label">Unique</div><div class="num" id="c-unique">${stats.unique}</div></div>
<div class="counter"><div class="label">Pages</div><div class="num" id="c-pages">${stats.byPage.length}</div></div>
<div class="counter"><div class="label">Countries</div><div class="num" id="c-countries">${stats.byCountry.length}</div></div>
</div>
<div class="section"><h2>Pages</h2><div class="list" id="pages-list">${stats.byPage.slice(0,12).map(p => `<span class="tag">${p.label} <span class="count">${p.count}</span></span>`).join('')}</div></div>
<div class="section"><h2>Countries</h2><div class="list" id="countries-list">${stats.byCountry.map(c => `<span class="tag">${flagEmoji(c.label)} ${c.label} <span class="count">${c.count}</span></span>`).join('')}</div></div>
<div class="section"><h2>Live Stream</h2><div class="live-stream" id="stream">${recent.length === 0 ? '<div class="empty-state"><div class="big">👀</div>Waiting for visitors...</div>' : recent.map(v => entryHtml(v)).join('')}</div></div>
</div>
<script>
const TOKEN=${JSON.stringify(token)};
const BASE=location.pathname.replace(/\\/+$/,'');
let known=new Set();
function f(c){if(!c||c==='Unknown'||c==='XX')return '';return[...c.toUpperCase()].map(l=>String.fromCodePoint(0x1F1E6+l.charCodeAt(0)-65)).join('')}
function poll(){fetch(BASE+'/stats?token='+TOKEN,{cache:'no-store'}).then(r=>r.json()).then(d=>{upd(d.stats);d.recent.forEach(v=>{if(!known.has(v.timestamp)){known.add(v.timestamp);addEntry(v)}})}).catch(()=>{})}
function upd(s){['total','unique','pages','countries'].forEach(k=>{const el=document.getElementById('c-'+k);if(el&&el.textContent!=String(s[k==='pages'?'byPage.length':k==='countries'?'byCountry.length':k])){el.textContent=s[k==='pages'?'byPage.length':k==='countries'?'byCountry.length':k];el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse')}});const pl=document.getElementById('pages-list');if(pl)pl.innerHTML=s.byPage.slice(0,12).map(p=>'<span class="tag">'+p.label+' <span class="count">'+p.count+'</span></span>').join('');const cl=document.getElementById('countries-list');if(cl)cl.innerHTML=s.byCountry.map(c=>'<span class="tag">'+f(c.label)+' '+c.label+' <span class="count">'+c.count+'</span></span>').join('')}
function addEntry(v){const st=document.getElementById('stream');const d=document.createElement('div');d.className='entry';d.innerHTML='<span class="time">'+new Date(v.timestamp).toLocaleTimeString()+'</span><span class="page" title="'+v.page+'">'+v.page+'</span><span class="flag">'+f(v.country)+' '+v.country+'</span><span class="device dev-'+((v.device||'u').toLowerCase().charAt(0))+'">'+(v.device||'?')+'</span>';const e=st.querySelector('.empty-state');if(e)e.remove();st.insertBefore(d,st.firstChild);while(st.children.length>60)st.removeChild(st.lastChild)}
poll();setInterval(poll,2000)
function clock(){document.getElementById('clock').textContent=new Date().toLocaleString()}
clock();setInterval(clock,1000)
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

function entryHtml(v) {
  return '<div class="entry"><span class="time">' + new Date(v.timestamp).toLocaleTimeString() + '</span><span class="page" title="' + v.page + '">' + v.page + '</span><span class="flag">' + flagEmoji(v.country) + ' ' + v.country + '</span><span class="device dev-' + (v.device || 'u').toLowerCase().charAt(0) + '">' + (v.device || '?') + '</span></div>';
}

module.exports = dashboardRouter;
