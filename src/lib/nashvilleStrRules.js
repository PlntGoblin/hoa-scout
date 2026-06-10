/**
 * Nashville STR rules — permitted-zone model.
 *
 * Nashville operates a zone-based STR system:
 * - Non-owner-occupied STRs are PERMITTED in commercial / mixed-use zones
 * - Non-owner-occupied STRs are PROHIBITED in residential zones (RS, R, AR, AR2A, etc.)
 * - Owner-occupied STRs (host-on-site) have different rules — not the focus here
 *
 * Sources:
 *   Metro Nashville Code of Ordinances §17.16.210
 *   https://www.nashville.gov/departments/codes/short-term-rental-property
 *
 * IMPORTANT: This is a research-aid tool. Verify current Metro Nashville Code
 * directly before making any investment decision. STR regulations change.
 */

// Zones where non-owner-occupied STRs are generally permitted
const PERMITTED_ZONE_PREFIXES = [
  'MUL', 'MUG', 'MUN', 'MUI',    // Mixed-use
  'ORI', 'OR',                    // Office-residential
  'CF',                           // Commercial flex
  'IWD', 'IND',                   // Industrial / waterfront
  'CC', 'CS', 'CL', 'CN', 'CBD', // Commercial variants
  'DTC',                          // Downtown core
  'SP',                           // Specific plan
  'RM',                           // Multi-family residential (conditional — check CC&Rs)
];

// Zones where non-owner-occupied STRs are prohibited
const PROHIBITED_ZONE_PREFIXES = [
  'RS',   // Single-family residential
  'R',    // Residential (general)
  'AR',   // Agricultural-residential (AR, AR2A)
  'AG',   // Agricultural
];

const OFFICIAL_LINK = 'https://www.nashville.gov/departments/codes/short-term-rental-property';

/**
 * Classify a Nashville zone code.
 * Returns 'permitted' | 'prohibited' | 'conditional' | 'unknown'
 */
function classifyZone(zoneCode) {
  if (!zoneCode) return 'unknown';
  const z = zoneCode.toUpperCase().trim();

  for (const prefix of PROHIBITED_ZONE_PREFIXES) {
    if (z === prefix || z.startsWith(prefix)) return 'prohibited';
  }

  for (const prefix of PERMITTED_ZONE_PREFIXES) {
    if (z === prefix || z.startsWith(prefix)) return 'permitted';
  }

  return 'unknown';
}

/**
 * Nashville STR rule engine.
 *
 * @param {{ parcel: object|null, hoa: object|null }} opts
 * @returns {{
 *   eligible: boolean|null,
 *   zoneClass: string,
 *   zoneCode: string|null,
 *   tierLabel: string,
 *   summary: string,
 *   permitNote: string,
 *   hoaNote: string|null,
 *   officialLink: string,
 * }}
 */
export function nashvilleStrRule({ parcel, hoa }) {
  const zoneCode = parcel?.zoningCode || parcel?.zoning || null;
  const zoneClass = classifyZone(zoneCode);

  const zoneDisplay = zoneCode ? `Zone ${zoneCode}` : 'zone unknown';

  let eligible = null;
  let tierLabel = 'Unknown';
  let summary = '';
  let permitNote = '';

  if (zoneClass === 'permitted') {
    eligible = true;
    tierLabel = '✓ Permitted Zone';
    summary = `${zoneDisplay} — non-owner-occupied STR generally permitted under Metro Nashville code.`;
    permitNote = 'Non-owner-occupied STRP license required from Metro Codes. Verify current cap/waitlist status.';
  } else if (zoneClass === 'prohibited') {
    eligible = false;
    tierLabel = '✗ Prohibited Zone';
    summary = `${zoneDisplay} — non-owner-occupied STRs are prohibited in residential zones under Metro Nashville code.`;
    permitNote = 'Owner-occupied (host-on-site) STRs may still be permitted — verify with Metro Codes.';
  } else if (zoneClass === 'conditional') {
    eligible = null;
    tierLabel = '⚠ Conditional Zone';
    summary = `${zoneDisplay} — STR eligibility is conditional. Verify with Metro Nashville Codes department.`;
    permitNote = 'Contact Metro Nashville Codes to confirm STR permit eligibility for this zone.';
  } else {
    eligible = null;
    tierLabel = '? Zone Unknown';
    summary = zoneCode
      ? `Zone "${zoneCode}" — not in known permitted/prohibited list. Manual verification required.`
      : 'Zoning data unavailable — STR eligibility cannot be determined.';
    permitNote = 'Verify zone classification at Nashville Metro Codes.';
  }

  // HOA overlay note
  let hoaNote = null;
  if (hoa?.strPolicy === 'prohibited') {
    hoaNote = `${hoa.name} prohibits STRs — HOA restriction applies regardless of zone.`;
    eligible = false;
  } else if (hoa?.strPolicy === 'allowed') {
    hoaNote = `${hoa.name} permits STRs.`;
  } else if (hoa) {
    hoaNote = `${hoa.name} STR policy unknown — verify CC&Rs.`;
  }

  return {
    eligible,
    zoneClass,
    zoneCode,
    tierLabel,
    summary,
    permitNote,
    hoaNote,
    officialLink: OFFICIAL_LINK,
  };
}
