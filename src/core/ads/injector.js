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

function buildAdUnit(slotId, width, height) {
  if (!config.ads.adsenseClientId || !slotId) return '';
  return `
    <ins class="adsbygoogle"
         style="display:inline-block;width:${width}px;height:${height}px"
         data-ad-client="${config.ads.adsenseClientId}"
         data-ad-slot="${slotId}"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  `;
}

function injectAds(html) {
  const adScript = buildAdSenseScript();
  const ga4Script = buildGA4Script();
  const scMeta = buildSearchConsoleMeta();
  const fbPixel = buildFacebookPixel();
  const allHeadInjection = [adScript, ga4Script, scMeta, fbPixel].filter(Boolean).join('\n');

  let result = html;

  if (allHeadInjection && result.includes('</head>')) {
    result = result.replace('</head>', `${allHeadInjection}\n</head>`);
  } else if (allHeadInjection && result.includes('<head>')) {
    result = result.replace('<head>', `<head>${allHeadInjection}`);
  }

  // Fill empty gp_* ad containers with real ad units
  if (result.includes('gp_728x90') && !result.includes('data-ad-slot="3616266206"')) {
    const ad = buildAdUnit(config.ads.slotLeaderboard, 728, 90);
    if (ad) result = result.replace(/<div[^>]*id="gp_728x90"[^>]*><\/div>/g, `<div id="gp_728x90">${ad}</div>`);
  }
  if (result.includes('gp_300x250') && !result.includes('data-ad-slot="7744193417"')) {
    const ad = buildAdUnit(config.ads.slotRectangle, 300, 250);
    if (ad) result = result.replace(/<div[^>]*id="gp_300x250"[^>]*><\/div>/g, `<div id="gp_300x250">${ad}</div>`);
  }
  if (result.includes('gp_160x600') && !result.includes('data-ad-slot="3025953274"')) {
    const ad = buildAdUnit(config.ads.slotSkyscraper, 160, 600);
    if (ad) result = result.replace(/<div[^>]*id="gp_160x600"[^>]*><\/div>/g, `<div id="gp_160x600">${ad}</div>`);
  }

  return result;
}

module.exports = { injectAds, buildAdSenseScript, buildGA4Script, buildSearchConsoleMeta };
