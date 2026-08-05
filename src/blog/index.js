const posts = require('./posts');
const { enhanceContent } = require('./posts/generator');

function needsEnhancement(post) {
  return !post.content.includes('<h3>') || !post.content.includes('<strong>') || !post.content.includes('<img');
}

// Auto-enhance posts that lack modern SEO features
if (process.env.NODE_ENV !== 'development') {
  posts.forEach(p => {
    if (needsEnhancement(p)) {
      p.content = enhanceContent(p.content, p.title);
      p.readingTime = Math.max(1, Math.round(p.content.replace(/<[^>]+>/g, '').split(/\s+/).length / 200));
    }
  });
}

const CAT_CLASS = { Guides: 'guides', Lists: 'lists', Comparisons: 'comparisons', Articles: 'articles' };
const CAT_EMOJI = { Guides: '🎮', Lists: '📋', Comparisons: '⚖️', Articles: '📝' };
const CAT_COLORS = { guides: '#5f3dc4', lists: '#c62828', comparisons: '#1565c0', articles: '#2e7d32' };
const CAT_DESC = {
  guides: 'Step-by-step game guides, pro tips, and expert strategies for your favorite browser games. Learn how to play and improve.',
  lists: 'Curated rankings and collections of the best browser games. Top 10 lists, genre roundups, and hidden gems you need to try.',
  comparisons: 'Head-to-head game comparisons. See how your favorite browser games stack up against each other across features, gameplay, and fun factor.',
  articles: 'Browse gaming news, trends, and deep dives into browser gaming culture. Stay informed about the evolving world of free online games.',
};
const CAT_H1 = { guides: 'Game Guides & Tips', lists: 'Best Browser Games — Lists & Rankings', comparisons: 'Game Comparisons', articles: 'Gaming Articles & News' };

function cardImgUrl(slug, cat) {
  const cls = CAT_CLASS[cat] || 'guides';
  const colors = { guides: '5f3dc4/ede9fe', lists: 'c62828/fce4ec', comparisons: '1565c0/e3f2fd', articles: '2e7d32/e8f5e9' };
  return `https://placehold.co/600x400/${colors[cls]}?text=${encodeURIComponent(slug.split('-').slice(0,2).join(' '))}`;
}

function catBadge(cat) {
  const cls = CAT_CLASS[cat] || 'guides';
  return `<span class="cat-badge ${cls}">${CAT_EMOJI[cat]||'🎮'} ${cat}</span>`;
}

function cardHtml(post) {
  const cls = CAT_CLASS[post.category] || 'guides';
  const emoji = CAT_EMOJI[post.category] || '🎮';
  return `<article class="post-card" data-category="${post.category}">
<div class="card-img cat-bg-${cls}"><img src="${cardImgUrl(post.slug, post.category)}" alt="${post.title}" loading="lazy"><div class="card-img-overlay"><span class="card-emoji">${emoji}</span></div></div>
<div class="card-body">
${catBadge(post.category)}
<h3><a href="/blog/${post.slug}">${post.title}</a></h3>
<div class="meta"><span>${post.date}</span><span class="dot"></span><span>${post.readingTime || 3} min read</span></div>
<div class="excerpt">${post.excerpt}</div>
</div>
</article>`;
}

function featuredCard(post) {
  const cls = CAT_CLASS[post.category] || 'guides';
  const emoji = CAT_EMOJI[post.category] || '🎮';
  return `<div class="post-featured">
<div class="featured-img cat-bg-${cls}"><img src="${cardImgUrl(post.slug, post.category)}" alt="${post.title}"><div class="featured-img-overlay"><span class="featured-emoji">${emoji}</span></div></div>
<div class="featured-body">
<div class="featured-label">Featured Article</div>
${catBadge(post.category)}
<h2><a href="/blog/${post.slug}">${post.title}</a></h2>
<div class="meta"><span>${post.date}</span><span class="dot"></span><span>${post.readingTime || 3} min read</span></div>
<div class="excerpt">${post.excerpt}</div>
</div>
</div>`;
}

function ctaSection() {
  return `<div class="blog-cta"><div class="cta-inner"><h3>Ready to Play?</h3><p>Jump into hundreds of free browser games — no download, no sign-up, just click and play.</p><a href="/" class="cta-btn">Play Games Now →</a></div></div>`;
}

