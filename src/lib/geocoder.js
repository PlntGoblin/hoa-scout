/**
 * Geocoding fallback chain: MapTiler → Photon (CORS-safe for browser use)
 * Returns { lat, lng, display } or null.
 *
 * Census Geocoder works from a server but has no CORS headers — unusable from the browser.
 * MapTiler geocoding is CORS-safe and handles rural AZ addresses well.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

async function geocodeMapTiler(address) {
  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://api.maptiler.com/geocoding/${encoded}.json?key=${MAPTILER_KEY}&country=us&limit=1`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  const [lng, lat] = feat.center;
  return {
    lat,
    lng,
    display: feat.place_name || feat.text,
    source: 'maptiler',
  };
}

async function geocodePhoton(address) {
  const params = new URLSearchParams({ q: address, limit: 1 });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  const [lng, lat] = feat.geometry.coordinates;
  const p = feat.properties;
  const display = [p.name, p.street, p.city, p.state, p.country]
    .filter(Boolean)
    .join(', ');
  return { lat, lng, display, source: 'photon' };
}

export async function geocodeAddress(address) {
  try {
    const result = await geocodeMapTiler(address);
    if (result) return result;
  } catch (_) {}

  try {
    const result = await geocodePhoton(address);
    if (result) return result;
  } catch (_) {}

  return null;
}
