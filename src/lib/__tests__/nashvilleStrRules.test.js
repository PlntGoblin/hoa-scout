import { describe, it, expect } from 'vitest';
import { nashvilleStrRule } from '../markets/nashville/strRules.js';

describe('nashvilleStrRule — zone classification', () => {
  it('marks MUL as permitted', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'MUL' }, hoa: null });
    expect(result.eligible).toBe(true);
    expect(result.zoneClass).toBe('permitted');
  });

  it('marks MUG as permitted', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'MUG' }, hoa: null });
    expect(result.eligible).toBe(true);
  });

  it('marks ORI as permitted', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'ORI' }, hoa: null });
    expect(result.eligible).toBe(true);
    expect(result.zoneClass).toBe('permitted');
  });

  it('marks RS as prohibited', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'RS' }, hoa: null });
    expect(result.eligible).toBe(false);
    expect(result.zoneClass).toBe('prohibited');
  });

  it('marks RS5 (variant) as prohibited', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'RS5' }, hoa: null });
    expect(result.eligible).toBe(false);
  });

  it('marks R as prohibited', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'R' }, hoa: null });
    expect(result.eligible).toBe(false);
    expect(result.zoneClass).toBe('prohibited');
  });

  it('marks AR as prohibited', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'AR' }, hoa: null });
    expect(result.eligible).toBe(false);
  });

  it('marks AR2A as prohibited', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'AR2A' }, hoa: null });
    expect(result.eligible).toBe(false);
  });

  it('returns unknown for unrecognized zone', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'ZZZ' }, hoa: null });
    expect(result.eligible).toBe(null);
    expect(result.zoneClass).toBe('unknown');
  });

  it('returns unknown when parcel is null', () => {
    const result = nashvilleStrRule({ parcel: null, hoa: null });
    expect(result.eligible).toBe(null);
    expect(result.zoneClass).toBe('unknown');
  });

  it('returns unknown when zoningCode is missing', () => {
    const result = nashvilleStrRule({ parcel: {}, hoa: null });
    expect(result.eligible).toBe(null);
  });

  it('is case-insensitive for zone code', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'rs' }, hoa: null });
    expect(result.eligible).toBe(false);
  });
});

describe('nashvilleStrRule — HOA overlay', () => {
  it('HOA prohibition overrides permitted zone', () => {
    const result = nashvilleStrRule({
      parcel: { zoningCode: 'MUL' },
      hoa: { name: 'Test HOA', strPolicy: 'prohibited' },
    });
    expect(result.eligible).toBe(false);
    expect(result.hoaNote).toMatch(/prohibits/i);
  });

  it('HOA allowed adds note without changing zone eligibility', () => {
    const result = nashvilleStrRule({
      parcel: { zoningCode: 'MUL' },
      hoa: { name: 'Test HOA', strPolicy: 'allowed' },
    });
    expect(result.eligible).toBe(true);
    expect(result.hoaNote).toMatch(/permits/i);
  });

  it('unknown HOA policy adds a verify note', () => {
    const result = nashvilleStrRule({
      parcel: { zoningCode: 'MUL' },
      hoa: { name: 'Test HOA', strPolicy: 'unknown' },
    });
    expect(result.eligible).toBe(true);
    expect(result.hoaNote).toMatch(/unknown/i);
  });

  it('no HOA means null hoaNote', () => {
    const result = nashvilleStrRule({ parcel: { zoningCode: 'RS' }, hoa: null });
    expect(result.hoaNote).toBe(null);
  });
});

describe('nashvilleStrRule — output shape', () => {
  it('always returns required fields', () => {
    const result = nashvilleStrRule({ parcel: null, hoa: null });
    expect(result).toHaveProperty('eligible');
    expect(result).toHaveProperty('zoneClass');
    expect(result).toHaveProperty('tierLabel');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('permitNote');
    expect(result).toHaveProperty('officialLink');
    expect(result.officialLink).toMatch(/nashville\.gov/);
  });
});
