const config = require('../../config');
const cheerio = require('cheerio');

// Map of game slugs to their mirror replacement URLs
const MIRRORS = {
  'subway-surfers': 'https://g.igroutka.ru/games/164/OUNWHVSFldaeghn4/1/subway_surfers_hong_kong/?mp_assets=https%3A%2F%2Fs2.minijuegosgratis.com%2F&mp_embed=0&mp_game_id=223783&mp_game_uid=subway-surfers&mp_game_url=https%3A%2F%2Fwww.miniplay.com%2Fgame%2Fsubway-surfers&mp_int=1&mp_locale=en_US&mp_player_type=IFRAME&mp_site_https_url=https%3A%2F%2Fwww.miniplay.com%2F&mp_site_name=miniplay.com&mp_site_url=https%3A%2F%2Fwww.miniplay.com%2F&mp_timezone=Africa%2FCasablanca&mp_view_type=',
  'temple-run-2': 'https://html5.gamemonetize.co/pkyyuilfrqkcdnmrxsg60j22ypk0peje/',
  'temple-run-2-frozen-shadows': 'https://html5.gamemonetize.co/z8ud3po55n6uhr9d86moe2ur7rzlffs0/',
  'temple-run-2-jungle-fall': 'https://html5.gamemonetize.co/pkrsuit51ypgzm64h6ohkjnqvwv1zabz/',
  'temple-run-2-holi-festival': 'https://sda.4399.com/4399swf//upload_swf/ftp36/liuxinyu/20210628/jjjj1/index.html',
  'temple-run-2-spooky-summit': 'https://f.igry.pro/games/164/VJYtd6ApThscCS5u/2/temple_run_2_spooky_summit/',
  'murder': 'https://html5.gamedistribution.com/rvvASMiM/5e7acf55e50b4723afef834449b82bce/index.html',
  'apple-worm': 'https://apple-worm.com/appleworm/index.html',
  'drive-mad': 'https://play.fancade.com/5F084A0BCE06B710?max_w=999999&max_h=9999999&istart=1',
};

