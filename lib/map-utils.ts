/**
 * Strava polyline decoder and map rendering utilities.
 *
 * Strava encodes polylines using a Google-encoded polyline algorithm.
 * This decodes them into coordinate arrays for SVG rendering.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decode a Strava/Google encoded polyline string into coordinate pairs.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }

  return points;
}

/**
 * Convert decoded polyline points to normalized coordinates for SVG rendering.
 * Returns points scaled to fit within a 0-1 bounding box.
 */
export function normalizePoints(
  points: LatLng[],
): { x: number; y: number }[] {
  if (points.length === 0) return [];

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  // Add 10% padding
  const pad = 0.1;

  return points.map((p) => ({
    x: pad + (1 - 2 * pad) * ((p.lng - minLng) / lngRange),
    y: pad + (1 - 2 * pad) * (1 - (p.lat - minLat) / latRange), // Flip Y for screen coords
  }));
}

/**
 * Convert normalized points to an SVG path string.
 */
export function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const parts: string[] = [];
  parts.push(`M ${points[0].x} ${points[0].y}`);
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  return parts.join(" ");
}

/**
 * One-shot: decode a Strava polyline and get an SVG path string (0-1 normalized coords).
 */
export function polylineToSvgPath(encoded: string): string | null {
  try {
    const points = decodePolyline(encoded);
    if (points.length < 2) return null;
    const norm = normalizePoints(points);
    return pointsToSvgPath(norm);
  } catch {
    return null;
  }
}
