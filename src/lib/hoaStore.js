/**
 * HOA Knowledge Layer — localStorage-backed store.
 * Each record is a structured, sourced STR-policy entry per HOA.
 * Schema matches the PRD §7.5 spec.
 *
 * Keyed by normalized HOA name so lookups are O(1).
 */

const STORAGE_KEY = 'property-scout:hoa-knowledge-layer';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function save(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Normalize a name for consistent keying (e.g. "RIDGEVIEW SUBDIVISION" → "ridgeview") */
export function normalizeHoaKey(name) {
  return name
    .toLowerCase()
    .replace(/\b(subdivision|sub|hoa|homeowners?|owners?|association|community|estates?|village|ranch|heights?|hills?)\b/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

/** Add or update an HOA record. Returns the saved record. */
export function upsertHoa(record) {
  const store = load();
  const key = normalizeHoaKey(record.name);
  const existing = store[key] || {};
  store[key] = {
    ...existing,
    ...record,
    key,
    updatedAt: new Date().toISOString(),
  };
  save(store);
  return store[key];
}

/** Look up an HOA by its display name (fuzzy — tries normalized key). */
export function findHoa(name) {
  if (!name) return null;
  const store = load();
  const key = normalizeHoaKey(name);
  return store[key] ?? null;
}

/** Return all HOA records as an array. */
export function listHoas() {
  return Object.values(load());
}

/** Delete an HOA record by name. */
export function deleteHoa(name) {
  const store = load();
  const key = normalizeHoaKey(name);
  delete store[key];
  save(store);
}

/**
 * Derive confidence from an HOA record + whether we found a parcel at all.
 * High  = HOA policy verified (sourced record)
 * Medium = parcel found but no HOA record
 * Low   = no parcel data
 */
export function deriveConfidence(parcel, hoa) {
  if (!parcel) return 'low';
  if (hoa && hoa.strPolicy !== 'unknown' && hoa.confidence === 'high') return 'high';
  if (hoa && hoa.strPolicy !== 'unknown') return 'medium';
  return 'medium';
}
