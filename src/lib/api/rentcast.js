/**
 * RentCast ValueProvider — fallback enrichment for parcels the county GIS can't serve.
 * Wired as the PRD's swappable provider interface.
 *
 * Usage tracking persists in localStorage, auto-resets on the 1st of each month.
 */

const API_KEY = import.meta.env.VITE_RENTCAST_KEY;
const BASE_URL = 'https://api.rentcast.io/v1';
const USAGE_KEY = 'property-scout:rentcast-usage';
const MONTHLY_LIMIT = 50;

// ─── Usage tracker ────────────────────────────────────────────────────────────

function getUsage() {
  try {
    const raw = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Auto-reset if we're past the stored reset date
    if (raw.resetDate && new Date(raw.resetDate) <= now) {
      return { count: 0, resetDate: resetDate.toISOString(), lastCall: null };
    }

    return {
      count: raw.count ?? 0,
      resetDate: raw.resetDate ?? resetDate.toISOString(),
      lastCall: raw.lastCall ?? null,
    };
  } catch {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1, 1);
    resetDate.setHours(0, 0, 0, 0);
    return { count: 0, resetDate: resetDate.toISOString(), lastCall: null };
  }
}

function incrementUsage() {
  const usage = getUsage();
  const updated = { ...usage, count: usage.count + 1, lastCall: new Date().toISOString() };
  localStorage.setItem(USAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getUsageStats() {
  return getUsage();
}

export function isAtLimit() {
  return getUsage().count >= MONTHLY_LIMIT;
}

// ─── RentCast API ─────────────────────────────────────────────────────────────

async function fetchRentCast(endpoint, params = {}) {
  if (!API_KEY) throw new Error('VITE_RENTCAST_KEY not set');
  if (isAtLimit()) throw new Error('Monthly RentCast limit reached');

  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { 'X-Api-Key': API_KEY, Accept: 'application/json' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `RentCast ${res.status}`);
  }

  incrementUsage();
  return res.json();
}

/**
 * Look up a property by address. Returns a normalized parcel-compatible object.
 * Used as fallback when county GIS returns null.
 */
export async function lookupPropertyRentCast(address) {
  try {
    const data = await fetchRentCast('/properties', { address, limit: 1 });
    const prop = Array.isArray(data) ? data[0] : data;
    if (!prop) return null;

    const ownerName = prop.ownerOccupied != null
      ? (prop.ownerOccupied ? 'Owner Occupied' : prop.owner?.names?.join(', ') || null)
      : prop.owner?.names?.join(', ') || null;

    const mailingAddr = prop.owner?.mailingAddress
      ? [
          prop.owner.mailingAddress.addressLine1,
          prop.owner.mailingAddress.city,
          prop.owner.mailingAddress.state,
          prop.owner.mailingAddress.zipCode,
        ].filter(Boolean).join(', ')
      : null;

    return {
      apn: prop.assessorID || null,
      ownerName,
      ownerMailingAddress: mailingAddr,
      siteAddress: prop.formattedAddress || address,
      zoning: prop.zoning || null,
      acres: prop.lotSize ? (prop.lotSize / 43560).toFixed(2) : null, // sqft → acres
      subdivision: prop.subdivision || null,
      county: (prop.county || '').toLowerCase() || 'unknown',
      // Enrichment fields beyond parcel basics
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      squareFootage: prop.squareFootage,
      yearBuilt: prop.yearBuilt,
      assessedValue: prop.assessedValue,
      lastSalePrice: prop.lastSalePrice,
      lastSaleDate: prop.lastSaleDate,
      ownerOccupied: prop.ownerOccupied,
      source: 'rentcast',
      raw: prop,
    };
  } catch (e) {
    console.warn('RentCast lookup failed:', e.message);
    return null;
  }
}

/**
 * Get AVM (estimated market value) and rent estimate for a property.
 */
export async function getAvm(address) {
  try {
    const [valueData, rentData] = await Promise.allSettled([
      fetchRentCast('/avm/value', { address }),
      fetchRentCast('/avm/rent/long-term', { address }),
    ]);

    return {
      estimatedValue: valueData.status === 'fulfilled' ? valueData.value?.price : null,
      valueLow: valueData.status === 'fulfilled' ? valueData.value?.priceLow : null,
      valueHigh: valueData.status === 'fulfilled' ? valueData.value?.priceHigh : null,
      estimatedRent: rentData.status === 'fulfilled' ? rentData.value?.rent : null,
      rentLow: rentData.status === 'fulfilled' ? rentData.value?.rentLow : null,
      rentHigh: rentData.status === 'fulfilled' ? rentData.value?.rentHigh : null,
    };
  } catch (e) {
    console.warn('RentCast AVM failed:', e.message);
    return null;
  }
}
