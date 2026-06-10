import { routeCounty } from './countyRouter';
import { lookupPropertyRentCast } from './rentcast';
import { lookupSdParcel } from './sdParcelLookup';
import { lookupNashvilleParcel } from './nashvilleParcelLookup';

/**
 * Look up parcel + owner info.
 * Primary: county ArcGIS (free, unlimited, CORS-safe where available).
 * Fallback: RentCast (metered — only fires when county GIS returns nothing).
 */

const YAVAPAI_PARCELS_URL =
  'https://gis.yavapaiaz.gov/arcgis/rest/services/Parcels/FeatureServer/0/query';

async function queryArcGIS(baseUrl, geometry) {
  const params = new URLSearchParams({
    geometry: `${geometry.lng},${geometry.lat}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    outFields: '*',
    returnGeometry: false,
    f: 'json',
  });
  const res = await fetch(`${baseUrl}?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.features?.[0]?.attributes ?? null;
}

function normalizeYavapai(attrs) {
  if (!attrs) return null;
  return {
    apn: attrs.PARLABEL || attrs.PARCEL_ID,
    ownerName: attrs.NAME,
    ownerMailingAddress: [attrs.ADDRESS, attrs.CITY, attrs.STATE, attrs.ZIP]
      .filter(Boolean).join(', '),
    siteAddress: attrs.SITUS_ADD_DOR || attrs.ADDRESS,
    zoning: attrs.ZONING,
    acres: attrs.ACRE_DEED,
    subdivision: attrs.SUBCOMMON || attrs.SUBNAME,
    accountNo: attrs.ACCOUNTNO,
    county: 'yavapai',
    source: 'yavapai-gis',
    raw: attrs,
  };
}

/**
 * Detects absentee ownership by comparing site address to mailing address.
 * Returns 'absentee' | 'owner-occupied' | 'unknown'
 */
export function detectOwnerOccupancy(parcel) {
  if (!parcel) return 'unknown';

  // RentCast gives us ownerOccupied directly
  if (parcel.source === 'rentcast' && parcel.ownerOccupied != null) {
    return parcel.ownerOccupied ? 'owner-occupied' : 'absentee';
  }

  if (!parcel.ownerMailingAddress || !parcel.siteAddress) return 'unknown';

  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const site = normalize(parcel.siteAddress);
  const mail = normalize(parcel.ownerMailingAddress);

  if (!site || !mail) return 'unknown';

  const name = (parcel.ownerName || '').toLowerCase();
  if (/llc|trust|corp|inc\b|ltd/.test(name)) return 'absentee';
  if (/pobox|postofficebox/.test(mail)) return 'absentee';

  return site.slice(0, 12) === mail.slice(0, 12) ? 'owner-occupied' : 'absentee';
}

/**
 * Returns a URL to the county assessor public record page for a given APN + county.
 * These are public websites — no API key needed, just open in a new tab.
 */
export function assessorUrl(county, apn) {
  if (!apn) return null;
  const clean = apn.replace(/-/g, '');
  if (county === 'coconino') {
    return `https://assessor.coconino.az.gov/parcelDetails.aspx?assessorParcelNumber=${clean}`;
  }
  if (county === 'yavapai') {
    return `https://assessor.yavapai.us/assessor/parcel.aspx?parcelNumber=${apn}`;
  }
  if (county === 'san-diego') {
    return `https://arcc.sdcounty.ca.gov/Pages/Assessor-Parcel-Details.aspx?parcel=${apn}`;
  }
  if (county === 'davidson') {
    return `https://www.padctn.org/prc/property/${apn}/card/1`;
  }
  return null;
}

const SD_BOUNDS        = { minLng: -117.6,  maxLng: -116.9,  minLat: 32.5,  maxLat: 33.2  };
const NASHVILLE_BOUNDS = { minLng: -87.05,  maxLng: -86.50,  minLat: 35.95, maxLat: 36.42 };

function isSanDiego(lng, lat) {
  return lng >= SD_BOUNDS.minLng && lng <= SD_BOUNDS.maxLng &&
         lat >= SD_BOUNDS.minLat && lat <= SD_BOUNDS.maxLat;
}

function isNashville(lng, lat) {
  return lng >= NASHVILLE_BOUNDS.minLng && lng <= NASHVILLE_BOUNDS.maxLng &&
         lat >= NASHVILLE_BOUNDS.minLat && lat <= NASHVILLE_BOUNDS.maxLat;
}

/**
 * Main lookup — routes by geography, falls back to RentCast.
 * Nashville  → Metro Nashville GIS (owner data included — no RentCast needed)
 * San Diego  → SANDAG GIS → RentCast
 * Sedona     → Yavapai GIS → RentCast
 */
export async function lookupParcel(lng, lat, address = null) {
  // Nashville branch — owner data is in the GIS layer directly
  if (isNashville(lng, lat)) {
    try {
      const result = await lookupNashvilleParcel(lng, lat);
      if (result) return result;
    } catch (e) {
      console.warn('Nashville GIS lookup failed:', e);
    }
    return null;
  }

  // San Diego branch
  if (isSanDiego(lng, lat)) {
    try {
      const result = await lookupSdParcel(lng, lat);
      if (result) return result;
    } catch (e) {
      console.warn('SANDAG lookup failed:', e);
    }
    if (address) {
      const result = await lookupPropertyRentCast(address);
      if (result) return result;
    }
    return null;
  }

  // Sedona / Arizona branch
  const county = routeCounty(lng, lat);
  try {
    const attrs = await queryArcGIS(YAVAPAI_PARCELS_URL, { lng, lat });
    const normalized = normalizeYavapai(attrs);
    if (normalized) return normalized;
  } catch (e) {
    console.warn('Yavapai GIS failed:', e);
  }

  if (address) {
    console.info(`GIS miss for [${county}] — trying RentCast for: ${address}`);
    const result = await lookupPropertyRentCast(address);
    if (result) return result;
  }

  return null;
}
