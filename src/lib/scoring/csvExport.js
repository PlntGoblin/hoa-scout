/**
 * CSV export for the shortlist — PRD FR-16.
 * Generates a downloadable CSV file from shortlist entries.
 */

const COLUMNS = [
  { key: 'address',            label: 'Address' },
  { key: 'market',             label: 'Market' },
  { key: 'score',              label: 'Opportunity Score' },
  { key: 'status',             label: 'Status' },
  { key: 'ownerName',          label: 'Owner Name' },
  { key: 'ownerMailing',       label: 'Owner Mailing Address' },
  { key: 'occupancy',          label: 'Occupancy' },
  { key: 'apn',                label: 'APN' },
  { key: 'county',             label: 'County' },
  { key: 'zoning',             label: 'Zoning' },
  { key: 'subdivision',        label: 'Subdivision / CPA' },
  { key: 'hoaName',            label: 'HOA Name' },
  { key: 'hoaStrPolicy',       label: 'HOA STR Policy' },
  { key: 'acres',              label: 'Acres' },
  { key: 'assessedValue',      label: 'Assessed Value' },
  { key: 'lastSalePrice',      label: 'Last Sale Price' },
  { key: 'notes',              label: 'Notes' },
  { key: 'savedAt',            label: 'Saved Date' },
];

function esc(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function flattenEntry(entry) {
  const p = entry.parcel || {};
  const h = entry.hoa || null;

  // Derive occupancy label
  const name = (p.ownerName || '').toLowerCase();
  let occupancy = 'Unknown';
  if (p.source === 'rentcast' && p.ownerOccupied != null) {
    occupancy = p.ownerOccupied ? 'Owner-Occupied' : 'Absentee';
  } else if (/llc|trust|corp|inc\b|ltd/.test(name)) {
    occupancy = 'Absentee (LLC/Trust)';
  } else if (p.ownerMailingAddress && p.siteAddress) {
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    occupancy = norm(p.siteAddress) === norm(p.ownerMailingAddress)
      ? 'Likely Owner-Occupied'
      : 'Likely Absentee';
  }

  const county = (p.county || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    address:       entry.address || p.siteAddress || '',
    market:        entry.market || '',
    score:         entry.score ?? '',
    status:        entry.status || 'new',
    ownerName:     p.ownerName || '',
    ownerMailing:  p.ownerMailingAddress || '',
    occupancy,
    apn:           p.apn || '',
    county,
    zoning:        p.zoning || '',
    subdivision:   p.subdivision || '',
    hoaName:       h?.name || '',
    hoaStrPolicy:  h?.strPolicy || '',
    acres:         p.acres != null ? Number(p.acres).toFixed(2) : '',
    assessedValue: p.assessedValue ? `$${Number(p.assessedValue).toLocaleString()}` : '',
    lastSalePrice: p.lastSalePrice ? `$${Number(p.lastSalePrice).toLocaleString()}` : '',
    notes:         entry.notes || '',
    savedAt:       entry.savedAt ? new Date(entry.savedAt).toLocaleDateString() : '',
  };
}

/** Generate a CSV string from a list of shortlist entries. */
export function generateCsv(entries) {
  const header = COLUMNS.map((c) => esc(c.label)).join(',');
  const rows = entries.map((entry) => {
    const flat = flattenEntry(entry);
    return COLUMNS.map((c) => esc(flat[c.key])).join(',');
  });
  return [header, ...rows].join('\n');
}

/** Trigger a browser download of the CSV. */
export function downloadCsv(entries, filename = 'property-scout-shortlist.csv') {
  const csv = generateCsv(entries);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
