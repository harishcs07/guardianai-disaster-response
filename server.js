const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Seed Data
let shelters = [
  { id: 'shelter-1', name: 'St. Jude High Ground Academy', lat: 13.0780, lng: 80.2220, capacity: 450, currentOccupancy: 312, foodRationsDays: 4.5, waterRationsDays: 5.0, traumaKits: 18, generatorFuelPercent: 84, status: 'OPEN', contactRadio: 'CH-01' },
  { id: 'shelter-2', name: 'Municipal Sports Complex Stadium', lat: 13.0880, lng: 80.2480, capacity: 1200, currentOccupancy: 810, foodRationsDays: 6.0, waterRationsDays: 4.2, traumaKits: 45, generatorFuelPercent: 96, status: 'OPEN', contactRadio: 'CH-03' }
];

let hazards = [
  { id: 'haz-1', type: 'FLOOD', severity: 'CRITICAL', title: 'Adyar River Basin Inundation Zone', description: 'Surging river breach. Water depth 1.8m - 2.8m across primary residential grid.', lat: 13.0560, lng: 80.2440, radiusMeters: 1200, active: true },
  { id: 'haz-2', type: 'LIVE_WIRE', severity: 'CRITICAL', title: 'Submerged 11kV Power Line Downed', description: 'High-voltage feeder snapped into flooded road intersection.', lat: 13.0510, lng: 80.2320, radiusMeters: 180, active: true }
];

let victims = [
  { id: 'SOS-8412', senderName: 'Ramesh Sundaram (Family of 4)', lat: 13.0555, lng: 80.2415, addressDescription: 'Lake View Road', severity: 4, trappedCount: 4, vulnerabilities: ['elderly', 'infants'], batteryLevel: 14, waterDepthCm: 160, status: 'PENDING', priorityScore: 32.5, meshHops: 3, meshRelayPath: ['Phone-8412', 'Relay-Beacon', 'Command-Station'] }
];

let meshPackets = [];

// API Endpoints
app.get('/api/state', (req, res) => {
  res.json({ shelters, hazards, victims, meshPackets });
});

app.post('/api/sos', (req, res) => {
  const { senderName, lat, lng, addressDescription, severity, trappedCount, vulnerabilities, batteryLevel, waterDepthCm, notes } = req.body;
  const newId = 'SOS-' + Math.floor(1000 + Math.random() * 9000);
  const score = (Number(severity) * 4) + (Number(trappedCount) * 2) + (Array.isArray(vulnerabilities) ? vulnerabilities.length * 3 : 0);
  const newSOS = {
    id: newId,
    timestamp: new Date().toISOString(),
    senderName: senderName || 'Anonymous Citizen',
    lat: Number(lat) || 13.0575,
    lng: Number(lng) || 80.2420,
    addressDescription: addressDescription || 'Unspecified location',
    severity: Number(severity) || 3,
    trappedCount: Number(trappedCount) || 1,
    vulnerabilities: vulnerabilities || [],
    batteryLevel: Number(batteryLevel) || 50,
    waterDepthCm: Number(waterDepthCm) || 50,
    notes: notes || '',
    status: 'PENDING',
    priorityScore: score,
    meshHops: 2,
    meshRelayPath: ['Civ-Phone-' + newId, 'Air-Drone-01', 'Base-EOC']
  };
  victims.unshift(newSOS);
  res.status(201).json({ success: true, sos: newSOS });
});

app.patch('/api/victim/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, assignedTeam } = req.body;
  const victim = victims.find(v => v.id === id);
  if (victim) {
    victim.status = status;
    if (assignedTeam) victim.assignedTeam = assignedTeam;
    return res.json({ success: true, victim });
  }
  res.status(404).json({ error: 'Not found' });
});

app.post('/api/hazard', (req, res) => {
  const newHazard = { ...req.body, id: 'haz-' + Math.floor(100 + Math.random() * 900), active: true, timestamp: new Date().toISOString() };
  hazards.unshift(newHazard);
  res.status(201).json({ success: true, hazard: newHazard });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GuardianAI Mobile & Command Server running on http://0.0.0.0:${PORT}`);
});
