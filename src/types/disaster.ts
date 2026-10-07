export type Role = 'CIVILIAN' | 'RESCUE' | 'CONTROL';

export type TriageSeverity = 1 | 2 | 3 | 4; // 1: Minor, 2: Moderate, 3: Severe, 4: Critical

export type VictimStatus = 'PENDING' | 'EN_ROUTE' | 'RESCUED' | 'TRANSFERRED';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  addressDescription?: string;
}

export interface SOSRequest {
  id: string;
  timestamp: string;
  senderName: string;
  senderPhone?: string;
  lat: number;
  lng: number;
  addressDescription: string;
  severity: TriageSeverity;
  trappedCount: number;
  vulnerabilities: string[]; // 'infants' | 'elderly' | 'pregnant' | 'bleeding' | 'unconscious' | 'chronic_illness'
  batteryLevel: number; // 0-100
  waterDepthCm: number; // 0-300
  notes: string;
  status: VictimStatus;
  assignedTeam?: string | null;
  priorityScore: number;
  meshHops: number;
  meshRelayPath: string[];
}

export interface Shelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  foodRationsDays: number;
  waterRationsDays: number;
  traumaKits: number;
  generatorFuelPercent: number;
  status: 'OPEN' | 'NEAR_CAPACITY' | 'FULL' | 'ISOLATED';
  contactRadio: string;
  elevationMeters: number;
}

export type HazardType = 'FLOOD' | 'COLLAPSE' | 'LIVE_WIRE' | 'BLOCKED_ROAD' | 'CHEMICAL' | 'DAM_SURGE';

export interface Hazard {
  id: string;
  type: HazardType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  polygonCoordinates?: [number, number][];
  reportedBy: string;
  timestamp: string;
  active: boolean;
}

export interface MeshNode {
  id: string;
  name: string;
  type: 'CIVILIAN_PHONE' | 'RELAY_BEACON' | 'DRONE_RELAY' | 'RESCUE_UNIT' | 'BASE_STATION';
  lat: number;
  lng: number;
  battery: number;
  rssiDbm: number; // -40 to -95
  active: boolean;
  lastHeard: string;
}

export interface MeshPacket {
  id: string;
  type: 'SOS_BROADCAST' | 'STATUS_UPDATE' | 'HAZARD_ALERT' | 'WALKIE_MSG' | 'SHELTER_UPDATE' | 'HEARTBEAT';
  senderId: string;
  receiverId?: string; // 'BROADCAST' or specific node
  timestamp: string;
  ttl: number; // Time to live decrements
  hopCount: number;
  path: string[];
  payload: any;
}

export interface WalkieMessage {
  id: string;
  channel: string;
  senderCallsign: string;
  role: Role;
  timestamp: string;
  text: string;
  sitrepTag?: string;
  priority: 'ROUTINE' | 'PRIORITY' | 'FLASH';
}

export interface WeatherCondition {
  temperatureC: number;
  windSpeedKmh: number;
  windDirection: string;
  barometricHpa: number;
  rainfallMmPerHour: number;
  floodWarningTier: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  stormTrajectory: string;
}

export interface SurvivalGuide {
  id: string;
  category: string;
  title: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE';
  summary: string;
  steps: string[];
  proTips: string[];
}

export interface SafeRoute {
  destinationShelter: Shelter;
  distanceKm: number;
  estimatedWalkingMins: number;
  waypoints: [number, number][];
  hazardsAvoided: string[];
}