function pageHtml(listHtml, hasMore, page, cat, pageNum) {
  const isCat = cat && CAT_CLASS[cat];
  const loadMoreHtml = hasMore
    ? `<div class="load-more-wrap"><button class="load-more-btn" data-page="${page}"${isCat ? ' data-cat="' + (CAT_CLASS[cat] || '') + '"' : ''} onclick="loadMore(this)"><span class="spinner"></span><span class="btn-text">Load More Articles</span></button></div>`
    : '';
  const pageTitle = isCat ? `${CAT_H1[CAT_CLASS[cat]]} - BrowserGamesHQ` : 'Blog - BrowserGamesHQ';
  const pageDesc = isCat ? CAT_DESC[CAT_CLASS[cat]] : 'Game guides, tips, and lists at BrowserGamesHQ. Learn how to master your favorite browser games.';
  const catSchema = isCat ? categorySchema(cat) : '';
  const indexSchema = isCat ? '' : blogIndexSchema();
  const introHtml = isCat ? '' : blogIntroHtml();
  const breadcrumbHtml = isCat ? `<div class="breadcrumbs"><a href="/blog">Blog</a><span class="sep">/</span><span class="current">${cat}</span></div>` : '';
  const canonicalUrl = isCat ? `https://browsergameshq.com/blog/category/${CAT_CLASS[cat]}/` : 'https://browsergameshq.com/blog/';
  const robotsTag = pageNum > 1 ? '<meta name="robots" content="noindex,follow">\n' : '';
  const pagination = paginationHtml(pageNum || 1, cat ? totalForCat(cat) : posts.length, 12, cat);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pageTitle}</title>
<meta name="description" content="${pageDesc}">
${robotsTag}<link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/static/css/blog.css?v=20260725">
  ${webSiteSchema()}
  ${catSchema}
  ${indexSchema}
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.ADSENSE_CLIENT_ID || 'ca-pub-7128312414229788'}" crossorigin="anonymous"></script>
  <!-- Meta Pixel Code -->
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
  <!-- End Meta Pixel Code -->
  <script>
  (function(){var k='_bghtid',id=sessionStorage.getItem(k)||(Date.now().toString(36)+Math.random().toString(36).slice(2,6));sessionStorage.setItem(k,id);var g=function(s){try{var d=new Blob(['id='+encodeURIComponent(id)+(s||'')],{type:'application/x-www-form-urlencoded'});navigator.sendBeacon('/t',d)}catch(e){}};g('&page='+encodeURIComponent(location.pathname));setInterval(function(){g('')},8000);var ph=history.pushState,rh=history.replaceState;history.pushState=function(){ph.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};history.replaceState=function(){rh.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};window.addEventListener('popstate',function(){g('&page='+encodeURIComponent(location.pathname))});window.addEventListener('beforeunload',function(){g('&disconnect=1')})})();
  </script>
  </head>
