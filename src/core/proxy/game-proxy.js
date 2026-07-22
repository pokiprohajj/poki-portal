const express = require('express');
const fetch = require('node-fetch');
const config = require('../../config');
const cache = require('../cache');

const router = express.Router();

const GAME_ORIGIN = 'https://games.poki.com';

// Game URL mapping: replace broken Poki embeds with working mirrors
// Key is the game slug (matched from URL path), value is the mirror URL
const GAME_MIRRORS = {
  'subway-surfers': 'https://web.archive.org/web/20260410095301if_/https://ubg77.github.io/updatefaqs/subway-surfers-winter-holiday/',
};

var GAME_INTERCEPTOR = `<script>(function(){
try{var dr=Object.getOwnPropertyDescriptor(Document.prototype,'referrer');
if(dr&&dr.configurable){Object.defineProperty(Document.prototype,'referrer',
{get:function(){return'https://poki.com/'}})}
var st=document.createElement('style');
st.textContent='.poki-ad-slot,.poki-ad-slot *,[data-poki-ad-size]{display:none!important;visibility:hidden!important;height:0!important;width:0!important;overflow:hidden!important;position:absolute!important;top:-9999px!important;left:-9999px!important}';
document.head.appendChild(st);
var clientId='ca-pub-7128312414229788';
var adSizes=[{slot:'3616266206',w:728,h:90,match:'728x90'},{slot:'7744193417',w:300,h:250,match:'300x250'},{slot:'3025953274',w:160,h:600,match:'160x600'}];
function loadAds(){
if(window._adsLoaded)return;window._adsLoaded=true;
var s=document.createElement('script');
s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+clientId;
s.crossOrigin='anonymous';s.async=true;document.head.appendChild(s)}
function nukeAndReplace(){
loadAds();
var targets=document.querySelectorAll('.poki-ad-slot,[data-poki-ad-size]');
for(var i=0;i<targets.length;i++){
var t=targets[i];
if(t.querySelector&&t.querySelector('ins.adsbygoogle'))continue;
var sizeAttr=t.getAttribute('data-poki-ad-size')||'';
var size=adSizes.find(function(s){return s.match===sizeAttr});
if(!size)continue;
var container=document.createElement('div');
container.style.cssText='width:'+size.w+'px;height:'+size.h+'px;overflow:hidden;';
var ins=document.createElement('ins');ins.className='adsbygoogle';
ins.style.display='inline-block';ins.style.width=size.w+'px';ins.style.height=size.h+'px';
ins.setAttribute('data-ad-client',clientId);ins.setAttribute('data-ad-slot',size.slot);
container.appendChild(ins);
t.parentNode.replaceChild(container,t);
try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}}
nukeAndReplace();
var mo=new MutationObserver(function(ms){
for(var i=0;i<ms.length;i++){var added=ms[i].addedNodes;
for(var j=0;j<added.length;j++){var n=added[j];
if(n.nodeType!==1)continue;
if((n.classList&&(n.classList.contains('poki-ad-slot')||n.hasAttribute&&n.hasAttribute('data-poki-ad-size')))||
(n.querySelectorAll&&(n.querySelectorAll('.poki-ad-slot,[data-poki-ad-size]').length>0))){
nukeAndReplace();break}}}});
mo.observe(document.documentElement||document.body,{childList:true,subtree:true});
setInterval(nukeAndReplace,1000)}
catch(e){}
var gp="games.poki.com";
var gdp=["gdn.poki.com","poki-gdn.com","game-cdn.poki.com","api.poki.com","devs-api.poki.com","a.poki.com","ay.delivery","poki-auth.poki.com","user-vault.poki.com","t.poki.io","poki.io","poki-cdn.com","ads.poki.com","ads.poki-cdn.com","i.poki-cdn.com","v.poki-cdn.com"];
var pp="/game-proxy/gdn-proxy/";
function rw(u){if(!u||typeof u!=="string")return u;
if(u.indexOf("/game-proxy/")===0)return u;
if(u.indexOf("browsergameshq.com")!==-1)return u;
for(var i=0;i<gdp.length;i++){if(u.indexOf(gdp[i])!==-1)
return pp+u.replace(/https?:\\/\\//,"").replace(/^\\/\\//,"")}
if(u.indexOf(gp)!==-1)return u.replace(/https?:\\/\\/games\\.poki\\.com/,"/game-proxy");
// Broad catch-all: any poki.* domain not caught above
if(u.match(/https?:\\/\\/[^\\/]*poki\\.(com|io|cdn\\.com)/)){
return pp+u.replace(/https?:\\/\\//,"").replace(/^\\/\\//,"")}
return u}
var _og=window.open;window.open=function(u){
if(u&&typeof u==="string"&&rw(u)!==u)return _og.call(window,rw(u));
return _og.apply(window,arguments)};
if(Location.prototype){
var _la=Object.getOwnPropertyDescriptor(Location.prototype,"href");
if(_la&&_la.set){Object.defineProperty(Location.prototype,"href",{get:_la.get,
set:function(v){if(typeof v==="string"){var r=rw(v);if(r!==v){return _la.set.call(this,r)}}return _la.set.call(this,v)},
configurable:true})}
if(Location.prototype&&Location.prototype.assign){
var _lAssign=Location.prototype.assign;
Location.prototype.assign=function(u){if(typeof u==="string"){var r=rw(u);if(r!==u)return _lAssign.call(this,r)}return _lAssign.apply(this,arguments)}}
if(Location.prototype&&Location.prototype.replace){
var _lReplace=Location.prototype.replace;
Location.prototype.replace=function(u){if(typeof u==="string"){var r=rw(u);if(r!==u)return _lReplace.call(this,r)}return _lReplace.apply(this,arguments)}}
if(typeof History.prototype!=="undefined"){
var _ps=History.prototype.pushState;
if(_ps){History.prototype.pushState=function(s,t,u){if(typeof u==="string"){var r=rw(u);if(r!==u)u=r}return _ps.apply(this,arguments)}}
var _rs=History.prototype.replaceState;
if(_rs){History.prototype.replaceState=function(s,t,u){if(typeof u==="string"){var r=rw(u);if(r!==u)u=r}return _rs.apply(this,arguments)}}}
var _pokiUrlRe=/https?:\\/\\/[^\\/]*poki\\.(com|io|cdn\\.com)[^\\s"']*/g;
var _pokiUrlReProto=/\\/\\/[^\\/]*poki\\.(com|io|cdn\\.com)[^\\s"']*/g;
var of=window.fetch;window.fetch=function(u,o){
var url=typeof u==="string"?u:u&&u.url;
if(url&&url.indexOf("devs-api.poki.com/gameinfo/@sdk")!==-1)
return Promise.resolve(new Response(
'{"game_id":"temple-run-2","game_name":"Temple Run 2","cached_content_game_id":"temple-run-2","playtest_record":0,"playtest_version":0,"playtest_device_category":"","playtest_new_user":false,"playtest_request_id":"","ad_settings":{"preroll":0,"time_per_try":30,"time_between_ads":60,"start_ads_after":30,"special_conditions":{}}}',
{status:200,headers:{"Content-Type":"application/json"}}));
if(url&&url.indexOf("user-vault.poki.com")!==-1)
return Promise.resolve(new Response(
'{"id":"","name":""}',
{status:200,headers:{"Content-Type":"application/json"}}));
if(url&&(url.indexOf("ads.poki-cdn.com")!==-1||url.indexOf("ads.poki.com")!==-1))
return Promise.resolve(new Response('',{status:200,headers:{"Content-Type":"text/plain"}}));
if(url&&url.indexOf("poki.")!==-1)return Promise.resolve(new Response('',{status:200,headers:{"Content-Type":"text/plain"}}));
if(url){var rw2=rw(url);if(rw2&&rw2!==url)return of(rw2,o)}
return of(u,o)};
var ox=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(m,u,a){
if(u&&typeof u==="string"){var r=rw(u);if(r!==u)arguments[1]=r}
return ox.apply(this,arguments)};
// Intercept EventSource (SSE)
var _es=window.EventSource;
if(_es){window.EventSource=function(url,config){
if(typeof url==="string"&&rw(url)!==url)url=rw(url);
return config?new _es(url,config):new _es(url)};window.EventSource.prototype=_es.prototype}
// Intercept WebSocket
var _ws=window.WebSocket;
if(_ws){window.WebSocket=function(url,protocols){
if(typeof url==="string"&&rw(url)!==url)url=rw(url);
return protocols?new _ws(url,protocols):new _ws(url)};window.WebSocket.prototype=_ws.prototype}
// Intercept Web Worker
var _wk=window.Worker;
if(_wk){window.Worker=function(url,config){
if(typeof url==="string"&&rw(url)!==url)url=rw(url);
return config?new _wk(url,config):new _wk(url)};window.Worker.prototype=_wk.prototype}
function op(p,pr){var d=Object.getOwnPropertyDescriptor(p,pr);
if(d&&d.set){Object.defineProperty(p,pr,{get:d.get,
set:function(v){return d.set.call(this,rw(v)||v)},configurable:true})}}
op(HTMLScriptElement.prototype,"src");
op(HTMLIFrameElement.prototype,"src");
op(HTMLImageElement.prototype,"src");
op(HTMLSourceElement.prototype,"src");
op(HTMLLinkElement.prototype,"href");
op(HTMLAnchorElement.prototype,"href");
var _dc=document.createElement;
document.createElement=function(t){
var el=_dc.apply(this,arguments);
if(el&&(t==="IFRAME"||t==="SCRIPT"||t==="IMG"||t==="A")){
var pd=Object.getOwnPropertyDescriptor(t==="A"?HTMLAnchorElement.prototype:
t==="SCRIPT"?HTMLScriptElement.prototype:
t==="IFRAME"?HTMLIFrameElement.prototype:HTMLImageElement.prototype,"src");
if(pd&&pd.set){Object.defineProperty(el,"src",{get:pd.get,set:function(v){return pd.set.call(this,rw(v))},configurable:true})}
if(t==="A"){var hpd=Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype,"href");
if(hpd&&hpd.set){Object.defineProperty(el,"href",{get:hpd.get,set:function(v){return hpd.set.call(this,rw(v))},configurable:true})}}}
return el};
var osa=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(n,v){
if(n==="src"&&(this.tagName==="IFRAME"||this.tagName==="SCRIPT")){v=rw(v)}
if(n==="href"&&this.tagName==="A"){v=rw(v)}
return osa.call(this,n,v)};
function fixEl(n){if(n.nodeType!==1)return;
if(n.src){var s=rw(n.src);if(s!==n.src)n.src=s}
if(n.href){var h=rw(n.href);if(h!==n.href)n.href=h}
var els=n.querySelectorAll&&n.querySelectorAll("[src],[href]");
if(els){for(var i=0;i<els.length;i++){
if(els[i].src){var s2=rw(els[i].src);if(s2!==els[i].src)els[i].src=s2}
if(els[i].href){var h2=rw(els[i].href);if(h2!==els[i].href)els[i].href=h2}}}}
var mo2=new MutationObserver(function(ms){
for(var i=0;i<ms.length;i++){var ns=ms[i].addedNodes;
for(var j=0;j<ns.length;j++)fixEl(ns[j])}
});
mo2.observe(document.documentElement||document.body,{childList:true,subtree:true});
// Override document.write/writeln to rewrite poki URLs inline
var _dw=document.write;document.write=function(){
for(var i=0;i<arguments.length;i++){if(typeof arguments[i]==="string"&&arguments[i].indexOf("poki.")!==-1){arguments[i]=arguments[i].replace(_pokiUrlRe,function(m){return pp+m.replace(/https?:\/\//,"")})}}
return _dw.apply(document,arguments)};
var _dwl=document.writeln;document.writeln=function(){
for(var i=0;i<arguments.length;i++){if(typeof arguments[i]==="string"&&arguments[i].indexOf("poki.")!==-1){arguments[i]=arguments[i].replace(_pokiUrlRe,function(m){return pp+m.replace(/https?:\/\//,"")})}}
return _dwl.apply(document,arguments)};
// Override innerHTML setter to catch poki URLs injected dynamically
var _ih=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
if(_ih&&_ih.set){Object.defineProperty(Element.prototype,"innerHTML",{get:_ih.get,
set:function(v){if(typeof v==="string"&&v.indexOf("poki.")!==-1){
v=v.replace(_pokiUrlRe,function(m){if(m.indexOf("/game-proxy/")!==-1)return m;return pp+m.replace(/https?:\/\//,"")});
v=v.replace(_pokiUrlReProto,function(m){if(m.indexOf("/game-proxy/")!==-1||m.indexOf("browsergameshq")!==-1)return m;return pp+m.replace(/^\/\//,"")})}
return _ih.set.call(this,v)},configurable:true})}
// Override outerHTML setter
var _oh=Object.getOwnPropertyDescriptor(Element.prototype,"outerHTML");
if(_oh&&_oh.set){Object.defineProperty(Element.prototype,"outerHTML",{get:_oh.get,
set:function(v){if(typeof v==="string"&&v.indexOf("poki.")!==-1){
v=v.replace(_pokiUrlRe,function(m){if(m.indexOf("/game-proxy/")!==-1)return m;return pp+m.replace(/https?:\/\//,"")});
v=v.replace(_pokiUrlReProto,function(m){if(m.indexOf("/game-proxy/")!==-1||m.indexOf("browsergameshq")!==-1)return m;return pp+m.replace(/^\/\//,"")})}
return _oh.set.call(this,v)},configurable:true})}
// Override insertAdjacentHTML
var _iah=Element.prototype.insertAdjacentHTML;
Element.prototype.insertAdjacentHTML=function(p,v){
if(typeof v==="string"&&v.indexOf("poki.")!==-1){
v=v.replace(_pokiUrlRe,function(m){if(m.indexOf("/game-proxy/")!==-1)return m;return pp+m.replace(/https?:\/\//,"")});
v=v.replace(_pokiUrlReProto,function(m){if(m.indexOf("/game-proxy/")!==-1||m.indexOf("browsergameshq")!==-1)return m;return pp+m.replace(/^\/\//,"")})}
return _iah.call(this,p,v)};
// Block form submissions to poki domains
document.addEventListener("submit",function(e){try{var a=e.target.action;if(a&&a.indexOf("poki.")!==-1){e.preventDefault();e.stopPropagation()}}catch(ex){}},true);
var _fs=HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit=function(){try{if(this.action&&this.action.indexOf("poki.")!==-1)return}catch(ex){}return _fs.apply(this,arguments)};
})();</script>`;

