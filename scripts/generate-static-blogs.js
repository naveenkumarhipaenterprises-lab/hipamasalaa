const fs = require('fs');
const path = require('path');

const blogsDataRaw = fs.readFileSync(path.join(__dirname, '..', 'js', 'blog-data.js'), 'utf8');
const fakeWindow = {};
Function('window', blogsDataRaw)(fakeWindow);
const blogs = fakeWindow.HIPA_BLOGS;

const template = fs.readFileSync(path.join(__dirname, '..', 'blog-details.html'), 'utf8');

const blogDir = path.join(__dirname, '..', 'blog');
if (!fs.existsSync(blogDir)) {
  fs.mkdirSync(blogDir, { recursive: true });
}

blogs.forEach(blog => {
  let html = template;

  // Fix relative asset paths for /blog/ subdirectory
  html = html.replace(/href="css\//g, 'href="../css/');
  html = html.replace(/src="css\//g, 'src="../css/');
  html = html.replace(/src="assets\//g, 'src="../assets/');
  html = html.replace(/href="assets\//g, 'href="../assets/');
  html = html.replace(/src="js\//g, 'src="../js/');
  html = html.replace(/href="index\.html/g, 'href="../index.html');
  html = html.replace(/href="shop\.html/g, 'href="../shop.html');
  html = html.replace(/href="b2b-bulk-supply\.html/g, 'href="../b2b-bulk-supply.html');
  html = html.replace(/href="about\.html/g, 'href="../about.html');
  html = html.replace(/href="contact\.html/g, 'href="../contact.html');
  html = html.replace(/href="wishlist\.html/g, 'href="../wishlist.html');
  html = html.replace(/href="cart\.html/g, 'href="../cart.html');
  html = html.replace(/href="login\.html/g, 'href="../login.html');
  html = html.replace(/href="faq\.html/g, 'href="../faq.html');
  html = html.replace(/href="shipping-policy\.html/g, 'href="../shipping-policy.html');
  html = html.replace(/href="return-refund-policy\.html/g, 'href="../return-refund-policy.html');
  html = html.replace(/href="privacy-policy\.html/g, 'href="../privacy-policy.html');
  html = html.replace(/href="terms-and-conditions\.html/g, 'href="../terms-and-conditions.html');
  html = html.replace(/href="cookie-policy\.html/g, 'href="../cookie-policy.html');
  html = html.replace(/href="blog\.html/g, 'href="../blog.html');

  // Replace Title & Meta
  html = html.replace(/<title id="pageTitle">.*?<\/title>/, `<title>${blog.seoTitle || blog.title} | HIPA Masalas</title>`);
  html = html.replace(/<meta name="description" id="pageMetaDesc" content=".*?">/, `<meta name="description" content="${blog.seoDescription}">`);
  html = html.replace(/<link rel="canonical" id="pageCanonical" href=".*?">/, `<link rel="canonical" href="${blog.canonical || ('https://www.hipamasalas.com/blog/' + blog.slug)}">`);
  html = html.replace(/<meta property="og:title" id="ogTitle" content=".*?">/, `<meta property="og:title" content="${blog.title}">`);
  html = html.replace(/<meta property="og:description" id="ogDesc" content=".*?">/, `<meta property="og:description" content="${blog.seoDescription}">`);
  html = html.replace(/<meta property="og:image" id="ogImage" content=".*?">/, `<meta property="og:image" content="../${blog.coverImage}">`);

  // Pre-render content inside articleRenderTarget
  // Update internal image paths to ../assets/images/blog/
  let content = blog.contentHtml.replace(/src="assets\//g, 'src="../assets/');
  
  html = html.replace(
    '<div id="articleRenderTarget">\n          <!-- Rendered dynamically -->\n        </div>',
    `<div id="articleRenderTarget"><div class="blog-content">${content}</div></div>`
  );

  html = html.replace(
    '<span id="breadcrumbCurrent" style="color:var(--text-dark);">Article</span>',
    `<span id="breadcrumbCurrent" style="color:var(--text-dark);">${blog.title}</span>`
  );

  // Pre-render related blogs
  const others = blogs.filter(b => b.slug !== blog.slug).slice(0, 3);
  const relatedHtml = others.map(b => `
    <article class="blog-card">
      <a href="${b.slug}.html" class="blog-card-media" aria-label="Read ${b.title}">
        <img class="blog-card-img" src="../${b.coverImage}" alt="${b.coverAlt}" loading="lazy">
        <span class="blog-card-tag">Buyer Guide</span>
      </a>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span>${b.readTime}</span>
          <span>•</span>
          <span>${b.author}</span>
        </div>
        <h3 class="blog-card-title">
          <a href="${b.slug}.html">${b.title}</a>
        </h3>
        <p class="blog-card-excerpt">${b.intro}</p>
        <div class="blog-card-footer">
          <a href="${b.slug}.html">Read Guide &rarr;</a>
        </div>
      </div>
    </article>
  `).join('');

  html = html.replace(
    '<div class="blog-grid" id="relatedBlogsContainer"></div>',
    `<div class="blog-grid" id="relatedBlogsContainer">${relatedHtml}</div>`
  );

  const targetFile = path.join(blogDir, blog.slug + '.html');
  fs.writeFileSync(targetFile, html, 'utf8');
  console.log('Created dedicated blog page:', targetFile);
});
