/**
 * Decodes a Google encoded polyline (the format Strava's `summary_polyline`
 * uses) into an array of [lat, lng] pairs.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/** Normalizes lat/lng points to a 0..1 box, preserving aspect ratio, for SVG plotting. */
export function normalizeRoute(points: [number, number][]): { x: number; y: number }[] {
  if (points.length === 0) return [];

  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const scale = Math.max(latRange, lngRange);

  return points.map(([lat, lng]) => ({
    x: (lng - minLng) / scale,
    // Flip Y since latitude increases northward but screen Y increases downward.
    y: 1 - (lat - minLat) / scale,
  }));
}
