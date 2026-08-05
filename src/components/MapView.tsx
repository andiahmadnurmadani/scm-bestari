import React, { useRef, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MapViewProps {
  latitude: number;
  longitude: number;
  height?: string;
  label?: string;
}

const API_KEY = 'AIzaSyCPF-bBwtG8YB0YvRUBJIgw1uttjcstmpQ';

// ── Google Maps script loader (shared singleton) ──────────────────────────────
let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const g = (window as any).google;
    if (g?.maps?.Map) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { loadPromise = null; reject(new Error('Gagal memuat Google Maps')); };
    document.head.appendChild(script);
  });
  return loadPromise;
}

// ── Google Maps read-only map (full detail: POI, jalan, label) ────────────────
const MapView: React.FC<MapViewProps> = ({ latitude, longitude, height = '176px', label = 'Lokasi Lahan' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const showLegend = true;

  // Buka link lokasi di Google Maps (tab baru)
  const openInGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const g = (window as any).google;
        if (!g?.maps?.Map) { setState('error'); return; }

        const pos = { lat: latitude, lng: longitude };

        // Full detail — tanpa styles override, jadi POI, jalan, nama tempat semua tampil
        const map = new g.maps.Map(containerRef.current, {
          center: pos,
          zoom: 17,
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: g.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
          },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_BOTTOM },
        });

        // Custom pin lokasi (SVG data URI) — merah
        const pinUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#D32F2F" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="11" r="6" fill="#FFFFFF"/>
            <circle cx="12" cy="11" r="3.5" fill="#D32F2F"/>
          </svg>`
        )}`;

        const marker = new g.maps.Marker({
          position: pos,
          map,
          title: label,
          icon: {
            url: pinUrl,
            size: new g.maps.Size(24, 32),
            scaledSize: new g.maps.Size(24, 32),
            anchor: new g.maps.Point(12, 32),
          },
        });

        mapRef.current = map;
        markerRef.current = marker;

        // ── Mobile fix: peta tampil penuh setelah modal buka / rotasi ──
        setTimeout(() => {
          const g2 = (window as any).google;
          if (g2?.maps?.event) g2.maps.event.trigger(map, 'resize');
        }, 150);

        const onResize = () => {
          const g3 = (window as any).google;
          if (g3?.maps?.event) g3.maps.event.trigger(map, 'resize');
        };
        resizeHandlerRef.current = onResize;
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);

        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
      const h = resizeHandlerRef.current;
      if (h) {
        window.removeEventListener('resize', h);
        window.removeEventListener('orientationchange', h);
        resizeHandlerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden border border-[#c4c8bb]/40" style={{ height }}>
        {state === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F7F7F5] gap-2.5">
            <span className="inline-block w-5 h-5 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#6B7280]">Memuat peta...</span>
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#FFF8F4] gap-2 p-4 text-center">
            <p className="text-[11px] font-semibold text-[#8B6914]">Peta tidak dapat dimuat</p>
            <button
              onClick={() => { loadPromise = null; setState('loading'); loadGoogleMaps().then(() => setState('ready')).catch(() => setState('error')); }}
              className="px-4 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Container peta */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Legenda: penanda lokasi */}
        {state === 'ready' && showLegend && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 rounded-lg shadow-md border border-[#c4c8bb]/30">
            <MapPin className="w-3.5 h-3.5 text-[#2C4219]" />
            <span className="text-[10px] font-bold text-[#221A12]">{label}</span>
          </div>
        )}

        {/* Tombol buka di Google Maps */}
        {state === 'ready' && (
          <button
            onClick={openInGoogleMaps}
            className="absolute bottom-2 right-2 z-10 px-2.5 py-1.5 bg-[#2C4219] text-white text-[10px] font-bold rounded-lg shadow-md hover:bg-[#172C05] transition-colors cursor-pointer"
            title="Buka lokasi di Google Maps"
          >
            Buka di Google Maps
          </button>
        )}
      </div>
    </div>
  );
};

export default MapView;
