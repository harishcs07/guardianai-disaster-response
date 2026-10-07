import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  INITIAL_HAZARDS, 
  INITIAL_MESH_NODES, 
  INITIAL_SHELTERS, 
  INITIAL_VICTIMS, 
  INITIAL_WEATHER 
} from './src/data/seedData.ts';
import { Hazard, MeshNode, MeshPacket, Shelter, SOSRequest, VictimStatus, WalkieMessage, WeatherCondition } from './src/types/disaster.ts';
import { calculatePriorityScore } from './src/services/triageEngine.ts';
import { calculateSafeRoute } from './src/services/routingService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Database Store for 100% Offline / Local Operation
let weather: WeatherCondition = { ...INITIAL_WEATHER };
let shelters: Shelter[] = [...INITIAL_SHELTERS];
let hazards: Hazard[] = [...INITIAL_HAZARDS];
let victims: SOSRequest[] = [...INITIAL_VICTIMS];
let meshNodes: MeshNode[] = [...INITIAL_MESH_NODES];
let meshPackets: MeshPacket[] = [];
let walkieMessages: WalkieMessage[] = [
  {
    id: 'MSG-01',
    channel: 'CH-01 TAC OPS',
    senderCallsign: 'NDRF BASE ALPHA',
    role: 'RESCUE',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    text: 'All units check in. Primary communication repeaters operational on 433MHz BLE mesh bridges.',
    priority: 'ROUTINE'
  },
  {
    id: 'MSG-02',
    channel: 'CH-01 TAC OPS',
    senderCallsign: 'RESCUE ROVER 02',
    role: 'RESCUE',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    text: 'Arrived at Sarada Girls Hostel. Water level 190cm. Beginning roof evacuation using Zodiac boat.',
    sitrepTag: 'EXTRICATING',
    priority: 'FLASH'
  }
];

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // 1. GET FULL DISASTER STATE
  app.get('/api/state', (req, res) => {
    res.json({
      weather,
      shelters,
      hazards,
      victims,
      meshNodes,
      walkieMessages,
      meshPackets
    });
  });

  // 2. DISPATCH STRUCTURED SOS
  app.post('/api/sos', (req, res) => {
    try {
      const {
        senderName,
        senderPhone,
        lat,
        lng,
        addressDescription,
        severity,
        trappedCount,
        vulnerabilities,
        batteryLevel,
        waterDepthCm,
        notes
      } = req.body;

      const priorityScore = calculatePriorityScore({
        senderName: senderName || 'Anonymous Citizen',
        senderPhone,
        lat: Number(lat),
        lng: Number(lng),
        addressDescription: addressDescription || 'Unspecified location',
        severity: Number(severity) as any,
        trappedCount: Number(trappedCount) || 1,
        vulnerabilities: Array.isArray(vulnerabilities) ? vulnerabilities : [],
        batteryLevel: Number(batteryLevel) || 50,
        waterDepthCm: Number(waterDepthCm) || 0,
        notes: notes || ''
      });

      const newId = 'SOS-' + Math.floor(1000 + Math.random() * 9000);
      const newSOS: SOSRequest = {
        id: newId,
        timestamp: new Date().toISOString(),
        senderName: senderName || 'Anonymous Citizen',
        senderPhone,
        lat: Number(lat),
        lng: Number(lng),
        addressDescription: addressDescription || 'Unspecified location',
        severity: Number(severity) as any,
        trappedCount: Number(trappedCount) || 1,
        vulnerabilities: Array.isArray(vulnerabilities) ? vulnerabilities : [],
        batteryLevel: Number(batteryLevel) || 50,
        waterDepthCm: Number(waterDepthCm) || 0,
        notes: notes || '',
        status: 'PENDING',
        assignedTeam: null,
        priorityScore,
        meshHops: 2,
        meshRelayPath: ['Civilian-Terminal', 'SkyGuard-Drone-Relay', 'District-EOC-Base']
      };

      victims.unshift(newSOS);

      // Create Store-and-Forward Mesh Packet
      const packet: MeshPacket = {
        id: 'PKT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        type: 'SOS_BROADCAST',
        senderId: 'Civ-Terminal-' + newId,
        receiverId: 'BROADCAST',
        timestamp: new Date().toISOString(),
        ttl: 6,
        hopCount: 2,
        path: ['Civ-Terminal', 'SkyGuard-Drone', 'Base-EOC'],
        payload: newSOS
      };
      meshPackets.unshift(packet);

      res.status(201).json({ success: true, sos: newSOS, packet });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. UPDATE VICTIM STATUS (State Machine)
  app.patch('/api/victim/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, assignedTeam } = req.body;

    const victim = victims.find(v => v.id === id);
    if (!victim) {
      return res.status(404).json({ error: 'Victim record not found' });
    }

    victim.status = status as VictimStatus;
    if (assignedTeam) {
      victim.assignedTeam = assignedTeam;
    }

    // Broadcast status change packet over mesh
    const packet: MeshPacket = {
      id: 'PKT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      type: 'STATUS_UPDATE',
      senderId: assignedTeam || 'NDRF-Rover',
      receiverId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      ttl: 5,
      hopCount: 1,
      path: [assignedTeam || 'NDRF-Rover', 'Base-Station'],
      payload: { victimId: id, status, assignedTeam }
    };
    meshPackets.unshift(packet);

    res.json({ success: true, victim });
  });

  // 4. DROP / BROADCAST FIELD HAZARD
  app.post('/api/hazard', (req, res) => {
    try {
      const { type, severity, title, description, lat, lng, radiusMeters, reportedBy } = req.body;
      const newHazard: Hazard = {
        id: 'haz-' + Math.floor(100 + Math.random() * 900),
        type,
        severity,
        title,
        description,
        lat: Number(lat),
        lng: Number(lng),
        radiusMeters: Number(radiusMeters) || 200,
        reportedBy: reportedBy || 'Field Unit',
        timestamp: new Date().toISOString(),
        active: true
      };

      hazards.unshift(newHazard);

      const packet: MeshPacket = {
        id: 'PKT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        type: 'HAZARD_ALERT',
        senderId: reportedBy || 'Field Unit',
        receiverId: 'BROADCAST',
        timestamp: new Date().toISOString(),
        ttl: 8,
        hopCount: 1,
        path: [reportedBy || 'Field-Node', 'Repeater-South', 'Base-EOC'],
        payload: newHazard
      };
      meshPackets.unshift(packet);

      res.status(201).json({ success: true, hazard: newHazard, packet });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. UPDATE SHELTER LOGISTICS
  app.patch('/api/shelter/:id', (req, res) => {
    const { id } = req.params;
    const shelter = shelters.find(s => s.id === id);
    if (!shelter) {
      return res.status(404).json({ error: 'Shelter not found' });
    }

    Object.assign(shelter, req.body);
    res.json({ success: true, shelter });
  });

  // 6. POST WALKIE TALKIE MESSAGE
  app.post('/api/walkie', (req, res) => {
    const { channel, senderCallsign, role, text, sitrepTag, priority } = req.body;
    const newMsg: WalkieMessage = {
      id: 'MSG-' + Math.floor(100 + Math.random() * 900),
      channel: channel || 'CH-01 TAC OPS',
      senderCallsign: senderCallsign || 'OPERATOR',
      role: role || 'RESCUE',
      timestamp: new Date().toISOString(),
      text,
      sitrepTag,
      priority: priority || 'PRIORITY'
    };
    walkieMessages.push(newMsg);
    res.status(201).json({ success: true, message: newMsg });
  });

  // 7. EDGE SAFE NAVIGATION ROUTE
  app.get('/api/route', (req, res) => {
    const lat = parseFloat(req.query.lat as string) || 13.0600;
    const lng = parseFloat(req.query.lng as string) || 80.2400;
    const shelterId = req.query.shelterId as string;

    const route = calculateSafeRoute(lat, lng, shelters, hazards, shelterId);
    res.json({ success: true, route });
  });

  // Vite Integration (Dev) or Static files (Prod)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[GuardianAI] Running 100% Offline-First Ecosystem on http://0.0.0.0:${PORT}`);
  });
}

startServer();
