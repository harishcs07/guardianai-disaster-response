import { Hazard, SafeRoute, Shelter } from '../types/disaster';
import { calculateHaversineDistance } from './triageEngine';

/**
 * Calculates a safe evacuation navigation path bypassing active hazard zones.
 */
export function calculateSafeRoute(
  startLat: number,
  startLng: number,
  shelters: Shelter[],
  hazards: Hazard[],
  targetShelterId?: string
): SafeRoute | null {
  if (!shelters || shelters.length === 0) return null;

  // Filter to available shelters (open or near capacity)
  const availableShelters = shelters.filter(s => s.status !== 'ISOLATED');
  if (availableShelters.length === 0) return null;

  let targetShelter: Shelter | undefined;
  if (targetShelterId) {
    targetShelter = availableShelters.find(s => s.id === targetShelterId);
  }

  // If not specified or not found, choose nearest available shelter with capacity
  if (!targetShelter) {
    targetShelter = availableShelters
      .filter(s => s.currentOccupancy < s.capacity)
      .sort((a, b) => {
        const distA = calculateHaversineDistance(startLat, startLng, a.lat, a.lng);
        const distB = calculateHaversineDistance(startLat, startLng, b.lat, b.lng);
        return distA - distB;
      })[0] || availableShelters[0];
  }

  const directDistanceKm = calculateHaversineDistance(
    startLat,
    startLng,
    targetShelter.lat,
    targetShelter.lng
  );

  // Identify hazards between start and shelter
  const activeHazards = hazards.filter(h => h.active);
  const hazardsAvoided: string[] = [];
  const waypoints: [number, number][] = [[startLat, startLng]];

  // Test line-of-sight against each hazard
  for (const hazard of activeHazards) {
    // Check if hazard center is approximately within the bounding corridor
    const distToStart = calculateHaversineDistance(startLat, startLng, hazard.lat, hazard.lng);
    const distToShelter = calculateHaversineDistance(hazard.lat, hazard.lng, targetShelter.lat, targetShelter.lng);

    // If hazard is roughly on the direct path (triangle inequality check)
    if (distToStart + distToShelter < directDistanceKm * 1.35) {
      hazardsAvoided.push(`${hazard.title} (${hazard.type.replace('_', ' ')})`);

      // Generate a lateral detour waypoint away from hazard center
      const detourOffsetLat = hazard.lat > startLat ? 0.008 : -0.008;
      const detourOffsetLng = hazard.lng > startLng ? 0.010 : -0.010;

      // Add high-ground safe waypoint
      waypoints.push([
        (startLat + hazard.lat) / 2 + detourOffsetLat,
        (startLng + hazard.lng) / 2 + detourOffsetLng
      ]);
    }
  }

  // Finally add destination shelter
  waypoints.push([targetShelter.lat, targetShelter.lng]);

  // Compute total segmented path distance
  let totalDistanceKm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistanceKm += calculateHaversineDistance(
      waypoints[i][0],
      waypoints[i][1],
      waypoints[i + 1][0],
      waypoints[i + 1][1]
    );
  }

  totalDistanceKm = Math.round(totalDistanceKm * 100) / 100;
  // Flood/disaster walking speed estimated at ~2.8 km/h with wading
  const estimatedWalkingMins = Math.round((totalDistanceKm / 2.8) * 60);

  return {
    destinationShelter: targetShelter,
    distanceKm: totalDistanceKm,
    estimatedWalkingMins: Math.max(5, estimatedWalkingMins),
    waypoints,
    hazardsAvoided
  };
}
