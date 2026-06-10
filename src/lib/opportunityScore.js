/**
 * Property Opportunity Score — PRD §7.3
 *
 * Weighted sum of flags → 0–100 score.
 * Weights are operator-editable and stored in localStorage.
 * The score is a PRIORITIZATION AID, not a recommendation.
 * It never overrides the confidence read.
 *
 * Default weights (sum = 100):
 *   absentee_owner     30  — absentee = motivated seller signal
 *   str_zone_ok        30  — zone/HOA actually permits STR
 *   hoa_allows_str     20  — HOA explicitly verified as STR-friendly
 *   has_parcel_data    10  — data quality: real GIS hit
 *   has_rent_estimate  10  — financial: AVM/rent data present
 */

const WEIGHTS_KEY = 'property-scout:score-weights';

export const DEFAULT_WEIGHTS = {
  absentee_owner:     30,
  str_zone_ok:        30,
  hoa_allows_str:     20,
  has_parcel_data:    10,
  has_rent_estimate:  10,
};

export function loadWeights() {
  try {
    const saved = JSON.parse(localStorage.getItem(WEIGHTS_KEY) || 'null');
    if (!saved) return { ...DEFAULT_WEIGHTS };
    // Merge with defaults so new flags don't break old saved weights
    return { ...DEFAULT_WEIGHTS, ...saved };
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

export function saveWeights(weights) {
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
}

export function resetWeights() {
  localStorage.removeItem(WEIGHTS_KEY);
  return { ...DEFAULT_WEIGHTS };
}

/**
 * Compute the opportunity score for a property.
 *
 * @param {{ parcel, hoa, strRule, avm, market }} opts
 * @returns {{ score: number, max: number, flags: object, breakdown: Array }}
 */
export function computeScore({ parcel, hoa, strRule, avm, market } = {}) {
  const weights = loadWeights();

  const flags = {
    // Absentee owner — LLC/trust or mailing ≠ site address
    absentee_owner: (() => {
      if (!parcel) return false;
      const name = (parcel.ownerName || '').toLowerCase();
      if (/llc|trust|corp|inc\b|ltd/.test(name)) return true;
      if (!parcel.ownerMailingAddress || !parcel.siteAddress) return false;
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
      return norm(parcel.siteAddress) !== norm(parcel.ownerMailingAddress);
    })(),

    // STR zone ok — depends on market rule result
    str_zone_ok: (() => {
      if (!strRule) return false;
      // Nashville: eligible boolean
      if (market === 'nashville') return strRule.eligible === true;
      // San Diego: tier assigned and cap not confirmed full
      if (market === 'sandiego') return strRule.eligible === true;
      // Sedona: strZoneOk is true if city permits (always true in AZ), but
      // practical gate is HOA — reward if HOA allows or no HOA restriction found
      if (market === 'sedona') {
        if (strRule.hoaAllowsStr === true) return true;
        if (strRule.hoaAllowsStr === 'unknown' && parcel) return true; // partial credit
        return false;
      }
      return false;
    })(),

    // HOA explicitly verified as STR-allowed
    hoa_allows_str: !!(hoa && hoa.strPolicy === 'allowed'),

    // Has real parcel data from GIS
    has_parcel_data: !!(parcel && parcel.source !== null),

    // Has AVM / rent estimate
    has_rent_estimate: !!(avm && (avm.estimatedRent || avm.estimatedValue)),
  };

  let score = 0;
  const breakdown = [];

  for (const [flag, fired] of Object.entries(flags)) {
    const w = weights[flag] ?? 0;
    const points = fired ? w : 0;
    score += points;
    breakdown.push({ flag, fired, weight: w, points, label: FLAG_LABELS[flag] });
  }

  return {
    score: Math.min(Math.round(score), 100),
    max: Object.values(weights).reduce((a, b) => a + b, 0),
    flags,
    breakdown,
  };
}

const FLAG_LABELS = {
  absentee_owner:     'Likely absentee owner',
  str_zone_ok:        'STR zone / HOA eligible',
  hoa_allows_str:     'HOA verified STR-friendly',
  has_parcel_data:    'Parcel data confirmed',
  has_rent_estimate:  'Rent estimate available',
};
