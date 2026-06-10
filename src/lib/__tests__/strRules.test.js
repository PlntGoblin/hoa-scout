import { describe, it, expect } from 'vitest';
import { sedonaStrRule } from '../strRules.js';

describe('sedonaStrRule', () => {
  it('returns unknown when no HOA', () => {
    const result = sedonaStrRule({ hoa: null });
    expect(result.strZoneOk).toBe('unknown');
    expect(result.hoaAllowsStr).toBe('unknown');
    expect(result.summary).toMatch(/unknown/i);
  });

  it('returns allowed when HOA policy is allowed', () => {
    const result = sedonaStrRule({
      hoa: { name: 'Oak Creek Estates HOA', strPolicy: 'allowed' },
    });
    expect(result.strZoneOk).toBe(true);
    expect(result.hoaAllowsStr).toBe(true);
    expect(result.summary).toMatch(/permitted/i);
  });

  it('returns prohibited when HOA policy is prohibited', () => {
    const result = sedonaStrRule({
      hoa: { name: 'Crimson View HOA', strPolicy: 'prohibited' },
    });
    expect(result.strZoneOk).toBe(true);
    expect(result.hoaAllowsStr).toBe(false);
    expect(result.summary).toMatch(/prohibited/i);
  });

  it('returns unknown hoaAllowsStr when HOA policy is unknown', () => {
    const result = sedonaStrRule({
      hoa: { name: 'Some HOA', strPolicy: 'unknown' },
    });
    expect(result.hoaAllowsStr).toBe('unknown');
    expect(result.summary).toMatch(/unverified/i);
  });

  it('always includes permit warning about non-transferability', () => {
    const result = sedonaStrRule({ hoa: null });
    expect(result.permitWarning).toMatch(/non-transferable/i);
  });

  it('always includes officialLink', () => {
    const result = sedonaStrRule({ hoa: null });
    expect(result.officialLink).toMatch(/sedona/i);
  });
});
