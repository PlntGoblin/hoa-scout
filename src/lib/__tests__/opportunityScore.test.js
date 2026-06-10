import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { computeScore, DEFAULT_WEIGHTS, loadWeights, saveWeights, resetWeights } from '../opportunityScore.js';

// Mock localStorage for node environment
const store = {};
const localStorageMock = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  global.localStorage = localStorageMock;
});

afterEach(() => {
  resetWeights();
});

describe('computeScore — absentee flag', () => {
  it('fires for LLC owner', () => {
    const { flags } = computeScore({
      parcel: { ownerName: 'Sunset Properties LLC', siteAddress: '123 Main', ownerMailingAddress: '123 Main' },
      market: 'sedona',
    });
    expect(flags.absentee_owner).toBe(true);
  });

  it('fires for trust owner', () => {
    const { flags } = computeScore({
      parcel: { ownerName: 'Smith Family Trust', siteAddress: '123 Main', ownerMailingAddress: '123 Main' },
      market: 'sedona',
    });
    expect(flags.absentee_owner).toBe(true);
  });

  it('fires when mailing address differs from site', () => {
    const { flags } = computeScore({
      parcel: {
        ownerName: 'John Doe',
        siteAddress: '456 Oak Creek Dr Sedona',
        ownerMailingAddress: '789 Suburb Ave Phoenix AZ',
      },
      market: 'sedona',
    });
    expect(flags.absentee_owner).toBe(true);
  });

  it('does not fire for matching address', () => {
    const { flags } = computeScore({
      parcel: {
        ownerName: 'Jane Smith',
        siteAddress: '123 Red Rock Rd',
        ownerMailingAddress: '123 Red Rock Rd Sedona AZ',
      },
      market: 'sedona',
    });
    expect(flags.absentee_owner).toBe(false);
  });
});

describe('computeScore — str_zone_ok flag', () => {
  it('fires for Nashville permitted zone', () => {
    const { flags } = computeScore({
      parcel: { zoningCode: 'MUL' },
      strRule: { eligible: true },
      market: 'nashville',
    });
    expect(flags.str_zone_ok).toBe(true);
  });

  it('does not fire for Nashville prohibited zone', () => {
    const { flags } = computeScore({
      parcel: { zoningCode: 'RS' },
      strRule: { eligible: false },
      market: 'nashville',
    });
    expect(flags.str_zone_ok).toBe(false);
  });

  it('fires for San Diego eligible tier', () => {
    const { flags } = computeScore({
      parcel: {},
      strRule: { eligible: true },
      market: 'sandiego',
    });
    expect(flags.str_zone_ok).toBe(true);
  });

  it('fires for Sedona when HOA allows STR', () => {
    const { flags } = computeScore({
      parcel: {},
      hoa: { strPolicy: 'allowed' },
      strRule: { hoaAllowsStr: true },
      market: 'sedona',
    });
    expect(flags.str_zone_ok).toBe(true);
  });
});

describe('computeScore — hoa_allows_str flag', () => {
  it('fires when HOA explicitly allows STR', () => {
    const { flags } = computeScore({
      hoa: { strPolicy: 'allowed' },
      market: 'sedona',
    });
    expect(flags.hoa_allows_str).toBe(true);
  });

  it('does not fire for unknown HOA policy', () => {
    const { flags } = computeScore({
      hoa: { strPolicy: 'unknown' },
      market: 'sedona',
    });
    expect(flags.hoa_allows_str).toBe(false);
  });

  it('does not fire with no HOA', () => {
    const { flags } = computeScore({ market: 'sedona' });
    expect(flags.hoa_allows_str).toBe(false);
  });
});

describe('computeScore — has_parcel_data flag', () => {
  it('fires when parcel object is present', () => {
    const { flags } = computeScore({ parcel: { apn: '123', source: 'yavapai-gis' }, market: 'sedona' });
    expect(flags.has_parcel_data).toBe(true);
  });

  it('does not fire when parcel is null', () => {
    const { flags } = computeScore({ parcel: null, market: 'sedona' });
    expect(flags.has_parcel_data).toBe(false);
  });
});

describe('computeScore — score bounds', () => {
  it('returns 0 with no data', () => {
    const { score } = computeScore({});
    expect(score).toBe(0);
  });

  it('score does not exceed 100', () => {
    const { score } = computeScore({
      parcel: { ownerName: 'LLC', siteAddress: 'a', ownerMailingAddress: 'b', source: 'gis' },
      hoa: { strPolicy: 'allowed' },
      strRule: { eligible: true, hoaAllowsStr: true },
      avm: { estimatedRent: 2000 },
      market: 'nashville',
    });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(0);
  });

  it('score is a whole number', () => {
    const { score } = computeScore({ parcel: { source: 'gis', ownerName: 'LLC' }, market: 'sedona' });
    expect(Number.isInteger(score)).toBe(true);
  });
});

describe('computeScore — breakdown', () => {
  it('returns one breakdown entry per flag', () => {
    const { breakdown } = computeScore({ market: 'sedona' });
    expect(breakdown.length).toBe(Object.keys(DEFAULT_WEIGHTS).length);
  });

  it('breakdown entries have required fields', () => {
    const { breakdown } = computeScore({ market: 'sedona' });
    breakdown.forEach((b) => {
      expect(b).toHaveProperty('flag');
      expect(b).toHaveProperty('fired');
      expect(b).toHaveProperty('weight');
      expect(b).toHaveProperty('points');
      expect(b).toHaveProperty('label');
    });
  });
});

describe('weights persistence', () => {
  it('loadWeights returns defaults when nothing saved', () => {
    const w = loadWeights();
    expect(w).toEqual(DEFAULT_WEIGHTS);
  });

  it('saveWeights + loadWeights round-trips', () => {
    const custom = { ...DEFAULT_WEIGHTS, absentee_owner: 50 };
    saveWeights(custom);
    expect(loadWeights().absentee_owner).toBe(50);
  });

  it('resetWeights restores defaults', () => {
    saveWeights({ ...DEFAULT_WEIGHTS, absentee_owner: 99 });
    resetWeights();
    expect(loadWeights()).toEqual(DEFAULT_WEIGHTS);
  });
});
