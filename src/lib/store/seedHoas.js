/**
 * Seed data for known Sedona-area HOAs.
 * Sources: Yavapai/Coconino County Recorder, Sedona GIS, HOA research.
 * STR policies marked 'unknown' until verified against CC&Rs.
 *
 * Only seeds records that don't already exist — never overwrites user edits.
 */

import { normalizeHoaKey, upsertHoa, listHoas } from './hoaStore';

const SEED_VERSION = 4;
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

  // ── San Diego Community Plan Areas ──────────────────────────────────────────
  // Keyed to SD community plan area names (SANDAG CMTY_PLAN_SD layer).
  // STR context: Tier 3 whole-home STRO license required; HOA policy is the
  // second gate. Verify CC&Rs via SD County Recorder.

  {
    name: 'CARMEL VALLEY',
    strPolicy: 'unknown',
    strPolicyNotes: 'Master-planned community with multiple sub-HOAs (Del Mar Highlands, Torrey Del Mar, etc.). Many sub-associations restrict STRs — verify individual CC&Rs via SD County Recorder.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
    notes: 'High HOA density. Tier 3 STRO license also required.',
  },
  {
    name: 'RANCHO BERNARDO',
    strPolicy: 'unknown',
    strPolicyNotes: 'Large planned community with 30+ sub-HOAs (Seven Oaks, Bernardo Heights, etc.). Check each sub-association CC&Rs individually — restrictions vary widely.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },
  {
    name: 'SCRIPPS MIRAMAR RANCH',
    strPolicy: 'unknown',
    strPolicyNotes: 'Multiple HOAs. Scripps Ranch HOA and sub-associations. Verify CC&Rs — some restrict minimum lease terms.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },
  {
    name: 'MISSION BEACH',
    strPolicy: 'unknown',
    strPolicyNotes: 'STRO Tier 4 area (separate cap, frequently at limit). HOA restrictions vary by building. Verify both Tier 4 license availability AND any HOA/condo CC&Rs.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
    notes: 'Tier 4 STRO — cap often full. High priority to verify.',
  },
  {
    name: 'PACIFIC BEACH',
    strPolicy: 'unknown',
    strPolicyNotes: 'Popular STR market. Mix of condos with HOAs and single-family homes. Condo HOAs often restrict STRs — verify CC&Rs per building.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },
  {
    name: 'LA JOLLA',
    strPolicy: 'unknown',
    strPolicyNotes: 'Mix of HOA and non-HOA properties. Luxury condos and hillside communities — many condo associations restrict STRs. Verify per building/community.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },
  {
    name: 'OCEAN BEACH',
    strPolicy: 'unknown',
    strPolicyNotes: 'Mostly single-family and small multi-unit — fewer formal HOAs than planned communities. STR-friendly area but verify per parcel.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },
  {
    name: 'BLACK MOUNTAIN RANCH',
    strPolicy: 'unknown',
    strPolicyNotes: 'Newer master-planned community. HOA likely restricts STRs — verify CC&Rs via SD County Recorder.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },
  {
    name: 'PACIFIC HIGHLANDS RANCH',
    strPolicy: 'unknown',
    strPolicyNotes: 'Newer planned community with active HOA. Likely has STR restrictions — verify CC&Rs.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },
  {
    name: 'MIRA MESA',
    strPolicy: 'unknown',
    strPolicyNotes: 'Older planned community. HOA coverage varies by tract. Research individual subdivision CC&Rs.',
    source: 'San Diego Community Plan Research',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'sandiego',
  },

  // ── Nashville Community Planning Areas ──────────────────────────────────────
  // 14 Metro Nashville CPAs from Boundaries/Boundaries/MapServer/1.
  // STR context: Nashville uses a PERMITTED-ZONE model. Non-owner-occupied STRs
  // require a Metro license and are only legal in commercial/mixed-use zones.
  // Residential zones (RS, R, AR) prohibit non-owner-occupied STRs.
  // Verify against current Metro Nashville Code §17.16.210.

  {
    name: 'Nashville',
    strPolicy: 'unknown',
    strPolicyNotes: 'Urban core — mix of commercial/mixed-use and residential zones. Non-owner-occupied STRs permitted in MUL/ORI/commercial zones; prohibited in RS/R zones. Verify ZONE_DESC for each parcel.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
    notes: 'Downtown and urban neighborhoods. High density of MUL/MUG zones — STR-eligible with permit.',
  },
  {
    name: 'Antioch - Priest Lake',
    strPolicy: 'unknown',
    strPolicyNotes: 'Suburban southeast Nashville. Primarily residential (RS) zones — non-owner-occupied STRs likely prohibited. Verify zoning per parcel.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Bellevue',
    strPolicy: 'unknown',
    strPolicyNotes: 'Suburban west Nashville. Mostly residential zoning — non-owner-occupied STRs likely prohibited. Mixed-use corridors along Hwy 70 may be eligible.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Bordeaux - Whites Creek - Haynes Trinity',
    strPolicy: 'unknown',
    strPolicyNotes: 'North Nashville CPA. Primarily residential zones. Verify zoning per parcel before assuming STR eligibility.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Donelson - Hermitage - Old Hickory',
    strPolicy: 'unknown',
    strPolicyNotes: 'East Nashville suburbs. Mix of residential and some commercial corridors. Non-owner-occupied STRs prohibited in RS zones — verify per parcel.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'East Nashville',
    strPolicy: 'unknown',
    strPolicyNotes: 'High-demand STR market. Mix of RS residential (prohibited) and MUL/mixed-use corridors (permitted). Gentrifying area — many investor purchases. Verify ZONE_DESC for each parcel.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
    notes: 'Popular STR target area. Zone verification critical — single-family residential STRs prohibited.',
  },
  {
    name: 'Edgehill - Berry Hill',
    strPolicy: 'unknown',
    strPolicyNotes: 'South-central Nashville. Mix of residential and commercial zones. Berry Hill is an independent municipality — verify applicable codes separately.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Joelton',
    strPolicy: 'unknown',
    strPolicyNotes: 'Rural-suburban far north Davidson County. Primarily AG/AR agricultural-residential zoning — non-owner-occupied STRs likely prohibited.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Madison',
    strPolicy: 'unknown',
    strPolicyNotes: 'North Nashville suburb. Primarily residential zoning. Some commercial corridors along Gallatin Pike may be eligible. Verify per parcel.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'North Nashville',
    strPolicy: 'unknown',
    strPolicyNotes: 'Near Germantown and Buena Vista. Mix of residential and commercial/mixed-use zones. Higher density areas near downtown may have MUL/ORI eligibility.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
    notes: 'Germantown corridor — verify MUL zoning for STR eligibility.',
  },
  {
    name: 'Pennington Bend',
    strPolicy: 'unknown',
    strPolicyNotes: 'East Nashville near the river bend. Primarily residential. Verify zone classification per parcel.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Radnor - Berry',
    strPolicy: 'unknown',
    strPolicyNotes: 'South Nashville. Primarily residential neighborhoods. Non-owner-occupied STRs likely prohibited under RS zoning.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Rivergate - Springfield Pike',
    strPolicy: 'unknown',
    strPolicyNotes: 'Far north Davidson County near Rivergate. Mix of commercial corridors and residential. Commercial zones along Springfield Pike may be eligible.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
  },
  {
    name: 'Southeast Nashville',
    strPolicy: 'unknown',
    strPolicyNotes: 'Suburban southeast. Primarily residential (RS) zoning. Non-owner-occupied STRs likely prohibited. Some commercial corridors may be eligible.',
    source: 'Nashville Community Planning Areas / Metro Nashville Code',
    lastVerified: '2026-06',
    confidence: 'medium',
    market: 'nashville',
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
