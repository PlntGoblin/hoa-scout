import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import AddressSearch from './components/AddressSearch';
import PropertyCard from './components/PropertyCard';
import HoaCapture from './components/HoaCapture';
import HoaList from './components/HoaList';
import LayerToggle from './components/LayerToggle';
import UsageTracker from './components/UsageTracker';
import { lookupParcel } from './lib/parcelLookup';
import { findHoa, listHoas, normalizeHoaKey } from './lib/hoaStore';
import { seedKnownHoas } from './lib/seedHoas';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

const MARKETS = {
  sedona: {
    label: 'Sedona, AZ',
    center: { longitude: -111.7609, latitude: 34.8697, zoom: 13 },
    subdivisionsUrl: 'https://gis.yavapaiaz.gov/arcgis/rest/services/Property/FeatureServer/3/query?where=1%3D1&geometry=-111.85%2C34.65%2C-111.65%2C34.92&geometryType=esriGeometryEnvelope&inSR=4326&outFields=SUBCOMMON%2CSUBNAME%2CSUBDIVISION_LINK%2CCITYDIST&f=geojson',
    zoningUrl: 'https://gis.yavapaiaz.gov/arcgis/rest/services/Zoning/FeatureServer/8/query?where=1%3D1&outFields=*&f=geojson',
  },
  sandiego: {
    label: 'San Diego, CA',
    center: { longitude: -117.1611, latitude: 32.7157, zoom: 11 },
    subdivisionsUrl: 'https://geo.sandag.org/server/rest/services/Hosted/CMTY_PLAN_SD/FeatureServer/0/query?where=1%3D1&outFields=cpname,cpcode,website&f=geojson',
    zoningUrl: 'https://webmaps.sandiego.gov/arcgis/rest/services/DSD/Zoning_Base/MapServer/0/query?where=1%3D1&geometry=-117.35%2C32.55%2C-116.95%2C32.90&geometryType=esriGeometryEnvelope&inSR=4326&outFields=ZONE_NAME&f=geojson',
  },
  nashville: {
    label: 'Nashville, TN',
    center: { longitude: -86.7816, latitude: 36.1627, zoom: 11 },
    subdivisionsUrl: 'https://maps.nashville.gov/arcgis/rest/services/Boundaries/Boundaries/MapServer/1/query?where=1%3D1&outFields=CommunityName&f=geojson',
    zoningUrl: 'https://maps.nashville.gov/arcgis/rest/services/Zoning_Landuse/Zoning/MapServer/14/query?where=1%3D1&geometry=-87.1%2C35.95%2C-86.5%2C36.45&geometryType=esriGeometryEnvelope&inSR=4326&outFields=ZONE_DESC&f=geojson',
  },
};

const SEDONA_LAYERS = [
  { id: 'subdivisions', label: 'HOA / Subdivisions', color: '#6366f1', visible: true },
  { id: 'zoning',       label: 'Zoning',             color: '#f59e0b', visible: false },
];

const SD_LAYERS = [
  { id: 'subdivisions', label: 'Community Plans', color: '#6366f1', visible: true },
  { id: 'zoning',       label: 'Zoning',          color: '#f59e0b', visible: false },
];

const NASHVILLE_LAYERS = [
  { id: 'subdivisions', label: 'Planning Areas', color: '#6366f1', visible: true },
  { id: 'zoning',       label: 'Zoning',         color: '#f59e0b', visible: false },
];