function rewriteHtml(html, sourcePath) {
  const $ = cheerio.load(html, {
    decodeEntities: false,
    xmlMode: false,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  });

  const sourceDomain = config.sourceDomain;
  const targetDomain = config.domain;
  const sourceOrigin = config.sourceOrigin;

  // Pass 1: Remove only ad-related scripts by src URL pattern (scripts aren't tracked by React hydration)
  // NOTE: Skip DOM element stripping — Poki's React SPA requires the full server HTML for hydration.
  // Client-side portal-ad-blocker script handles ad element removal + Adsense injection after mount.

  // Remove ad scripts by URL pattern
  $('script').each(function () {
    const src = $(this).attr('src') || '';
    if (src.includes('pagead') || src.includes('adsbygoogle') || src.includes('googletag') ||
        src.includes('doubleclick') || src.includes('prebid') || src.includes('taboola') ||
        src.includes('outbrain') || src.includes('criteo') || src.includes('amazon-adsystem')) {
      $(this).remove();
    }
  });

  // Pass 2: Rewrite navigation links only
  $('a').each(function () {
    let href = $(this).attr('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

    if (href.startsWith('//')) {
      href = 'https:' + href;
    }

    // Only rewrite poki.com/poki.io navigation links (not CDN asset links)
    const isNavLink = href.startsWith(sourceOrigin) ||
      href.match(new RegExp('^https?://' + sourceDomain.replace('.', '\\.') + '/'));
    if (isNavLink) {
      let cleanHref = href;
      if (href.startsWith(sourceOrigin)) {
        cleanHref = href.substring(sourceOrigin.length);
      } else {
        try {
          const parsed = new URL(href);
          cleanHref = parsed.pathname + parsed.search + parsed.hash;
        } catch {
          cleanHref = href.replace(/https?:\/\/[^/]+/, '');
        }
      }
      if (!cleanHref) cleanHref = '/';
      $(this).attr('href', cleanHref);
    }
  });

  // Pass 3: Images — keep ALL as absolute URLs, remove loading="lazy"
  $('img').each(function () {
    normalizeToAbsolute($, this, 'src');
    normalizeToAbsolute($, this, 'data-src');
    normalizeToAbsolute($, this, 'data-lazy-src');
    $(this).removeAttr('loading');

    // srcset kept as-is — Poki URLs are already absolute CDN URLs.
    // Do NOT split on comma: CDN image URLs contain commas in query strings
    // (e.g. image/q=78, scq=50, width=94), which naive split(',') would break.
  });

  // Pass 4: Keep ALL link tags (CSS, preconnect, etc.) as absolute
  // a.poki-cdn.com CSS/JS loads directly in browser — no proxy needed
  $('link').each(function () {
    normalizeToAbsolute($, this, 'href');
  });

  // Pass 5: Source elements — keep absolute (srcset kept as-is, see note above)
  $('source').each(function () {
    const srcset = $(this).attr('srcset') || '';
    if (srcset && srcset.startsWith('//')) {
      $(this).attr('srcset', 'https:' + srcset);
    }
  });

  // Pass 6: Data attributes with URLs — keep absolute
  const urlAttrs = [
    'poster', 'data-poster', 'data-bg', 'data-background',
    'data-image', 'data-lazy-src', 'data-original', 'data-full',
    'data-thumb', 'data-video-url',
  ];
  urlAttrs.forEach(attr => {
    $(`[${attr}]`).each(function () {
      normalizeToAbsolute($, this, attr);
    });
  });

  // Pass 7: Rewrite title
  $('title').each(function () {
    const text = $(this).text() || '';
    if (text.includes('Poki') || text.includes('poki')) {
      $(this).text(text.replace(/Poki/gi, 'GameZone').replace(/poki/gi, 'GameZone'));
    }
  });

  // Pass 8: Rewrite meta tags
  rewriteMetaTags($, sourceDomain, targetDomain);
  rewriteOpenGraph($, sourceDomain, targetDomain);

  // Pass 9: Replace Poki logo with custom logo (responsive for all devices)
  replacePokiLogo($);

  // Pass 9b: Rewrite games.poki.com URLs in INITIAL_STATE server-side (most reliable)
  rewriteGameInitState($, sourcePath);

  // Pass 9c: On ALL pages, inject iframe src interceptor (persists across SPA navigations)
  if ($('head').length) {
    $('head').append('<script id="portal-iframe-rw">' +
      '(function(){' +
      'var gp="games.poki.com";var pp="/game-proxy";' +
      'var sdp=["api.poki.com","devs-api.poki.com","a.poki.com","poki-auth.poki.com","ay.delivery","user-vault.poki.com","ads.poki.com","gdn.poki.com","poki-gdn.com","game-cdn.poki.com","ads.poki-cdn.com"];' +
      'var ssp="/game-proxy/gdn-proxy/";' +
      'var sm=' + JSON.stringify(MIRRORS) + ';' +
      'function mirrorUrl(v){' +
      'if(typeof v!=="string")return null;' +
      'var m=window.location.pathname.match(/\\/([a-z]{2}\\/g\\/)?([^/]+?)(?:\\/\\d+)?$/);' +
      'if(!m||!sm[m[2]])return null;' +
      'if(v.indexOf("gdn.poki.com")!==-1||v.indexOf("poki-gdn.com")!==-1||v.indexOf(ssp)!==-1||v.indexOf(gp)!==-1||v.indexOf(pp)!==-1){return sm[m[2]]}' +
      'return null}' +
      // Rewrite existing iframes on the page (server-rendered ones before React takes over)
      'try{var ifs=document.querySelectorAll("iframe");' +
      'for(var i=0;i<ifs.length;i++){' +
      'var s=ifs[i].getAttribute("src");var mr=mirrorUrl(s);' +
      'if(mr){ifs[i].setAttribute("src",mr)}}}catch(e){}' +
      // Watch for any new iframes added to the DOM
      'var mo=new MutationObserver(function(ms){' +
      'for(var i=0;i<ms.length;i++){var ns=ms[i].addedNodes;' +
      'for(var j=0;j<ns.length;j++){var n=ns[j];' +
      'if(n.tagName==="IFRAME"){var s=n.getAttribute("src");var mr=mirrorUrl(s);if(mr)n.setAttribute("src",mr)}' +
      'if(n.nodeType===1){var a=n.querySelectorAll&&n.querySelectorAll("iframe");' +
      'if(a){for(var k=0;k<a.length;k++){var s2=a[k].getAttribute("src");var mr2=mirrorUrl(s2);if(mr2)a[k].setAttribute("src",mr2)}}}}}});' +
      'try{mo.observe(document.documentElement||document.body,{childList:true,subtree:true})}catch(e){}' +
      'function rw(v){if(typeof v!=="string")return v;' +
      'var mr=mirrorUrl(v);if(mr)return mr;' +
      'if(v.indexOf(gp)!==-1){return pp+v.replace(/https?:\\/\\/games\\.poki\\.com/,"")}' +
      'for(var i=0;i<sdp.length;i++){if(v.indexOf(sdp[i])!==-1){return ssp+v.replace(/https?:\\/\\//,"").replace(/^\\/\\//,"")}}' +
      'if(v.indexOf("poki.com")!==-1||v.indexOf("poki.io")!==-1||v.indexOf("poki-cdn.com")!==-1){return v.replace(/https?:\\/\\/(?:[^\\/]+\\.)*poki\\.(com|io|cdn\\.com)/,window.location.origin)}' +
      'return v}' +
      'var d=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,"src");' +
      'if(d&&d.set){Object.defineProperty(HTMLIFrameElement.prototype,"src",{' +
      'get:d.get,set:function(v){return d.set.call(this,rw(v))},configurable:true})}' +
      'var ad=Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype,"href");' +
      'if(ad&&ad.set){Object.defineProperty(HTMLAnchorElement.prototype,"href",{' +
      'get:ad.get,set:function(v){return ad.set.call(this,rw(v))},configurable:true})}' +
      'var osa=Element.prototype.setAttribute;' +
      'Element.prototype.setAttribute=function(n,v){' +
      'if(n==="src"&&this.tagName==="IFRAME"){v=rw(v)}' +
      'if(n==="href"&&this.tagName==="A"){v=rw(v)}' +
      'return osa.call(this,n,v)};' +
      'var _og=window.open;window.open=function(u){' +
      'if(u&&typeof u==="string"){var r=rw(u);if(r!==u)return _og.call(window,r)}' +
      'return _og.apply(window,arguments)};' +
      'var _la=Object.getOwnPropertyDescriptor(Location.prototype,"href");' +
      'if(_la&&_la.set){Object.defineProperty(Location.prototype,"href",{' +
      'get:_la.get,set:function(v){if(typeof v==="string"){var r=rw(v);if(r!==v)return _la.set.call(this,r)}' +
      'return _la.set.call(this,v)},configurable:true})}' +
      'var _lA=Location.prototype.assign;' +
      'Location.prototype.assign=function(u){if(typeof u==="string"){var r=rw(u);if(r!==u)return _lA.call(this,r)}return _lA.apply(this,arguments)};' +
      'var _lR=Location.prototype.replace;' +
      'Location.prototype.replace=function(u){if(typeof u==="string"){var r=rw(u);if(r!==u)return _lR.call(this,r)}return _lR.apply(this,arguments)};' +
      'var of=window.fetch;window.fetch=function(u,o){' +
      'var _u=typeof u==="string"?u:(u&&u.url);' +
      'if(_u&&_u.indexOf("ads.poki-cdn.com")!==-1)return Promise.resolve(new Response("",{status:200}));' +
      'return of(rw(_u)||u,o)};' +
      'var ox=XMLHttpRequest.prototype.open;' +
      'XMLHttpRequest.prototype.open=function(m,u,a){' +
      'arguments[1]=rw(u)||u;return ox.apply(this,arguments)};' +
      'var clientId=' + JSON.stringify(config.ads.adsenseClientId || '') + ';' +
      'var slots={"728x90":' + JSON.stringify(config.ads.slotLeaderboard || '') + ',"300x250":' + JSON.stringify(config.ads.slotRectangle || '') + ',"160x600":' + JSON.stringify(config.ads.slotSkyscraper || '') + '};' +
      'function nukeAndReplace(){' +
      'if(!clientId)return;' +
      'var targets=document.querySelectorAll(".poki-ad-slot,[data-poki-ad-size]");' +
      'for(var i=0;i<targets.length;i++){var t=targets[i];' +
      'if(t.querySelector&&t.querySelector("ins.adsbygoogle"))continue;' +
      'var sizeAttr=t.getAttribute("data-poki-ad-size")||"";' +
      'var slot=slots[sizeAttr];if(!slot)continue;' +
      'var w=sizeAttr.split("x")[0]||"300";var h=sizeAttr.split("x")[1]||"250";' +
      'var c=document.createElement("div");' +
      'c.style.cssText="width:"+w+"px;height:"+h+"px;overflow:hidden;";' +
      'var ins=document.createElement("ins");ins.className="adsbygoogle";' +
      'ins.style.display="inline-block";ins.style.width=w+"px";ins.style.height=h+"px";' +
      'ins.setAttribute("data-ad-client",clientId);ins.setAttribute("data-ad-slot",slot);' +
      'c.appendChild(ins);' +
      't.parentNode.replaceChild(c,t);' +
      'try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}}' +
      'nukeAndReplace();' +
      'var adObs=new MutationObserver(function(muts){' +
      'for(var i=0;i<muts.length;i++){var added=muts[i].addedNodes;' +
      'for(var j=0;j<added.length;j++){var n=added[j];' +
      'if(n.nodeType!==1)continue;' +
      'if((n.classList&&(n.classList.contains("poki-ad-slot")||(n.hasAttribute&&n.hasAttribute("data-poki-ad-size"))))||' +
      '(n.querySelectorAll&&(n.querySelectorAll(".poki-ad-slot,[data-poki-ad-size]").length>0))){' +
      'nukeAndReplace();break}}}});' +
      'adObs.observe(document.documentElement||document.body,{childList:true,subtree:true});' +
      'setInterval(nukeAndReplace,1000);' +
      '})();</script>');
  }

  return $.html();
}

function normalizeToAbsolute($, el, attr) {
  let val = $(el).attr(attr) || '';
  if (!val) return;
  if (val.startsWith('//')) {
    val = 'https:' + val;
  }
  $(el).attr(attr, val);
}

function rewriteMetaTags($, sourceDomain, targetDomain) {
  const escapedSource = sourceDomain.replace('.', '\\.');
  $('meta[property="og:url"]').each(function () {
    const content = $(this).attr('content') || '';
    $(this).attr('content', content.replace(new RegExp(escapedSource, 'g'), targetDomain));
  });
  $('meta[name="canonical"]').each(function () {
    const content = $(this).attr('content') || '';
    $(this).attr('content', content.replace(new RegExp(escapedSource, 'g'), targetDomain));
  });
  $('link[rel="canonical"]').each(function () {
    const href = $(this).attr('href') || '';
    $(this).attr('href', href.replace(new RegExp(escapedSource, 'g'), targetDomain));
  });
  $('meta[name="description"]').each(function () {
    const content = $(this).attr('content') || '';
    if (content.includes('Poki') || content.includes('poki')) {
      $(this).attr('content', content.replace(/Poki/gi, 'GameZone').replace(/poki/gi, 'GameZone'));
    }
  });
}

function rewriteOpenGraph($, sourceDomain, targetDomain) {
  const escapedSource = sourceDomain.replace('.', '\\.');
  $('meta[property^="og:"]').each(function () {
    const content = $(this).attr('content') || '';
    if (content.includes(sourceDomain)) {
      $(this).attr('content', content.replace(new RegExp(escapedSource, 'g'), targetDomain));
    }
    if (content.includes('Poki') || content.includes('poki')) {
      $(this).attr('content', content.replace(/Poki/gi, 'GameZone').replace(/poki/gi, 'GameZone'));
    }
  });
}

function replaceGamePageAds($, sourcePath) {
  var hasAd = false;
  ['gp_728x90', 'gp_300x250', 'gp_160x600'].forEach(function (id) {
    if ($('#' + id).length) hasAd = true;
  });
  var isGamePage = typeof sourcePath === 'string' && (sourcePath.match(/\/[a-z]{2}\/g\/.+/i) || sourcePath.indexOf('/g/') !== -1);
  if (!hasAd && !isGamePage) return;
  if (!$('head').length) return;
  // Nullify Poki house ad data in INITIAL_STATE before React boots
  // Keep gp_* containers empty for React hydration (don't inject ad units here - React would break)
  // Inject MutationObserver to block Poki ad networks and set up our own ad injection
  var clientId = config.ads.adsenseClientId;
  $('head').append('<script id="portal-ad-blocker">' +
    '(function(){' +
    // Step 1: Nullify house ad replacement data
    'var s=window.INITIAL_STATE;' +
    'if(s&&s.background){' +
    'var cfg=s.background;' +
    'for(var k in cfg){' +
    'if(k.indexOf("getImvitaConfigs")!==-1||k.indexOf("Imvita")!==-1){' +
    'var d=cfg[k];' +
    'if(d&&d.data){for(var id in d.data){if(d.data[id]&&d.data[id].replacements){d.data[id].replacements={}}}}' +
    '}}' +
    '}' +
    'if(s&&s.ads){s.ads.takeover=null}' +
    // Step 2a: Rewrite games.poki.com URLs in INITIAL_STATE before React reads them
    'var gp="games.poki.com";var pp="/game-proxy";' +
    'function rewriteGameUrls(o){' +
    'if(typeof o==="string"&&o.indexOf(gp)!==-1){return o.replace("https://"+gp,pp).replace("http://"+gp,pp).replace("//"+gp,pp)}' +
    'if(o&&typeof o==="object"){for(var k in o){if(o.hasOwnProperty(k)){var v=rewriteGameUrls(o[k]);if(v!==o[k]){o[k]=v}}}' +
    '}return o}' +
    'setTimeout(function(){if(window.INITIAL_STATE)rewriteGameUrls(window.INITIAL_STATE)},0);' +
    // Step 2b: Keep gp_* containers empty for React hydration, then inject our ads after React mounts
    'var c=["gp_728x90","gp_300x250","gp_160x600"];' +
    'var cc=["okjidGhocmXN7zKxDo6s"];' +
    'function nukePokiAds(){' +
    'var pa=document.querySelectorAll(".poki-ad-slot,[data-poki-ad-size]");' +
    'for(var i=0;i<pa.length;i++){var el=pa[i];if(el.parentNode)el.parentNode.removeChild(el)}' +
    '}' +
    'function emptyContainers(){' +
    'for(var i=0;i<c.length;i++){var el=document.getElementById(c[i]);if(el&&el.children.length>0&&!el.querySelector("ins.adsbygoogle")){el.innerHTML=""}}' +
    'for(var i=0;i<cc.length;i++){var els=document.querySelectorAll("."+cc[i]);for(var j=0;j<els.length;j++){if(els[j].children.length>0&&!els[j].querySelector("ins.adsbygoogle")){els[j].innerHTML=""}}}' +
    '}' +
    // Step 3: Inject our AdSense ads into empty containers
    'var clientId=' + JSON.stringify(clientId) + ';' +
    'var slots={"728x90":' + JSON.stringify(config.ads.slotLeaderboard) + ',"300x250":' + JSON.stringify(config.ads.slotRectangle) + ',"160x600":' + JSON.stringify(config.ads.slotSkyscraper) + '};' +
    'function injectOurAds(){' +
    'nukePokiAds();emptyContainers();' +
    'for(var i=0;i<c.length;i++){var el=document.getElementById(c[i]);if(el&&el.children.length===0){' +
    'var w=el.style&&el.style.width?parseInt(el.style.width):0;' +
    'var h=el.style&&el.style.height?parseInt(el.style.height):0;' +
    'if(!w||!h){var style=(el.getAttribute("style")||"");var mw=style.match(/width:\\s*(\\d+)/);var mh=style.match(/height:\\s*(\\d+)/);if(mw&&mh){w=parseInt(mw[1]);h=parseInt(mh[1])}}' +
    'var key=w+"x"+h;var slot=slots[key];' +
    'if(slot&&clientId){' +
    'var ins=document.createElement("ins");' +
    'ins.className="adsbygoogle";' +
    'ins.style.display="inline-block";' +
    'ins.style.width=w+"px";' +
    'ins.style.height=h+"px";' +
    'ins.setAttribute("data-ad-client",clientId);' +
    'ins.setAttribute("data-ad-slot",slot);' +
    'el.appendChild(ins);' +
    'try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}}}}' +
    // Inject into okjid* containers
    'var els=document.querySelectorAll(".okjidGhocmXN7zKxDo6s");' +
    'for(var i=0;i<els.length;i++){var el=els[i];' +
    'if(el.children.length===0){' +
    'var style=(el.getAttribute("style")||"");' +
    'var mw=style.match(/width:\\s*(\\d+)/);' +
    'var mh=style.match(/height:\\s*(\\d+)/);' +
    'if(mw&&mh){var key=mw[1]+"x"+mh[1];var slot=slots[key];' +
    'if(slot&&clientId){' +
    'var ins=document.createElement("ins");' +
    'ins.className="adsbygoogle";' +
    'ins.style.display="inline-block";' +
    'ins.style.width=mw[1]+"px";' +
    'ins.style.height=mh[1]+"px";' +
    'ins.setAttribute("data-ad-client",clientId);' +
    'ins.setAttribute("data-ad-slot",slot);' +
    'el.appendChild(ins);' +
    'try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}}}}}' +
    // Block Poki-specific ad networks
    'var p=["ads.poki.com","ads.poki-cdn.com","taboola","outbrain","criteo","moatads","adnxs","adsrvr","prebid","amazon-adsystem"];' +
    // Rewrite games.poki.com iframes to go through our proxy (prevents embed fallback)
    'function rewriteGameIframe(el){' +
    'if(el.tagName==="IFRAME"&&el.src&&el.src.indexOf(gp)!==-1){' +
    'var newSrc=el.src.replace("https://"+gp,"").replace("http://"+gp,"");' +
    'if(newSrc.indexOf("/")!==0)newSrc="/"+newSrc;' +
    'el.src=pp+newSrc;return true}return false}' +
    'function matchUrl(u){if(!u)return false;for(var i=0;i<p.length;i++){if(u.indexOf(p[i])!==-1)return true}return false}' +
    'var o=new MutationObserver(function(m){' +
    'for(var i=0;i<m.length;i++){var mut=m[i];' +
    'for(var j=0;j<mut.addedNodes.length;j++){var n=mut.addedNodes[j];' +
    'if(n.tagName==="SCRIPT"&&n.src&&matchUrl(n.src)){n.type="text/placeholder";n.src="";try{n.remove()}catch(e){}}' +
    'if(n.tagName==="IFRAME"&&n.src){' +
    'if(rewriteGameIframe(n)){}else if(matchUrl(n.src)){n.src="about:blank";try{n.remove()}catch(e){}}' +
    '}' +
    'if(n.tagName==="IMG"&&n.src&&matchUrl(n.src)){n.src="";try{n.remove()}catch(e){}}' +
    'if(n.nodeType===1){' +
    'if(n.matches&&n.matches(".okjidGhocmXN7zKxDo6s")){' +
    'var el=n;if(el.children.length===0){var style=(el.getAttribute("style")||"");var mw=style.match(/width:\\s*(\\d+)/);var mh=style.match(/height:\\s*(\\d+)/);if(mw&&mh){var key=mw[1]+"x"+mh[1];var slot=slots[key];if(slot&&clientId){var ins=document.createElement("ins");ins.className="adsbygoogle";ins.style.display="inline-block";ins.style.width=mw[1]+"px";ins.style.height=mh[1]+"px";ins.setAttribute("data-ad-client",clientId);ins.setAttribute("data-ad-slot",slot);el.appendChild(ins);try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}}}}' +
    'var a=n.querySelectorAll&&n.querySelectorAll("script,iframe,img");if(a){for(var l=0;l<a.length;l++){var s=a[l];if(s.src){if(rewriteGameIframe(s)){}else if(matchUrl(s.src)){s.src="";try{s.remove()}catch(e){}}}}}}' +
    '}' +
    '});' +
    'var t=document.documentElement;if(t){o.observe(t,{childList:true,subtree:true})}' +
    // Run after React has a chance to hydrate, then periodically
    'setTimeout(function(){nukePokiAds();injectOurAds()},300);' +
    'setTimeout(function(){nukePokiAds();injectOurAds()},1000);' +
    'setTimeout(function(){nukePokiAds();injectOurAds()},3000);' +
    'setInterval(function(){nukePokiAds();injectOurAds()},2000);' +
    '})();' +
    '</script>');
}

function replacePokiLogo($) {
  var logoUrl = 'https://i.imgur.com/YRRj3Hw.png';
  // 1. Set customLogo in INITIAL_STATE so the Logo React component uses our image
  $('script').each(function () {
    var text = $(this).html() || '';
    if (text.indexOf('INITIAL_STATE') === -1) return;
    // Replace "customLogo":null with our logo URL (no inline style, so CSS handles responsive sizing)
    text = text.replace('"customLogo":null', '"customLogo":{"url":"' + logoUrl + '"}');
    // Also update "customFavicon":null
    text = text.replace('"customFavicon":null', '"customFavicon":{"url":"' + logoUrl + '"}');
    $(this).html(text);
  });
  // 2. Update visible branding on parent elements (not reverted by React since they're attributes)
  $('span[role="img"]').each(function () {
    var style = $(this).attr('style') || '';
    if (style.indexOf('poki.svg') === -1) return;
    var parentLink = $(this).closest('a');
    if (parentLink.length) {
      parentLink.attr('aria-label', 'GameZone');
      parentLink.attr('title', 'GameZone');
    }
    var parentButton = $(this).closest('button');
    if (parentButton.length) {
      parentButton.attr('aria-label', 'GameZone');
    }
  });
  // 3. Add responsive CSS for the custom logo (targets by unique image URL since React adds no class)
  if ($('head').length && !$('#portal-logo-style').length) {
    $('head').append('<style id="portal-logo-style">' +
      'img[src*="YRRj3Hw"]{height:32px;width:auto;object-fit:contain;vertical-align:middle;display:inline-block}' +
      '@media(max-width:1024px){img[src*="YRRj3Hw"]{height:28px}}' +
      '@media(max-width:640px){img[src*="YRRj3Hw"]{height:24px}}' +
      '</style>');
  }
}

function rewriteGameInitState($, sourcePath) {
  var slug = null;
  var slugMatch = sourcePath ? sourcePath.match(/\/([^/]+?)(?:\/\d+)?$/) : null;
  if (slugMatch) slug = slugMatch[1];
  $('script').each(function () {
    var text = $(this).html() || '';
    var idx = text.indexOf('window.INITIAL_STATE=');
    if (idx === -1) idx = text.indexOf('window.INITIAL_STATE =');
    if (idx === -1) return;
    var start = text.indexOf('{', idx);
    if (start === -1) return;
    // Parse the JSON object by counting braces
    var depth = 0;
    var inStr = false;
    var esc = false;
    var end = -1;
    for (var i = start; i < text.length; i++) {
      var c = text[i];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end === -1) return;
    try {
      var jsonStr = text.substring(start, end);
      // Replace \u002F with / for proper parsing
      var cleanJson = jsonStr.replace(/\\u002F/g, '/');
      // Replace gdn embed URLs with mirror URL for mapped games (server-side)
      if (MIRRORS[slug]) {
        var mirrorUrl = MIRRORS[slug];
        cleanJson = cleanJson.replace(/https?:\/\/[^"'\s]*gdn\.poki\.com[^"'\s]*/g, mirrorUrl);
        cleanJson = cleanJson.replace(/https?:\/\/[^"'\s]*poki-gdn\.com[^"'\s]*/g, mirrorUrl);
        cleanJson = cleanJson.replace(/\/\/[^"'\s]*gdn\.poki\.com[^"'\s]*/g, mirrorUrl);
      }
      var data = JSON.parse(cleanJson);
      var modified = rewriteGameUrls(data);
      // For mapped games, also replace any /game-proxy/ URLs with the mirror
      if (MIRRORS[slug]) {
        var mirrorUrl = MIRRORS[slug];
        function mirrorWalk(obj, visited) {
          if (!obj || typeof obj !== 'object') return false;
          if (!visited) visited = new WeakSet();
          if (visited.has(obj)) return false;
          visited.add(obj);
          var changed = false;
          for (var k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
              var v = obj[k];
              if (typeof v === 'string' && (v.indexOf('/game-proxy/') !== -1 || v.indexOf('games.poki.com') !== -1)) {
                obj[k] = mirrorUrl;
                changed = true;
              } else if (typeof v === 'object' && v !== null) {
                if (mirrorWalk(v, visited)) changed = true;
              }
            }
          }
          return changed;
        }
        if (mirrorWalk(data)) modified = true;
      }
      if (!modified) return;
      var newJson = JSON.stringify(data).replace(/\//g, '\\u002F');
      var newText = text.substring(0, start) + newJson + text.substring(end);
      $(this).html(newText);
    } catch (e) {
      // Silent fail - don't break page rendering
    }
  });
}

function rewriteGameUrls(obj, visited) {
  if (!obj || typeof obj !== 'object') return false;
  if (!visited) visited = new WeakSet();
  if (visited.has(obj)) return false;
  visited.add(obj);
  var changed = false;
  for (var k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var v = obj[k];
      if (typeof v === 'string' && v.indexOf('games.poki.com') !== -1) {
        obj[k] = v.replace(/(?:https?:)?\/\/games\.poki\.com/g, '/game-proxy');
        changed = true;
      } else if (typeof v === 'object' && v !== null) {
        if (rewriteGameUrls(v, visited)) changed = true;
      }
    }
  }
  return changed;
}

module.exports = { rewriteHtml };
