import { Hazard, MeshNode, Shelter, SOSRequest, WeatherCondition } from '../types/disaster';

export const INITIAL_WEATHER: WeatherCondition = {
  temperatureC: 32.4,
  windSpeedKmh: 64,
  windDirection: 'ENE (Gusts 82 km/h)',
  barometricHpa: 986.2,
  rainfallMmPerHour: 48.5,
  floodWarningTier: 'RED',
  stormTrajectory: 'Category 3 Cyclone landfall in 4 hours'
};

export const INITIAL_SHELTERS: Shelter[] = [
  {
    id: 'shelter-1',
    name: 'St. Jude High Ground Academy',
    lat: 13.0780,
    lng: 80.2220,
    elevationMeters: 28,
    capacity: 450,
    currentOccupancy: 312,
    foodRationsDays: 4.5,
    waterRationsDays: 5.0,
    traumaKits: 18,
    generatorFuelPercent: 84,
    status: 'OPEN',
    contactRadio: 'CH-01 High Ground Base'
  },
  {
    id: 'shelter-2',
    name: 'Municipal Sports Complex Stadium',
    lat: 13.0880,
    lng: 80.2480,
    elevationMeters: 32,
    capacity: 1200,
    currentOccupancy: 810,
    foodRationsDays: 6.0,
    waterRationsDays: 4.2,
    traumaKits: 45,
    generatorFuelPercent: 96,
    status: 'OPEN',
    contactRadio: 'CH-03 Central Relief'
  },
  {
    id: 'shelter-3',
    name: 'North Ridge Community Civic Center',
    lat: 13.0450,
    lng: 80.2180,
    elevationMeters: 22,
    capacity: 300,
    currentOccupancy: 288,
    foodRationsDays: 1.8,
    waterRationsDays: 1.5,
    traumaKits: 6,
    generatorFuelPercent: 38,
    status: 'NEAR_CAPACITY',
    contactRadio: 'CH-02 Ridge Net'
  },
  {
    id: 'shelter-4',
    name: 'Naval Port Helipad Medical Base',
    lat: 13.0920,
    lng: 80.2820,
    elevationMeters: 18,
    capacity: 600,
    currentOccupancy: 195,
    foodRationsDays: 12.0,
    waterRationsDays: 14.0,
    traumaKits: 90,
    generatorFuelPercent: 98,
    status: 'OPEN',
    contactRadio: 'CH-05 Coast Guard Tac'
  }
];

