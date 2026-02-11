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

const ARTICLE_SELECTORS = [
  '#story_text',
  '#article-body',
  '#story-body',
  'article',
  '[role="article"]',
  'main',
  '[role="main"]',
  '#main',
  '.article-body',
  '.article-content',
  '.article_body',
  '.story-body',
  '.story-content',
  '.post-content',
  '.entry-content',
  '.content-body',
  '.article__body',
  '.articleText',
  '.article-text',
  '[itemprop="articleBody"]',
  '[class*="article-body"]',
  '[class*="articleBody"]',
  '[class*="story-text"]',
  '[class*="post-body"]',
  '[class*="entry-content"]',
  '.prose',
  '.content',
];

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

function extractMainImage(doc: Document, baseUrl: string): ParsedImage | null {
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage && isSafeUrl(makeAbsoluteUrl(ogImage, baseUrl))) {
    const ogTitle = doc.querySelector('meta[property="og:image:alt"]')?.getAttribute('content') ?? '';
    return {
      src: makeAbsoluteUrl(ogImage, baseUrl),
      alt: ogTitle,
      caption: undefined,
      credit: undefined,
    };
  }
  const imgs = doc.querySelectorAll('article img, main img, .article-body img, .entry-content img, .post-content img, [itemprop="articleBody"] img');
  for (const img of imgs) {
    const src = img.getAttribute('src');
    if (!src || src.includes('logo') || src.includes('icon') || src.length < 20) continue;
    const abs = makeAbsoluteUrl(src, baseUrl);
    if (!isSafeUrl(abs)) continue;
    const alt = img.getAttribute('alt') ?? '';
    const parent = img.closest('figure');
    const caption = parent?.querySelector('figcaption')?.textContent?.trim();
    return {
      src: abs,
      alt,
      caption,
      credit: caption,
    };
  }
  return null;
}

function getArticleContainer(doc: Document): Element | null {
  for (const sel of ARTICLE_SELECTORS) {
    const el = doc.querySelector(sel);
    if (el && el.textContent && el.textContent.trim().length > 100) return el;
  }
  const body = doc.body;
  if (body.textContent && body.textContent.trim().length > 100) return body;
  return null;
}

function extractBlocks(container: Element, baseUrl: string): ParsedArticle['blocks'] {
  const blocks: ParsedArticle['blocks'] = [];
  const walk = (el: Element) => {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'IFRAME') return;
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src');
      if (!src || src.includes('logo') || src.length < 15) return;
      const abs = makeAbsoluteUrl(src, baseUrl);
      if (!isSafeUrl(abs)) return;
      const alt = el.getAttribute('alt') ?? '';
      const parent = el.parentElement;
      const figcap = parent?.tagName === 'FIGURE' ? parent.querySelector('figcaption') : null;
      const caption = figcap?.textContent?.trim();
      blocks.push({
        type: 'image',
        img: { src: abs, alt, caption, credit: caption },
      });
      return;
    }
    if (el.tagName === 'P' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4' || el.tagName === 'LI') {
      const text = el.textContent?.trim();
      if (text && text.length > 15) blocks.push({ type: 'paragraph', text });
      return;
    }
    if (el.tagName === 'BLOCKQUOTE') {
      const text = el.textContent?.trim();
      if (text && text.length > 15) blocks.push({ type: 'paragraph', text: `"${text}"` });
      return;
    }
    for (const child of el.children) walk(child);
  };
  walk(container);

  if (blocks.length === 0) {
    const paragraphs = container.querySelectorAll('p');
    for (const p of paragraphs) {
      const text = p.textContent?.trim();
      if (text && text.length > 15) blocks.push({ type: 'paragraph', text });
    }
  }

  if (blocks.length === 0) {
    const fullText = container.textContent?.trim();
    if (fullText && fullText.length > 100) {
      const chunks = fullText.split(/\n\n+/).filter((s) => s.trim().length > 50);
      for (const chunk of chunks) {
        blocks.push({ type: 'paragraph', text: chunk.trim() });
      }
    }
  }

  return blocks;
}

function extractTitle(doc: Document): string {
  return (
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ??
    doc.querySelector('h1')?.textContent?.trim() ??
    doc.title ??
    ''
  );
}

function extractByline(doc: Document): string {
  const sel = doc.querySelector('[rel="author"], .byline, .author, [itemprop="author"]');
  return sel?.textContent?.trim() ?? '';
}

async function fetchWithProxy(url: string): Promise<string> {
  let lastError: Error | null = null;
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      const html = await res.text();
      if (html && html.length > 500 && !html.includes('Access denied') && !html.includes('CORS')) {
        return html;
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('All proxies failed');
}

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  try {
    const html = await fetchWithProxy(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const baseUrl = url;

    const title = extractTitle(doc);
    const byline = extractByline(doc);
    const mainImage = extractMainImage(doc, baseUrl);
    const container = getArticleContainer(doc);

    if (!container) {
      return {
        title: title || 'Article',
        byline,
        mainImage,
        blocks: [
          { type: 'paragraph', text: 'Could not extract article content from this page. The site structure may not be supported.' },
        ],
      };
    }

    let blocks = extractBlocks(container, baseUrl);
    if (blocks.length === 0 && mainImage) {
      blocks.push({ type: 'image', img: mainImage });
    }

    if (mainImage) {
      const mainSrc = mainImage.src;
      const dupIndex = blocks.findIndex(
        (b) => b.type === 'image' && b.img.src === mainSrc
      );
      if (dupIndex >= 0) {
        const dup = blocks[dupIndex];
        if (dup.type === 'image' && (dup.img.caption || dup.img.credit)) {
          mainImage.caption = dup.img.caption ?? dup.img.credit;
          mainImage.credit = mainImage.caption;
        }
        blocks = blocks.filter((b, i) => i !== dupIndex);
      }
    }

    return {
      title,
      byline,
      mainImage,
      blocks,
    };
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
