/**
 * San Diego STRO (Short-Term Residential Occupancy) rule engine.
 * 4-tier license system per SD Municipal Code §141.0420.
 *
 * Tier 1: Home-share, owner-occupied, ≤20% of year (73 days). No cap.
 * Tier 2: Home-share, owner-occupied, >20% of year. No cap.
 * Tier 3: Whole-home, non-owner-occupied. Citywide cap ~1% of housing stock.
 * Tier 4: Mission Beach Coastal Overlay. Separate stricter cap.
 */

const MISSION_BEACH_COMMUNITIES = ['mission beach', 'mb'];

const TIER_INFO = {
  1: {
    label: 'Tier 1 — Home Share (≤73 days)',
    summary: 'Owner-occupied, renting ≤73 days/yr. No citywide cap — license available.',
    eligible: true,
    cap: false,
  },
  2: {
    label: 'Tier 2 — Home Share (>73 days)',
    summary: 'Owner-occupied, renting >73 days/yr. No citywide cap — license available.',
    eligible: true,
    cap: false,
  },
  3: {
    label: 'Tier 3 — Whole-Home STR',
    summary: 'Non-owner-occupied whole-home rental. Subject to citywide cap (~1% of housing stock). Check current availability.',
    eligible: true,
    cap: true,
    capNote: 'Tier 3 licenses are capped citywide. Verify availability before pursuing.',
  },
  4: {
    label: 'Tier 4 — Mission Beach',
    summary: 'Mission Beach Coastal Overlay. Separate cap applies — historically at or near limit.',
    eligible: true,
    cap: true,
    capNote: 'Mission Beach Tier 4 cap is frequently full. Verify current availability.',
  },
};

/**
 * Determine the applicable STRO tier for a parcel.
 * @param {object} parcel - normalized parcel object from sdParcelLookup
 * @param {object|null} hoa - HOA record (if any)
 * @returns {object} STR rule result
 */
export function sdStrRule({ parcel, hoa } = {}) {
  if (!parcel) {
    return {
      tier: null,
      tierLabel: 'Unknown',
      summary: 'Parcel data required to determine STRO tier.',
      eligible: null,
      cap: null,
      hoaNote: null,
      officialLink: 'https://www.sandiego.gov/treasurer/short-term-residential-occupancy',
      permitNote: 'STRO license required. Annual renewal. Owner must list license number on all platforms.',
    };
  }

  const community = (parcel.community || '').toLowerCase();
  const isMissionBeach = MISSION_BEACH_COMMUNITIES.some((mb) => community.includes(mb));
  const isOwnerOccupied = parcel.ownerOccupied === true;

  let tier;
  if (isMissionBeach) {
    tier = 4;
  } else if (isOwnerOccupied) {
    // Can't determine days without booking data — default to Tier 2 (more conservative)
    tier = 2;
  } else {
    tier = 3;
  }

  const info = TIER_INFO[tier];
  const hoaNote = hoa?.strPolicy === 'prohibited'
    ? '⚠ HOA prohibits STR — license eligibility does not override CC&Rs.'
    : hoa?.strPolicy === 'allowed'
    ? '✓ HOA permits STR.'
    : hoa
    ? 'HOA STR policy unverified — check CC&Rs.'
    : null;

  return {
    tier,
    tierLabel: info.label,
    summary: info.summary,
    eligible: info.eligible,
    cap: info.cap,
    capNote: info.capNote || null,
    hoaNote,
    officialLink: 'https://www.sandiego.gov/treasurer/short-term-residential-occupancy',
    permitNote: 'STRO license required annually. Must display license number on all listing platforms.',
  };
}

/** Zone codes that indicate residential use in San Diego zoning. */
export function isSdResidentialZone(zoneCode) {
  if (!zoneCode) return null;
  const z = zoneCode.toUpperCase();
  // RS = Single Family, RM = Multi-Family, RX = Residential Mixed, AR = Agricultural Res
  return /^(RS|RM|RX|AR|R-)/.test(z);
}