<body>
<header class="blog-header">
<div class="inner">
<a href="/" class="logo">
<svg viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#6c5ce7"/><path d="M8 14l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
BrowserGamesHQ
</a>
<nav>
<a href="/" class="nav-cta">▶ Play Games</a>
<a href="/blog" class="active">Blog</a>
</nav>
</div>
</header>
<section class="blog-hero${isCat ? ' cat-hero cat-' + (CAT_CLASS[cat] || 'guides') : ''}">
<div class="inner">
${isCat ? `<div class="badge">${CAT_EMOJI[cat] || '🎮'} ${cat}</div><h1>${CAT_H1[CAT_CLASS[cat]]}</h1><p>${CAT_DESC[CAT_CLASS[cat]]}</p>` : '<div class="badge">Free Browser Gaming</div><h1>BrowserGamesHQ Blog</h1><p>Game guides, pro tips, hidden gems, and expert strategies to level up your browser gaming experience</p>'}
</div>
</section>
<div class="blog-container">
${breadcrumbHtml}
${introHtml}
<div id="post-list">${listHtml}</div>
${pagination}
${loadMoreHtml}
${ctaSection()}
</div>
<footer class="blog-footer">
<div class="footer-inner">
<div class="footer-links">
<a href="/">Home</a>
<a href="/blog">Blog</a>
<a href="/blog/popular">Popular</a>
<a href="/blog/category/guides">Guides</a>
<a href="/blog/category/lists">Lists</a>
<a href="/blog/category/comparisons">Comparisons</a>
<a href="/blog/category/articles">Articles</a>
</div>
<div class="footer-copy">&copy; 2026 BrowserGamesHQ — Free browser games for everyone</div>
</footer>
<script>
function loadMore(btn){
  const page = parseInt(btn.dataset.page);
  const cat = btn.dataset.cat || '';
  btn.classList.add('loading');
  fetch((cat ? '/blog/category/'+cat : '/blog')+'?page='+page+'&format=json')
    .then(r=>r.json())
    .then(d=>{
      const list = document.getElementById('post-list');
      let grid = list.querySelector('.post-grid');
      if(!grid){
        grid = document.createElement('div');
        grid.className = 'post-grid';
        list.appendChild(grid);
      }
      d.html.forEach(h=>{const t=document.createElement('template');t.innerHTML=h.trim();grid.appendChild(t.content.firstChild)});
      if(d.hasMore){
        btn.dataset.page = page + 1;
        btn.classList.remove('loading');
      } else {
        btn.remove();
      }
    })
    .catch(()=>{btn.classList.remove('loading');alert('Failed to load more articles.');});
}
</script>
</body>
</html>`;
}

function totalForCat(cat) {
  return posts.filter(p => p.category === cat).length;
}

function renderPostList(pagePosts, page, total, cat) {
  const perPage = 12;
  const totalPages = Math.ceil(total / perPage);
  const hasMore = page < totalPages;
  const cards = pagePosts.map(cardHtml).join('');

  let listHtml;
  if (page === 1) {
    const featured = pagePosts[0] ? featuredCard(pagePosts[0]) : '';
    const rest = pagePosts.slice(1).map(cardHtml).join('');
    listHtml = featured + (rest ? `<div class="post-grid">${rest}</div>` : '');
  } else {
    listHtml = `<div class="post-grid">${cards}</div>`;
  }

  return pageHtml(listHtml, hasMore, page + 1, cat, page);
}

function renderPostJson(pagePosts, page, total) {
  const perPage = 12;
  const totalPages = Math.ceil(total / perPage);
  return {
    html: pagePosts.map(cardHtml),
    hasMore: page < totalPages,
    page: page + 1,
  };
}

function extractKeywords(title) {
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','can','could','should','may','might','this','that','these','those','it','its','you','your','they','them','their','we','us','our','he','him','his','she','her','not','no','nor','so','as','all','each','every','both','few','more','most','some','any','about','into','over','after','before','between','under','above','below','up','down','out','off','just','also','very','too','how','what','why','when','where','which','who','whom','best','top','new','free','online','ultimate','guide','tips','tricks','games']);
  return title.replace(/[^a-zA-Z0-9\s-]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())).slice(0, 10).join(', ');
}

function tableOfContents(content) {
  const headings = content.match(/<h2>(.+?)<\/h2>/g);
  if (!headings || headings.length < 4) return '';
  const items = headings.map((h, i) => {
    const text = h.replace(/<\/?h2>/g, '');
    const id = 'toc-' + i + '-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return '<li><a href="#' + id + '">' + text + '</a></li>';
  }).join('\n');
  return '<div class="toc"><h3>Table of Contents</h3><ol>' + items + '</ol></div>';
}

function addHeadingIds(content) {
  let i = 0;
  return content.replace(/<h2>(.+?)<\/h2>/g, (m, text) => {
    const id = 'toc-' + i + '-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    i++;
    return '<h2 id="' + id + '">' + text + '</h2>';
  });
}

// Replace broken img.poki-cdn.com/placeholder-*.png URLs (HTTP 403) with working
// placehold.co equivalents so article images actually render. Blog content only.
function fixBrokenImages(content, category) {
  const colors = { guides: '5f3dc4/ede9fe', lists: 'c62828/fce4ec', comparisons: '1565c0/e3f2fd', articles: '2e7d32/e8f5e9' };
  const cls = CAT_CLASS[category] || 'guides';
  return content.replace(/https:\/\/img\.poki-cdn\.com\/cdn-cgi\/image\/[^"']*?placeholder-([a-z0-9-]+)\.png/g, (m, name) => {
    return 'https://placehold.co/800x400/' + colors[cls] + '?text=' + encodeURIComponent(name.split('-').slice(0, 2).join(' '));
  });
}

function socialShareButtons(slug, title) {
  const url = 'https://browsergameshq.com/blog/' + slug;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return '<div class="social-share"><span>Share this article:</span><a href="https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl + '" target="_blank" rel="noopener" class="share-twitter" aria-label="Share on Twitter"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17a4.77 4.77 0 0 0-8.13 4.35C7.5 9.4 4.26 7.73 2 5.12a4.77 4.77 0 0 0 1.48 6.38c-.77-.02-1.5-.24-2.14-.6v.06a4.77 4.77 0 0 0 3.83 4.68c-.7.2-1.44.22-2.16.08a4.77 4.77 0 0 0 4.45 3.32A9.57 9.57 0 0 1 0 20.57a13.5 13.5 0 0 0 7.32 2.15c8.78 0 13.58-7.28 13.58-13.58 0-.2 0-.42-.02-.63A9.7 9.7 0 0 0 24 6.56a9.5 9.5 0 0 1-2.54.7z"/></svg></a><a href="https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl + '" target="_blank" rel="noopener" class="share-facebook" aria-label="Share on Facebook"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a><a href="https://www.reddit.com/submit?url=' + encodedUrl + '&title=' + encodedTitle + '" target="_blank" rel="noopener" class="share-reddit" aria-label="Share on Reddit"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.74c.69 0 1.25.56 1.25 1.25a1.25 1.25 0 0 1-2.5 0c0-.69.56-1.25 1.25-1.25zm-3.77 4.9a1.89 1.89 0 0 1 1.89 1.89c0 .79-.5 1.47-1.2 1.73l.37.35a1.8 1.8 0 0 1 .5-.06c.54 0 1.05.2 1.44.59.38.38.59.9.59 1.44 0 .54-.2 1.05-.59 1.44-.39.38-.9.59-1.44.59-.54 0-1.05-.2-1.44-.59-.38-.38-.59-.9-.59-1.44 0-.2.03-.4.08-.6l-.68-.66a1.9 1.9 0 0 1-1.43.04 1.89 1.89 0 0 1-1.1-2.09l-1.4-.9a.3.3 0 0 1 .14-.56h.07l1.13.72a1.89 1.89 0 0 1 2.23-.53 1.9 1.9 0 0 1 1.07 1.27l.8-.8a1.88 1.88 0 0 1-.56-1.33c0-.7.38-1.3.94-1.62l-.72-1.14a.3.3 0 0 1 .24-.44h.07l1.28.8c.21-.1.44-.16.68-.16zm-7.62 2.73c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25a1.25 1.25 0 0 0 0-2.5zm3.74 1.85c-.32 0-.58.26-.58.58 0 .32.26.58.58.58.32 0 .58-.26.58-.58 0-.32-.26-.58-.58-.58zm-3.79 2.63c0-.32.26-.58.58-.58.32 0 .58.26.58.58 0 .32-.26.58-.58.58s-.58-.26-.58-.58zm1.26 1.74c0 .32.26.58.58.58.32 0 .58-.26.58-.58 0-.32-.26-.58-.58-.58s-.58.26-.58.58zm3.4-.89a1.29 1.29 0 0 0-1.28 1.28c0 .7.57 1.28 1.28 1.28.7 0 1.28-.57 1.28-1.28 0-.7-.57-1.28-1.28-1.28zm2.3-.65c-.32 0-.58.26-.58.58 0 .32.26.58.58.58.32 0 .58-.26.58-.58 0-.32-.26-.58-.58-.58zm0 2.36c-.32 0-.58.26-.58.58 0 .32.26.58.58.58.32 0 .58-.26.58-.58 0-.32-.26-.58-.58-.58zm-3.76.37h-.01c-.32 0-.58.26-.58.58 0 .32.26.58.58.58.32 0 .58-.26.58-.58 0-.32-.26-.58-.58-.58z"/></svg></a></div>';
}

function newsletterSection() {
  return '';
}

function howToSchema(post) {
  if (post.category !== 'Guides') return '';
  const steps = [];
  const headingMatches = post.content.match(/<h2>(.+?)<\/h2>/g);
  if (!headingMatches || headingMatches.length < 2) return '';
  headingMatches.forEach((h, i) => {
    const text = h.replace(/<\/?h2>/g, '');
    steps.push({ '@type': 'HowToStep', 'position': i + 1, 'name': text, 'itemListElement': { '@type': 'HowToDirection', 'text': text } });
  });
  return '<script type="application/ld+json">{"@context":"https://schema.org","@type":"HowTo","name":' + JSON.stringify(post.title) + ',"description":' + JSON.stringify(post.excerpt) + ',"step":' + JSON.stringify(steps) + '}</script>';
}

function faqSchema(post) {
  const qas = [];
  const parts = post.content.split(/(?=<h2>)/);
  for (const part of parts) {
    const qm = part.match(/<h2>(.+?)<\/h2>/);
    const am = part.match(/<p>(.+?)<\/p>/);
    if (qm && am) {
      qas.push({ question: qm[1].replace(/<[^>]+>/g, ''), answer: am[1].replace(/<[^>]+>/g, '') });
    }
  }
  if (!qas.length) return '';
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${qas.map(q => `{"@type":"Question","name":${JSON.stringify(q.question)},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(q.answer)}}}`).join(',')}]}</script>`;
}

