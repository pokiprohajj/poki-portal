const posts = require('./posts');

const CAT_EMOJI = { Guides: '🎮', Lists: '📋', Comparisons: '⚖️', Articles: '📝' };
const CAT_CLASS = { Guides: 'guides', Lists: 'lists', Comparisons: 'comparisons', Articles: 'articles' };

function catBadge(cat) {
  const cls = CAT_CLASS[cat] || 'guides';
  return `<span class="category-badge ${cls}">${cat}</span>`;
}

function featuredHtml(post, small) {
  const emoji = CAT_EMOJI[post.category] || '🎮';
  return `<div class="post-featured cat-${post.category}"><div class="overlay"></div><span class="emoji">${emoji}</span></div>`;
}

function postCard(post) {
  return `<article class="post-card">
${featuredHtml(post)}
<div class="card-body">
${catBadge(post.category)}
<h2><a href="/blog/${post.slug}">${post.title}</a></h2>
<div class="post-meta"><span>${post.date}</span><span class="dot"></span><span>${post.readingTime || 3} min read</span></div>
<div class="excerpt">${post.excerpt}</div>
</div>
</article>`;
}

function renderPagination(page, totalPages) {
  let html = '<div class="pagination">';
  if (page > 1) html += `<a href="/blog?page=${page-1}">&laquo; Prev</a>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === page) html += `<span class="active">${i}</span>`;
    else if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) html += `<a href="/blog?page=${i}">${i}</a>`;
    else if (Math.abs(i - page) === 3) html += `<span>...</span>`;
  }
  if (page < totalPages) html += `<a href="/blog?page=${page+1}">Next &raquo;</a>`;
  html += '</div>';
  return html;
}

function renderPostList(posts, page) {
  const perPage = 12;
  const totalPages = Math.ceil(posts.length / perPage);
  const start = (page - 1) * perPage;
  const pagePosts = posts.slice(start, start + perPage);
  const cards = pagePosts.map(postCard).join('');
  const pagination = totalPages > 1 ? renderPagination(page, totalPages) : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Blog - BrowserGamesHQ</title>
<meta name="description" content="Game guides, tips, and lists at BrowserGamesHQ. Learn how to master your favorite browser games.">
<link rel="stylesheet" href="/css/blog.css">
</head>
<body>
<header class="blog-header">
<div class="inner">
<a href="/" class="logo">BrowserGamesHQ</a>
<nav>
<a href="/">Home</a>
<a href="/blog">Blog</a>
</nav>
</div>
</header>
<section class="blog-hero">
<h1>BrowserGamesHQ Blog</h1>
<p>Game guides, hidden gems, and pro tips to level up your browser gaming</p>
</section>
<div class="blog-container">
<div class="search-bar">
<input type="text" placeholder="Search articles..." aria-label="Search blog posts">
<button>Search</button>
</div>
<div class="post-grid">${cards}</div>
${pagination}
</div>
<footer class="blog-footer">
<p>&copy; 2026 BrowserGamesHQ &mdash; Free browser games for everyone &middot; <a href="/">Home</a> &middot; <a href="/blog">Blog</a></p>
</footer>
</body>
</html>`;
}

function renderRelated(post, allPosts) {
  const sameCat = allPosts.filter(p => p.category === post.category && p.slug !== post.slug).slice(0, 4);
  if (!sameCat.length) return '';
  const cards = sameCat.map(p => `<div class="related-card"><div class="cat">${p.category}</div><h4><a href="/blog/${p.slug}">${p.title}</a></h4></div>`).join('');
  return `<div class="related-posts"><h3>More ${post.category}</h3><div class="related-grid">${cards}</div></div>`;
}

function renderPost(post, allPosts) {
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
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/css/blog.css">
</head>
<body>
<header class="blog-header">
<div class="inner">
<a href="/" class="logo">BrowserGamesHQ</a>
<nav>
<a href="/">Home</a>
<a href="/blog">Blog</a>
</nav>
</div>
</header>
<div class="blog-container">
<div class="breadcrumbs"><a href="/blog">Blog</a> <span>/</span> ${catBadge(post.category)} <span>/</span> <span>${post.title}</span></div>
<a href="/blog" class="back-link">&larr; Back to Blog</a>
<article class="post-article">
<div class="article-header">
${catBadge(post.category)}
<h1>${post.title}</h1>
<div class="article-meta"><span>${post.date}</span><span class="dot"></span><span>${post.readingTime || 3} min read</span></div>
</div>
${post.content}
${renderRelated(post, allPosts)}
</article>
</div>
<footer class="blog-footer">
<p>&copy; 2026 BrowserGamesHQ &mdash; Free browser games for everyone &middot; <a href="/">Home</a> &middot; <a href="/blog">Blog</a></p>
</footer>
</body>
</html>`;
}

function blogRouter(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

  if (path === '/blog') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPostList(posts, page));
    return true;
  }

  const match = path.match(/^\/blog\/([a-z0-9-]+)\/?$/);
  if (match) {
    const slug = match[1];
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!DOCTYPE html><html><head><title>404 - BrowserGamesHQ</title><link rel="stylesheet" href="/css/blog.css"></head><body><div class="blog-container" style="text-align:center;padding:4rem 1.5rem"><h1>404</h1><p>Article not found.</p><a href="/blog" class="back-link">&larr; Back to Blog</a></div></body></html>');
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPost(post, posts));
    return true;
  }

  return false;
}

module.exports = blogRouter;
