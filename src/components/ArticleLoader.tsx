import { useState, useEffect } from 'react';
import type { NewsItem } from '../data/news';
import { fetchAndParseArticle, type ParsedArticle, type ParsedImage } from '../lib/parseArticle';

const WORDS_PER_MIN = 225;

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MIN));
}

type TextSize = 'small' | 'medium' | 'large';

const TEXT_SIZE_STYLES: Record<TextSize, React.CSSProperties> = {
  small: { fontSize: '0.9rem', lineHeight: 1.6 },
  medium: { fontSize: '1rem', lineHeight: 1.7 },
  large: { fontSize: '1.125rem', lineHeight: 1.8 },
};

interface ArticleLoaderProps {
  item: NewsItem;
  onClose: () => void;
}

function ArticleImage({ img }: { img: ParsedImage }) {
  const base = { margin: '1.5rem 0', border: '1px solid var(--ef-border)' };
  return (
    <figure style={base}>
      <img src={img.src} alt={img.alt} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
      {(img.caption || img.credit) && (
        <figcaption style={{ fontSize: '0.85rem', color: 'var(--ef-grey1)', marginTop: '0.5rem', padding: '0 0.5rem' }}>
          {img.caption || img.credit}
        </figcaption>
      )}
    </figure>
  );
}

export function ArticleLoader({ item, onClose }: ArticleLoaderProps) {
  const [parsed, setParsed] = useState<ParsedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = item.link ?? '';
  const title = parsed?.title ?? item.title;
  const fullText = parsed?.blocks.filter((b) => b.type === 'paragraph').map((b) => b.type === 'paragraph' ? b.text : '').join(' ');
  const readingMins = fullText ? estimateReadingTime(fullText) : 0;

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAndParseArticle(url)
      .then(setParsed)
      .catch(() => setParsed({ title: item.title, mainImage: null, blocks: [], error: 'Fetch failed' }))
      .finally(() => setLoading(false));
  }, [url, item.title]);

  const handleShare = (platform: 'twitter' | 'facebook' | 'copy') => {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`, '_blank', 'noopener');
    else if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank', 'noopener');
    else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShareOpen(false);
  };

  if (!url) return null;

  return (
    <div className="article-overlay" style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label="Article">
      <div
        className="outline-strong"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={toolbarStyle}>
          <button type="button" onClick={onClose} style={navBtnStyle}>
            ← Back to list
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setShareOpen(!shareOpen)} style={iconBtnStyle} aria-label="Share">
                Share
              </button>
              {shareOpen && (
                <div className="outline" style={shareMenuStyle}>
                  <button type="button" onClick={() => handleShare('twitter')}>Twitter</button>
                  <button type="button" onClick={() => handleShare('facebook')}>Facebook</button>
                  <button type="button" onClick={() => handleShare('copy')}>
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['small', 'medium', 'large'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={textSize === s ? 'active' : ''}
                  onClick={() => setTextSize(s)}
                  style={{ ...iconBtnStyle, fontSize: '0.75rem' }}
                >
                  {s[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--ef-grey1)', padding: '2rem' }}>Loading article…</p>
        ) : parsed?.error ? (
          <p style={{ color: 'var(--ef-red)', padding: '2rem' }}>
            {parsed.error}. <a href={url} target="_blank" rel="noopener noreferrer">Open in new tab</a>
          </p>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <span className={`pill ${item.category === 'archaeology' ? 'arch' : item.category === 'paleontology' ? 'paleo' : 'history'}`} style={{ marginRight: '0.5rem' }}>
                {item.category}
              </span>
              <span className="pill" style={{ borderColor: 'var(--ef-aqua)', color: 'var(--ef-aqua)' }}>Article</span>
            </div>
            <h1 style={{ margin: '0 0 0.5rem' }}>{title}</h1>
            <p style={{ color: 'var(--ef-grey1)', fontSize: '0.875rem', margin: 0 }}>
              {item.date} · {item.source}
              {parsed?.byline && ` · ${parsed.byline}`}
              {readingMins > 0 && ` · ${readingMins} min read`}
            </p>

            {parsed?.mainImage && (
              <ArticleImage img={parsed.mainImage} />
            )}

            <div style={{ ...bodyStyle, ...TEXT_SIZE_STYLES[textSize] }}>
              {parsed?.blocks.map((block, i) =>
                block.type === 'paragraph' ? (
                  <p key={i} style={{ marginBottom: '1rem' }}>{block.text}</p>
                ) : (
                  <ArticleImage key={i} img={block.img} />
                )
              )}
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--ef-grey1)' }}>
              <a href={url} target="_blank" rel="noopener noreferrer">View original at {item.source} →</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '2rem',
  overflow: 'auto',
  zIndex: 100,
};

const panelStyle: React.CSSProperties = {
  background: 'var(--ef-bg0)',
  border: '1px solid var(--ef-border-strong)',
  borderRadius: 0,
  maxWidth: 720,
  width: '100%',
  padding: '1.5rem',
  marginBottom: '2rem',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid var(--ef-border)',
};

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ef-aqua)',
  cursor: 'pointer',
  padding: '0.25rem 0',
  fontSize: '0.9rem',
};

const iconBtnStyle: React.CSSProperties = {
  padding: '0.35rem 0.6rem',
  fontSize: '0.8rem',
};

const shareMenuStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '0.25rem',
  padding: '0.5rem',
  background: 'var(--ef-bg1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  zIndex: 10,
};

const bodyStyle: React.CSSProperties = {
  color: 'var(--ef-fg)',
};
