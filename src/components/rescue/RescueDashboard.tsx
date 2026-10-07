import React, { useState } from 'react';
import { Hazard, HazardType, SOSRequest, VictimStatus, WalkieMessage } from '../../types/disaster';
import { getTriageBadge, sortVictimsByPriority } from '../../services/triageEngine';
import { 
  Flame, 
  AlertTriangle, 
  Radio, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Droplets, 
  Battery, 
  Send, 
  PlusCircle, 
  Clock, 
  Activity,
  ListFilter,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface RescueDashboardProps {
  victims: SOSRequest[];
  hazards: Hazard[];
  walkieMessages: WalkieMessage[];
  selectedVictimId: string | null;
  onSelectVictim: (id: string) => void;
  onUpdateVictimStatus: (id: string, status: VictimStatus, teamName?: string) => void;
  onDropHazardPin: (hazard: Omit<Hazard, 'id' | 'timestamp' | 'active'>) => void;
  onSendWalkieMessage: (msg: Omit<WalkieMessage, 'id' | 'timestamp'>) => void;
  userLocation: { lat: number; lng: number };
}

export const RescueDashboard: React.FC<RescueDashboardProps> = ({
  victims,
  hazards,
  walkieMessages,
  selectedVictimId,
  onSelectVictim,
  onUpdateVictimStatus,
  onDropHazardPin,
  onSendWalkieMessage,
  userLocation
}) => {
  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'HAZARD_PIN' | 'WALKIE'>('MISSIONS');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Walkie Chat State
  const [walkieChannel, setWalkieChannel] = useState('CH-01 TAC OPS');
  const [chatInput, setChatInput] = useState('');
  const [callsign, setCallsign] = useState('NDRF UNIT ALPHA-1');

  // Drop Hazard Form State
  const [hazardType, setHazardType] = useState<HazardType>('LIVE_WIRE');
  const [hazardTitle, setHazardTitle] = useState('Downed 11kV Feeder in Water');
  const [hazardDesc, setHazardDesc] = useState('Arterial intersection impassable due to electrical conduction in 1m water.');
  const [hazardRadius, setHazardRadius] = useState(150);
  const [hazardSeverity, setHazardSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('CRITICAL');

  // Sorted list of victims by calculated Priority Score
  const prioritizedVictims = sortVictimsByPriority(victims, userLocation);

  const filteredVictims = prioritizedVictims.filter(v => {
    if (filterSeverity === 'PENDING') return v.status === 'PENDING';
    if (filterSeverity === 'EN_ROUTE') return v.status === 'EN_ROUTE';
    if (filterSeverity === 'CRITICAL') return v.priorityScore >= 30;
    if (filterSeverity === 'RESOLVED') return v.status === 'RESCUED' || v.status === 'TRANSFERRED';
    return true;
  });

  const selectedVictim = victims.find(v => v.id === selectedVictimId) || prioritizedVictims[0];

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    onSendWalkieMessage({
      channel: walkieChannel,
      senderCallsign: callsign,
      role: 'RESCUE',
      text: chatInput.trim(),
      priority: 'PRIORITY'
    });
    setChatInput('');
  };

  const handleCannedSitrep = (text: string, sitrepTag: string) => {
    onSendWalkieMessage({
      channel: walkieChannel,
      senderCallsign: callsign,
      role: 'RESCUE',
      text,
      sitrepTag,
      priority: 'FLASH'
    });
  };

  const handleCreateHazard = (e: React.FormEvent) => {
    e.preventDefault();
    onDropHazardPin({
      type: hazardType,
      severity: hazardSeverity,
      title: hazardTitle,
      description: hazardDesc,
      lat: userLocation.lat + (Math.random() * 0.004 - 0.002),
      lng: userLocation.lng + (Math.random() * 0.004 - 0.002),
      radiusMeters: hazardRadius,
      reportedBy: callsign
    });
    setActiveTab('MISSIONS');
  };

  // State Machine Transitions: PENDING -> EN_ROUTE -> RESCUED -> TRANSFERRED
  const getNextStatus = (current: VictimStatus): VictimStatus => {
    switch (current) {
      case 'PENDING': return 'EN_ROUTE';
      case 'EN_ROUTE': return 'RESCUED';
      case 'RESCUED': return 'TRANSFERRED';
      default: return 'TRANSFERRED';
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-hidden">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('MISSIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'MISSIONS'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>AI TRIAGE QUEUE ({victims.filter(v => v.status === 'PENDING').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HAZARD_PIN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'HAZARD_PIN'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>PIN FIELD HAZARD</span>
          </button>

          <button
            onClick={() => setActiveTab('WALKIE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'WALKIE'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>TACTICAL MESH WALKIE ({walkieMessages.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-slate-400 pr-2">
          <span className="text-amber-400 font-bold">{callsign}</span>
        </div>
      </div>

      {/* TAB 1: AI-PRIORITIZED MISSION QUEUE */}
      {activeTab === 'MISSIONS' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
          {/* Left Column (7 cols): Queue List */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">TRIAGE SORTED BY URGENCY FORMULA</span>
              </div>
              <div className="flex space-x-1 text-[10px] font-mono">
                {['ALL', 'CRITICAL', 'PENDING', 'EN_ROUTE', 'RESOLVED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterSeverity(f)}
                    className={`px-2 py-0.5 rounded border transition-all ${
                      filterSeverity === f
                        ? 'bg-amber-600 border-amber-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Missions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredVictims.map((v, idx) => {
                const badge = getTriageBadge(v.priorityScore);
                const isSelected = selectedVictim?.id === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVictim(v.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 ring-1 ring-amber-500 shadow-lg'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-white">{v.senderName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.badgeBg}`}>
                          SCORE: {v.priorityScore}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          v.status === 'PENDING' ? 'bg-red-950 text-red-300' :
                          v.status === 'EN_ROUTE' ? 'bg-amber-950 text-amber-300' :
                          v.status === 'RESCUED' ? 'bg-blue-950 text-blue-300' :
                          'bg-emerald-950 text-emerald-300'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{v.addressDescription}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <div>Trapped: <b className="text-white">{v.trappedCount}</b></div>
                      <div>Water: <b className="text-cyan-400">{v.waterDepthCm}cm</b></div>
                      <div>Battery: <b className={v.batteryLevel < 20 ? 'text-red-400' : 'text-emerald-400'}>{v.batteryLevel}%</b></div>
                    </div>

                    {v.vulnerabilities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {v.vulnerabilities.map((vuln, i) => (
                          <span key={i} className="text-[9px] font-mono bg-red-950/60 text-red-300 border border-red-900/50 px-1.5 py-0.2 rounded uppercase">
                            {vuln}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (5 cols): Selected Mission Action & State Machine */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-y-auto p-4">
            {selectedVictim ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400">MISSION DETAILS</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{selectedVictim.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedVictim.senderName}</h3>
                  <div className="text-xs text-slate-400 mt-1">{selectedVictim.addressDescription}</div>
                </div>

                {/* State Machine Status Progression */}
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-300 mb-2">
                    STATUS STATE MACHINE
                  </div>
                  <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-center mb-3">
                    {(['PENDING', 'EN_ROUTE', 'RESCUED', 'TRANSFERRED'] as VictimStatus[]).map((st, i) => {
                      const isCurrent = selectedVictim.status === st;
                      const isPast = ['PENDING', 'EN_ROUTE', 'RESCUED', 'TRANSFERRED'].indexOf(selectedVictim.status) >= i;

                      return (
                        <div
                          key={st}
                          className={`p-1.5 rounded ${
                            isCurrent
                              ? 'bg-amber-600 text-white font-bold shadow'
                              : isPast
                              ? 'bg-slate-800 text-emerald-400'
                              : 'text-slate-600'
                          }`}
                        >
                          <div>{i + 1}. {st}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Advance State Machine Button */}
                  {selectedVictim.status !== 'TRANSFERRED' && (
                    <button
                      onClick={() => onUpdateVictimStatus(selectedVictim.id, getNextStatus(selectedVictim.status), callsign)}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs font-mono tracking-wider flex items-center justify-center space-x-2 shadow-lg transition-all"
                    >
                      <span>ADVANCE STATUS ➔ {getNextStatus(selectedVictim.status)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Situation Assessment Notes */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="font-bold text-slate-300 mb-1">Civilian Field Sitrep:</div>
                  <p className="text-slate-300 leading-relaxed italic bg-slate-900 p-2.5 rounded border border-slate-800">
                    "{selectedVictim.notes || 'No notes provided'}"
                  </p>
                </div>

                {/* Contact Phone & Coordinates */}
                <div className="space-y-1.5 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone/Radio:</span>
                    <span className="text-white">{selectedVictim.senderPhone || 'Direct BLE Mesh Signal'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-cyan-400">{selectedVictim.lat.toFixed(4)}°N, {selectedVictim.lng.toFixed(4)}°E</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mesh Hops:</span>
                    <span className="text-emerald-400">{selectedVictim.meshHops} Relays Traversed</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-center py-12 text-xs">
                Select a mission from the triage queue to inspect.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PIN FIELD HAZARD */}
      {activeTab === 'HAZARD_PIN' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                Broadcast Field Hazard Pin to Mesh
              </h3>
            </div>

            <form onSubmit={handleCreateHazard} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hazard Classification</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['LIVE_WIRE', 'FLOOD', 'COLLAPSE', 'BLOCKED_ROAD', 'CHEMICAL', 'DAM_SURGE'] as HazardType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHazardType(type)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        hazardType === type
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
                <label className="block text-slate-300 font-semibold mb-1">Hazard Title</label>
                <input
                  type="text"
                  value={hazardTitle}
                  onChange={e => setHazardTitle(e.target.value)}
                  placeholder="e.g. Submerged Bridge / Gas Leak"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Details & Perimeter Risk</label>
                <textarea
                  rows={3}
                  value={hazardDesc}
                  onChange={e => setHazardDesc(e.target.value)}
                  placeholder="Describe risk, water speed, electrical arcing..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Danger Radius: <b className="text-amber-400 font-mono">{hazardRadius}m</b>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={1000}
                    step={50}
                    value={hazardRadius}
                    onChange={e => setHazardRadius(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                  <select
                    value={hazardSeverity}
                    onChange={e => setHazardSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl font-mono text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>BROADCAST HAZARD TO ALL FIELD NODES & CIVILIANS</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: TACTICAL MESH WALKIE LOG */}
      {activeTab === 'WALKIE' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Channel Bar & Quick Canned Sitreps */}
          <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <select
                value={walkieChannel}
                onChange={e => setWalkieChannel(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono font-bold px-2 py-1 rounded outline-none"
              >
                <option value="CH-01 TAC OPS">CH-01 TAC OPS (All Responders)</option>
                <option value="CH-02 MEDICAL">CH-02 MEDICAL TRIAGE</option>
                <option value="CH-03 RESCUE-DELTA">CH-03 RESCUE BOAT DELTA</option>
                <option value="CH-04 ALL RELAY">CH-04 ALL MESH RELAYS</option>
              </select>
            </div>

            {/* Quick Canned SITREPs */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-mono text-slate-500 mr-1">QUICK SITREP:</span>
              <button
                onClick={() => handleCannedSitrep('Victim extricated safely. Preparing for medical transfer.', 'RESCUE_CONFIRMED')}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300"
              >
                + EXTRICATED
              </button>
              <button
                onClick={() => handleCannedSitrep('Requesting inflatable Zodiac boat due to 2m water surge.', 'BOAT_REQ')}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300"
              >
                + BOAT REQ
              </button>
              <button
                onClick={() => handleCannedSitrep('Submerged live electrical line identified. Danger zone pinned.', 'POWER_HAZARD')}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300"
              >
                + LIVE WIRE
              </button>
              <button
                onClick={() => handleCannedSitrep('Trauma kit exhausted. Requesting immediate medical supply drop.', 'MED_DROP')}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 hover:bg-red-900 border border-red-800 text-red-300"
              >
                + MED EVAC
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {walkieMessages.map(msg => (
              <div
                key={msg.id}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs"
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-400">{msg.senderCallsign}</span>
                    <span className="text-slate-500">[{msg.channel}]</span>
                    {msg.sitrepTag && (
                      <span className="bg-red-950 text-red-300 px-1 rounded border border-red-900">
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
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Send tactical transmission over store-and-forward mesh..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs font-mono tracking-wider flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
