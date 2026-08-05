import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapPin, Search, X, AlertCircle, MapPinHouse } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MapLocation {
  latitude: number;
  longitude: number;
  desa: string;
  kecamatan: string;
  alamatLengkap: string;
}

interface MapPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationChange: (loc: MapLocation) => void;
  onReset?: () => void;
}

interface PlaceSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
}

const API_KEY = 'AIzaSyCPF-bBwtG8YB0YvRUBJIgw1uttjcstmpQ';
const DEFAULT_CENTER = { lat: -7.25, lng: 110.5 };
const NOMINATIM = 'https://nominatim.openstreetmap.org';

// ── Nominatim: search dengan dropdown ─────────────────────────────────────────
async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  try {
    const url = `${NOMINATIM}/search?format=json&q=${encodeURIComponent(query)}&limit=6&accept-language=id&countrycodes=id`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((r: any) => ({
      id: r.place_id,
      mainText: r.display_name.split(',')[0] || r.display_name,
      secondaryText: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<MapLocation> {
  try {
    const url = `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocode gagal');
    const data = await res.json();
    const addr = data.address || {};
    const desa = addr.village || addr.hamlet || addr.suburb || '';
    const kecamatan = addr.county || addr.city_district || addr.district || '';
    return {
      latitude: Math.round(lat * 1e6) / 1e6,
      longitude: Math.round(lng * 1e6) / 1e6,
      desa,
      kecamatan,
      alamatLengkap: data.display_name || `${desa}, ${kecamatan}`,
    };
  } catch {
    throw new Error('Geocode gagal');
  }
}

// ── Google Maps script loader ─────────────────────────────────────────────────
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

// ── MapPicker ─────────────────────────────────────────────────────────────────
const MapPicker: React.FC<MapPickerProps> = ({
  initialLat = null,
  initialLng = null,
  onLocationChange,
  onReset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState('');
  const [lastAddress, setLastAddress] = useState('');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [coords, setCoords] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchSeqRef = useRef(0);

  const notify = useCallback(
    async (lat: number, lng: number) => {
      try {
        const loc = await reverseGeocode(lat, lng);
        setLastAddress(loc.alamatLengkap);
        setCoords(`${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
        onLocationChange(loc);
      } catch {
        const loc = {
          latitude: Math.round(lat * 1e6) / 1e6,
          longitude: Math.round(lng * 1e6) / 1e6,
          desa: '',
          kecamatan: '',
          alamatLengkap: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };
        setLastAddress(loc.alamatLengkap);
        setCoords(`${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
        onLocationChange(loc);
      }
    },
    [onLocationChange]
  );

  // ── Init Map (render hanya, tanpa Places/Geocoding API) ─────────────────────
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const g = (window as any).google;
        if (!g?.maps?.Map) { setLoadState('error'); return; }

        const center = initialLat && initialLng
          ? { lat: initialLat, lng: initialLng }
          : DEFAULT_CENTER;

        const map = new g.maps.Map(containerRef.current, {
          center,
          zoom: 15,
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
          position: center,
          map,
          draggable: true,
          title: 'Lokasi Lahan',
          animation: g.maps.Animation?.DROP,
          icon: {
            url: pinUrl,
            size: new g.maps.Size(24, 32),
            scaledSize: new g.maps.Size(24, 32),
            anchor: new g.maps.Point(12, 32),
          },
        });

        mapRef.current = map;
        markerRef.current = marker;

        // Klik peta → pindah pin + reverse geocode via Nominatim
        map.addListener('click', (e: any) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          notify(e.latLng.lat(), e.latLng.lng());
        });

        // Seret pin → update
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) notify(pos.lat(), pos.lng());
        });

        // ── Atasi masalah mobile: peta tampil setengah/setelah modal buka ──
        // Trigger resize setelah inisialisasi agar container punya dimensi benar
        setTimeout(() => {
          const g2 = (window as any).google;
          if (g2?.maps?.event) g2.maps.event.trigger(map, 'resize');
        }, 150);

        // Handles window/container resize (rotasi HP, buka/tutup keyboard)
        const onResize = () => {
          const g3 = (window as any).google;
          if (g3?.maps?.event) g3.maps.event.trigger(map, 'resize');
        };
        resizeHandlerRef.current = onResize;
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);

        setLoadState('ready');

        // Lokasi awal
        if (initialLat && initialLng) notify(initialLat, initialLng);
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const h = resizeHandlerRef.current;
      if (h) {
        window.removeEventListener('resize', h);
        window.removeEventListener('orientationchange', h);
        resizeHandlerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Klik di luar dropdown → tutup ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Ketik → debounce → Nominatim search ────────────────────────────────────
  const handleInputChange = (value: string) => {
    setSearchText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setIsSearching(false);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const seq = ++searchSeqRef.current;
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(value.trim());
      // Abaikan respons basi (user sudah ketik teks lain)
      if (seq !== searchSeqRef.current) return;
      setIsSearching(false);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 400);
  };

  // ── Pilih saran → pindah pin & peta ────────────────────────────────────────
  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    setSearchText(s.mainText);
    setSuggestions([]);
    setShowSuggestions(false);

    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setPosition({ lat: s.lat, lng: s.lng });
      map.setCenter({ lat: s.lat, lng: s.lng });
      map.setZoom(17);
    }
    notify(s.lat, s.lng);
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
    setLastAddress('');
    setCoords('');
    const map = mapRef.current;
    const marker = markerRef.current;
    const c = initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER;
    if (map && marker) {
      marker.setPosition(c);
      map.setCenter(c);
      map.setZoom(15);
    }
    onReset?.();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
        Pilih Lokasi Lahan di Peta
      </label>
      <p className="text-[10px] text-[#6B7280] -mt-2 mb-1">
        Ketik alamat, pilih dari daftar, lalu klik atau seret penanda di peta
      </p>

      {/* Search + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        <input
          ref={searchRef}
          type="text"
          value={searchText}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="Cari lokasi lahan... contoh: Sukamaju, Kabupaten Magelang"
          className="w-full pl-10 pr-10 py-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm placeholder:text-[11px] placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
        />
        {searchText && (
          <button
            onClick={handleReset}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-red-500 cursor-pointer"
            title="Reset lokasi"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown saran */}
        {showSuggestions && (
          <div role="listbox" aria-label="Saran lokasi" className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-[#c4c8bb]/30 shadow-xl overflow-hidden max-h-[220px] overflow-y-auto">
            {isSearching && (
              <div className="p-4 text-center text-[11px] font-semibold text-[#6B7280] flex items-center justify-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin" />
                Mencari lokasi...
              </div>
            )}
            {!isSearching && suggestions.length === 0 && searchText.trim().length >= 2 && (
              <div className="p-4 text-center">
                <p className="text-[11px] text-[#9CA3AF] font-medium">Lokasi tidak ditemukan</p>
                <p className="text-[10px] text-[#B0B0B0] mt-0.5">Coba ketik alamat yang lebih lengkap</p>
              </div>
            )}
            {suggestions.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                role="option"
                onClick={() => handleSelectSuggestion(s)}
                className={`w-full px-4 py-3 text-left hover:bg-[#C3E28D]/15 transition-colors cursor-pointer flex items-start gap-3 ${
                  idx < suggestions.length - 1 ? 'border-b border-[#c4c8bb]/10' : ''
                }`}
              >
                <MapPinHouse className="w-4 h-4 text-[#2C4219] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#221A12] leading-tight">{s.mainText}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight line-clamp-2">{s.secondaryText}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Peta */}
      <div className="relative h-[260px] sm:h-[320px] rounded-xl border border-[#c4c8bb]/30 overflow-hidden bg-[#F7F7F5]">
        {loadState === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F7F7F5] gap-2.5">
            <span className="inline-block w-5 h-5 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#6B7280]">Memuat peta...</span>
          </div>
        )}
        {loadState === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#FFF8F4] gap-2 p-4 text-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <p className="text-xs font-bold text-[#8B6914]">Peta tidak dapat dimuat</p>
            <p className="text-[10px] text-[#6B7280]">Periksa koneksi internet atau matikan ad blocker</p>
            <button
              onClick={() => { loadPromise = null; setLoadState('loading'); loadGoogleMaps().then(() => setLoadState('ready')).catch(() => setLoadState('error')); }}
              className="px-4 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Lokasi terpilih */}
      {lastAddress && (
        <div className="p-3 bg-[#C3E28D]/15 border border-[#C3E28D]/30 rounded-xl flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#2C4219] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#2C4219]">Lokasi Terpilih</p>
            <p className="text-[11px] text-[#44483e] leading-relaxed break-words line-clamp-3">{lastAddress}</p>
            {coords && <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">{coords}</p>}
          </div>
        </div>
      )}

      {/* Petunjuk */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-[#F7F7F5] rounded-lg">
          <p className="text-[10px] font-bold text-[#2C4219]">1. Ketik Alamat</p>
          <p className="text-[9px] text-[#6B7280]">Pilih dari daftar</p>
        </div>
        <div className="p-2 bg-[#F7F7F5] rounded-lg">
          <p className="text-[10px] font-bold text-[#2C4219]">2. Klik Peta</p>
          <p className="text-[9px] text-[#6B7280]">Tandai titik lahan</p>
        </div>
        <div className="p-2 bg-[#F7F7F5] rounded-lg">
          <p className="text-[10px] font-bold text-[#2C4219]">3. Seret Penanda</p>
          <p className="text-[9px] text-[#6B7280]">Koreksi posisi</p>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
