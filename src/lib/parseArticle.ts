const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

export interface ParsedImage {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
}

export interface ParsedArticle {
  title: string;
  byline?: string;
  mainImage: ParsedImage | null;
  blocks: Array<{ type: 'paragraph'; text: string } | { type: 'image'; img: ParsedImage }>;
  error?: string;
}

// Exhaustive selectors: site-specific and generic (order matters – try specific first)
const ARTICLE_SELECTORS = [
  '#story_text',
  '#article-body',
  '#story-body',
  '#content-body',
  '#main-content',
  '#article_content',
  '#article-content',
  'article .content',
  'article .post-content',
  'article .entry-content',
  '[data-article-body]',
  '[data-content]',
  'article',
  '[role="article"]',
  'main',
  '[role="main"]',
  '#main .content',
  '#content article',
  '.post article',
  '.single-post .entry-content',
  '.article-body',
  '.article-content',
  '.article_body',
  '.article_text',
  '.story-body',
  '.story-content',
  '.post-content',
  '.entry-content',
  '.content-body',
  '.article__body',
  '.articleText',
  '.article-text',
  '.post-body',
  '.entry-body',
  '[itemprop="articleBody"]',
  '.td-post-content',
  '.entry',
  '.story-body-text',
  '.article-main',
  '.news-article-body',
  '[class*="article-body"]',
  '[class*="articleBody"]',
  '[class*="story-text"]',
  '[class*="post-body"]',
  '[class*="entry-content"]',
  '[class*="content-body"]',
  '.prose',
  '.e-content',
  '.hentry .entry-content',
  '.content',
];

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'NOSCRIPT', 'SVG', 'PATH']);
const NOISE_SELECTORS = 'nav, footer, aside, [role="navigation"], [role="banner"], .nav, .menu, .sidebar, .ad, .ads, .social-share, .comments, .related-posts, .newsletter';

function makeAbsoluteUrl(href: string, base: string): string {
  if (!href || href.startsWith('data:')) return href;
  if (href.startsWith('http')) return href;
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function isSafeUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function getImageSrc(el: Element, baseUrl: string): string | null {
  const src = el.getAttribute('src') ?? el.getAttribute('data-src') ?? el.getAttribute('data-lazy-src');
  if (!src || src.length < 15) return null;
  const abs = makeAbsoluteUrl(src, baseUrl);
  return isSafeUrl(abs) ? abs : null;
}

function getCaptionForImage(img: Element): string | undefined {
  const parent = img.parentElement;
  if (parent?.tagName === 'FIGURE') {
    const figcap = parent.querySelector('figcaption');
    if (figcap) return figcap.textContent?.trim() || undefined;
  }
  const next = img.nextElementSibling;
  if (next?.classList.contains('caption') || next?.classList.contains('wp-caption-text') || /caption|credit|credit-line/i.test(next?.className ?? '')) {
    return next.textContent?.trim() || undefined;
  }
  const wrapper = img.closest('[class*="caption"], [class*="figure"]');
  const cap = wrapper?.querySelector('.caption, .wp-caption-text, [class*="caption"], figcaption');
  return cap?.textContent?.trim() || undefined;
}

function extractMainImage(doc: Document, baseUrl: string): ParsedImage | null {
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage && isSafeUrl(makeAbsoluteUrl(ogImage, baseUrl))) {
    const ogAlt = doc.querySelector('meta[property="og:image:alt"]')?.getAttribute('content') ?? '';
    return {
      src: makeAbsoluteUrl(ogImage, baseUrl),
      alt: ogAlt,
      caption: undefined,
      credit: undefined,
    };
  }
  const containers = doc.querySelectorAll('article, main, [itemprop="articleBody"], .article-body, .entry-content, .post-content, #story_text, #article-body');
  for (const container of containers) {
    const imgs = container.querySelectorAll('img');
    for (const img of imgs) {
      const src = getImageSrc(img, baseUrl);
      if (!src || /logo|icon|avatar|sprite|pixel|1x1|ad\./i.test(src)) continue;
      return {
        src,
        alt: img.getAttribute('alt') ?? '',
        caption: getCaptionForImage(img),
        credit: undefined,
      };
    }
  }
  const firstImg = doc.querySelector('article img, main img, .content img');
  if (firstImg) {
    const src = getImageSrc(firstImg, baseUrl);
    if (src) return { src, alt: firstImg.getAttribute('alt') ?? '', caption: getCaptionForImage(firstImg), credit: undefined };
  }
  return null;
}

function getArticleContainer(doc: Document): Element | null {
  for (const sel of ARTICLE_SELECTORS) {
    try {
      const el = doc.querySelector(sel);
      if (el && !el.closest(NOISE_SELECTORS) && el.textContent && el.textContent.trim().length > 150) return el;
    } catch {
      continue;
    }
  }
  return findBestCandidate(doc);
}

/** Readability-style: find the element that looks most like the main article content */
function findBestCandidate(doc: Document): Element | null {
  const candidates: { el: Element; score: number; textLength: number }[] = [];
  const noise = doc.querySelectorAll(NOISE_SELECTORS);
  const isNoise = (el: Element) => noise.some((n) => n.contains(el));

  function score(el: Element): number {
    if (isNoise(el) || SKIP_TAGS.has(el.tagName)) return -1;
    const ps = el.querySelectorAll('p');
    const text = el.textContent?.trim() ?? '';
    const textLen = text.length;
    if (textLen < 200) return -1;
    const linkLen = (el.querySelectorAll('a').length * 50);
    const pScore = ps.length * 30;
    return textLen + pScore - linkLen;
  }

  const walk = (el: Element) => {
    if (SKIP_TAGS.has(el.tagName)) return;
    if (['DIV', 'SECTION', 'ARTICLE', 'MAIN'].includes(el.tagName)) {
      const s = score(el);
      if (s > 0) candidates.push({ el, score: s, textLength: (el.textContent?.trim() ?? '').length });
    }
    for (const child of el.children) walk(child);
  };

  walk(doc.body);
  if (candidates.length === 0) return doc.body;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return best.textLength > 300 ? best.el : null;
}

