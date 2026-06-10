/**
 * Pin memory — persists map pins and recent searches across sessions.
 *
 * Pins are stored per-market so switching Sedona ↔ Nashville restores
 * the right set of pins without cross-contamination.
 *
 * Recent searches are cross-market (last 8), newest first.
 * Stars are a lightweight favourite flag on individual pins.
 */

const PINS_KEY    = 'property-scout:pins';
const RECENTS_KEY = 'property-scout:recent-searches';
const MAX_RECENTS = 8;
const MAX_PINS_PER_MARKET = 50; // prevent runaway growth

// ── Pins ─────────────────────────────────────────────────────────────────────

function loadAllPins() {
  try { return JSON.parse(localStorage.getItem(PINS_KEY) || '{}'); }
  catch { return {}; }
}

function saveAllPins(all) {
  localStorage.setItem(PINS_KEY, JSON.stringify(all));
}

/** Load all saved pins for a given market. */
export function loadPins(market) {
  return loadAllPins()[market] || [];
}

/** Upsert a pin for a market. Returns the updated pin list. */
export function savePin(market, pin) {
  const all = loadAllPins();
  const list = all[market] || [];
  const idx = list.findIndex((p) => p.id === pin.id);
  const entry = { starred: false, savedAt: new Date().toISOString(), ...pin };
  if (idx >= 0) {
    // Preserve existing star + savedAt when re-adding
    list[idx] = { ...list[idx], ...pin };
  } else {
    list.unshift(entry);
    if (list.length > MAX_PINS_PER_MARKET) list.splice(MAX_PINS_PER_MARKET);
  }
  all[market] = list;
  saveAllPins(all);
  return list;
}

/** Toggle the star on a pin. Returns the updated pin. */
export function toggleStar(market, pinId) {
  const all = loadAllPins();
  const list = all[market] || [];
  const idx = list.findIndex((p) => p.id === pinId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], starred: !list[idx].starred };
  all[market] = list;
  saveAllPins(all);
  return list[idx];
}

/** Remove a single pin from a market. */
export function removePin(market, pinId) {
  const all = loadAllPins();
  all[market] = (all[market] || []).filter((p) => p.id !== pinId);
  saveAllPins(all);
}

/** Clear all pins for a market. */
export function clearPins(market) {
  const all = loadAllPins();
  delete all[market];
  saveAllPins(all);
}

// ── Recent searches ───────────────────────────────────────────────────────────

function loadRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); }
  catch { return []; }
}

/** Push a new search to the recents list (dedupes by display address). */
export function pushRecent(entry) {
  const list = loadRecents().filter((r) => r.display !== entry.display);
  list.unshift({ ...entry, searchedAt: new Date().toISOString() });
  localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
}

/** Get all recent searches, newest first. */
export function getRecents() {
  return loadRecents();
}

/** Remove a single recent entry by display string. */
export function removeRecent(display) {
  const list = loadRecents().filter((r) => r.display !== display);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
}

/** Clear all recents. */
export function clearRecents() {
  localStorage.removeItem(RECENTS_KEY);
}