export default function App() {
  const [market, setMarket] = useState('sedona');
  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [parcel, setParcel] = useState(null);
  const [hoa, setHoa] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [showHoaForm, setShowHoaForm] = useState(false);
  const [hoaFormPrefill, setHoaFormPrefill] = useState(null);
  const [showHoaList, setShowHoaList] = useState(false);
  const [layers, setLayers] = useState(SEDONA_LAYERS);
  const [subdivisionsGeoJSON, setSubdivisionsGeoJSON] = useState(null);
  const [zoningGeoJSON, setZoningGeoJSON] = useState(null);
  const [hoaRecords, setHoaRecords] = useState(() => listHoas());
  const mapRef = useRef(null);

  useEffect(() => { seedKnownHoas(); }, []);

  // Load GeoJSON layers when market changes
  useEffect(() => {
    const empty = { type: 'FeatureCollection', features: [] };
    const m = MARKETS[market];
    setSubdivisionsGeoJSON(null);
    setZoningGeoJSON(null);

    if (m.subdivisionsUrl) {
      fetch(m.subdivisionsUrl).then((r) => r.json()).then(setSubdivisionsGeoJSON).catch(() => setSubdivisionsGeoJSON(empty));
    }
    if (m.zoningUrl) {
      fetch(m.zoningUrl).then((r) => r.json()).then(setZoningGeoJSON).catch(() => setZoningGeoJSON(empty));
    }
  }, [market]);

  const switchMarket = useCallback((m) => {
    setMarket(m);
    const layerMap = { sedona: SEDONA_LAYERS, sandiego: SD_LAYERS, nashville: NASHVILLE_LAYERS };
    setLayers(layerMap[m] || SEDONA_LAYERS);
    setPins([]);
    setSelectedPin(null);
    setParcel(null);
    setHoa(null);
    setShowHoaList(false);
    setShowHoaForm(false);
    const center = MARKETS[m].center;
    mapRef.current?.flyTo({ center: [center.longitude, center.latitude], zoom: center.zoom, duration: 1200 });
  }, []);

  const toggleLayer = useCallback((id) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  }, []);

  const openCard = useCallback(async (pin) => {
    setSelectedPin(pin);
    setParcel(null);
    setHoa(null);
    setCardLoading(true);
    const result = await lookupParcel(pin.lng, pin.lat, pin.display);
    setParcel(result);
    setHoa(result?.subdivision ? findHoa(result.subdivision) : null);
    setCardLoading(false);
  }, []);

  const addPin = useCallback(({ lat, lng, display }) => {
    const newPin = { id: `${lng},${lat}`, lng, lat, display };
    setPins((prev) => prev.find((p) => p.id === newPin.id) ? prev : [...prev, newPin]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
    setShowHoaList(false);
    openCard(newPin);
  }, [openCard]);

  const handleMapClick = useCallback((e) => {
    const { lng, lat } = e.lngLat;
    addPin({ lat, lng, display: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }, [addPin]);

  const openHoaForm = useCallback((prefill) => {
    setHoaFormPrefill(prefill);
    setShowHoaForm(true);
    setShowHoaList(false);
  }, []);

  const handleHoaSaved = useCallback((record) => {
    setHoa(record);
    setHoaRecords(listHoas());
    setShowHoaForm(false);
  }, []);

  const subdivisionLayer = layers.find((l) => l.id === 'subdivisions');
  const zoningLayer = layers.find((l) => l.id === 'zoning');

  // Enrich subdivision/CPA polygons with HOA policy colors (works for both markets)
  const enrichedSubdivisionsGeoJSON = useMemo(() => {
    if (!subdivisionsGeoJSON) return null;
    const recordsByKey = Object.fromEntries(hoaRecords.map((r) => [r.key, r]));
    return {
      ...subdivisionsGeoJSON,
      features: subdivisionsGeoJSON.features.map((f) => {
        // Sedona uses SUBCOMMON/SUBNAME; SD uses cpname
        const name = f.properties?.SUBCOMMON || f.properties?.SUBNAME || f.properties?.cpname || f.properties?.CommunityName || '';
        const key = normalizeHoaKey(name);
        const record = recordsByKey[key];
        const policy = record?.strPolicy ?? 'none';
        return { ...f, properties: { ...f.properties, hoaPolicy: policy, areaName: name } };
      }),
    };
  }, [subdivisionsGeoJSON, hoaRecords]);

  // Enrich Nashville zoning layer with STR-zone color signal
  const enrichedZoningGeoJSON = useMemo(() => {
    if (!zoningGeoJSON) return zoningGeoJSON;

    if (market === 'nashville') {
      const PERMITTED = ['MUL','MUG','MUN','MUI','ORI','OR','CF','IWD','IND','CC','CS','CL','CN','CBD','DTC','SP','RM'];
      const PROHIBITED = ['RS','R','AR','AG'];
      return {
        ...zoningGeoJSON,
        features: zoningGeoJSON.features.map((f) => {
          const z = (f.properties?.ZONE_DESC || '').toUpperCase();
          const category =
            PERMITTED.some(p => z === p || z.startsWith(p))  ? 'permitted' :
            PROHIBITED.some(p => z === p || z.startsWith(p)) ? 'prohibited' : 'unknown';
          return { ...f, properties: { ...f.properties, zoneCategory: category, zoneName: z } };
        }),
      };
    }

    if (market !== 'sandiego') return zoningGeoJSON;
    return {
      ...zoningGeoJSON,
      features: zoningGeoJSON.features.map((f) => {
        const zone = (f.properties?.ZONE_NAME || '').toUpperCase();
        // RS/RM/RX = residential (Tier 3 eligible), AR = agri-res, CC/C = commercial
        const category =
          /^(RS|RM|RX)/.test(zone) ? 'residential' :
          /^AR/.test(zone)          ? 'agri-res' :
          /^(CC|CP|CV|CN|CR|CO|IL|IH|IS|IP)/.test(zone) ? 'commercial' : 'other';
        return { ...f, properties: { ...f.properties, zoneCategory: category, zoneName: zone } };
      }),
    };
  }, [zoningGeoJSON, market]);

  const currentMarket = MARKETS[market];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map
        ref={mapRef}
        initialViewState={currentMarket.center}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        onClick={handleMapClick}
        cursor="crosshair"
      >
        <NavigationControl position="bottom-right" />

        {/* HOA-colored subdivision / community plan polygons (both markets) */}
        {enrichedSubdivisionsGeoJSON && (
          <Source id="subdivisions" type="geojson" data={enrichedSubdivisionsGeoJSON}>
            <Layer id="subdivisions-fill" type="fill"
              layout={{ visibility: subdivisionLayer?.visible ? 'visible' : 'none' }}
              paint={{
                'fill-color': ['match', ['get', 'hoaPolicy'],
                  'allowed', '#22c55e', 'prohibited', '#ef4444', 'unknown', '#f59e0b', '#6366f1'],
                'fill-opacity': ['match', ['get', 'hoaPolicy'],
                  'allowed', 0.30, 'prohibited', 0.30, 'unknown', 0.20, 0.10],
              }}
            />
            <Layer id="subdivisions-line" type="line"
              layout={{ visibility: subdivisionLayer?.visible ? 'visible' : 'none' }}
              paint={{
                'line-color': ['match', ['get', 'hoaPolicy'],
                  'allowed', '#16a34a', 'prohibited', '#dc2626', 'unknown', '#d97706', '#6366f1'],
                'line-width': ['match', ['get', 'hoaPolicy'],
                  'allowed', 2, 'prohibited', 2, 'unknown', 1.5, 1],
                'line-opacity': 0.7,
              }}
            />
          </Source>
        )}

        {/* Both markets: zoning overlay */}
        {enrichedZoningGeoJSON && (
          <Source id="zoning" type="geojson" data={enrichedZoningGeoJSON}>
            <Layer id="zoning-fill" type="fill"
              layout={{ visibility: zoningLayer?.visible ? 'visible' : 'none' }}
              paint={{
                'fill-color':
                  market === 'sandiego' ? ['match', ['get', 'zoneCategory'],
                    'residential', '#3b82f6',
                    'agri-res',    '#22c55e',
                    'commercial',  '#f59e0b',
                    '#94a3b8'] :
                  market === 'nashville' ? ['match', ['get', 'zoneCategory'],
                    'permitted',  '#22c55e',
                    'prohibited', '#ef4444',
                    '#94a3b8'] :
                  '#f59e0b',
                'fill-opacity': 0.18,
              }}
            />
            <Layer id="zoning-line" type="line"
              layout={{ visibility: zoningLayer?.visible ? 'visible' : 'none' }}
              paint={{
                'line-color':
                  market === 'sandiego' ? ['match', ['get', 'zoneCategory'],
                    'residential', '#2563eb',
                    'agri-res',    '#16a34a',
                    'commercial',  '#d97706',
                    '#64748b'] :
                  market === 'nashville' ? ['match', ['get', 'zoneCategory'],
                    'permitted',  '#16a34a',
                    'prohibited', '#dc2626',
                    '#64748b'] :
                  '#f59e0b',
                'line-width': 1,
                'line-opacity': 0.6,
              }}
            />
          </Source>
        )}

        {pins.map((pin) => (
          <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); openCard(pin); }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              background: selectedPin?.id === pin.id ? '#0f172a' : '#3b82f6',
              border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              cursor: 'pointer', transition: 'background 0.2s',
            }} />
          </Marker>
        ))}
      </Map>

      {/* Market switcher */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', gap: 4,
        background: 'rgba(15,23,42,0.90)', borderRadius: 10, padding: 4,
        backdropFilter: 'blur(6px)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {Object.entries(MARKETS).map(([key, m]) => (
          <button key={key} onClick={() => switchMarket(key)} style={{
            padding: '7px 16px', borderRadius: 7, border: 'none',
            background: market === key ? '#3b82f6' : 'transparent',
            color: market === key ? '#ffffff' : '#94a3b8',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {m.label}
          </button>
        ))}
      </div>

      <AddressSearch onResult={addPin} market={market} />
      <LayerToggle layers={layers} onToggle={toggleLayer} />
      <UsageTracker />

      {/* HOA Records button */}
      <button
          onClick={() => { setShowHoaList((v) => !v); setSelectedPin(null); }}
          style={{
            position: 'absolute', top: 182, left: 16, zIndex: 10,
            background: showHoaList ? '#0f172a' : '#ffffff',
            color: showHoaList ? '#ffffff' : '#1e293b',
            border: '1px solid #e2e8f0', borderRadius: 10,
            padding: '9px 14px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          🏘 HOA Records
        </button>

      {/* Property card */}
      {selectedPin && !showHoaForm && !showHoaList && (
        <PropertyCard
          feature={{ properties: { address: selectedPin.display } }}
          parcel={parcel}
          hoa={hoa}
          market={market}
          loading={cardLoading}
          onClose={() => { setSelectedPin(null); setParcel(null); setHoa(null); }}
          onAddHoa={(name) => openHoaForm(name)}
        />
      )}

      {/* HOA list panel */}
      {showHoaList && (
        <HoaList
          onClose={() => setShowHoaList(false)}
          onEdit={(record) => openHoaForm(record)}
        />
      )}

      {/* HOA capture form (modal) */}
      {showHoaForm && (
        <>
          <div onClick={() => setShowHoaForm(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 15 }} />
          <HoaCapture
            prefillName={typeof hoaFormPrefill === 'string' ? hoaFormPrefill : hoaFormPrefill?.name || ''}
            initialRecord={typeof hoaFormPrefill === 'object' ? hoaFormPrefill : null}
            onSaved={handleHoaSaved}
            onClose={() => setShowHoaForm(false)}
          />
        </>
      )}

      <div style={{
        position: 'absolute', bottom: 24, left: 16,
        background: 'rgba(15,23,42,0.85)', color: '#94a3b8',
        borderRadius: 8, padding: '6px 12px', fontSize: 11,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backdropFilter: 'blur(4px)',
      }}>
        Property Scout · {currentMarket.label} · Phase 2
      </div>
    </div>
  );
}
