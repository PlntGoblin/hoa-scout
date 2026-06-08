/**
 * San Diego parcel lookup via SANDAG FeatureServer.
 * Returns APN, zoning, subdivision, property specs.
 * Owner name not in SANDAG layer — falls to RentCast caller.
 */

const SANDAG_PARCELS_URL =
  'https://geo.sandag.org/server/rest/services/Hosted/Parcels/FeatureServer/0/query';

const SD_ZONING_URL =
  'https://webmaps.sandiego.gov/arcgis/rest/services/DSD/Zoning_Base/MapServer/0/query';

const SD_COMMUNITY_PLAN_URL =
  'https://geo.sandag.org/server/rest/services/Hosted/CMTY_PLAN_SD/FeatureServer/0/query';

const FIELDS = [
  'apn', 'situs_address', 'situs_street', 'situs_suffix', 'situs_zip',
  'situs_juris', 'situs_community', 'nucleus_zone_cd', 'asr_zone',
  'acreage', 'ownerocc', 'subname', 'bedrooms', 'baths',
  'total_lvg_area', 'asr_total', 'year_effective',
].join(',');

async function queryPoint(url, lng, lat, extraParams = {}) {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    outFields: '*',
    returnGeometry: false,
    f: 'json',
    ...extraParams,
  });
  const res = await fetch(`${url}?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.features?.[0]?.attributes ?? null;
}

function buildSiteAddress(attrs) {
  const num = attrs.situs_address && attrs.situs_address !== 0 ? attrs.situs_address : '';
  const street = [
    attrs.situs_pre_dir, attrs.situs_street, attrs.situs_suffix, attrs.situs_post_dir
  ].filter(Boolean).join(' ');
  const zip = attrs.situs_zip || '';
  return [num, street, zip ? `San Diego CA ${zip}` : 'San Diego, CA'].filter(Boolean).join(' ');
}

export async function lookupSdParcel(lng, lat) {
  try {
    const attrs = await queryPoint(SANDAG_PARCELS_URL, lng, lat, { outFields: FIELDS });
    if (!attrs || !attrs.apn) return null;

    // Fetch zoning name and community plan area in parallel
    let zoneName = attrs.nucleus_zone_cd || attrs.asr_zone || null;
    let communityPlan = attrs.situs_community || null;
    try {
      const [zoningAttrs, cpaAttrs] = await Promise.all([
        queryPoint(SD_ZONING_URL, lng, lat, { outFields: 'ZONE_NAME' }),
        queryPoint(SD_COMMUNITY_PLAN_URL, lng, lat, { outFields: 'cpname,website' }),
      ]);
      if (zoningAttrs?.ZONE_NAME) zoneName = zoningAttrs.ZONE_NAME;
      if (cpaAttrs?.cpname) communityPlan = cpaAttrs.cpname;
    } catch {}

    return {
      apn: attrs.apn,
      ownerName: null,        // Not in SANDAG layer — caller uses RentCast
      ownerMailingAddress: null,
      siteAddress: buildSiteAddress(attrs),
      zoning: zoneName,
      acres: attrs.acreage ?? null,
      subdivision: attrs.subname || null,
      bedrooms: attrs.bedrooms || null,
      bathrooms: attrs.baths || null,
      squareFootage: attrs.total_lvg_area || null,
      yearBuilt: attrs.year_effective || null,
      assessedValue: attrs.asr_total || null,
      subdivision: communityPlan,
      jurisdiction: attrs.situs_juris || null,
      community: communityPlan,
      ownerOccupied: attrs.ownerocc != null ? Boolean(attrs.ownerocc) : null,
      county: 'san-diego',
      source: 'sandag-gis',
      raw: attrs,
    };
  } catch (e) {
    console.warn('SANDAG parcel lookup failed:', e);
    return null;
  }
}
