const config = require('../../config');
const { shouldRemoveElement } = require('../ads/filter');
const cheerio = require('cheerio');

const POKI_HOSTS = [
  'poki.com', 'poki.io', 'poki-cdn.com',
  'img.poki.com', 'a.poki-cdn.com', 't.poki.io',
  'v.poki-cdn.com',
];

function isPokiUrl(url) {
  if (!url) return false;
  return POKI_HOSTS.some(host => url.includes(host));
}

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

  // Pass 1: Strip ad content but KEEP element structure for React hydration
  $('div, section, aside, span').each(function () {
    const el = $(this)[0];
    if (shouldRemoveElement(el)) {
      $(this).empty().removeAttr('class').removeAttr('style').removeAttr('id');
    }
  });

  // Remove ad scripts entirely (React doesn't track script elements in hydration)
  $('script').each(function () {
    const el = $(this)[0];
    if (shouldRemoveElement(el)) {
      $(this).remove();
    }
  });

  // Remove ad iframes entirely (React tracks these but iframes are external)
  $('iframe').each(function () {
    const el = $(this)[0];
    if (shouldRemoveElement(el)) {
      $(this).remove();
    }
  });

  // Remove ad links entirely (React tracks these but ad links are separate)
  $('a').each(function () {
    const el = $(this)[0];
    if (shouldRemoveElement(el)) {
      $(this).remove();
    }
  });

  // Pass 1b: Remove additional ad scripts by URL pattern
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

  // Pass 9: Replace Poki ad containers with size-labeled placeholders
  replaceGamePageAds($, sourcePath);

  // Pass 9b: Replace Poki logo with custom logo (responsive for all devices)
  replacePokiLogo($);

  // Pass 10: Inject navigation overlay for SPA-style link interception
  injectNavigationOverlay($, targetDomain);

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
    'if(typeof o==="string"&&o.indexOf(gp)!==-1){return o.replace("https://"+gp,pp).replace("http://"+gp,pp)}' +
    'if(o&&typeof o==="object"){for(var k in o){if(o.hasOwnProperty(k)){var v=rewriteGameUrls(o[k]);if(v!==o[k]){o[k]=v}}}' +
    '}return o}' +
    'setTimeout(function(){if(window.INITIAL_STATE)rewriteGameUrls(window.INITIAL_STATE)},0);' +
    // Step 2b: Keep gp_* containers empty for React hydration, then inject our ads after React mounts
    'var c=["gp_728x90","gp_300x250","gp_160x600"];' +
    'var cc=["okjidGhocmXN7zKxDo6s"];' +
    'function emptyContainers(){' +
    'for(var i=0;i<c.length;i++){var el=document.getElementById(c[i]);if(el&&el.children.length>0&&!el.querySelector("ins.adsbygoogle")){el.innerHTML=""}}' +
    'for(var i=0;i<cc.length;i++){var els=document.querySelectorAll("."+cc[i]);for(var j=0;j<els.length;j++){if(els[j].children.length>0&&!els[j].querySelector("ins.adsbygoogle")){els[j].innerHTML=""}}}' +
    '}' +
    // Step 3: Inject our AdSense ads into empty containers
    'var clientId=' + JSON.stringify(clientId) + ';' +
    'var slots={"728x90":' + JSON.stringify(config.ads.slotLeaderboard) + ',"300x250":' + JSON.stringify(config.ads.slotRectangle) + ',"160x600":' + JSON.stringify(config.ads.slotSkyscraper) + '};' +
    'function injectOurAds(){' +
    'emptyContainers();' +
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
    'var p=["ads.poki.com","taboola","outbrain","criteo","moatads","adnxs","adsrvr","prebid","amazon-adsystem"];' +
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
    // Run after React has a chance to hydrate (timeout to let React settle)
    'setTimeout(injectOurAds,500);' +
    'setTimeout(injectOurAds,2000);' +
    'setInterval(injectOurAds,5000);' +
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

function injectNavigationOverlay($, targetDomain) {
  // SPA-safe: only intercept clicks/touches on external links to poki domains
  // Uses both click and touchstart events for mobile compatibility
  const script = `
    <script id="portal-nav-overlay">
      (function() {
        function interceptLink(e) {
          if (e.defaultPrevented) return;
          if (e.type === 'click' && e.button !== 0) return;
          var link = e.target.closest('a');
          if (!link) return;
          var href = link.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
          if (href.startsWith('http') && (href.includes('poki.com') || href.includes('poki.io'))) {
            if (link.hasAttribute('data-spa') || link.closest('[data-spa]')) return;
            e.preventDefault();
            try {
              var path = new URL(href).pathname + (new URL(href).search || '');
              window.location.href = path;
            } catch(err) {}
          }
        }
        document.addEventListener('click', interceptLink);
        document.addEventListener('touchstart', interceptLink, {passive:false});
      })();
    </script>
  `;
  if ($('body').length) {
    $('body').append(script);
  }
}

module.exports = { rewriteHtml };
