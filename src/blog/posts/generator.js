function readingTime(content) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function post(slug, title, date, category, excerpt, content) {
  return { slug, title, date, category, excerpt, content, readingTime: readingTime(content) };
}

module.exports = { post, readingTime };
