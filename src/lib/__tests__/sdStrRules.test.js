import { describe, it, expect } from 'vitest';
import { sdStrRule, isSdResidentialZone } from '../sdStrRules.js';

describe('sdStrRule — tier assignment', () => {
  it('returns unknown tier and null eligible with no parcel', () => {
    const result = sdStrRule({});
    expect(result.tier).toBe(null);
    expect(result.eligible).toBe(null);
  });

  it('assigns Tier 3 for non-owner-occupied, non-Mission-Beach', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: false, community: 'Pacific Beach' },
    });
    expect(result.tier).toBe(3);
    expect(result.cap).toBe(true);
  });

  it('assigns Tier 2 for owner-occupied, non-Mission-Beach', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: true, community: 'La Jolla' },
    });
    expect(result.tier).toBe(2);
    expect(result.cap).toBe(false);
  });

  it('assigns Tier 4 for Mission Beach parcel', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: false, community: 'mission beach' },
    });
    expect(result.tier).toBe(4);
    expect(result.cap).toBe(true);
  });

  it('Tier 4 even for owner-occupied Mission Beach', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: true, community: 'Mission Beach' },
    });
    expect(result.tier).toBe(4);
  });

  it('Tier 3 when ownerOccupied is null (unknown)', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: null, community: 'North Park' },
    });
    expect(result.tier).toBe(3);
  });
});

describe('sdStrRule — HOA note', () => {
  it('adds prohibition note when HOA prohibits STR', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: false, community: 'Carmel Valley' },
      hoa: { name: 'Carmel Valley HOA', strPolicy: 'prohibited' },
    });
    expect(result.hoaNote).toMatch(/prohibit/i);
  });

  it('adds allowed note when HOA allows STR', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: false, community: 'Carmel Valley' },
      hoa: { name: 'Carmel Valley HOA', strPolicy: 'allowed' },
    });
    expect(result.hoaNote).toMatch(/permit/i);
  });

  it('returns null hoaNote when no HOA record', () => {
    const result = sdStrRule({
      parcel: { ownerOccupied: false, community: 'North Park' },
      hoa: null,
    });
    expect(result.hoaNote).toBe(null);
  });
});

describe('sdStrRule — output shape', () => {
  it('always returns officialLink', () => {
    const result = sdStrRule({ parcel: { ownerOccupied: false, community: 'PB' } });
    expect(result.officialLink).toMatch(/sandiego\.gov/);
  });

  it('always returns permitNote', () => {
    const result = sdStrRule({ parcel: { ownerOccupied: false, community: 'PB' } });
    expect(result.permitNote).toBeTruthy();
  });
});

describe('isSdResidentialZone', () => {
  it('identifies RS zones as residential', () => {
    expect(isSdResidentialZone('RS-1-7')).toBe(true);
    expect(isSdResidentialZone('RS1')).toBe(true);
  });

  it('identifies RM zones as residential', () => {
    expect(isSdResidentialZone('RM-1-1')).toBe(true);
  });

  it('identifies AR zones as residential', () => {
    expect(isSdResidentialZone('AR-1-1')).toBe(true);
  });

  it('returns false for commercial zones', () => {
    expect(isSdResidentialZone('CC-3-4')).toBe(false);
  });

  it('returns null for null input', () => {
    expect(isSdResidentialZone(null)).toBe(null);
    expect(isSdResidentialZone('')).toBe(null);
  });
});
