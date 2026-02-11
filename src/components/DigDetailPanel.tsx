import type { Dig } from '../data/digs';

interface DigDetailPanelProps {
  dig: Dig;
  onClose: () => void;
}

export function DigDetailPanel({ dig, onClose }: DigDetailPanelProps) {
  return (
    <div className="panel outline-strong" style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{dig.name}</h2>
          <span className={`pill ${dig.kind === 'archaeology' ? 'arch' : 'paleo'}`} style={{ marginTop: '0.25rem', display: 'inline-block' }}>
            {dig.kind === 'archaeology' ? 'Archaeology' : 'Paleontology'}
          </span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p style={{ color: 'var(--ef-fg-dim)', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>
        {dig.region}, {dig.country}
      </p>
      <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
        {dig.description}
      </p>
      <p style={{ color: 'var(--ef-grey1)', fontSize: '0.8rem', margin: '0 0 1rem' }}>
        Active since {dig.startYear} · {dig.status}
      </p>
      <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Latest news</h3>
      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
        {dig.news.map((item) => (
          <li key={item.id} style={{ marginBottom: '0.5rem' }}>
            <strong>{item.title}</strong>
            <span style={{ color: 'var(--ef-grey1)', marginLeft: '0.35rem' }}>— {item.date}</span>
            <div style={{ color: 'var(--ef-fg-dim)' }}>{item.excerpt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 'min(360px, calc(100% - 32px))',
  maxHeight: 'calc(100% - 32px)',
  overflow: 'auto',
  background: 'var(--ef-bg0)',
  padding: '1rem',
  zIndex: 10,
  border: '1px solid var(--ef-border-strong)',
  borderRadius: 0,
};
