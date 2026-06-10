import { describe, it, expect } from 'vitest';
import { normalizeHoaKey } from '../store/hoaStore.js';

describe('normalizeHoaKey', () => {
  it('lowercases the name', () => {
    expect(normalizeHoaKey('OAK CREEK')).toBe('oak-creek');
  });

  it('strips "HOA" suffix', () => {
    expect(normalizeHoaKey('Crimson View HOA')).toBe('crimson-view');
  });

  it('strips "Homeowners Association"', () => {
    expect(normalizeHoaKey('Eagle Rock Homeowners Association')).toBe('eagle-rock');
  });

  it('strips "Owners Association"', () => {
    expect(normalizeHoaKey('Foothills South Owners Association')).toBe('foothills-south');
  });

  it('strips "Community"', () => {
    expect(normalizeHoaKey('Red Rock Community')).toBe('red-rock');
  });

  it('strips "Subdivision"', () => {
    expect(normalizeHoaKey('Oak Creek Subdivision')).toBe('oak-creek');
  });

  it('strips "Estates"', () => {
    expect(normalizeHoaKey('Cathedral Rock Estates')).toBe('cathedral-rock');
  });

  it('strips "Village"', () => {
    expect(normalizeHoaKey('Sedona Village')).toBe('sedona');
  });

  it('strips punctuation and collapses spaces', () => {
    expect(normalizeHoaKey('Oak Creek, HOA')).toBe('oak-creek');
  });

  it('handles all-caps input consistently with title case', () => {
    const upper = normalizeHoaKey('CARMEL VALLEY');
    const title = normalizeHoaKey('Carmel Valley');
    expect(upper).toBe(title);
  });

  it('handles empty string', () => {
    expect(normalizeHoaKey('')).toBe('');
  });

  it('produces consistent keys for CPA names with dashes and slashes', () => {
    const key = normalizeHoaKey('Donelson - Hermitage - Old Hickory');
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
    // Should not contain slashes or dashes from punctuation
    expect(key).not.toMatch(/[/\\]/);
  });
});
