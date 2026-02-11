import type { NewsItem } from '../data/news';
import { ArticleLoader } from './ArticleLoader';

interface ArticleViewProps {
  item: NewsItem;
  onClose: () => void;
}

export function ArticleView({ item, onClose }: ArticleViewProps) {
  // When item has a link, use the dynamic ArticleLoader (fetch, parse, render in theme)
  if (item.link) {
    return <ArticleLoader item={item} onClose={onClose} />;
  }

  // Curated content (fullArticle, imageUrls) — render in our layout
  return (
    <div className="article-overlay" style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label="Article">
      <div
        className="outline-strong"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <button type="button" onClick={onClose} style={backBtnStyle}>← Back to list</button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`pill ${item.category === 'archaeology' ? 'arch' : item.category === 'paleontology' ? 'paleo' : 'history'}`}>
              {item.category}
            </span>
            <span className="pill" style={{ borderColor: 'var(--ef-aqua)', color: 'var(--ef-aqua)' }}>Article</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={closeBtnStyle}>×</button>
        </div>
        <h2 style={{ margin: '0 0 0.5rem' }}>{item.title}</h2>
        <p style={{ color: 'var(--ef-grey1)', fontSize: '0.875rem', margin: '0 0 1rem' }}>
          {item.date} · {item.source}
        </p>
        <div style={bodyStyle}>
          {item.fullArticle?.split('\n\n').map((p, i) => (
            <p key={i} style={{ marginBottom: '1rem' }}>{p}</p>
          ))}
          {item.imageUrls?.map((url, i) => (
            <figure key={i} style={figureStyle}>
              <img src={url} alt="" style={imgStyle} loading="lazy" />
            </figure>
          ))}
          {!item.fullArticle && !item.imageUrls?.length && <p>{item.excerpt}</p>}
        </div>
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

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ef-aqua)',
  cursor: 'pointer',
  padding: '0.25rem 0',
  fontSize: '0.9rem',
};

const closeBtnStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  lineHeight: 1,
  padding: '0.25rem 0.5rem',
};

const bodyStyle: React.CSSProperties = {
  color: 'var(--ef-fg)',
  lineHeight: 1.7,
  fontSize: '1rem',
};

const figureStyle: React.CSSProperties = {
  margin: '1.5rem 0',
};

const imgStyle: React.CSSProperties = {
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
  border: '1px solid var(--ef-border)',
};
