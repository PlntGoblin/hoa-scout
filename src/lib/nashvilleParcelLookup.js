/**
 * Nashville parcel lookup via Metro Nashville GIS.
 * Returns owner name + mailing address directly — no RentCast needed.
 * CORS-safe: Access-Control-Allow-Origin confirmed.
 */

const NASHVILLE_PARCELS_URL =
  'https://maps.nashville.gov/arcgis/rest/services/Cadastral/Parcels/MapServer/0/query';

const NASHVILLE_ZONING_URL =
  'https://maps.nashville.gov/arcgis/rest/services/Zoning_Landuse/Zoning/MapServer/14/query';

const NASHVILLE_CPA_URL =
  'https://maps.nashville.gov/arcgis/rest/services/Boundaries/Boundaries/MapServer/1/query';

const PARCEL_FIELDS = [
  'APN', 'Owner', 'OwnAddr1', 'OwnAddr2', 'OwnCity', 'OwnState', 'OwnZip',
  'PropAddr', 'PropStreet', 'PropCity', 'PropZip',
  'LUCode', 'LUDesc', 'Acres', 'TotlAppr', 'SalePrice', 'DeededAcreage',
].join(',');

async function queryPoint(url, lng, lat, extraParams = {}) {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    returnGeometry: false,
    f: 'json',
    ...extraParams,
  });
  const res = await fetch(`${url}?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.features?.[0]?.attributes ?? null;
}

export async function lookupNashvilleParcel(lng, lat) {
  try {
    const [parcelAttrs, zoningAttrs, cpaAttrs] = await Promise.all([
      queryPoint(NASHVILLE_PARCELS_URL, lng, lat, { outFields: PARCEL_FIELDS }),
      queryPoint(NASHVILLE_ZONING_URL, lng, lat,  { outFields: 'ZONE_DESC' }),
      queryPoint(NASHVILLE_CPA_URL, lng, lat,     { outFields: 'CommunityName' }),
    ]);

    if (!parcelAttrs) return null;

    const ownerMailing = [
      parcelAttrs.OwnAddr1,
      parcelAttrs.OwnAddr2,
      [parcelAttrs.OwnCity, parcelAttrs.OwnState, parcelAttrs.OwnZip].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ');

    const siteAddress = [
      parcelAttrs.PropAddr || parcelAttrs.PropStreet,
      parcelAttrs.PropCity || 'Nashville',
      parcelAttrs.PropZip ? `TN ${parcelAttrs.PropZip}` : 'TN',
    ].filter(Boolean).join(', ');

    return {
      apn:                parcelAttrs.APN,
      ownerName:          parcelAttrs.Owner || null,
      ownerMailingAddress: ownerMailing || null,
      siteAddress,
      zoning:             zoningAttrs?.ZONE_DESC || parcelAttrs.LUDesc || null,
      zoningCode:         zoningAttrs?.ZONE_DESC || null,
      acres:              parcelAttrs.Acres ?? parcelAttrs.DeededAcreage ?? null,
      subdivision:        cpaAttrs?.CommunityName || null,
      landUseCode:        parcelAttrs.LUCode || null,
      landUseDesc:        parcelAttrs.LUDesc || null,
      assessedValue:      parcelAttrs.TotlAppr || null,
      lastSalePrice:      parcelAttrs.SalePrice || null,
      county:             'davidson',
      source:             'nashville-gis',
      raw:                parcelAttrs,
    };
  } catch (e) {
    console.warn('Nashville parcel lookup failed:', e);
    return null;
  }
}
