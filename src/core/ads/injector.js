const config = require('../../config');

function buildAdSenseScript() {
  if (!config.ads.adsenseClientId) return '';
  return `
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.ads.adsenseClientId}" crossorigin="anonymous"></script>
  `;
}

function buildGA4Script() {
  if (!config.ga4Id) return '';
  return `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${config.ga4Id}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${config.ga4Id}');
    </script>
  `;
}

function buildFacebookPixel() {
  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2002475273742428');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=2002475273742428&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;
}

function buildSearchConsoleMeta() {
  if (!config.searchConsoleVerification) return '';
  return `\n    <meta name="google-site-verification" content="${config.searchConsoleVerification}">`;
}

function buildTrackerScript() {
  return `<script>
(function(){var k='_bghtid',id=sessionStorage.getItem(k)||(Date.now().toString(36)+Math.random().toString(36).slice(2,6));sessionStorage.setItem(k,id);var g=function(s){try{var d=new Blob(['id='+encodeURIComponent(id)+(s||'')],{type:'application/x-www-form-urlencoded'});navigator.sendBeacon('/t',d)}catch(e){}};g('&page='+encodeURIComponent(location.pathname));setInterval(function(){g('')},8000);var ph=history.pushState,rh=history.replaceState;history.pushState=function(){ph.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};history.replaceState=function(){rh.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};window.addEventListener('popstate',function(){g('&page='+encodeURIComponent(location.pathname))});window.addEventListener('beforeunload',function(){g('&disconnect=1')})})();
</script>`;
}

function injectAds(html) {
  const adScript = buildAdSenseScript();
  const ga4Script = buildGA4Script();
  const scMeta = buildSearchConsoleMeta();
  const fbPixel = buildFacebookPixel();
  const trackerScript = buildTrackerScript();
  const allHeadInjection = [adScript, ga4Script, scMeta, fbPixel, trackerScript].filter(Boolean).join('\n');

  let result = html;

  if (allHeadInjection && result.includes('</head>')) {
    result = result.replace('</head>', `${allHeadInjection}\n</head>`);
  } else if (allHeadInjection && result.includes('<head>')) {
    result = result.replace('<head>', `<head>${allHeadInjection}`);
  }

  // NOTE: gp_* ad containers are intentionally left EMPTY in the served HTML.
  // They live inside Poki's React tree — any element we put in them server-side
  // is wiped by React's hydration reconciliation (its VDOM renders them empty).
  // The React-safe ad manager injected by the rewriter claims those containers
  // AFTER mount and defends the <ins> against re-renders (one request each).
  return result;
}

module.exports = { injectAds, buildAdSenseScript, buildGA4Script, buildSearchConsoleMeta };
