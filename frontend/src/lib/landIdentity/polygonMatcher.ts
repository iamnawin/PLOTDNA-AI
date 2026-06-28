import type { PlotDnaPolygon } from './types'

export type LatLngPoint = {
  lat: number
  lng: number
}

export function isPointInsidePolygon(point: LatLngPoint, polygon: [number, number][]): boolean {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [latI, lngI] = polygon[index]
    const [latJ, lngJ] = polygon[previous]
    const intersects =
      ((lngI > point.lng) !== (lngJ > point.lng)) &&
      (point.lat < ((latJ - latI) * (point.lng - lngI)) / ((lngJ - lngI) || Number.EPSILON) + latI)
    if (intersects) inside = !inside
  }
  return inside
}

export function findContainingFlagshipBoundary(
  point: LatLngPoint,
  boundaries: Array<PlotDnaPolygon & { polygon?: [number, number][] }> = [],
): PlotDnaPolygon | null {
  return boundaries.find(
    boundary => boundary.coverageType === 'flagship_boundary' &&
      boundary.polygon &&
      isPointInsidePolygon(point, boundary.polygon),
  ) ?? null
}

export function findContainingMicroZone(
  point: LatLngPoint,
  zones: Array<PlotDnaPolygon & { polygon?: [number, number][] }> = [],
): PlotDnaPolygon | null {
  return zones.find(
    zone => zone.coverageType === 'micro_zone' &&
      zone.polygon &&
      isPointInsidePolygon(point, zone.polygon),
  ) ?? null
}
