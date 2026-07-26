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

    if (path === '/live/stream' || path === '/admin/live/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      tracker.addSSEClient(res);
      const keepAlive = setInterval(() => {
        try { res.write(': keepalive\n\n'); } catch (e) { clearInterval(keepAlive); }
      }, 30000);
      req.on('close', () => {
        clearInterval(keepAlive);
        tracker.removeSSEClient(res);
      });
      return true;
    }

    if (path === '/live' || path === '/admin/live') {
      const stats = tracker.getActiveVisitors();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live Analytics</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
body{background:#0f0f23;color:#e0e0e0;padding:20px}
h1{font-size:24px;margin-bottom:20px;color:#6c5ce7}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.card{background:#1a1a3e;border-radius:12px;padding:20px;border:1px solid #2a2a5e}
.card h3{font-size:12px;text-transform:uppercase;color:#8888aa;margin-bottom:8px;letter-spacing:1px}
.card .num{font-size:32px;font-weight:700;color:#fff}
.panel{background:#1a1a3e;border-radius:12px;padding:20px;border:1px solid #2a2a5e;margin-bottom:16px}
.panel h3{font-size:12px;text-transform:uppercase;color:#8888aa;margin-bottom:12px;letter-spacing:1px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:6px 4px;border-bottom:1px solid #2a2a5e;color:#8888aa;font-size:11px;text-transform:uppercase}
td{padding:6px 4px;border-bottom:1px solid #1a1a3e;font-size:13px}
.bar-wrap{background:#2a2a5e;border-radius:4px;overflow:hidden;display:inline-block;min-width:60px;text-align:right}
.bar-fill{background:#6c5ce7;height:20px;line-height:20px;padding-right:6px;color:#fff;font-size:11px;text-align:right;transition:width .3s}
.badge-d{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#2d3748;color:#a0aec0}
.badge-m{background:#22543d;color:#68d391}
.badge-t{background:#2a4365;color:#63b3ed}
.badge-u{background:#2d3748;color:#a0aec0}
#activity-log{max-height:400px;overflow-y:auto}
.activity-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1a1a3e;font-size:12px;animation:fadeIn .3s;gap:8px}
.activity-row > *{white-space:nowrap}
.activity-time{color:#8888aa;min-width:65px}
.activity-page{color:#6c5ce7;overflow:hidden;text-overflow:ellipsis;max-width:250px;min-width:100px}
.activity-country{min-width:50px}
@keyframes fadeIn{from{opacity:0;background:#2a2a5e}to{opacity:1;background:transparent}}
.header-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.time{font-size:13px;color:#8888aa}
@media(max-width:768px){.cols{grid-template-columns:1fr}.activity-page{max-width:120px}}
</style>
</head>
<body>
<div class="header-bar"><h1>Live Analytics</h1><span class="time" id="clock"></span></div>
<div class="grid">
<div class="card"><h3>Active (5m)</h3><div class="num" id="a-total">0</div></div>
<div class="card"><h3>Unique</h3><div class="num" id="a-unique">0</div></div>
<div class="card"><h3>Pages</h3><div class="num" id="a-pages">0</div></div>
<div class="card"><h3>Countries</h3><div class="num" id="a-countries">0</div></div>
</div>
<div class="cols">
<div class="panel"><h3>Pages</h3><div id="pages-list"></div></div>
<div class="panel"><h3>Countries</h3><div id="countries-list"></div></div>
</div>
<div class="cols">
<div class="panel"><h3>Devices</h3><div id="devices-list"></div></div>
<div class="panel"><h3>Live Activity</h3><div id="activity-log"><p style="color:#8888aa;font-size:13px">Waiting for visitors...</p></div></div>
</div>
<script>
const token = new URLSearchParams(location.search).get('token');
const evtSource = new EventSource(location.pathname + '/stream?token=' + token);
const activityLog = document.getElementById('activity-log');
function flag(c){if(!c||c==='Unknown'||c==='XX')return '';return [...c.toUpperCase()].map(l=>String.fromCodePoint(0x1F1E6+l.charCodeAt(0)-65)).join('')}
function badge(d){const m=(d||'u').toLowerCase();return '<span class="badge-'+m.charAt(0)+'">'+(d||'?')+'</span>'}
function tbl(data,key){if(!data||!data.length)return'<p style="color:#8888aa;font-size:13px">No data</p>';const mx=data[0].count;return'<table><tr><th>Name</th><th style="text-align:right">Count</th></tr>'+data.map(d=>'<tr><td>'+d[key]+'</td><td style="text-align:right"><div class="bar-wrap"><div class="bar-fill" style="width:'+Math.max(8,(d.count/mx)*100)+'%">'+d.count+'</div></div></td></tr>').join('')+'</table>'}
function upd(s){document.getElementById('a-total').textContent=s.total;document.getElementById('a-unique').textContent=s.unique;document.getElementById('a-pages').textContent=s.byPage.length;document.getElementById('a-countries').textContent=s.byCountry.length;document.getElementById('pages-list').innerHTML=tbl(s.byPage,'label');document.getElementById('countries-list').innerHTML=tbl(s.byCountry.map(c=>({...c,label:flag(c.label)+' '+c.label})),'label');document.getElementById('devices-list').innerHTML=tbl(s.byDevice,'label')}
evtSource.onmessage=function(e){const d=JSON.parse(e.data);if(d.type==='init'){upd(d.stats);d.stats.recent.forEach(addRow)}else if(d.type==='new_visit'){upd(d.stats);addRow(d.visit)}}
function addRow(v){const t=new Date(v.timestamp).toLocaleTimeString();const r=document.createElement('div');r.className='activity-row';r.innerHTML='<span class="activity-time">'+t+'</span><span class="activity-page" title="'+v.page+'">'+v.page+'</span><span class="activity-country">'+flag(v.country)+' '+v.country+'</span><span>'+badge(v.device)+'</span>';activityLog.insertBefore(r,activityLog.firstChild);if(activityLog.children.length>100)activityLog.removeChild(activityLog.lastChild);const ph=activityLog.querySelector('p');if(ph)ph.remove()}
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

module.exports = dashboardRouter;
