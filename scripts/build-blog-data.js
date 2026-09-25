const fs = require('fs');
const path = require('path');

const files = [
  '01-best-masala-manufacturer-in-chennai.html',
  '02-how-to-choose-a-masala-manufacturer-in-chennai.html',
  '03-what-makes-a-good-masala-manufacturer.html',
  '04-masala-manufacturer-vs-supplier-vs-distributor.html',
  '05-how-to-evaluate-a-masala-manufacturer-in-chennai.html'
];

const blogs = files.map((file, idx) => {
  const raw = fs.readFileSync(path.join(__dirname, '..', 'temp_blogs', file), 'utf8');

  // Title
  const titleMatch = raw.match(/<h1>(.*?)<\/h1>/s);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // SEO Title
  const seoTitleMatch = raw.match(/<title>(.*?)<\/title>/s);
  const seoTitle = seoTitleMatch ? seoTitleMatch[1].trim() : title;

  // SEO Desc
  const descMatch = raw.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/s);
  const seoDescription = descMatch ? descMatch[1].trim() : '';

  // Canonical
  const canMatch = raw.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/s);
  const canonical = canMatch ? canMatch[1].trim() : '';

  // Slug from canonical or filename
  let slug = '';
  if (canonical) {
    const parts = canonical.split('/');
    slug = parts[parts.length - 1];
  }
  if (!slug) {
    slug = file.replace(/^\d+-/, '').replace('.html', '');
  }

  // Eyebrow
  const eyebrowMatch = raw.match(/<p class=["']eyebrow["']>(.*?)<\/p>/s);
  const eyebrow = eyebrowMatch ? eyebrowMatch[1].trim() : '';

  // Intro
  const introMatch = raw.match(/<p class=["']intro["']>(.*?)<\/p>/s);
  const intro = introMatch ? introMatch[1].trim() : '';

  // Image & alt
  const imgMatch = raw.match(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["']/s);
  const imgName = imgMatch ? path.basename(imgMatch[1]) : '';
  const coverImage = 'assets/images/blog/' + imgName;
  const coverAlt = imgMatch ? imgMatch[2].trim() : '';

  // Word count & read time
  const plainText = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const words = plainText.trim().split(' ').length;
  const readTime = Math.ceil(words / 200) + ' min read';

  // Article content (extract everything inside <article ...> ... </article>)
  // Remove the hidden seo-metadata div if present
  let articleBody = raw;
  articleBody = articleBody.replace(/<div class=["']seo-metadata["'][\s\S]*?<\/div>/s, '');
  articleBody = articleBody.replace(/<section class=["']seo-metadata["'][\s\S]*?<\/section>/s, '');
  // Update local image src inside content to assets/images/blog/
  articleBody = articleBody.replace(/src=["']images\//g, 'src="assets/images/blog/');

  return {
    id: idx + 1,
    slug,
    title,
    seoTitle,
    seoDescription,
    canonical,
    eyebrow,
    intro,
    coverImage,
    coverAlt,
    author: 'HIPA Masalas',
    publishDate: 'September 2026',
    readTime,
    wordCount: words,
    contentHtml: articleBody.trim()
  };
});

const outputPath = path.join(__dirname, '..', 'js', 'blog-data.js');
fs.writeFileSync(outputPath, '/* HIPA Masalas Centralized Blog Data */\nwindow.HIPA_BLOGS = ' + JSON.stringify(blogs, null, 2) + ';\n');
console.log('Successfully generated js/blog-data.js with', blogs.length, 'articles.');
blogs.forEach(b => console.log(' - ' + b.slug + ' (' + b.readTime + ', ' + b.wordCount + ' words)'));
