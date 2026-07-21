const config = require('../../config');

const AD_PATTERNS = {
  selectors: [
    '[class*="ad-"]', '[class*="ads-"]', '[class*="advert"]', '[class*="banner"]',
    '[id*="ad-"]', '[id*="ads-"]', '[id*="advert"]', '[id*="banner"]',
    '[class*="sponsored"]', '[class*="promo"]', '[class*="promotion"]',
    '[data-ad]', '[data-ads]', '[data-ad-slot]', '[data-adunit]',
    '[class*="dfp"]', '[id*="dfp"]',
    '[class*="google-ad"]', '[id*="google-ad"]',
    '[class*="pub"]', '[id*="pub"]',
    '.ad-container', '.ads-container', '.ad-wrapper', '.ads-wrapper',
    '.advertisement', '.ad-slot', '.ad-unit',
    '[class*="interstitial"]', '[class*="overlay-ad"]',
    '[class*="native-ad"]', '[class*="sponsored-content"]',
  ],

  scripts: [
    'pagead', 'googletag', 'adsbygoogle', 'doubleclick',
    'adsense', 'adnxs', 'adsrvr', 'advertising',
    'prebid', 'taboola', 'outbrain', 'criteo',
    'amazon-adsystem', 'aps.amazon', 'moatads',
  ],

  iframes: [
    'googletagmanager.com', 'doubleclick.net', 'googleads',
    'googleadservices', 'adnxs.com', 'amazon-adsystem',
    'taboola.com', 'criteo.com', 'moatads.com',
  ],

  classes: [
    'poki-ads', 'poki-ad', 'poki-banner', 'poki-promo',
    'poki-sponsor', 'poki-commercial', 'poki-premium',
    'ad-container', 'ad-wrapper', 'ad-overlay',
    'banner-ad', 'sidebar-ad', 'footer-ad', 'header-ad',
    'interstitial', 'popup-ad', 'modal-ad',
    'sponsored-tag', 'promo-tag', 'ad-label',
  ],

  ids: [
    'poki-ads', 'poki-ad-container', 'poki-banner',
    'ad-container', 'ad-wrapper', 'ad-overlay', 'ad-modal',
    'banner-ad', 'sidebar-ad', 'footer-ad', 'header-ad',
    'interstitial-ad', 'popup-ad', 'modal-ad',
  ],
};

function shouldRemoveElement(el) {
  const tagName = el.tagName ? el.tagName.toLowerCase() : '';
  const className = (el.attribs && el.attribs.class) || '';
  const id = (el.attribs && el.attribs.id) || '';
  const src = (el.attribs && el.attribs.src) || '';
  const dataAttrs = el.attribs ? Object.keys(el.attribs).filter(k => k.startsWith('data-')) : [];

  for (const idPattern of AD_PATTERNS.ids) {
    if (id.toLowerCase().includes(idPattern)) return true;
  }

  for (const cls of AD_PATTERNS.classes) {
    if (className.toLowerCase().includes(cls)) return true;
  }

  for (const script of AD_PATTERNS.scripts) {
    if (src.toLowerCase().includes(script)) return true;
    if (className.toLowerCase().includes(script)) return true;
    if (id.toLowerCase().includes(script)) return true;
  }

  if (tagName === 'iframe') {
    for (const iframeSrc of AD_PATTERNS.iframes) {
      if (src.toLowerCase().includes(iframeSrc)) return true;
    }
  }

  for (const attr of dataAttrs) {
    if (['data-ad', 'data-ads', 'data-ad-slot', 'data-adunit', 'data-dfp'].includes(attr)) {
      return true;
    }
  }

  if (tagName === 'a') {
    const href = (el.attribs && el.attribs.href) || '';
    if (href.includes('pagead') || href.includes('doubleclick') || href.includes('googleads')) {
      return true;
    }
  }

  return false;
}

function createAdFilter() {
  return {
    AD_PATTERNS,
    shouldRemoveElement,
  };
}

module.exports = { createAdFilter, AD_PATTERNS, shouldRemoveElement };