function articleSchema(post) {
  const img = cardImgUrl(post.slug, post.category);
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":${JSON.stringify(post.title)},"description":${JSON.stringify(post.excerpt)},"image":${JSON.stringify(img)},"datePublished":"${post.date}","dateModified":"${post.date}","author":{"@type":"Organization","name":"BrowserGamesHQ","url":"https://browsergameshq.com"},"publisher":{"@type":"Organization","name":"BrowserGamesHQ","url":"https://browsergameshq.com","logo":{"@type":"ImageObject","url":"https://browsergameshq.com/logo.png"}},"mainEntityOfPage":{"@type":"WebPage","@id":"https://browsergameshq.com/blog/${post.slug}"}}</script>`;
}

function breadcrumbSchema(post) {
  const cls = CAT_CLASS[post.category] || 'guides';
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Blog","item":"https://browsergameshq.com/blog"},{"@type":"ListItem","position":2,"name":"${post.category}","item":"https://browsergameshq.com/blog/category/${cls}"},{"@type":"ListItem","position":3,"name":${JSON.stringify(post.title)},"item":"https://browsergameshq.com/blog/${post.slug}"}]}</script>`;
}

function webSiteSchema() {
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"BrowserGamesHQ","url":"https://browsergameshq.com","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://browsergameshq.com/search?q={search_term_string}"},"query-input":"required name=search_term_string"}}</script>`;
}

function categorySchema(cat) {
  const cls = CAT_CLASS[cat] || 'guides';
  const desc = CAT_DESC[cls] || 'Browser game guides and tips';
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"${CAT_H1[cls]} - BrowserGamesHQ","description":"${desc}","url":"https://browsergameshq.com/blog/category/${cls}","breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Blog","item":"https://browsergameshq.com/blog"},{"@type":"ListItem","position":2,"name":"${cat}","item":"https://browsergameshq.com/blog/category/${cls}"}]},"mainEntity":{"@type":"ItemList","itemListElement":[${posts.filter(p => p.category === cat).slice(0, 10).map((p, i) => `{"@type":"ListItem","position":${i + 1},"url":"https://browsergameshq.com/blog/${p.slug}"}`).join(',')}]}}</script>`;
}

