/**
 * Shortlist store — localStorage-backed saved properties.
 * PRD §8.5 / FR-16: save, tag, note, status, export.
 *
 * Each entry:
 *   id          string   — `${lng},${lat}` (stable pin ID)
 *   address     string
 *   lng, lat    number
 *   market      string   — 'sedona' | 'sandiego' | 'nashville'
 *   status      string   — 'new' | 'researching' | 'pitched' | 'pass'
 *   notes       string
 *   score       number   — opportunity score at time of save
 *   parcel      object   — snapshot of parcel data
 *   hoa         object   — snapshot of HOA record (if any)
 *   savedAt     string   — ISO timestamp
 *   updatedAt   string   — ISO timestamp
 */

const STORAGE_KEY = 'property-scout:shortlist';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Add or update a shortlist entry. Returns the saved entry. */
export function upsertShortlistEntry(entry) {
  const list = load();
  const idx = list.findIndex((e) => e.id === entry.id);
  const now = new Date().toISOString();
  const updated = {
    status: 'new',
    notes: '',
    score: 0,
    ...entry,
    updatedAt: now,
    savedAt: idx >= 0 ? list[idx].savedAt : now,
  };
  if (idx >= 0) {
    list[idx] = updated;
  } else {
    list.unshift(updated); // newest first
  }
  save(list);
  return updated;
}

/** Get a single entry by pin ID. */
export function getShortlistEntry(id) {
  return load().find((e) => e.id === id) ?? null;
}

/** Get all shortlist entries. */
export function listShortlist() {
  return load();
}

/** Update just status/notes on an existing entry. */
export function updateShortlistEntry(id, patch) {
  const list = load();
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  save(list);
  return list[idx];
}

/** Remove an entry from the shortlist. */
export function removeShortlistEntry(id) {
  save(load().filter((e) => e.id !== id));
}

/** True if a pin ID is already on the shortlist. */
export function isShortlisted(id) {
  return load().some((e) => e.id === id);
}

export const STATUS_OPTIONS = [
  { value: 'new',         label: '🆕 New',         color: '#3b82f6' },
  { value: 'researching', label: '🔍 Researching',  color: '#f59e0b' },
  { value: 'pitched',     label: '📨 Pitched',      color: '#8b5cf6' },
  { value: 'pass',        label: '✗ Pass',          color: '#94a3b8' },
];

export function statusStyle(value) {
  return STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];
}
