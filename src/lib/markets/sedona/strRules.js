/**
 * Per-market STR rule engine (§6 of PRD).
 * Each market module returns { strZoneOk, summary, officialLink }
 * Sedona's gate is HOA/CC&R — the zone is always legally OK (AZ preemption),
 * but the HOA is the practical blocker.
 */

export function sedonaStrRule({ hoa }) {
  const base = {
    officialLink: 'https://www.sedonaaz.gov/city-services/building-safety/short-term-rentals',
    legalNote: 'AZ law (SB1350/SB1168) bars cities from banning residential STRs. City permit required (~$210/yr, non-transferable on sale). HOA/CC&R rules are the practical gate.',
    permitWarning: 'Sedona STR permits are non-transferable on sale and tied to the advertised unit.',
  };

  if (!hoa) {
    return {
      ...base,
      strZoneOk: 'unknown',
      hoaAllowsStr: 'unknown',
      summary: 'HOA membership unknown. City permit legally available — verify HOA CC&Rs.',
    };
  }

  const hoaAllowsStr = hoa.strPolicy === 'allowed'
    ? true
    : hoa.strPolicy === 'prohibited'
    ? false
    : 'unknown';

  return {
    ...base,
    strZoneOk: true,
    hoaAllowsStr,
    summary: hoa.strPolicy === 'allowed'
      ? `${hoa.name}: STR permitted per CC&Rs. City permit still required.`
      : hoa.strPolicy === 'prohibited'
      ? `${hoa.name}: STR prohibited per CC&Rs.`
      : `${hoa.name}: STR policy unverified — check CC&Rs.`,
  };
}
