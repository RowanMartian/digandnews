import { useState } from 'react';
import type { NewsCategory } from '../data/news';
import type { NewsItem } from '../data/news';
import { ArticleView } from './ArticleView';

interface NewsSectionProps {
  items: NewsItem[];
  category: NewsCategory | 'all';
  onCategoryChange: (cat: NewsCategory | 'all') => void;
  loading?: boolean;
}

const CATEGORIES: { value: NewsCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'history', label: 'History' },
  { value: 'archaeology', label: 'Archaeology' },
  { value: 'paleontology', label: 'Paleontology' },
];

export function NewsSection({ items, category, onCategoryChange, loading = false }: NewsSectionProps) {
  const filtered = category === 'all' ? items : items.filter((n) => n.category === category);
  const [openArticle, setOpenArticle] = useState<NewsItem | null>(null);

  return (
    <section className="outline" style={sectionStyle}>
      <h2 style={{ marginBottom: '1rem' }}>General news</h2>
      {loading && <p style={{ color: 'var(--ef-grey1)', fontSize: '0.875rem', marginBottom: '1rem' }}>Loading latest from feeds…</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={category === value ? 'active' : ''}
            onClick={() => onCategoryChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {filtered.map((item) => (
          <li
            key={item.id}
            className="outline"
            style={{
              ...itemStyle,
              cursor: item.isArticle || item.link ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (item.isArticle || item.link) setOpenArticle(item);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              if (item.isArticle || item.link) setOpenArticle(item);
            }}
            role={item.isArticle || item.link ? 'button' : undefined}
            tabIndex={item.isArticle || item.link ? 0 : undefined}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span className={`pill ${item.category === 'archaeology' ? 'arch' : item.category === 'paleontology' ? 'paleo' : 'history'}`}>
                {item.category}
              </span>
              {item.isArticle && (
                <span className="pill" style={{ borderColor: 'var(--ef-aqua)', color: 'var(--ef-aqua)' }}>Article</span>
              )}
            </div>
            <strong>{item.title}</strong>
            <span style={{ color: 'var(--ef-grey1)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              {item.date}
            </span>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--ef-fg-dim)', fontSize: '0.875rem' }}>
              {item.excerpt}
            </p>
            {item.source && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ef-grey0)', display: 'block', marginTop: '0.25rem' }}>{item.source}</span>
            )}
            {(item.isArticle || item.link) && (
              <span style={{ fontSize: '0.8rem', color: 'var(--ef-aqua)', marginTop: '0.35rem', display: 'inline-block' }}>
                {item.isArticle ? 'Read article →' : 'Open link →'}
              </span>
            )}
          </li>
        ))}
      </ul>
      {openArticle && (
        <ArticleView item={openArticle} onClose={() => setOpenArticle(null)} />
      )}
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: '1.25rem',
  background: 'var(--ef-bg0)',
};

const itemStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  marginBottom: '0.5rem',
  background: 'var(--ef-bg1)',
  border: '1px solid var(--ef-border)',
  borderRadius: 0,
};
