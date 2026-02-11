import { useRef, useEffect, useMemo } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import type { Dig } from '../data/digs';

// Continents visible; coarse wireframe (fewer segments = less wires)
const GLOBE_IMAGE = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

interface DigGlobeProps {
  digs: Dig[];
  selectedDig: Dig | null;
  onSelectDig: (dig: Dig | null) => void;
  filterKind: 'all' | 'archaeology' | 'paleontology';
}

export function DigGlobe({ digs, selectedDig, onSelectDig, filterKind }: DigGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  const pointsData = useMemo(() => {
    if (filterKind === 'all') return digs;
    return digs.filter((d) => d.kind === filterKind);
  }, [digs, filterKind]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !selectedDig) return;
    g.pointOfView({ lat: selectedDig.lat, lng: selectedDig.lng, altitude: 2 }, 800);
  }, [selectedDig]);

  return (
    <div className="globe-container outline" style={{ width: '100%', height: '100%', minHeight: 360, background: 'var(--ef-bg-dim)' }}>
      <Globe
        ref={globeRef}
        globeImageUrl={GLOBE_IMAGE}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#83c092"
        atmosphereAltitude={0.12}
        showGraticules={true}
        globeCurvatureResolution={20}
        width={undefined}
        height={undefined}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: Dig) => (d.kind === 'archaeology' ? '#dbbc7f' : '#7fbbb3')}
        pointAltitude={0.06}
        pointRadius={0.25}
        pointLabel={(d: Dig) => `${d.name} (${d.kind})`}
        pointsMerge={false}
        onPointClick={(point: Dig) => onSelectDig(point)}
        onGlobeClick={() => onSelectDig(null)}
      />
    </div>
  );
}
