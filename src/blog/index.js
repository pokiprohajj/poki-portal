const posts = require('./posts');

function renderPostList(posts) {
  const cards = posts.map(p => `
    <article class="post-card">
      <div class="card-body">
        <div class="category">${p.category}</div>
        <h2><a href="/blog/${p.slug}">${p.title}</a></h2>
        <div class="date">${p.date}</div>
        <div class="excerpt">${p.excerpt}</div>
      </div>
    </article>
  `).join('');
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
<div class="post-grid">${cards}</div>
</div>
<footer class="blog-footer">
<p>&copy; 2026 BrowserGamesHQ &mdash; Free browser games for everyone</p>
</footer>
</body>
</html>`;
}

function renderPost(post) {
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
<a href="/blog" class="back-link">&larr; Back to Blog</a>
<article class="post-article">
<div class="article-header">
<div class="category">${post.category}</div>
<h1>${post.title}</h1>
<div class="date">${post.date}</div>
</div>
${post.content}
</article>
</div>
<footer class="blog-footer">
<p>&copy; 2026 BrowserGamesHQ &mdash; Free browser games for everyone</p>
</footer>
</body>
</html>`;
}

function blogRouter(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (path === '/blog') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPostList(posts));
    return true;
  }

  const match = path.match(/^\/blog\/([a-z0-9-]+)\/?$/);
  if (match) {
    const slug = match[1];
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Post Not Found</h1><a href="/blog">Back to blog</a>');
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPost(post));
    return true;
  }

  return false;
}

module.exports = blogRouter;
