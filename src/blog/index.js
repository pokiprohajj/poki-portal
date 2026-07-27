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

function pageHtml(listHtml, hasMore, page, cat) {
  const loadMoreHtml = hasMore
    ? `<div class="load-more-wrap"><button class="load-more-btn" data-page="${page}"${isCat ? ' data-cat="' + (CAT_CLASS[cat] || '') + '"' : ''} onclick="loadMore(this)"><span class="spinner"></span><span class="btn-text">Load More Articles</span></button></div>`
    : '';
  const isCat = cat && CAT_CLASS[cat];
  const pageTitle = isCat ? `${CAT_H1[CAT_CLASS[cat]]} - BrowserGamesHQ` : 'Blog - BrowserGamesHQ';
  const pageDesc = isCat ? CAT_DESC[CAT_CLASS[cat]] : 'Game guides, tips, and lists at BrowserGamesHQ. Learn how to master your favorite browser games.';
  const catSchema = isCat ? categorySchema(cat) : '';
  const breadcrumbHtml = isCat ? `<div class="breadcrumbs"><a href="/blog">Blog</a><span class="sep">/</span><span class="current">${cat}</span></div>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pageTitle}</title>
<meta name="description" content="${pageDesc}">
  <link rel="stylesheet" href="/static/css/blog.css?v=20260725">
  ${webSiteSchema()}
  ${catSchema}
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
<div id="post-list">${listHtml}</div>
${loadMoreHtml}
${ctaSection()}
</div>
<footer class="blog-footer">
<div class="footer-inner">
<div class="footer-links">
<a href="/">Home</a>
<a href="/blog">Blog</a>
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

  return pageHtml(listHtml, hasMore, page + 1, cat);
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
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Blog","item":"https://browsergameshq.com/blog"},{"@type":"ListItem","position":2,"name":"${post.category}","item":"https://browsergameshq.com/blog"},{"@type":"ListItem","position":3,"name":${JSON.stringify(post.title)},"item":"https://browsergameshq.com/blog/${post.slug}"}]}</script>`;
}

function webSiteSchema() {
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"BrowserGamesHQ","url":"https://browsergameshq.com","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://browsergameshq.com/search?q={search_term_string}"},"query-input":"required name=search_term_string"}}</script>`;
}

function categorySchema(cat) {
  const cls = CAT_CLASS[cat] || 'guides';
  const desc = CAT_DESC[cls] || 'Browser game guides and tips';
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"${CAT_H1[cls]} - BrowserGamesHQ","description":"${desc}","url":"https://browsergameshq.com/blog/category/${cls}","breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Blog","item":"https://browsergameshq.com/blog"},{"@type":"ListItem","position":2,"name":"${cat}","item":"https://browsergameshq.com/blog/category/${cls}"}]},"mainEntity":{"@type":"ItemList","itemListElement":[${posts.filter(p => p.category === cat).slice(0, 10).map((p, i) => `{"@type":"ListItem","position":${i + 1},"url":"https://browsergameshq.com/blog/${p.slug}"}`).join(',')}]}}</script>`;
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
  const sameCat = allPosts.filter(p => p.category === post.category && p.slug !== post.slug).slice(0, 4);
  const relatedHtml = sameCat.length
    ? `<div class="related-posts"><h3>More ${post.category}</h3><div class="related-grid">${sameCat.map(p =>
        `<div class="related-card"><div class="rc-cat ${cls}">${post.category}</div><h4><a href="/blog/${p.slug}">${p.title}</a></h4><div class="rc-meta">${p.date} · ${p.readingTime || 3} min</div></div>`
      ).join('')}</div></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${post.title} - BrowserGamesHQ</title>
<meta name="description" content="${post.excerpt}">
<meta property="og:title" content="${post.title}">
<meta property="og:description" content="${post.excerpt}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://browsergameshq.com/blog/${post.slug}">
<meta property="og:image" content="${cardImgUrl(post.slug, post.category)}">
<meta property="article:published_time" content="${post.date}">
<meta property="article:modified_time" content="${post.date}">
<meta property="article:author" content="BrowserGamesHQ">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${cardImgUrl(post.slug, post.category)}">
  <link rel="stylesheet" href="/static/css/blog.css?v=20260725">
  ${faqSchema(post)}
  ${articleSchema(post)}
  ${breadcrumbSchema(post)}
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
<div class="article-body">${post.content}</div>
${peopleAlsoAsk(post)}
${relatedHtml}
${ctaSection()}
</article>
</div>
<footer class="blog-footer">
<div class="footer-inner">
<div class="footer-links">
<a href="/">Home</a>
<a href="/blog">Blog</a>
<a href="/blog/category/guides">Guides</a>
<a href="/blog/category/lists">Lists</a>
<a href="/blog/category/comparisons">Comparisons</a>
<a href="/blog/category/articles">Articles</a>
</div>
<div class="footer-copy">&copy; 2026 BrowserGamesHQ — Free browser games for everyone</div>
</div>
</footer>
</body>
</html>`;
}

function blogRouter(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const format = url.searchParams.get('format') || 'html';

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
