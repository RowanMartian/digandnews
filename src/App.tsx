import { useState, useMemo, useEffect } from 'react';
import { DigGlobe } from './components/DigGlobe';
import { DigDetailPanel } from './components/DigDetailPanel';
import { NewsSection } from './components/NewsSection';
import { defaultDigs } from './data/digs';
import { defaultNews } from './data/news';
import { fetchDigs } from './lib/fetchDigs';
import { fetchNewsFromFeeds } from './lib/fetchNews';
import type { Dig } from './data/digs';
import type { NewsCategory, NewsItem } from './data/news';

function normalizeNewsKey(link: string): string {
  try {
    const u = new URL(link.trim());
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${host}${path}`;
  } catch {
    return link.toLowerCase().trim();
  }
}

type DigFilter = 'all' | 'archaeology' | 'paleontology';
type ViewMode = 'globe' | 'news';

export default function App() {
  const [view, setView] = useState<ViewMode>('globe');
  const [selectedDig, setSelectedDig] = useState<Dig | null>(null);
  const [digFilter, setDigFilter] = useState<DigFilter>('all');
  const [newsCategory, setNewsCategory] = useState<NewsCategory | 'all'>('all');
  const [digs, setDigs] = useState<Dig[]>(defaultDigs);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(defaultNews);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    fetchDigs()
      .then((fetched) => {
        if (fetched.length > 0) setDigs(fetched);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setNewsLoading(true);
    fetchNewsFromFeeds()
      .then((fetched) => {
        setNewsItems((prev) => {
          const key = (n: NewsItem) => n.link ? normalizeNewsKey(n.link) : n.title.toLowerCase().slice(0, 80);
          const seen = new Set<string>();
          const merged: NewsItem[] = [];
          for (const n of [...prev, ...fetched]) {
            const k = key(n);
            if (seen.has(k)) continue;
            seen.add(k);
            merged.push(n);
          }
          return merged.sort((a, b) => (b.date > a.date ? 1 : -1));
        });
      })
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, []);

  const filteredDigs = useMemo(() => {
    if (digFilter === 'all') return digs;
    return digs.filter((d) => d.kind === digFilter);
  }, [digFilter]);

  return (
    <div style={layoutStyle}>
      <header className="outline-strong" style={headerStyle}>
        <div style={headerTopStyle}>
          <h1 style={titleStyle}>Dig & News</h1>
          <div style={toggleStyle}>
            <button
              type="button"
              className={view === 'globe' ? 'active' : ''}
              onClick={() => setView('globe')}
            >
              Globe
            </button>
            <button
              type="button"
              className={view === 'news' ? 'active' : ''}
              onClick={() => setView('news')}
            >
              News
            </button>
          </div>
        </div>
        <p style={subtitleStyle}>Archaeology · Paleontology · History</p>
      </header>

      <main style={mainStyle}>
        {view === 'globe' && (
          <section className="outline" style={globeSectionStyle}>
            <div style={globeHeaderStyle}>
              <h2 style={{ margin: 0 }}>Active digs</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={digFilter === 'all' ? 'active' : ''}
                  onClick={() => setDigFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={digFilter === 'archaeology' ? 'active' : ''}
                  onClick={() => setDigFilter('archaeology')}
                >
                  Archaeology
                </button>
                <button
                  type="button"
                  className={digFilter === 'paleontology' ? 'active' : ''}
                  onClick={() => setDigFilter('paleontology')}
                >
                  Paleontology
                </button>
              </div>
            </div>
            <div style={{ position: 'relative', flex: 1, minHeight: 360 }}>
              <DigGlobe
                digs={filteredDigs}
                selectedDig={selectedDig}
                onSelectDig={setSelectedDig}
                filterKind={digFilter}
              />
              {selectedDig && (
                <DigDetailPanel dig={selectedDig} onClose={() => setSelectedDig(null)} />
              )}
            </div>
            <p style={{ padding: '0.5rem 1rem', margin: 0, fontSize: '0.8rem', color: 'var(--ef-grey1)' }}>
              Click a pin to see dig info and latest news. Yellow = Archaeology, Teal = Paleontology.
            </p>
          </section>
        )}

        {view === 'news' && (
          <NewsSection
            items={newsItems}
            category={newsCategory}
            onCategoryChange={setNewsCategory}
            loading={newsLoading}
          />
        )}
      </main>
    </div>
  );
}

const layoutStyle: React.CSSProperties = {
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--ef-bg0)',
};

const headerStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  borderBottom: '1px solid var(--ef-border-strong)',
  background: 'var(--ef-bg1)',
};

const headerTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.75rem',
};

const toggleStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--ef-fg)',
};

const subtitleStyle: React.CSSProperties = {
  margin: '0.25rem 0 0',
  fontSize: '0.9rem',
  color: 'var(--ef-grey1)',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1rem',
  maxWidth: 1200,
  margin: '0 auto',
  width: '100%',
};

const globeSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  background: 'var(--ef-bg1)',
  border: '1px solid var(--ef-border)',
  borderRadius: 0,
  overflow: 'hidden',
};

const globeHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderBottom: '1px solid var(--ef-border)',
};