export const INITIAL_HAZARDS: Hazard[] = [
  {
    id: 'haz-1',
    type: 'FLOOD',
    severity: 'CRITICAL',
    title: 'Adyar River Basin Inundation Zone',
    description: 'Surging river breach. Water depth 1.8m - 2.8m across primary residential grid. Ground floors fully submerged.',
    lat: 13.0560,
    lng: 80.2440,
    radiusMeters: 1200,
    polygonCoordinates: [
      [13.0620, 80.2360],
      [13.0640, 80.2520],
      [13.0520, 80.2580],
      [13.0480, 80.2420],
      [13.0540, 80.2330]
    ],
    reportedBy: 'Flood Gauge Station 4',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    active: true
  },
  {
    id: 'haz-2',
    type: 'COLLAPSE',
    severity: 'HIGH',
    title: 'Metro Overpass Pillar Structural Damage',
    description: 'Partial girder displacement on Pillar 42. Active debris falling. Impassable for heavy vehicles and rescue rovers.',
    lat: 13.0690,
    lng: 80.2310,
    radiusMeters: 350,
    polygonCoordinates: [
      [13.0710, 80.2290],
      [13.0715, 80.2330],
      [13.0670, 80.2335],
      [13.0665, 80.2295]
    ],
    reportedBy: 'NDRF Scout Unit 2',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    active: true
  },
  {
    id: 'haz-3',
    type: 'LIVE_WIRE',
    severity: 'CRITICAL',
    title: 'Submerged 11kV Power Line Downed',
    description: 'High-voltage feeder snapped into flooded road intersection. Water is actively electrified within 80m radius.',
    lat: 13.0510,
    lng: 80.2320,
    radiusMeters: 180,
    polygonCoordinates: [
      [13.0525, 80.2305],
      [13.0525, 80.2335],
      [13.0495, 80.2335],
      [13.0495, 80.2305]
    ],
    reportedBy: 'Grid Patrol / Civilian SOS',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    active: true
  },
  {
    id: 'haz-4',
    type: 'BLOCKED_ROAD',
    severity: 'MEDIUM',
    title: 'Causeway Submerged & Tree Blockage',
    description: 'Fallen banyan trees and fast-moving 90cm water torrent. Road closed to all non-amphibious transport.',
    lat: 13.0740,
    lng: 80.2550,
    radiusMeters: 220,
    reportedBy: 'Traffic Police Post 7',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    active: true
  },
  {
    id: 'haz-5',
    type: 'DAM_SURGE',
    severity: 'CRITICAL',
    title: 'Chembarambakkam Reservoir Overflow Spillage',
    description: 'Discharge increased to 18,000 cusecs. Low-lying riverbanks flash surge anticipated within 60 minutes.',
    lat: 13.0400,
    lng: 80.2500,
    radiusMeters: 900,
    polygonCoordinates: [
      [13.0440, 80.2440],
      [13.0460, 80.2560],
      [13.0360, 80.2590],
      [13.0340, 80.2460]
    ],
    reportedBy: 'Irrigation Authority Broadcast',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    active: true
  }
];

export const INITIAL_VICTIMS: SOSRequest[] = [
  {
    id: 'SOS-8412',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    senderName: 'Ramesh Sundaram (Family of 4)',
    senderPhone: '+91 98401 23812',
    lat: 13.0555,
    lng: 80.2415,
    addressDescription: 'Flat 2B, Lakshmi Apartments, Lake View Road',
    severity: 4, // Critical
    trappedCount: 4,
    vulnerabilities: ['elderly', 'infants', 'chronic_illness'],
    batteryLevel: 14,
    waterDepthCm: 160,
    notes: 'Ground floor submerged. Water reaching first floor landing. Grandmother has cardiac condition, 8-month infant without formula.',
    status: 'PENDING',
    assignedTeam: null,
    priorityScore: 32.5,
    meshHops: 3,
    meshRelayPath: ['Civilian-Phone-8412', 'Relay-Beacon-South', 'NDRF-Rover-Alpha', 'Command-Station']
  },
  {
    id: 'SOS-7319',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    senderName: 'Priya & Anita (Hostel Wardens)',
    senderPhone: '+91 94440 99120',
    lat: 13.0610,
    lng: 80.2470,
    addressDescription: 'Sarada Girls College Hostel, Block C Roof',
    severity: 3, // Severe
    trappedCount: 9,
    vulnerabilities: ['pregnant', 'bleeding'],
    batteryLevel: 26,
    waterDepthCm: 190,
    notes: '9 students on terrace. One girl sustained deep laceration from tin roofing during cyclone gusts. Need first-aid tourniquet & boat.',
    status: 'EN_ROUTE',
    assignedTeam: 'NDRF Unit Bravo',
    priorityScore: 34.0,
    meshHops: 2,
    meshRelayPath: ['Civilian-Phone-7319', 'Drone-Relay-Omega', 'Command-Station']
  },
  {
    id: 'SOS-5104',
    timestamp: new Date(Date.now() - 4800000).toISOString(),
    senderName: 'David Raj',
    senderPhone: '+91 91760 44510',
    lat: 13.0720,
    lng: 80.2370,
    addressDescription: 'Corner Shop, Arcot Road Junction',
    severity: 2, // Moderate
    trappedCount: 2,
    vulnerabilities: ['elderly'],
    batteryLevel: 58,
    waterDepthCm: 70,
    notes: 'Elderly shopkeeper and assistant. Water is knee deep, no current immediate threat of drowning but road completely cut off.',
    status: 'PENDING',
    assignedTeam: null,
    priorityScore: 16.5,
    meshHops: 1,
    meshRelayPath: ['Civilian-Phone-5104', 'Relay-Beacon-Central', 'Command-Station']
  },
  {
    id: 'SOS-9011',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    senderName: 'Suresh Kumar',
    senderPhone: '+91 98840 77132',
    lat: 13.0505,
    lng: 80.2335,
    addressDescription: 'Near Downed Transformer, Gandhi Nagar 3rd St',
    severity: 4, // Critical
    trappedCount: 3,
    vulnerabilities: ['unconscious', 'severe_bleeding'],
    batteryLevel: 9,
    waterDepthCm: 110,
    notes: 'Neighbor received electric shock from downed live wire nearby, currently unconscious! Trapped on concrete sunshade. Water rising.',
    status: 'PENDING',
    assignedTeam: null,
    priorityScore: 36.0,
    meshHops: 2,
    meshRelayPath: ['Civilian-Phone-9011', 'NDRF-Scout-02', 'Command-Station']
  },
  {
    id: 'SOS-3281',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    senderName: 'Meenakshi Amman Temple Trust',
    senderPhone: '+91 97910 88219',
    lat: 13.0675,
    lng: 80.2260,
    addressDescription: 'Temple Hall Upper Chaultry',
    severity: 1, // Minor
    trappedCount: 12,
    vulnerabilities: ['elderly'],
    batteryLevel: 65,
    waterDepthCm: 30,
    notes: '12 pilgrims safe on high podium. Water is ankle deep around temple perimeter. Requesting dry food rations and drinking water.',
    status: 'RESCUED',
    assignedTeam: 'Civil Defense Volunteer Group 1',
    priorityScore: 23.0,
    meshHops: 1,
    meshRelayPath: ['Civilian-Phone-3281', 'Command-Station']
  }
];