function blogIndexSchema() {
  const featured = posts.slice(0, 20);
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Blog","name":"BrowserGamesHQ Blog","url":"https://browsergameshq.com/blog/","description":"Game guides, pro tips, reviews, and curated lists for free browser games.","publisher":{"@type":"Organization","name":"BrowserGamesHQ","url":"https://browsergameshq.com"},"blogPost":[${featured.map(p => `{"@type":"BlogPosting","headline":${JSON.stringify(p.title)},"url":"https://browsergameshq.com/blog/${p.slug}","datePublished":"${p.date}"}`).join(',')}]}</script>`;
}

function blogIntroHtml() {
  return `<section class="blog-intro">
<h2>Your Hub for Free Browser Game Guides, Tips and Reviews</h2>
<p>Welcome to the <strong>BrowserGamesHQ blog</strong> — the go-to resource for players who love free browser games. Every week we publish in-depth <a href="/blog/category/guides">game guides</a>, <a href="/blog/category/lists">curated lists</a>, honest <a href="/blog/category/comparisons">comparisons</a>, and fresh <a href="/blog/category/articles">articles</a> about the best HTML5 games you can play instantly in your browser.</p>
<p>From action-packed shooters and physics sandboxes to io games, racing sims, dress-up titles, and brain-bending puzzles, our writers break down how to play, master the controls, and win. Whether you are a casual player looking for something fun to play at school or a competitive gamer chasing high scores, you will find step-by-step tutorials and expert-level tips to level up your sessions.</p>
<p>All of the games we cover are <strong>100% free</strong>, run in any modern browser, and need no download or installation — so you can start playing in seconds. Bookmark this page and check back often: new guides are added every single day.</p>
<div class="blog-cat-nav">
<a href="/blog/category/guides" class="cat-nav-link guides">🎮 Guides</a>
<a href="/blog/category/lists" class="cat-nav-link lists">📋 Lists</a>
<a href="/blog/category/comparisons" class="cat-nav-link comparisons">⚖️ Comparisons</a>
<a href="/blog/category/articles" class="cat-nav-link articles">📝 Articles</a>
</div>
<div class="blog-editorial">
<h3>Why Trust Our Guides</h3>
<p>Every guide on BrowserGamesHQ is written by people who actually play the game, test the controls, and verify what works on a standard keyboard, mouse, and touchscreen. We do not copy-paste specs from other sites — we focus on the things that matter to a real player: <strong>how to start quickly, which controls actually work, and what habits make you improve fastest</strong>. Where a game changes, we update the guide so you are never reading stale advice.</p>
<p>If you are new here, the fastest way to get value is to open the guide for any game you are curious about and jump straight to the <em>controls</em> section — then look for the <em>pro tips</em> inside each guide before you play your first round. Curious which games other readers keep coming back to? Browse the <a href="/blog/popular">most popular articles</a>, or filter by what you feel like playing today.</p>
</div>
</section>`;
}

