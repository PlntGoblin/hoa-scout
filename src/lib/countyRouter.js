import * as turf from '@turf/turf';

// Coconino County's portion of Sedona (approx boundary polygon)
// The city of Sedona straddles Yavapai and Coconino counties.
// Points north of this boundary route to Coconino; south to Yavapai.
const COCONINO_SEDONA_POLYGON = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-111.8300, 34.8900],
      [-111.7700, 34.8900],
      [-111.7700, 34.8600],
      [-111.8100, 34.8550],
      [-111.8300, 34.8600],
      [-111.8300, 34.8900],
    ]],
  },
};

/**
 * Given a [lng, lat] point, returns 'coconino' or 'yavapai'.
 * Used to route parcel/owner API calls to the correct county.
 */
export function routeCounty(lng, lat) {
  const pt = turf.point([lng, lat]);
  return turf.booleanPointInPolygon(pt, COCONINO_SEDONA_POLYGON)
    ? 'coconino'
    : 'yavapai';
}