// Proxy gdn.poki.com / poki-gdn.com assets + API calls (including POST/PUT)
router.all('/gdn-proxy/:subdomain(*)', async (req, res) => {
  try {
    const fullPath = req.params.subdomain + (req._parsedUrl ? (req._parsedUrl.search || '') : '');
    const cacheKey = `gdn:${fullPath}`;

    // Only cache GET requests; skip cache for POST/PUT/etc
    const isGet = req.method === 'GET';

    if (isGet) {
      const cached = cache.getAsset(cacheKey);
      if (cached) {
        res.set({ 'X-Cache': 'HIT', 'Access-Control-Allow-Origin': '*', 'Content-Type': cached.contentType });
        return res.send(Buffer.from(cached.body, 'base64'));
      }
    }

    const url = new URL(`https://${fullPath}`);

    // user-vault.poki.com: return mock user profile instead of proxying
    if (url.hostname === 'user-vault.poki.com') {
      res.set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.send(JSON.stringify({ id: 'mock-user-id', name: 'Player', is_new: true, version: 1, ttl: 15552000 }));
    }

    // Block iframe attempts to load poki.com bare domain — return empty safe page
    if (url.hostname === 'poki.com' || url.hostname === 'www.poki.com') {
      res.removeHeader('Content-Security-Policy');
      res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      return res.send('<!DOCTYPE html><html><head></head><body></body></html>');
    }

    // Spoof domain in href/url_referrer params for devs-api.poki.com and api.poki.com calls
    // This prevents the SDK from detecting unauthorized hosting via query params
    if (url.hostname.includes('poki.com') || url.hostname.includes('ay.delivery')) {
      ['href', 'url_referrer', 'referrer'].forEach(function(param) {
        if (url.searchParams.has(param)) {
          var val = url.searchParams.get(param);
          if (val && val.indexOf(config.domain) !== -1) {
            url.searchParams.set(param, val.replace(config.domain, 'poki.com'));
          }
        }
      });
    }

    const fetchOpts = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: false,
    };

    // Forward request body and content-type for POST/PUT/etc
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.headers['content-type']) fetchOpts.headers['Content-Type'] = req.headers['content-type'];
      if (req.body) fetchOpts.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(url, fetchOpts);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': isGet ? 'public, max-age=86400' : 'no-store',
      'X-Cache': 'MISS',
    });

    // For HTML responses from gdn.poki.com, also bypass anti-embedding checks
    // and inject the GAME_INTERCEPTOR (catches PokiSDK checks in inner game HTML)
    if (isGet && contentType.includes('text/html')) {
      let html = body.toString('utf-8');

      // Strip Content-Security-Policy from upstream to prevent frame-ancestors blocking
      res.removeHeader('Content-Security-Policy');

      // Strip meta refresh tags that redirect to poki.com before JS runs
      html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*content\s*=\s*["'][^"']*url\s*=[^"']*poki\.[^"']*["'][^>]*>/gi, '');

      // Server-side: rewrite game-cdn.poki.com URLs through our proxy
      html = html.replace(/https?:\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });

      // Also rewrite user-vault.poki.com URLs
      html = html.replace(/https?:\/\/[^"'\s<>]*user-vault\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*user-vault\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      // Rewrite api.poki.com and devs-api.poki.com URLs
      html = html.replace(/https?:\/\/[^"'\s<>]*api\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      // Rewrite ads.poki.com and ads.poki-cdn.com
      html = html.replace(/https?:\/\/[^"'\s<>]*ads\.poki\.(com|cdn\.com)[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      // Rewrite i.poki-cdn.com and v.poki-cdn.com
      html = html.replace(/https?:\/\/[^"'\s<>]*(?:i|v)\.poki-cdn\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      // Rewrite bare www.poki.com and poki.com navigation URLs
      html = html.replace(/https?:\/\/(?:www\.)?poki\.com/g, 'https://' + (req.get('host') || 'browsergameshq.com'));
      // Broad catch-all: any remaining poki.* URLs not caught above
      html = html.replace(/https?:\/\/[^"'\s<>]*poki\.(com|io|cdn\.com)[^"'\s<>]*/g, function(match) {
        if (match.indexOf('browsergameshq.com') !== -1) return match;
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });

      html = html.replace(/if\s*\(\s*((?:window\.)?(?:top|self))\s*(={2,3}|!==?)\s*((?:window\.)?(?:self|top))/g, function(m, a, op, b) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      html = html.replace(/if\s*\(\s*window\s*(={2,3}|!==?)\s*window\.top/g, function(m, op) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      html = html.replace(/\(!e\|\|!e\.gameID\)&&!V\.debug&&!window\?\.isPokiPlayground&&!H\.isPokiExternal/g, 'false');
      html = html.replace(/\(!e\|\|!e\.gameID\)&&!V\.debug&&!window\.isPokiPlayground&&!H\.isPokiExternal/g, 'false');
      html = html.replace(/console\.error\(["']%cALERT["'][^;]*;/g, '');
      var headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        html = html.replace(headMatch[0], headMatch[0] + GAME_INTERCEPTOR);
      }
      try { cache.setAsset(cacheKey, { body: Buffer.from(html).toString('base64'), contentType }, 86400); } catch(e) {}
      res.set({ 'Content-Security-Policy': "form-action 'self'" });
      return res.send(html);
    }

    // For JavaScript responses (Poki SDK core), apply anti-embedding bypass
    if (isGet && (contentType.includes('javascript') || contentType.includes('application/x-javascript') || contentType.includes('text/javascript') || req.path.endsWith('.js'))) {
      let js = body.toString('utf-8');
      js = js.replace(/if\s*\(\s*((?:window\.)?(?:top|self))\s*(={2,3}|!==?)\s*((?:window\.)?(?:self|top))/g, function(m, a, op, b) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      js = js.replace(/if\s*\(\s*window\s*(={2,3}|!==?)\s*window\.top/g, function(m, op) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      // Server-side: disable the "Unauthorized Game Hosting" alert in SDK core
      js = js.replace(/\(!e\|\|!e\.gameID\)&&!V\.debug&&!window\?\.isPokiPlayground&&!H\.isPokiExternal/g, 'false');
      js = js.replace(/\(!e\|\|!e\.gameID\)&&!V\.debug&&!window\.isPokiPlayground&&!H\.isPokiExternal/g, 'false');
      // Remove console.error ALERT call entirely (belt-and-suspenders)
      js = js.replace(/console\.error\(["']%cALERT["'][^;]*;/g, '');
      try { cache.setAsset(cacheKey, { body: Buffer.from(js).toString('base64'), contentType }, 86400); } catch(e) {}
      return res.send(js);
    }

    // Strip CSP from ALL proxied responses (belt-and-suspenders)
    res.removeHeader('Content-Security-Policy');
    if (isGet) {
      try { cache.setAsset(cacheKey, { body: body.toString('base64'), contentType }, 86400); } catch(e) {}
    }
    res.send(body);
  } catch (err) {
    console.error(`[GDN PROXY ERROR] ${req.method} ${req.path}: ${err.message}`);
    res.status(502).send('Asset temporarily unavailable.');
  }
});

// Proxy games.poki.com — patch embed HTML + handle API calls (POST/PUT to savegame etc)
router.all('*', async (req, res) => {
  const gamePath = req.path;
  const isGet = req.method === 'GET';
  const cacheKey = `game:${gamePath}`;

  if (isGet) {
    const cachedHtml = cache.getHtml(cacheKey);
    if (cachedHtml) {
      res.set({ 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=600' });
      return res.send(cachedHtml);
    }
  }

  try {
    const url = `${GAME_ORIGIN}${gamePath}`;
    const fetchOpts = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://poki.com/',
        'Origin': 'https://poki.com',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
      timeout: 30000,
      compress: true,
    };

    // Forward request body and content-type for POST/PUT/etc
    if (!isGet && req.method !== 'HEAD') {
      if (req.headers['content-type']) fetchOpts.headers['Content-Type'] = req.headers['content-type'];
      if (req.body) fetchOpts.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(url, fetchOpts);

    const upstreamContentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.buffer();

    const cacheControl = isGet ? 'public, max-age=600' : 'no-store';
    res.set({
      'Content-Type': upstreamContentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
      'X-Cache': 'MISS',
    });

    if (isGet && upstreamContentType.includes('text/html')) {
      let html = body.toString('utf-8');

      // Strip meta refresh tags that redirect to poki.com before JS runs
      html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*content\s*=\s*["'][^"']*url\s*=[^"']*poki\.[^"']*["'][^>]*>/gi, '');

      // Server-side: rewrite all known poki domains to go through proxy
      html = html.replace(/https?:\/\/[^"'\s<>]*gdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/https?:\/\/[^"'\s<>]*poki-gdn\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/https?:\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      // Protocol-relative URLs
      html = html.replace(/\/\/[^"'\s<>]*gdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*game-cdn\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*poki-gdn\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      // user-vault.poki.com
      html = html.replace(/https?:\/\/[^"'\s<>]*user-vault\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*user-vault\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      // api.poki.com and devs-api.poki.com
      html = html.replace(/https?:\/\/[^"'\s<>]*api\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/\/\/[^"'\s<>]*api\.poki\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/^\/\//, '');
      });
      // Rewrite ads.poki.com, ads.poki-cdn.com, i.poki-cdn.com, v.poki-cdn.com
      html = html.replace(/https?:\/\/[^"'\s<>]*ads\.poki\.(com|cdn\.com)[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      html = html.replace(/https?:\/\/[^"'\s<>]*(?:i|v)\.poki-cdn\.com[^"'\s<>]*/g, function(match) {
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });
      // Rewrite bare www.poki.com and poki.com navigation URLs
      html = html.replace(/https?:\/\/(?:www\.)?poki\.com/g, 'https://' + (req.get('host') || 'browsergameshq.com'));
      // Broad catch-all: any remaining poki.* URLs not caught above
      html = html.replace(/https?:\/\/[^"'\s<>]*poki\.(com|io|cdn\.com)[^"'\s<>]*/g, function(match) {
        if (match.indexOf('browsergameshq.com') !== -1) return match;
        return '/game-proxy/gdn-proxy/' + match.replace(/https?:\/\//, '');
      });

      // Bypass anti-embedding check
      html = html.replace(/if\s*\(\s*((?:window\.)?(?:top|self))\s*(={2,3}|!==?)\s*((?:window\.)?(?:self|top))/g, function(m, a, op, b) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      html = html.replace(/if\s*\(\s*window\s*(={2,3}|!==?)\s*window\.top/g, function(m, op) {
        return op === '!==' || op === '!=' ? 'if(false' : 'if(true';
      });
      html = html.replace(/\(!e\|\|!e\.gameID\)&&!V\.debug&&!window\?\.isPokiPlayground&&!H\.isPokiExternal/g, 'false');
      html = html.replace(/\(!e\|\|!e\.gameID\)&&!V\.debug&&!window\.isPokiPlayground&&!H\.isPokiExternal/g, 'false');
      html = html.replace(/console\.error\(["']%cALERT["'][^;]*;/g, '');

      // Game mirrors: replace gdn-proxy iframe src with working mirror URL
      var slugMatch = gamePath.match(/\/([^/]+?)(?:\/\d+)?$/);
      var slug = slugMatch ? slugMatch[1] : null;
      if (slug && GAME_MIRRORS[slug]) {
        html = html.replace(/(<iframe[^>]*src\s*=\s*["'])\/game-proxy\/gdn-proxy\/[^"']*(["'][^>]*>)/ig, '$1' + GAME_MIRRORS[slug] + '$2');
      }

      var headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        html = html.replace(headMatch[0], headMatch[0] + GAME_INTERCEPTOR);
      }

      try { cache.setHtml(cacheKey, html); } catch(e) {}
      res.set({ 'Content-Security-Policy': "form-action 'self'" });
      return res.send(html);
    }

    if (isGet) {
      try { cache.setAsset(cacheKey, { body: body.toString('base64'), contentType: upstreamContentType }, 86400); } catch(e) {}
    }
    res.send(body);
  } catch (err) {
    console.error(`[GAME PROXY ERROR] ${req.method} ${gamePath}: ${err.message}`);
    res.status(502).send('Game temporarily unavailable.');
  }
});

module.exports = router;