function paginationHtml(page, total, perPage, cat) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return '';
  const base = cat ? `/blog/category/${CAT_CLASS[cat]}` : '/blog';
  const prev = page > 1 ? `<a class="pg-prev" href="${base}?page=${page - 1}">‹ Prev</a>` : '';
  const next = page < totalPages ? `<a class="pg-next" href="${base}?page=${page + 1}">Next ›</a>` : '';
  const nums = [];
  const win = [];
  const push = i => {
    if (win.length && win[win.length - 1] === i - 1) { if (win[win.length - 1] !== i) win.push(i); }
    else { if (win[win.length - 1] !== i - 1 && win.length) win.push('…'); win.push(i); }
  };
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) push(i);
  }
  for (const i of win) {
    if (i === '…') nums.push('<span class="pg-ellipsis">…</span>');
    else if (i === page) nums.push(`<span class="pg-num current">${i}</span>`);
    else nums.push(`<a class="pg-num" href="${base}?page=${i}">${i}</a>`);
  }
  return `<nav class="pagination" aria-label="Blog pages">${prev}${nums.join('')}${next}</nav>`;
}

function peopleAlsoAsk(post) {
  const qas = [];
  const parts = post.content.split(/(?=<h2>)/);
  for (const part of parts) {
    const qm = part.match(/<h2>(.+?)<\/h2>/);
    const am = part.match(/<p>(.+?)<\/p>/);
    if (qm && am) {
      qas.push({ q: qm[1].replace(/<[^>]+>/g, ''), a: am[1].replace(/<[^>]+>/g, '') });
    }
  }
  if (!qas.length) return '';
  const items = qas.slice(0, 4).map(qa => `<div class="paq-item"><details><summary>${qa.q}</summary><p>${qa.a}</p></details></div>`).join('');
  return `<div class="paq-section"><h3>People Also Ask</h3>${items}</div>`;
}

function renderPostPage(post, allPosts) {
  const cls = CAT_CLASS[post.category] || 'guides';
  const keywords = extractKeywords(post.title);
  const sameCat = allPosts.filter(p => p.category === post.category && p.slug !== post.slug).slice(0, 4);
  const relatedHtml = sameCat.length
    ? `<div class="related-posts"><h3>More ${post.category}</h3><div class="related-grid">${sameCat.map(p =>
        `<div class="related-card"><div class="rc-cat ${cls}">${post.category}</div><h4><a href="/blog/${p.slug}">${p.title}</a></h4><div class="rc-meta">${p.date} · ${p.readingTime || 3} min</div></div>`
      ).join('')}</div></div>`
    : '';
  const toc = tableOfContents(post.content);
  const contentWithIds = fixBrokenImages(addHeadingIds(post.content), post.category);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${post.title} - BrowserGamesHQ</title>
<meta name="description" content="${post.excerpt}">
<meta name="keywords" content="${keywords}">
<link rel="canonical" href="https://browsergameshq.com/blog/${post.slug}">
<meta property="og:title" content="${post.title}">
<meta property="og:description" content="${post.excerpt}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://browsergameshq.com/blog/${post.slug}">
<meta property="og:image" content="${cardImgUrl(post.slug, post.category)}">
<meta property="og:site_name" content="BrowserGamesHQ">
<meta property="article:published_time" content="${post.date}">
<meta property="article:modified_time" content="${post.date}">
<meta property="article:author" content="BrowserGamesHQ">
<meta property="article:tag" content="${post.category}">
<meta property="article:tag" content="browser games">
<meta property="article:tag" content="free online games">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${post.title}">
<meta name="twitter:description" content="${post.excerpt}">
<meta name="twitter:image" content="${cardImgUrl(post.slug, post.category)}">
  <link rel="stylesheet" href="/static/css/blog.css?v=20260725">
  ${faqSchema(post)}
  ${articleSchema(post)}
  ${breadcrumbSchema(post)}
  ${howToSchema(post)}
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.ADSENSE_CLIENT_ID || 'ca-pub-7128312414229788'}" crossorigin="anonymous"></script>
  <!-- Meta Pixel Code -->
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
  <!-- End Meta Pixel Code -->
  <script>
  (function(){var k='_bghtid',id=sessionStorage.getItem(k)||(Date.now().toString(36)+Math.random().toString(36).slice(2,6));sessionStorage.setItem(k,id);var g=function(s){try{var d=new Blob(['id='+encodeURIComponent(id)+(s||'')],{type:'application/x-www-form-urlencoded'});navigator.sendBeacon('/t',d)}catch(e){}};g('&page='+encodeURIComponent(location.pathname));setInterval(function(){g('')},8000);var ph=history.pushState,rh=history.replaceState;history.pushState=function(){ph.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};history.replaceState=function(){rh.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};window.addEventListener('popstate',function(){g('&page='+encodeURIComponent(location.pathname))});window.addEventListener('beforeunload',function(){g('&disconnect=1')})})();
  </script>
  </head>
