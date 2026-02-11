import type { Dig } from '../data/digs';

const DIGS_URL = `${import.meta.env.BASE_URL || '/'}digs.json`;

function isValidDig(d: unknown): d is Dig {
  if (!d || typeof d !== 'object') return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    (o.kind === 'archaeology' || o.kind === 'paleontology') &&
    typeof o.lat === 'number' &&
    typeof o.lng === 'number' &&
    typeof o.country === 'string' &&
    typeof o.region === 'string' &&
    typeof o.description === 'string' &&
    typeof o.startYear === 'number' &&
    (o.status === 'active' || o.status === 'seasonal' || o.status === 'paused') &&
    Array.isArray(o.news)
  );
}

export async function fetchDigs(): Promise<Dig[]> {
  try {
    const res = await fetch(DIGS_URL, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!res.ok) return [];
    const raw = await res.json();
    if (!Array.isArray(raw)) return [];
    const digs: Dig[] = [];
    for (const item of raw) {
      if (isValidDig(item)) digs.push(item);
    }
    return digs;
  } catch {
    return [];
  }
}