function extractBlocks(container: Element, baseUrl: string): ParsedArticle['blocks'] {
  const blocks: ParsedArticle['blocks'] = [];
  const seenText = new Set<string>();

  const walk = (el: Element) => {
    if (SKIP_TAGS.has(el.tagName)) return;
    if (el.tagName === 'IMG') {
      const src = getImageSrc(el, baseUrl);
      if (!src || /logo|icon|avatar|sprite|pixel|1x1|ad\./i.test(src)) return;
      const alt = el.getAttribute('alt') ?? '';
      const caption = getCaptionForImage(el);
      blocks.push({ type: 'image', img: { src, alt, caption, credit: caption } });
      return;
    }
    if (el.tagName === 'P' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4' || el.tagName === 'H5') {
      const text = el.textContent?.trim();
      if (text && text.length > 20) {
        const key = text.slice(0, 80);
        if (!seenText.has(key)) {
          seenText.add(key);
          blocks.push({ type: 'paragraph', text });
        }
      }
      return;
    }
    if (el.tagName === 'LI') {
      const text = el.textContent?.trim();
      if (text && text.length > 25) {
        const key = text.slice(0, 80);
        if (!seenText.has(key)) {
          seenText.add(key);
          blocks.push({ type: 'paragraph', text });
        }
      }
      return;
    }
    if (el.tagName === 'BLOCKQUOTE') {
      const text = el.textContent?.trim();
      if (text && text.length > 20) {
        seenText.add(text.slice(0, 80));
        blocks.push({ type: 'paragraph', text: `"${text}"` });
      }
      return;
    }
    for (const child of el.children) walk(child);
  };

  walk(container);

  if (blocks.length === 0) {
    container.querySelectorAll('p').forEach((p) => {
      const text = p.textContent?.trim();
      if (text && text.length > 20) {
        const key = text.slice(0, 80);
        if (!seenText.has(key)) {
          seenText.add(key);
          blocks.push({ type: 'paragraph', text });
        }
      }
    });
  }

  if (blocks.length === 0) {
    const fullText = container.textContent?.trim();
    if (fullText && fullText.length > 150) {
      const chunks = fullText.split(/\n\n+/).map((s) => s.trim()).filter((s) => s.length > 40);
      chunks.forEach((chunk) => blocks.push({ type: 'paragraph', text: chunk }));
    }
  }

  return blocks;
}

function extractTitle(doc: Document): string {
  return (
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ??
    doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim() ??
    doc.querySelector('h1')?.textContent?.trim() ??
    doc.querySelector('.entry-title, .post-title, .article-title')?.textContent?.trim() ??
    doc.title ??
    ''
  );
}

function extractByline(doc: Document): string {
  const sel = doc.querySelector('[rel="author"], .byline, .author, [itemprop="author"], .posted-by, .meta-author');
  return sel?.textContent?.trim() ?? '';
}

async function fetchWithProxy(url: string): Promise<string> {
  let lastError: Error | null = null;
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      if (text && text.length > 500 && !/Access denied|CORS|blocked/i.test(text)) return text;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('All proxies failed');
}

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  try {
    const html = await fetchWithProxy(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const baseUrl = url;

    const title = extractTitle(doc);
    const byline = extractByline(doc);
    const mainImage = extractMainImage(doc, baseUrl);
    let container = getArticleContainer(doc);

    if (!container || (container === doc.body && doc.body.textContent && doc.body.textContent.trim().length < 300)) {
      container = findBestCandidate(doc) ?? doc.body;
    }

    let blocks = extractBlocks(container, baseUrl);

    if (blocks.length === 0 && container !== doc.body) {
      const allP = doc.body.querySelectorAll('p');
      for (const p of allP) {
        const text = p.textContent?.trim();
        if (text && text.length > 40) blocks.push({ type: 'paragraph', text });
      }
    }

    if (blocks.length === 0 && mainImage) {
      blocks.push({ type: 'image', img: mainImage });
    }

    if (blocks.length === 0) {
      return {
        title: title || 'Article',
        byline,
        mainImage,
        blocks: [{ type: 'paragraph', text: 'Could not extract article content from this page. The site structure may not be supported. Try opening the link in a new tab.' }],
      };
    }

    if (mainImage) {
      const mainSrc = mainImage.src;
      const dupIdx = blocks.findIndex((b) => b.type === 'image' && b.img.src === mainSrc);
      if (dupIdx >= 0) {
        const dup = blocks[dupIdx];
        if (dup.type === 'image' && (dup.img.caption || dup.img.credit)) {
          mainImage.caption = dup.img.caption ?? dup.img.credit;
          mainImage.credit = mainImage.caption;
        }
        blocks = blocks.filter((_, i) => i !== dupIdx);
      }
    }

    return { title, byline, mainImage, blocks };
  } catch (e) {
    return {
      title: 'Article',
      byline: undefined,
      mainImage: null,
      blocks: [],
      error: e instanceof Error ? e.message : 'Failed to fetch article',
    };
  }
}