<body>
<header class="blog-header">
<div class="inner">
<a href="/" class="logo">
<svg viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#6c5ce7"/><path d="M8 14l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
BrowserGamesHQ
</a>
<nav>
<a href="/" class="nav-cta">▶ Play Games</a>
<a href="/blog">Blog</a>
</nav>
</div>
</header>
<div class="blog-container">
<div class="breadcrumbs">
<a href="/blog">Blog</a>
<span class="sep">/</span>
<a href="/blog/category/${cls}">${post.category}</a>
<span class="sep">/</span>
<span class="current">${post.title.substring(0, 60)}${post.title.length > 60 ? '...' : ''}</span>
</div>
<a href="/blog" class="back-link">&larr; Back to Blog</a>
<article class="post-article">
<div class="article-header">
<div class="article-label ${cls}">${post.category}</div>
<h1>${post.title}</h1>
<div class="article-meta">
<span>${post.date}</span>
<span class="dot"></span>
<span>${post.readingTime || 3} min read</span>
</div>
</div>
<div class="article-body">${toc}${contentWithIds}</div>
${socialShareButtons(post.slug, post.title)}
${peopleAlsoAsk(post)}
${relatedHtml}
${newsletterSection()}
${ctaSection()}
</article>
</div>
<footer class="blog-footer">
<div class="footer-inner">
<div class="footer-links">
<a href="/">Home</a>
<a href="/blog">Blog</a>
<a href="/blog/popular">Popular</a>
<a href="/blog/category/guides">Guides</a>
<a href="/blog/category/lists">Lists</a>
<a href="/blog/category/comparisons">Comparisons</a>
<a href="/blog/category/articles">Articles</a>
</div>
<div class="footer-copy">&copy; 2026 BrowserGamesHQ — Free browser games for everyone</div>
</footer>
</body>
</html>`;
}

function blogRouter(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const format = url.searchParams.get('format') || 'html';

  // Popular page: /blog/popular — top posts by content depth
  if (path === '/blog/popular' || path === '/blog/popular/') {
    const popular = posts.slice().sort((a, b) => {
      const aH2 = (a.content.match(/<h2>/g) || []).length;
      const bH2 = (b.content.match(/<h2>/g) || []).length;
      return bH2 - aH2 || (b.readingTime || 3) - (a.readingTime || 3);
    });
    const perPage = 12;
    const start = (page - 1) * perPage;
    const pagePosts = popular.slice(start, start + perPage);
    if (format === 'json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(renderPostJson(pagePosts, page, popular.length)));
      return true;
    }
    const totalPages = Math.ceil(popular.length / perPage);
    const hasMore = page < totalPages;
    let listHtml;
    if (page === 1) {
      const featured = popular[0] ? featuredCard(popular[0]) : '';
      const rest = pagePosts.slice(1).map(cardHtml).join('');
      listHtml = featured + (rest ? `<div class="post-grid">${rest}</div>` : '');
    } else {
      listHtml = `<div class="post-grid">${pagePosts.map(cardHtml).join('')}</div>`;
    }
    const pageTitle = 'Popular Articles - BrowserGamesHQ';
    const pageDesc = 'The most popular and comprehensive browser game guides, tips, and articles on BrowserGamesHQ.';
    const popRobotsTag = page > 1 ? '<meta name="robots" content="noindex,follow">\n' : '';
    const breadcrumbHtml = '<div class="breadcrumbs"><a href="/blog">Blog</a><span class="sep">/</span><span class="current">Popular</span></div>';
    const loadMoreHtml = hasMore ? `<div class="load-more-wrap"><button class="load-more-btn" data-page="${page + 1}" data-popular="1" onclick="loadMore(this)"><span class="spinner"></span><span class="btn-text">Load More Articles</span></button></div>` : '';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pageTitle}</title>
<meta name="description" content="${pageDesc}">
${popRobotsTag}<link rel="canonical" href="https://browsergameshq.com/blog/popular">
  <link rel="stylesheet" href="/static/css/blog.css?v=20260725">
  ${webSiteSchema()}
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.ADSENSE_CLIENT_ID || 'ca-pub-7128312414229788'}" crossorigin="anonymous"></script>
  <script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','2002475273742428');fbq('track','PageView');</script>
  <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=2002475273742428&ev=PageView&noscript=1"/></noscript>
  <script>(function(){var k='_bghtid',id=sessionStorage.getItem(k)||(Date.now().toString(36)+Math.random().toString(36).slice(2,6));sessionStorage.setItem(k,id);var g=function(s){try{var d=new Blob(['id='+encodeURIComponent(id)+(s||'')],{type:'application/x-www-form-urlencoded'});navigator.sendBeacon('/t',d)}catch(e){}};g('&page='+encodeURIComponent(location.pathname));setInterval(function(){g('')},8000);var ph=history.pushState,rh=history.replaceState;history.pushState=function(){ph.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};history.replaceState=function(){rh.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};window.addEventListener('popstate',function(){g('&page='+encodeURIComponent(location.pathname))});window.addEventListener('beforeunload',function(){g('&disconnect=1')})})();</script>
</head>
<body>
<header class="blog-header"><div class="inner"><a href="/" class="logo"><svg viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#6c5ce7"/><path d="M8 14l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>BrowserGamesHQ</a><nav><a href="/" class="nav-cta">▶ Play Games</a><a href="/blog">Blog</a></nav></div></header>
<section class="blog-hero"><div class="inner"><div class="badge">Most Read</div><h1>Popular Articles</h1><p>The most comprehensive guides, tips, and articles chosen by our readers.</p></div></section>
<div class="blog-container">${breadcrumbHtml}<div id="post-list">${listHtml}</div>${loadMoreHtml}${ctaSection()}</div>
<footer class="blog-footer"><div class="footer-inner"><div class="footer-links"><a href="/">Home</a><a href="/blog">Blog</a><a href="/blog/popular">Popular</a><a href="/blog/category/guides">Guides</a><a href="/blog/category/lists">Lists</a><a href="/blog/category/comparisons">Comparisons</a><a href="/blog/category/articles">Articles</a></div><div class="footer-copy">&copy; 2026 BrowserGamesHQ — Free browser games for everyone</div></div></footer>
<script>function loadMore(btn){const page=parseInt(btn.dataset.page);const popular=btn.dataset.popular||'';btn.classList.add('loading');fetch((popular?'/blog/popular':'/blog')+'?page='+page+'&format=json').then(r=>r.json()).then(d=>{const list=document.getElementById('post-list');let grid=list.querySelector('.post-grid');if(!grid){grid=document.createElement('div');grid.className='post-grid';list.appendChild(grid)}d.html.forEach(h=>{const t=document.createElement('template');t.innerHTML=h.trim();grid.appendChild(t.content.firstChild)});if(d.hasMore){btn.dataset.page=page+1;btn.classList.remove('loading')}else{btn.remove()}}).catch(()=>{btn.classList.remove('loading')})}</script>
</body>
</html>`);
    return true;
  }

  // Category pages: /blog/category/guides, /blog/category/lists, etc
  const catMatch = path.match(/^\/blog\/category\/(guides|lists|comparisons|articles)\/?$/);
  if (catMatch) {
    const catKey = catMatch[1];
    const catName = Object.keys(CAT_CLASS).find(k => CAT_CLASS[k] === catKey);
    const filtered = posts.filter(p => p.category === catName);
    const perPage = 12;
    const start = (page - 1) * perPage;
    const pagePosts = filtered.slice(start, start + perPage);

    if (format === 'json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ html: pagePosts.map(cardHtml), hasMore: page < Math.ceil(filtered.length / perPage), page: page + 1 }));
      return true;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPostList(pagePosts, page, filtered.length, catName));
    return true;
  }

  if (path === '/blog' || path === '/blog/') {
    const perPage = 12;
    const start = (page - 1) * perPage;
    const pagePosts = posts.slice(start, start + perPage);

    if (format === 'json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(renderPostJson(pagePosts, page, posts.length)));
      return true;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPostList(pagePosts, page, posts.length));
    return true;
  }

  const match = path.match(/^\/blog\/([a-z0-9-]+)\/?$/);
  if (match) {
    const slug = match[1];
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><title>404 - BrowserGamesHQ</title><link rel="stylesheet" href="/static/css/blog.css?v=20260725"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.ADSENSE_CLIENT_ID || 'ca-pub-7128312414229788'}" crossorigin="anonymous"></script><!-- Meta Pixel Code --><script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','2002475273742428');fbq('track','PageView');</script><noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=2002475273742428&ev=PageView&noscript=1"/></noscript><!-- End Meta Pixel Code --><script>(function(){var k='_bghtid',id=sessionStorage.getItem(k)||(Date.now().toString(36)+Math.random().toString(36).slice(2,6));sessionStorage.setItem(k,id);var g=function(s){try{var d=new Blob(['id='+encodeURIComponent(id)+(s||'')],{type:'application/x-www-form-urlencoded'});navigator.sendBeacon('/t',d)}catch(e){}};g('&page='+encodeURIComponent(location.pathname));setInterval(function(){g('')},8000);var ph=history.pushState,rh=history.replaceState;history.pushState=function(){ph.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};history.replaceState=function(){rh.apply(history,arguments);g('&page='+encodeURIComponent(location.pathname))};window.addEventListener('popstate',function(){g('&page='+encodeURIComponent(location.pathname))});window.addEventListener('beforeunload',function(){g('&disconnect=1')})})();</script></head><body><div class="not-found"><h1>404</h1><p>Article not found. It may have been moved or deleted.</p><a href="/blog" class="back-link" style="margin:0 auto">&larr; Back to Blog</a></div></body></html>`);
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPostPage(post, posts));
    return true;
  }

  return false;
}

module.exports = blogRouter;
