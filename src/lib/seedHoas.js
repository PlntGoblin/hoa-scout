/**
 * Seed data for known Sedona-area HOAs.
 * Sources: Yavapai/Coconino County Recorder, Sedona GIS, HOA research.
 * STR policies marked 'unknown' until verified against CC&Rs.
 *
 * Only seeds records that don't already exist — never overwrites user edits.
 */

import { normalizeHoaKey, upsertHoa, listHoas } from './hoaStore';

const SEED_VERSION = 2;
const SEED_VERSION_KEY = 'property-scout:seed-version';

const KNOWN_HOAS = [
  {
    name: 'Crimson View HOA',
    strPolicy: 'unknown',
    strPolicyNotes: '91-lot community. Verify STR policy against recorded CC&Rs with Coconino County Recorder.',
    source: 'Sedona Area HOA Research / County Records',
    lastVerified: '2026-06',
    confidence: 'medium',
    lotCount: 91,
    county: 'coconino',
    notes: 'Confirmed HOA community. CC&Rs recorded with county recorder.',
  },
  {
    name: 'Eagle Rock Homeowners Association',
    strPolicy: 'unknown',
    strPolicyNotes: '26-lot community. Small HOA — verify STR policy against recorded CC&Rs.',
    source: 'Sedona Area HOA Research / County Records',
    lastVerified: '2026-06',
    confidence: 'medium',
    lotCount: 26,
    county: 'coconino',
    notes: 'Confirmed HOA community.',
  },
  {
    name: 'Foothills South Owners Association',
    strPolicy: 'unknown',
    strPolicyNotes: '205-lot community. Larger HOA — STR restrictions common in developments this size. Verify CC&Rs.',
    source: 'Sedona Area HOA Research / County Records',
    lastVerified: '2026-06',
    confidence: 'medium',
    lotCount: 205,
    county: 'yavapai',
    notes: 'One of the larger Sedona HOA communities.',
  },
  {
    name: 'Broken Arrow Civic Improvement Association',
    strPolicy: 'unknown',
    strPolicyNotes: 'Near Broken Arrow Trail corridor. Civic improvement associations often have deed restrictions — verify with county recorder.',
    source: 'Sedona Area HOA Research / County Records',
    lastVerified: '2026-06',
    confidence: 'medium',
    county: 'yavapai',
    notes: 'Civic improvement association — may have deed restrictions rather than full HOA CC&Rs.',
  },
  {
    name: 'Tlaquepaque Homeowners Association',
    strPolicy: 'unknown',
    strPolicyNotes: 'Community near the arts village. Verify STR policy with Yavapai County Recorder.',
    source: 'Sedona Area HOA Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    county: 'yavapai',
  },
  {
    name: 'Cathedral Rock Homeowners Association',
    strPolicy: 'unknown',
    strPolicyNotes: 'Near Cathedral Rock area. Popular STR zone — policy verification critical.',
    source: 'Sedona Area HOA Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    county: 'yavapai',
  },
  {
    name: 'Uptown Sedona Homeowners Association',
    strPolicy: 'unknown',
    strPolicyNotes: 'Uptown Sedona corridor. Coconino County jurisdiction.',
    source: 'Sedona Area HOA Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    county: 'coconino',
  },
];

/**
 * Seeds known HOA records into the store.
 * Only inserts records that don't already exist — safe to call on every app load.
 * Won't overwrite user-edited records.
 */
export function seedKnownHoas() {
  const lastVersion = parseInt(localStorage.getItem(SEED_VERSION_KEY) || '0', 10);
  if (lastVersion >= SEED_VERSION) return; // Already seeded this version

  const existing = listHoas();
  const existingKeys = new Set(existing.map((h) => normalizeHoaKey(h.name)));

  let seeded = 0;
  for (const hoa of KNOWN_HOAS) {
    const key = normalizeHoaKey(hoa.name);
    if (!existingKeys.has(key)) {
      upsertHoa(hoa);
      seeded++;
    }
  }

  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
  if (seeded > 0) {
    console.info(`[Property Scout] Seeded ${seeded} known Sedona HOA records.`);
  }
}
