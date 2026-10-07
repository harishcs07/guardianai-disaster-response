import React, { useState } from 'react';
import { Hazard, HazardType, MeshNode, MeshPacket, Shelter, SOSRequest } from '../../types/disaster';
import { 
  Building2, 
  Activity, 
  Layers, 
  Radio, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Droplet, 
  Battery, 
  Zap, 
  RefreshCw, 
  PlusCircle, 
  Send,
  Boxes,
  Signal,
  CheckCircle2,
  Share2
} from 'lucide-react';

interface ControlDashboardProps {
  victims: SOSRequest[];
  shelters: Shelter[];
  hazards: Hazard[];
  meshNodes: MeshNode[];
  meshPackets: MeshPacket[];
  onBroadcastHazardZone: (hazard: Omit<Hazard, 'id' | 'timestamp' | 'active'>) => void;
  onUpdateShelter: (shelterId: string, updates: Partial<Shelter>) => void;
}

export const ControlDashboard: React.FC<ControlDashboardProps> = ({
  victims,
  shelters,
  hazards,
  meshNodes,
  meshPackets,
  onBroadcastHazardZone,
  onUpdateShelter
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SHELTERS' | 'BROADCAST_HAZARD' | 'MESH_HEALTH'>('OVERVIEW');

  // Dynamic Hazard Zone Form
  const [zoneTitle, setZoneTitle] = useState('Chembarambakkam Dam Discharge Surge Alert');
  const [zoneType, setZoneType] = useState<HazardType>('DAM_SURGE');
  const [zoneRadius, setZoneRadius] = useState(1200);
  const [zoneSeverity, setZoneSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('CRITICAL');
  const [zoneDesc, setZoneDesc] = useState('Controlled reservoir sluice gate release increased to 22,000 cusecs. Immediate evacuation within 1200m riverbanks.');

  // Sector calculations
  const totalVictims = victims.length;
  const criticalVictims = victims.filter(v => v.priorityScore >= 30 && v.status === 'PENDING').length;
  const rescuedVictims = victims.filter(v => v.status === 'RESCUED' || v.status === 'TRANSFERRED').length;
  const activeHazardsCount = hazards.filter(h => h.active).length;
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalShelterOccupancy = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const availableBeds = Math.max(0, totalShelterCapacity - totalShelterOccupancy);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    onBroadcastHazardZone({
      title: zoneTitle,
      type: zoneType,
      severity: zoneSeverity,
      description: zoneDesc,
      radiusMeters: zoneRadius,
      lat: 13.0600 + (Math.random() * 0.01 - 0.005),
      lng: 80.2450 + (Math.random() * 0.01 - 0.005),
      reportedBy: 'CENTRAL EOC COMMAND OPERATOR'
    });
    setActiveTab('OVERVIEW');
  };

  const handleRestockShelter = (shelter: Shelter) => {
    onUpdateShelter(shelter.id, {
      foodRationsDays: Math.round((shelter.foodRationsDays + 3) * 10) / 10,
      waterRationsDays: Math.round((shelter.waterRationsDays + 3) * 10) / 10,
      traumaKits: shelter.traumaKits + 15,
      generatorFuelPercent: Math.min(100, shelter.generatorFuelPercent + 25)
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>DISTRICT SITREP & SECTORS</span>
          </button>

          <button
            onClick={() => setActiveTab('SHELTERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'SHELTERS'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>SHELTER LOGISTICS ({shelters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('BROADCAST_HAZARD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'BROADCAST_HAZARD'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>DYNAMIC HAZARD BROADCASTER</span>
          </button>

          <button
            onClick={() => setActiveTab('MESH_HEALTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'MESH_HEALTH'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Signal className="w-3.5 h-3.5" />
            <span>MESH HEALTH & TOPOLOGY</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-emerald-400 pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>EOC SECURE LOCAL CONSOLE</span>
        </div>
      </div>

      {/* TAB 1: DISTRICT OVERVIEW & SECTOR SITREPS */}
      {activeTab === 'OVERVIEW' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* KPI High-Level Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400">TOTAL SOS LOGGED</div>
              <div className="text-xl font-bold font-mono text-white mt-1">{totalVictims}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across 4 sectors</div>
            </div>

            <div className="bg-slate-900 border border-red-900/50 p-3 rounded-xl bg-red-950/20">
              <div className="text-[10px] font-mono text-red-400 font-semibold">CRITICAL PENDING</div>
              <div className="text-xl font-bold font-mono text-red-400 mt-1">{criticalVictims}</div>
              <div className="text-[10px] text-red-500/80 mt-0.5">Score &ge; 30 (Immediate)</div>
            </div>

            <div className="bg-slate-900 border border-emerald-900/50 p-3 rounded-xl bg-emerald-950/20">
              <div className="text-[10px] font-mono text-emerald-400 font-semibold">SUCCESSFUL RESCUES</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{rescuedVictims}</div>
              <div className="text-[10px] text-emerald-500/80 mt-0.5">Extricated & safe</div>
            </div>

            <div className="bg-slate-900 border border-amber-900/50 p-3 rounded-xl bg-amber-950/20">
              <div className="text-[10px] font-mono text-amber-400 font-semibold">ACTIVE HAZARDS</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">{activeHazardsCount}</div>
              <div className="text-[10px] text-amber-500/80 mt-0.5">Perimeters enforced</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400">SHELTER BEDS OPEN</div>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">{availableBeds}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{totalShelterOccupancy}/{totalShelterCapacity} filled</div>
            </div>

            <div className="bg-slate-900 border border-cyan-900/50 p-3 rounded-xl bg-cyan-950/20">
              <div className="text-[10px] font-mono text-cyan-400 font-semibold">MESH NODES ON</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{meshNodes.filter(n => n.active).length}</div>
              <div className="text-[10px] text-cyan-500/80 mt-0.5">Relay masts & drones</div>
            </div>
          </div>

          {/* Sector-by-Sector Situational Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Sector-Level Tactical Matrix</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { sector: 'Sector Alpha (North Ridge)', status: 'CONTROLLED', victims: 2, critical: 0, floodRate: 'Stable', hazards: 1 },
                { sector: 'Sector Bravo (River Basin Delta)', status: 'CRITICAL SURGE', victims: 6, critical: 3, floodRate: '+15 cm/hr', hazards: 3 },
                { sector: 'Sector Charlie (Metro Core)', status: 'MODERATE', victims: 3, critical: 1, floodRate: '+5 cm/hr', hazards: 1 },
                { sector: 'Sector Delta (Coastal Port)', status: 'PREPARING EVAC', victims: 1, critical: 0, floodRate: 'Surge 1.2m', hazards: 1 }
              ].map((s, i) => (
                <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">{s.sector}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      s.status.includes('CRITICAL') ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Victims / Cases:</span>
                      <b className="text-white">{s.victims}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Critical Trapped:</span>
                      <b className={s.critical > 0 ? 'text-red-400' : 'text-emerald-400'}>{s.critical}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Water Velocity:</span>
                      <b className="text-cyan-400">{s.floodRate}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Hazards:</span>
                      <b className="text-amber-400">{s.hazards}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHELTERS & LOGISTICS MONITOR */}
      {activeTab === 'SHELTERS' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold uppercase text-white font-mono flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-400" />
              <span>Evacuation Shelters Capacity & Logistics Inventory</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total Shelters: {shelters.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shelters.map(shelter => {
              const occupancyPct = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
              const isOverloaded = occupancyPct >= 90;

              return (
                <div key={shelter.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{shelter.name}</h4>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Radio Net: <span className="text-amber-400">{shelter.contactRadio}</span> • Elev: {shelter.elevationMeters}m
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isOverloaded ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {occupancyPct}% OCCUPIED
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Occupancy: {shelter.currentOccupancy} / {shelter.capacity} beds</span>
                      <span>{shelter.capacity - shelter.currentOccupancy} Remaining</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isOverloaded ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Supplies Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-[9px] text-slate-500">FOOD</div>
                      <div className="font-bold text-white">{shelter.foodRationsDays}d</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500">WATER</div>
                      <div className="font-bold text-cyan-400">{shelter.waterRationsDays}d</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500">MED KITS</div>
                      <div className="font-bold text-red-400">{shelter.traumaKits}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500">FUEL</div>
                      <div className="font-bold text-amber-400">{shelter.generatorFuelPercent}%</div>
                    </div>
                  </div>

                  {/* Restock Logistics Button */}
                  <button
                    onClick={() => handleRestockShelter(shelter)}
                    className="w-full bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-mono text-xs py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>AUTHORIZE SUPPLY RESUPPLY DROP (+Food/Water/Kits)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC HAZARD BROADCASTER */}
      {activeTab === 'BROADCAST_HAZARD' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-y-auto">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Share2 className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                Control Room Dynamic Danger Zone Broadcaster
              </h3>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
              Operator tool to define perimeter exclusion alerts (e.g. Dam Spillage, Flash Flood Surge, Industrial Risk). Propagates with top TTL priority across the entire simulated store-and-forward mesh network to instantly detour civilians and field responders.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Zone Alert Classification</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DAM_SURGE', 'FLOOD', 'CHEMICAL', 'LIVE_WIRE', 'COLLAPSE', 'BLOCKED_ROAD'] as HazardType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setZoneType(type)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        zoneType === type
                          ? 'bg-red-950 border-red-500 text-red-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Exclusion Zone Title</label>
                <input
                  type="text"
                  value={zoneTitle}
                  onChange={e => setZoneTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Evacuation Broadcast Instructions</label>
                <textarea
                  rows={3}
                  value={zoneDesc}
                  onChange={e => setZoneDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Exclusion Radius: <b className="text-red-400 font-mono">{zoneRadius}m</b>
                  </label>
                  <input
                    type="range"
                    min={200}
                    max={3000}
                    step={100}
                    value={zoneRadius}
                    onChange={e => setZoneRadius(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Alert Severity</label>
                  <select
                    value={zoneSeverity}
                    onChange={e => setZoneSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                  >
                    <option value="CRITICAL">CRITICAL (MANDATORY EVACUATION)</option>
                    <option value="HIGH">HIGH RISK</option>
                    <option value="MEDIUM">MEDIUM (ADVISORY)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-black py-3 rounded-xl text-xs font-mono tracking-wider shadow-xl flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>EXECUTE DYNAMIC PERIMETER BROADCAST (ALL NODES)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: MESH HEALTH & NODE TOPOLOGY */}
      {activeTab === 'MESH_HEALTH' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-white font-mono flex items-center gap-2">
              <Signal className="w-4 h-4 text-cyan-400" />
              <span>Simulated Store-and-Forward Mesh Node Relays & Packet Ledger</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              {meshNodes.length} ACTIVE PHYSICAL RELAYS
            </span>
          </div>

          {/* Node Health Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {meshNodes.map(node => (
              <div key={node.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white text-xs truncate">{node.name}</span>
                  <span className="text-[10px] bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800">
                    {node.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mt-2 bg-slate-900/60 p-2 rounded">
                  <div>Battery: <b className="text-emerald-400">{node.battery}%</b></div>
                  <div>RSSI: <b className="text-cyan-400">{node.rssiDbm} dBm</b></div>
                  <div className="col-span-2 text-[10px] text-slate-500 truncate">
                    Coord: {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Mesh Packets Ledger */}
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-300 uppercase mb-2">
              Recent Multi-Hop Packet Ledger ({meshPackets.length})
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {meshPackets.map(pkt => (
                <div key={pkt.id} className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[11px] flex items-center justify-between text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-400 font-bold">{pkt.id}</span>
                    <span className="bg-slate-900 px-1.5 py-0.2 rounded text-[9px] text-cyan-300 border border-slate-800">
                      {pkt.type}
                    </span>
                    <span className="text-slate-400">Hops: <b className="text-white">{pkt.hopCount}</b> (TTL: {pkt.ttl})</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Path: {pkt.path.join(' ➔ ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
