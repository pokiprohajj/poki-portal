// Local static trust pages (privacy, contact, terms) — served directly, no proxy.
// These never touch the homepage route or game page serving.

const config = require('../config');
const site = 'https://browsergameshq.com';

const pages = {
  '/privacy-policy': {
    title: 'Privacy Policy - BrowserGamesHQ',
    desc: 'BrowserGamesHQ privacy policy: what data we collect, how we use it, and your rights.',
    h1: 'Privacy Policy',
    updated: 'Last updated: August 1, 2026',
    body: `<p>BrowserGamesHQ ("we", "us") operates the website browsergameshq.com. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>
<h2>1. Information We Collect</h2>
<p>We may collect the following types of information:</p>
<ul>
<li>Log data: IP address, browser type, pages visited, and timestamps, automatically recorded by our servers.</li>
<li>Device data: operating system, screen size, and device type used to optimize your experience.</li>
<li>Cookies and similar technologies: used to remember preferences and improve the site.</li>
</ul>
<h2>2. How We Use Information</h2>
<p>We use collected information to operate, maintain, and improve BrowserGamesHQ; to measure traffic and performance; and to detect and prevent abuse.</p>
<h2>3. Advertising</h2>
<p>BrowserGamesHQ may display third-party ads. Advertising partners (such as Google) may use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalized advertising by visiting Google's Ads Settings.</p>
<h2>4. Cookies</h2>
<p>You can control cookies through your browser settings. Blocking cookies may affect some features of the site.</p>
<h2>5. Third-Party Services</h2>
<p>Games on BrowserGamesHQ are provided by third-party developers. Playing a game may cause that third party to collect data under their own privacy policy.</p>
<h2>6. Children's Privacy</h2>
<p>BrowserGamesHQ is a general audience website. We do not knowingly collect personal information from children under 13 without parental consent.</p>
<h2>7. Data Security</h2>
<p>We use reasonable technical and organizational measures to protect your information. No method of transmission over the internet is 100% secure.</p>
<h2>8. Your Rights</h2>
<p>Depending on your jurisdiction, you may have rights to access, correct, or delete your personal information. To make a request, contact us using the details on our <a href="/contact">Contact</a> page.</p>
<h2>9. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. Changes take effect when posted on this page.</p>
<h2>10. Contact Us</h2>
<p>If you have questions about this Privacy Policy, please <a href="/contact">contact us</a>.</p>`,
  },
  '/contact': {
    title: 'Contact BrowserGamesHQ',
    desc: 'Contact BrowserGamesHQ: report issues, request removal of a game, or reach the team.',
    h1: 'Contact Us',
    updated: '',
    body: `<p>We're happy to hear from you. Whether you have a question, found a broken game, or need help, here's how to reach us.</p>
<h2>Email</h2>
<p>Send us an email at <a href="mailto:hello@browsergameshq.com">hello@browsergameshq.com</a>.</p>
<h2>Report a Game</h2>
<p>If a game is not loading, is inappropriate, or you believe it infringes on your copyright, please include the game's name and URL in your message.</p>
<h2>Response Time</h2>
<p>We aim to respond within 2-3 business days.</p>`,
  },
  '/terms-of-service': {
    title: 'Terms of Service - BrowserGamesHQ',
    desc: 'BrowserGamesHQ terms of service: rules for using the website and its free games.',
    h1: 'Terms of Service',
    updated: 'Last updated: August 1, 2026',
    body: `<p>By accessing or using browsergameshq.com, you agree to these Terms of Service. If you do not agree, please do not use the site.</p>
<h2>1. Use of the Service</h2>
<p>BrowserGamesHQ provides free, browser-based games. You may use the service for personal, non-commercial purposes unless otherwise agreed in writing.</p>
<h2>2. Acceptable Use</h2>
<p>You agree not to misuse the service, including: attempting to disrupt servers, scraping at abusive rates, reverse engineering, or using the service for unlawful purposes.</p>
<h2>3. Intellectual Property</h2>
<p>Games are the property of their respective developers and publishers. The BrowserGamesHQ name and site content are our property.</p>
<h2>4. Third-Party Games</h2>
<p>Games are provided by third parties "as is". We do not guarantee that any game will be available, error-free, or suitable for your purposes.</p>
<h2>5. Limitation of Liability</h2>
<p>To the maximum extent permitted by law, BrowserGamesHQ is not liable for any damages arising from your use of the service.</p>
<h2>6. Changes to These Terms</h2>
<p>We may update these terms. Continued use after changes constitutes acceptance of the revised terms.</p>
<h2>7. Contact</h2>
<p>Questions about these terms? <a href="/contact">Contact us</a>.</p>`,
  },
};

function render(slug) {
  const p = pages[slug];
  if (!p) return null;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.title}</title>
  <meta name="description" content="${p.desc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${site}${slug}">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"${p.h1}","url":"${site}${slug}","isPartOf":{"@type":"WebSite","name":"BrowserGamesHQ","url":"${site}"}}</script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #e8e8f0; line-height: 1.7; }
    header { background: #16162e; padding: 18px 24px; border-bottom: 1px solid #2a2a4a; }
    header a { color: #6ee7ff; text-decoration: none; font-weight: 600; }
    main { max-width: 760px; margin: 0 auto; padding: 40px 24px 60px; }
    h1 { color: #fff; font-size: 2rem; margin-bottom: 6px; }
    .updated { color: #8888aa; font-size: .9rem; margin-bottom: 24px; }
    h2 { color: #6ee7ff; font-size: 1.25rem; margin: 28px 0 10px; }
    p { margin-bottom: 14px; }
    ul { margin: 0 0 14px 22px; }
    a { color: #6ee7ff; }
    footer { text-align: center; padding: 30px 24px; color: #8888aa; font-size: .85rem; border-top: 1px solid #2a2a4a; }
    footer a { color: #6ee7ff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <header><a href="/">BrowserGamesHQ</a></header>
  <main>
    <h1>${p.h1}</h1>
    ${p.updated ? `<p class="updated">${p.updated}</p>` : ''}
    ${p.body}
  </main>
  <footer>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/privacy-policy">Privacy</a>
    <a href="/terms-of-service">Terms</a>
  </footer>
</body>
</html>`;
}

module.exports = { render, pages };
