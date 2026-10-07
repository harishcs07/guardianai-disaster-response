import { SOSRequest, TriageSeverity } from '../types/disaster';

/**
 * AI-Prioritized Triage Scoring Algorithm:
 * Priority Score = (Severity * 4) + (Trapped Count * 2) + (Vulnerabilities * 3) - (Distance to Unit * 1.5)
 * With edge risk multipliers for water depth and critical battery depletion.
 */
export function calculatePriorityScore(
  victim: Omit<SOSRequest, 'id' | 'timestamp' | 'status' | 'priorityScore' | 'meshHops' | 'meshRelayPath'>,
  unitLocation: { lat: number; lng: number } = { lat: 13.0600, lng: 80.2400 }
): number {
  const severityMultiplier = victim.severity * 4;
  const countFactor = Math.min(victim.trappedCount, 15) * 2;
  const vulnCount = Array.isArray(victim.vulnerabilities) ? victim.vulnerabilities.length : 0;
  const vulnFactor = vulnCount * 3;

  // Approximate distance in kilometers using Haversine
  const distanceKm = calculateHaversineDistance(
    victim.lat,
    victim.lng,
    unitLocation.lat,
    unitLocation.lng
  );

  const distancePenalty = Math.max(0, distanceKm * 1.5);

  let rawScore = (severityMultiplier + countFactor + vulnFactor) - distancePenalty;

  // Edge risk adjustments:
  // Water rising above 120cm increases drowning risk
  if (victim.waterDepthCm >= 150) {
    rawScore += 4;
  } else if (victim.waterDepthCm >= 80) {
    rawScore += 2;
  }

  // Device battery dying imminently increases communication blackout risk
  if (victim.batteryLevel <= 10) {
    rawScore += 3;
  } else if (victim.batteryLevel <= 20) {
    rawScore += 1.5;
  }

  return Math.max(1, Math.round(rawScore * 10) / 10);
}

export function getTriageBadge(score: number): {
  label: string;
  colorClass: string;
  badgeBg: string;
} {
  if (score >= 30) {
    return {
      label: 'CRITICAL PRIORITY (IMMEDIATE)',
      colorClass: 'text-red-400',
      badgeBg: 'bg-red-950/80 border-red-500 text-red-300'
    };
  }
  if (score >= 20) {
    return {
      label: 'HIGH PRIORITY (SURGICAL/EVAC)',
      colorClass: 'text-amber-400',
      badgeBg: 'bg-amber-950/80 border-amber-500 text-amber-300'
    };
  }
  if (score >= 12) {
    return {
      label: 'MODERATE PRIORITY',
      colorClass: 'text-yellow-400',
      badgeBg: 'bg-yellow-950/80 border-yellow-500 text-yellow-300'
    };
  }
  return {
    label: 'STABLE / MINOR',
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
  };
}

export function sortVictimsByPriority(
  victims: SOSRequest[],
  unitLocation?: { lat: number; lng: number }
): SOSRequest[] {
  return [...victims].sort((a, b) => {
    // Unresolved pending cases first
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    // Higher priority score first
    return b.priorityScore - a.priorityScore;
  });
}

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}