export const INITIAL_MESH_NODES: MeshNode[] = [
  {
    id: 'node-cmd-01',
    name: 'District EOC Base Station',
    type: 'BASE_STATION',
    lat: 13.0820,
    lng: 80.2600,
    battery: 100,
    rssiDbm: -42,
    active: true,
    lastHeard: new Date().toISOString()
  },
  {
    id: 'node-drone-01',
    name: 'SkyGuard Airborne Drone Relay #1',
    type: 'DRONE_RELAY',
    lat: 13.0620,
    lng: 80.2450,
    battery: 78,
    rssiDbm: -58,
    active: true,
    lastHeard: new Date().toISOString()
  },
  {
    id: 'node-beacon-01',
    name: 'Solar Relay Mast North (St. Jude)',
    type: 'RELAY_BEACON',
    lat: 13.0770,
    lng: 80.2240,
    battery: 92,
    rssiDbm: -64,
    active: true,
    lastHeard: new Date().toISOString()
  },
  {
    id: 'node-beacon-02',
    name: 'Solar Relay Mast South (River Basin)',
    type: 'RELAY_BEACON',
    lat: 13.0530,
    lng: 80.2390,
    battery: 64,
    rssiDbm: -72,
    active: true,
    lastHeard: new Date().toISOString()
  },
  {
    id: 'node-rescue-alpha',
    name: 'NDRF Mobile Inflatable Boat 01',
    type: 'RESCUE_UNIT',
    lat: 13.0580,
    lng: 80.2380,
    battery: 89,
    rssiDbm: -68,
    active: true,
    lastHeard: new Date().toISOString()
  },
  {
    id: 'node-rescue-bravo',
    name: 'NDRF Amphibious Rover 02',
    type: 'RESCUE_UNIT',
    lat: 13.0680,
    lng: 80.2430,
    battery: 85,
    rssiDbm: -61,
    active: true,
    lastHeard: new Date().toISOString()
  }
];
