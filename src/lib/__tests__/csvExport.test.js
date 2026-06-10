import { describe, it, expect } from 'vitest';
import { generateCsv } from '../csvExport.js';

const SAMPLE_ENTRY = {
  id: '-111.76,34.87',
  address: '123 Red Rock Dr, Sedona AZ 86351',
  market: 'sedona',
  status: 'researching',
  score: 75,
  notes: 'Hot lead — absentee LLC owner',
  savedAt: '2026-06-09T21:00:00.000Z',
  parcel: {
    ownerName: 'Desert Properties LLC',
    ownerMailingAddress: '500 Corporate Blvd, Scottsdale AZ 85251',
    siteAddress: '123 Red Rock Dr, Sedona AZ 86351',
    apn: '408-14-001',
    county: 'yavapai',
    zoning: 'R1L-35',
    subdivision: 'Crimson View',
    acres: 0.42,
    assessedValue: 480000,
    lastSalePrice: 650000,
    source: 'yavapai-gis',
  },
  hoa: {
    name: 'Crimson View HOA',
    strPolicy: 'unknown',
  },
};

describe('generateCsv', () => {
  it('produces a non-empty string', () => {
    const csv = generateCsv([SAMPLE_ENTRY]);
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  it('first row is the header', () => {
    const csv = generateCsv([SAMPLE_ENTRY]);
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toContain('Address');
    expect(firstLine).toContain('Owner Name');
    expect(firstLine).toContain('Opportunity Score');
    expect(firstLine).toContain('Status');
  });

  it('data row contains expected values', () => {
    const csv = generateCsv([SAMPLE_ENTRY]);
    expect(csv).toContain('Desert Properties LLC');
    expect(csv).toContain('Yavapai');
    expect(csv).toContain('75');
    expect(csv).toContain('researching');
    expect(csv).toContain('Crimson View HOA');
  });

  it('handles commas in values by quoting', () => {
    const entry = {
      ...SAMPLE_ENTRY,
      notes: 'Hot lead, absentee owner',
    };
    const csv = generateCsv([entry]);
    expect(csv).toContain('"Hot lead, absentee owner"');
  });

  it('handles empty entry gracefully', () => {
    const csv = generateCsv([{ id: 'x', market: 'sedona' }]);
    expect(typeof csv).toBe('string');
    // Should have header + 1 data row
    expect(csv.split('\n').length).toBe(2);
  });

  it('returns header only for empty array', () => {
    const csv = generateCsv([]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Address');
  });

  it('formats assessed value with dollar sign', () => {
    const csv = generateCsv([SAMPLE_ENTRY]);
    expect(csv).toContain('$480,000');
  });

  it('infers absentee occupancy from LLC name', () => {
    const csv = generateCsv([SAMPLE_ENTRY]);
    expect(csv).toContain('Absentee');
  });
});
