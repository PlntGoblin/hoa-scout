/**
 * Nashville STR permit lookup via Metro Nashville Open Data (Socrata).
 * Dataset: 2z82-v8pm — Short Term Rental Permits
 * Endpoint: https://data.nashville.gov/resource/2z82-v8pm.json
 *
 * Used to check whether a property already has an active NOO STR permit,
 * which is a strong positive signal for investors.
 *
 * Socrata SoQL query — no API key needed for read-only public datasets.
 */

const SOCRATA_URL = 'https://data.nashville.gov/resource/2z82-v8pm.json';

/**
 * Normalize an address string for fuzzy matching against Socrata records.
 * Strips unit numbers, lowercases, collapses spaces.
 */
function normalizeAddress(addr) {
  return (addr || '')
    .toLowerCase()
    .replace(/\b(apt|unit|ste|suite|#)\s*[\w-]+/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Look up active STR permits for a Nashville property address.
 *
 * @param {string} address - The site address (e.g. "1008 16TH AVE S")
 * @returns {Promise<{
 *   hasPermit: boolean,
 *   permits: Array<{permitNumber: string, status: string, type: string, expiration: string|null}>,
 *   source: string
 * }|null>}
 */
export async function lookupNashvillePermit(address) {
  if (!address) return null;

  try {
    // Extract street number + first word of street for targeted query
    const normalized = normalizeAddress(address);
    const parts = normalized.split(' ');
    const streetNum = parts[0];

    if (!streetNum || !/^\d+$/.test(streetNum)) return null;

    const params = new URLSearchParams({
      '$where': `permit_address like '${streetNum} %'`,
      '$limit': '10',
      '$order': 'issued_date DESC',
    });

    const res = await fetch(`${SOCRATA_URL}?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;
    const records = await res.json();
    if (!Array.isArray(records) || records.length === 0) {
      return { hasPermit: false, permits: [], source: 'nashville-socrata' };
    }

    // Filter to records that match our address more closely
    const normalizedInput = normalizeAddress(address);
    const matched = records.filter((r) => {
      const recAddr = normalizeAddress(r.permit_address || '');
      return recAddr.startsWith(normalizeAddress(streetNum)) &&
             normalizedInput.split(' ').slice(1, 3).every(w => recAddr.includes(w));
    });

    const permits = (matched.length > 0 ? matched : records).map((r) => ({
      permitNumber: r.permit_number || r.permit_no || null,
      status:       r.permit_status || r.status || 'Unknown',
      type:         r.permit_type || r.short_term_rental_type || null,
      expiration:   r.expiration_date || r.expire_date || null,
      address:      r.permit_address || null,
    }));

    const active = permits.filter(p =>
      /active|approved|valid/i.test(p.status)
    );

    return {
      hasPermit: active.length > 0,
      activeCount: active.length,
      permits,
      source: 'nashville-socrata',
    };
  } catch (e) {
    console.warn('Nashville permit lookup failed:', e.message);
    return null;
  }
}
