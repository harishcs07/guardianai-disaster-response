import React, { useState } from 'react';
import { Hazard, HazardType, MeshNode, SOSRequest, VictimStatus, WalkieMessage, WeatherCondition } from '../../types/disaster';
import { getTriageBadge, sortVictimsByPriority } from '../../services/triageEngine';
import { DisasterMap } from '../map/DisasterMap';
import { 
  Flame, 
  Map as MapIcon, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Send, 
  PlusCircle, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  X,
  Compass
} from 'lucide-react';

interface RescueMobileAppProps {
  victims: SOSRequest[];
  hazards: Hazard[];
  walkieMessages: WalkieMessage[];
  meshNodes: MeshNode[];
  weather: WeatherCondition;
  selectedVictimId: string | null;
  onSelectVictim: (id: string) => void;
  onUpdateVictimStatus: (id: string, status: VictimStatus, teamName?: string) => void;
  onDropHazardPin: (hazard: Omit<Hazard, 'id' | 'timestamp' | 'active'>) => void;
  onSendWalkieMessage: (msg: Omit<WalkieMessage, 'id' | 'timestamp'>) => void;
  userLocation: { lat: number; lng: number };
}

export const RescueMobileApp: React.FC<RescueMobileAppProps> = ({
  victims,
  hazards,
  walkieMessages,
  meshNodes,
  weather,
  selectedVictimId,
  onSelectVictim,
  onUpdateVictimStatus,
  onDropHazardPin,
  onSendWalkieMessage,
  userLocation
}) => {
  // 3 Bottom Navigation Screens
  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'MAP' | 'COMM'>('MISSIONS');

  // Filter state
  const [filterMode, setFilterMode] = useState<string>('ALL');

  // Mission Detail Sheet
  const [inspectedVictimId, setInspectedVictimId] = useState<string | null>(null);

  // Drop Hazard Modal
  const [isDropHazardOpen, setIsDropHazardOpen] = useState(false);
  const [hazardType, setHazardType] = useState<HazardType>('LIVE_WIRE');
  const [hazardTitle, setHazardTitle] = useState('Submerged 11kV Power Cable');
  const [hazardDesc, setHazardDesc] = useState('Active electrical arcing in flood water. Blocked to all boats.');
  const [hazardRadius, setHazardRadius] = useState(150);

  // Walkie Comm State
  const [walkieChannel, setWalkieChannel] = useState('CH-01 TAC OPS');
  const [commInput, setCommInput] = useState('');
  const [callsign] = useState('NDRF UNIT ALPHA-1');

  // Sorted victims using triage formula
  const prioritizedVictims = sortVictimsByPriority(victims, userLocation);

  const filteredVictims = prioritizedVictims.filter(v => {
    if (filterMode === 'CRITICAL') return v.priorityScore >= 30;
    if (filterMode === 'PENDING') return v.status === 'PENDING';
    if (filterMode === 'EN_ROUTE') return v.status === 'EN_ROUTE';
    if (filterMode === 'RESCUED') return v.status === 'RESCUED' || v.status === 'TRANSFERRED';
    return true;
  });

  const inspectedVictim = victims.find(v => v.id === (inspectedVictimId || selectedVictimId)) || prioritizedVictims[0];

  const handleNextStatus = (current: VictimStatus): VictimStatus => {
    switch (current) {
      case 'PENDING': return 'EN_ROUTE';
      case 'EN_ROUTE': return 'RESCUED';
      case 'RESCUED': return 'TRANSFERRED';
      default: return 'TRANSFERRED';
    }
  };

  const handleDropHazardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDropHazardPin({
      type: hazardType,
      severity: 'CRITICAL',
      title: hazardTitle,
      description: hazardDesc,
      radiusMeters: hazardRadius,
      lat: userLocation.lat + (Math.random() * 0.003 - 0.0015),
      lng: userLocation.lng + (Math.random() * 0.003 - 0.0015),
      reportedBy: callsign
    });
    setIsDropHazardOpen(false);
  };

  const handleSendComm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commInput.trim()) return;

    onSendWalkieMessage({
      channel: walkieChannel,
      senderCallsign: callsign,
      role: 'RESCUE',
      text: commInput.trim(),
      priority: 'PRIORITY'
    });
    setCommInput('');
  };

  const handleCannedSitrep = (text: string, tag: string) => {
    onSendWalkieMessage({
      channel: walkieChannel,
      senderCallsign: callsign,
      role: 'RESCUE',
      text,
      sitrepTag: tag,
      priority: 'FLASH'
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden text-slate-100">
      {/* SCREEN 1: PRIORITY MISSION QUEUE */}
      {activeTab === 'MISSIONS' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* Header & Filter Chips */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-bold text-xs text-white">AI-PRIORITIZED MISSION QUEUE</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded">
                CALLSIGN: {callsign}
              </span>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-1 overflow-x-auto text-[10px] font-mono">
              {['ALL', 'CRITICAL', 'PENDING', 'EN_ROUTE', 'RESCUED'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterMode(f)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    filterMode === f
                      ? 'bg-amber-600 border-amber-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Mission Cards List */}
          <div className="space-y-2.5">
            {filteredVictims.map((v, idx) => {
              const badge = getTriageBadge(v.priorityScore);
              const isSelected = inspectedVictim?.id === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setInspectedVictimId(v.id);
                    onSelectVictim(v.id);
                  }}
                  className={`bg-slate-900 border rounded-2xl p-3.5 transition-all cursor-pointer shadow-lg ${
                    isSelected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center border border-slate-700">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-xs text-white">{v.senderName}</span>
                    </div>

                    <div className="flex items-center space-x-1 font-mono text-[9px]">
                      <span className={`px-1.5 py-0.5 rounded border ${badge.badgeBg}`}>
                        SCORE: {v.priorityScore}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        v.status === 'PENDING' ? 'bg-red-950 text-red-300' :
                        v.status === 'EN_ROUTE' ? 'bg-amber-950 text-amber-300' :
                        'bg-emerald-950 text-emerald-300'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{v.addressDescription}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800/80 mb-2.5">
                    <div>Trapped: <b className="text-white">{v.trappedCount} ppl</b></div>
                    <div>Water: <b className="text-cyan-400">{v.waterDepthCm}cm</b></div>
                    <div>Battery: <b className={v.batteryLevel < 20 ? 'text-red-400' : 'text-emerald-400'}>{v.batteryLevel}%</b></div>
                  </div>

                  {/* Mission Status State Machine Step Button */}
                  {v.status !== 'TRANSFERRED' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateVictimStatus(v.id, handleNextStatus(v.status), callsign);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 active:scale-98 font-mono text-xs font-bold text-amber-300 py-2 rounded-xl flex items-center justify-center space-x-1.5 border border-slate-700"
                    >
                      <span>ADVANCE: {v.status} ➔ {handleNextStatus(v.status)}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="text-center font-mono text-[10px] text-emerald-400 py-1 bg-emerald-950/60 rounded-lg border border-emerald-900">
                      ✓ RESCUE MISSION COMPLETED & TRANSFERRED
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCREEN 2: TACTICAL RESCUE MAP */}
      {activeTab === 'MAP' && (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 relative">
            <DisasterMap
              currentRole="RESCUE"
              shelters={[]}
              hazards={hazards}
              victims={victims}
              meshNodes={meshNodes}
              selectedVictimId={selectedVictimId}
              onSelectVictim={onSelectVictim}
              userLocation={userLocation}
              weather={weather}
              heightClass="h-full"
            />
          </div>

          {/* Floating Action Button: Drop Hazard Pin */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <button
              onClick={() => setIsDropHazardOpen(true)}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-98 text-white font-mono font-bold text-xs py-3 rounded-2xl shadow-2xl flex items-center justify-center space-x-2 border border-red-400/40"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>DROP FIELD HAZARD PIN (BROADCAST TO MESH)</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: TACTICAL MESH COMM */}
      {activeTab === 'COMM' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Channel Bar & Quick Canned Sitreps */}
          <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-white">TACTICAL MESH RADIO</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                CH-01 TAC OPS
              </span>
            </div>

            {/* Canned Sitrep Chips */}
            <div className="flex gap-1 overflow-x-auto text-[9px] font-mono">
              <button
                onClick={() => handleCannedSitrep('Victim extricated safely. Ready for medical transport.', 'EXTRICATED')}
                className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 whitespace-nowrap"
              >
                + EXTRICATED
              </button>
              <button
                onClick={() => handleCannedSitrep('Requesting Zodiac inflatable boat immediately.', 'BOAT_REQ')}
                className="px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 whitespace-nowrap"
              >
                + BOAT REQ
              </button>
              <button
                onClick={() => handleCannedSitrep('Live wire downed in flood corridor. Caution.', 'LIVE_WIRE')}
                className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 whitespace-nowrap"
              >
                + LIVE WIRE
              </button>
              <button
                onClick={() => handleCannedSitrep('Medical trauma kit exhausted. Need resupply.', 'MED_DROP')}
                className="px-2 py-1 rounded bg-red-950 text-red-300 border border-red-800 whitespace-nowrap"
              >
                + MED EVAC
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {walkieMessages.map(msg => (
              <div key={msg.id} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-amber-400">{msg.senderCallsign}</span>
                    {msg.sitrepTag && (
                      <span className="bg-red-950 text-red-300 px-1 rounded text-[9px] border border-red-900">
                        {msg.sitrepTag}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-200">{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendComm} className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={commInput}
              onChange={e => setCommInput(e.target.value)}
              placeholder="Send radio text over mesh..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs font-mono"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* DROP FIELD HAZARD MODAL SHEET */}
      {isDropHazardOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono font-bold text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>DROP FIELD HAZARD PIN</span>
              </span>
              <button onClick={() => setIsDropHazardOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDropHazardSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Hazard Type</label>
                <select
                  value={hazardType}
                  onChange={e => setHazardType(e.target.value as HazardType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                >
                  <option value="LIVE_WIRE">Downed Live Wire</option>
                  <option value="COLLAPSE">Structural Collapse / Debris</option>
                  <option value="FLOOD">Flash Flood Surge</option>
                  <option value="BLOCKED_ROAD">Bridge / Road Blockage</option>
                  <option value="CHEMICAL">Hazardous Material / Gas</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Hazard Title</label>
                <input
                  type="text"
                  value={hazardTitle}
                  onChange={e => setHazardTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Risk Details</label>
                <textarea
                  rows={2}
                  value={hazardDesc}
                  onChange={e => setHazardDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none resize-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Danger Radius:</span>
                  <b className="text-red-400">{hazardRadius}m</b>
                </div>
                <input
                  type="range"
                  min={50}
                  max={800}
                  step={25}
                  value={hazardRadius}
                  onChange={e => setHazardRadius(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs py-2.5 rounded-xl shadow-lg"
              >
                BROADCAST HAZARD TO ALL UNITS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION (3 TABS) */}
      <nav className="h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 flex items-center justify-around z-20 flex-shrink-0">
        <button
          onClick={() => setActiveTab('MISSIONS')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'MISSIONS' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight">MISSIONS</span>
        </button>

        <button
          onClick={() => setActiveTab('MAP')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'MAP' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight">TACTICAL MAP</span>
        </button>

        <button
          onClick={() => setActiveTab('COMM')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'COMM' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight">MESH COMM</span>
        </button>
      </nav>
    </div>
  );
};
