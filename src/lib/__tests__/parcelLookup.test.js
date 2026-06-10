import { describe, it, expect } from 'vitest';
import { detectOwnerOccupancy, assessorUrl } from '../parcelLookup.js';

describe('detectOwnerOccupancy', () => {
  it('returns unknown for null parcel', () => {
    expect(detectOwnerOccupancy(null)).toBe('unknown');
  });

  it('returns unknown when siteAddress or mailingAddress is missing', () => {
    expect(detectOwnerOccupancy({ siteAddress: '123 Main St' })).toBe('unknown');
    expect(detectOwnerOccupancy({ ownerMailingAddress: '123 Main St' })).toBe('unknown');
  });

  it('trusts RentCast ownerOccupied flag directly', () => {
    expect(detectOwnerOccupancy({ source: 'rentcast', ownerOccupied: true })).toBe('owner-occupied');
    expect(detectOwnerOccupancy({ source: 'rentcast', ownerOccupied: false })).toBe('absentee');
  });

  it('detects owner-occupied when site and mailing address match prefix', () => {
    const parcel = {
      siteAddress: '123 Oak Creek Dr, Sedona AZ 86351',
      ownerMailingAddress: '123 Oak Creek Dr, Sedona AZ 86351',
      ownerName: 'John Smith',
    };
    expect(detectOwnerOccupancy(parcel)).toBe('owner-occupied');
  });

  it('detects absentee when addresses differ', () => {
    const parcel = {
      siteAddress: '456 Cathedral Rock Rd, Sedona AZ 86351',
      ownerMailingAddress: '789 Suburb Lane, Phoenix AZ 85001',
      ownerName: 'Jane Doe',
    };
    expect(detectOwnerOccupancy(parcel)).toBe('absentee');
  });

  it('flags LLC owner as absentee regardless of address', () => {
    const parcel = {
      siteAddress: '123 Main St, Nashville TN 37206',
      ownerMailingAddress: '123 Main St, Nashville TN 37206',
      ownerName: 'Sunset Properties LLC',
    };
    expect(detectOwnerOccupancy(parcel)).toBe('absentee');
  });

  it('flags trust owner as absentee', () => {
    const parcel = {
      siteAddress: '100 Red Rock Dr',
      ownerMailingAddress: '100 Red Rock Dr',
      ownerName: 'Smith Family Trust',
    };
    expect(detectOwnerOccupancy(parcel)).toBe('absentee');
  });

  it('flags PO Box mailing address as absentee', () => {
    const parcel = {
      siteAddress: '123 Creekside Way',
      ownerMailingAddress: 'PO Box 1234, Flagstaff AZ 86001',
      ownerName: 'Bob Jones',
    };
    expect(detectOwnerOccupancy(parcel)).toBe('absentee');
  });
});

describe('assessorUrl', () => {
  it('returns coconino URL', () => {
    const url = assessorUrl('coconino', '11234001A');
    expect(url).toMatch(/coconino\.az\.gov/);
    expect(url).toMatch(/11234001A/);
  });

  it('returns yavapai URL', () => {
    const url = assessorUrl('yavapai', '408-14-001');
    expect(url).toMatch(/yavapai\.us/);
    expect(url).toMatch(/408-14-001/);
  });

  it('returns san-diego URL', () => {
    const url = assessorUrl('san-diego', '310-302-01-00');
    expect(url).toMatch(/sdcounty\.ca\.gov/);
  });

  it('returns davidson/Nashville URL', () => {
    const url = assessorUrl('davidson', '10501010000');
    expect(url).toMatch(/padctn\.org/);
    expect(url).toMatch(/10501010000/);
  });

  it('returns null for unknown county', () => {
    expect(assessorUrl('unknown', '123')).toBe(null);
  });

  it('returns null when apn is falsy', () => {
    expect(assessorUrl('coconino', null)).toBe(null);
    expect(assessorUrl('coconino', '')).toBe(null);
  });
});
