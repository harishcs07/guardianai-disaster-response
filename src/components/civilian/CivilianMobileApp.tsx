import React, { useState, useEffect } from 'react';
import { Hazard, SafeRoute, Shelter, SOSRequest, SurvivalGuide, TriageSeverity, WeatherCondition, MeshNode, MeshPacket } from '../../types/disaster';
import { calculatePriorityScore, getTriageBadge } from '../../services/triageEngine';
import { beaconService } from '../../services/beaconService';
import { DisasterMap } from '../map/DisasterMap';
import { CivilianMedicalID } from './CivilianMedicalID';
import { CivilianMeshScreen } from './CivilianMeshScreen';
import { 
  AlertOctagon, 
  Map as MapIcon, 
  BookOpen, 
  Radio, 
  Volume2, 
  Flashlight, 
  MapPin, 
  Crosshair, 
  Users, 
  Droplets, 
  HeartHandshake, 
  Send, 
  Compass, 
  ShieldCheck, 
  Search, 
  ChevronRight,
  BatteryMedium,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface CivilianMobileAppProps {
  userLocation: { lat: number; lng: number };
  shelters: Shelter[];
  hazards: Hazard[];
  victims: SOSRequest[];
  meshNodes: MeshNode[];
  meshPackets: MeshPacket[];
  weather: WeatherCondition;
  safeRoute: SafeRoute | null;
  onDispatchSOS: (sos: Omit<SOSRequest, 'id' | 'timestamp' | 'status' | 'priorityScore' | 'meshHops' | 'meshRelayPath'>) => void;
  lastDispatchedSOS: SOSRequest | null;
  onStartPinningLocation: () => void;
  isPinningLocation: boolean;
  onPinLocationSelected: (lat: number, lng: number) => void;
  onSelectShelterForRoute: (shelterId: string) => void;
  batteryLevel: number;
  outboxCount: number;
}

export const CivilianMobileApp: React.FC<CivilianMobileAppProps> = ({
  userLocation,
  shelters,
  hazards,
  victims,
  meshNodes,
  meshPackets,
  weather,
  safeRoute,
  onDispatchSOS,
  lastDispatchedSOS,
  onStartPinningLocation,
  isPinningLocation,
  onPinLocationSelected,
  onSelectShelterForRoute,
  batteryLevel,
  outboxCount
}) => {
  // 4 Bottom Navigation Screens
  const [activeTab, setActiveTab] = useState<'SOS' | 'MAP' | 'GUIDE' | 'MESH'>('SOS');

  // SOS Form States
  const [senderName, setSenderName] = useState('Anand (Family of 4)');
  const [addressDesc, setAddressDesc] = useState('2nd Floor Balcony, Lake View St');
  const [severity, setSeverity] = useState<TriageSeverity>(3);
  const [trappedCount, setTrappedCount] = useState<number>(4);
  const [vulnerabilities, setVulnerabilities] = useState<string[]>(['elderly', 'infants']);
  const [waterDepthCm, setWaterDepthCm] = useState<number>(120);
  const [notes, setNotes] = useState('Ground floor submerged, electricity cut. Water rising 10cm/hr.');
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Beacon UI States
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isVisualActive, setIsVisualActive] = useState(false);

  // Survival Guide States
  const [survivalGuides, setSurvivalGuides] = useState<SurvivalGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('cpr');
  const [guideSearch, setGuideSearch] = useState('');
  const [guideSubTab, setGuideSubTab] = useState<'FIRST_AID' | 'MEDICAL_ID'>('FIRST_AID');

  // Load offline survival wiki from local JSON
  useEffect(() => {
    fetch('/survival_data.json')
      .then(res => res.json())
      .then(data => {
        if (data.emergencyGuidelines) {
          setSurvivalGuides(data.emergencyGuidelines);
        }
      })
      .catch(err => {
        console.warn('Survival data load fallback:', err);
      });
  }, []);

  const toggleVulnerability = (vKey: string) => {
    if (vulnerabilities.includes(vKey)) {
      setVulnerabilities(vulnerabilities.filter(k => k !== vKey));
    } else {
      setVulnerabilities([...vulnerabilities, vKey]);
    }
  };

  const handleTransmitSOS = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransmitting(true);
    setTimeout(() => {
      onDispatchSOS({
        senderName: senderName || 'Anonymous Citizen',
        lat: userLocation.lat,
        lng: userLocation.lng,
        addressDescription: addressDesc || 'Unspecified location',
        severity,
        trappedCount,
        vulnerabilities,
        batteryLevel,
        waterDepthCm,
        notes
      });
      setIsTransmitting(false);
    }, 400);
  };

  const currentPreviewScore = calculatePriorityScore({
    senderName,
    lat: userLocation.lat,
    lng: userLocation.lng,
    addressDescription: addressDesc,
    severity,
    trappedCount,
    vulnerabilities,
    batteryLevel,
    waterDepthCm,
    notes
  });

  const previewBadge = getTriageBadge(currentPreviewScore);

  const filteredGuides = survivalGuides.filter(g =>
    g.title.toLowerCase().includes(guideSearch.toLowerCase()) ||
    g.category.toLowerCase().includes(guideSearch.toLowerCase()) ||
    g.summary.toLowerCase().includes(guideSearch.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden text-slate-100">
      {/* SCREEN 1: SOS DISPATCHER (PRIMARY) */}
      {activeTab === 'SOS' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* Quick Siren & Strobe Tactical Strip */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const next = beaconService.toggleAudioBeacon();
                setIsAudioActive(next);
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                isAudioActive
                  ? 'bg-red-950 border-red-500 text-red-200 ring-2 ring-red-500 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isAudioActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-400'}`}>
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold uppercase">SIREN BEACON</div>
                  <div className="text-[9px] text-slate-400">{isAudioActive ? 'PULSING' : 'Acoustic buzzer'}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-red-400">{isAudioActive ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={async () => {
                const next = await beaconService.toggleVisualBeacon();
                setIsVisualActive(next);
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                isVisualActive
                  ? 'bg-amber-950 border-amber-500 text-amber-200 ring-2 ring-amber-500 animate-bounce'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isVisualActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                  <Flashlight className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold uppercase">SOS STROBE</div>
                  <div className="text-[9px] text-slate-400">{isVisualActive ? 'FLASHING' : 'Morse beacon'}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400">{isVisualActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Active Broadcast Card if already transmitted */}
          {lastDispatchedSOS && (
            <div className="bg-gradient-to-r from-red-950/90 to-slate-900 border border-red-500 rounded-xl p-3 shadow-lg">
              <div className="flex items-center justify-between gap-1 border-b border-red-500/30 pb-1.5 mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-mono font-bold text-[11px] text-red-300 uppercase">
                    SOS ACTIVE ON STORE-&-FORWARD MESH
                  </span>
                </div>
                <span className="text-[9px] font-mono bg-red-900 text-red-200 px-1.5 py-0.2 rounded">
                  {lastDispatchedSOS.id}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                <div>Status: <b className="text-amber-400">{lastDispatchedSOS.status}</b></div>
                <div>Score: <b className="text-red-400">{lastDispatchedSOS.priorityScore}</b></div>
                <div>Relays: <b className="text-cyan-400">{lastDispatchedSOS.meshHops} Hops</b></div>
              </div>
            </div>
          )}

          {/* Structured Triage SOS Form */}
          <form onSubmit={handleTransmitSOS} className="space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            {/* Location Sensor Card */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GPS Sensor Fix (Offline)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('MAP');
                    onStartPinningLocation();
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 hover:bg-slate-700 flex items-center gap-1"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>PIN ON MAP</span>
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
                <span>{userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E</span>
                <span className="text-emerald-400 text-[10px] ml-auto">✓ Offline Sensor Fix</span>
              </div>
              <input
                type="text"
                value={addressDesc}
                onChange={e => setAddressDesc(e.target.value)}
                placeholder="Street name, floor, landmark"
                className="w-full mt-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500"
              />
            </div>

            {/* Triage Urgency Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Triage Urgency Tier (Severity)
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${previewBadge.badgeBg}`}>
                  AI SCORE: {currentPreviewScore}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { level: 1, label: '1 - Minor', color: 'border-emerald-500 text-emerald-400' },
                  { level: 2, label: '2 - Mod', color: 'border-yellow-500 text-yellow-400' },
                  { level: 3, label: '3 - Severe', color: 'border-amber-500 text-amber-400' },
                  { level: 4, label: '4 - Critical', color: 'border-red-500 text-red-400' }
                ].map(item => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSeverity(item.level as TriageSeverity)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      severity === item.level
                        ? `bg-slate-800 ${item.color} font-bold ring-2 ring-current`
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trapped Headcount Stepper & Flood Depth Slider */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Trapped Headcount</label>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTrappedCount(Math.max(1, trappedCount - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="text-sm font-mono font-bold text-white">{trappedCount} ppl</span>
                  <button
                    type="button"
                    onClick={() => setTrappedCount(trappedCount + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Water Depth:</span>
                  <b className="text-cyan-400 font-mono">{waterDepthCm}cm</b>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={10}
                  value={waterDepthCm}
                  onChange={e => setWaterDepthCm(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 mt-1"
                />
              </div>
            </div>

            {/* Vulnerabilities Checklist */}
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-red-400" />
                <span>Vulnerable Demographics Present</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'infants', label: 'Infant / Child (<5)' },
                  { id: 'elderly', label: 'Elderly (>65)' },
                  { id: 'pregnant', label: 'Pregnant' },
                  { id: 'mobility', label: 'Mobility Impaired' }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVulnerability(v.id)}
                    className={`p-1.5 rounded-lg text-[10px] font-mono border text-left flex items-center justify-between ${
                      vulnerabilities.includes(v.id)
                        ? 'bg-red-950 border-red-500 text-red-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{v.label}</span>
                    <span>{vulnerabilities.includes(v.id) ? '✓' : '+'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Access Notes */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Access Notes for NDRF Responders</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. 2nd floor window, collapsed stairs, need rope..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none resize-none focus:border-red-500"
              />
            </div>

            {/* Large Tactile Transmit Button */}
            <button
              type="submit"
              disabled={isTransmitting}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.98] text-white font-black py-3 rounded-xl text-xs font-mono tracking-wider shadow-xl shadow-red-950/60 flex items-center justify-center space-x-2 border border-red-400/30 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isTransmitting ? 'TRANSMITTING VIA MESH...' : 'TRANSMIT OFFLINE MESH SOS'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SCREEN 2: HAZARD & PREDICTION MAP */}
      {activeTab === 'MAP' && (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Map Viewport */}
          <div className="flex-1 relative">
            <DisasterMap
              currentRole="CIVILIAN"
              shelters={shelters}
              hazards={hazards}
              victims={victims}
              meshNodes={meshNodes}
              safeRoute={safeRoute}
              userLocation={userLocation}
              weather={weather}
              isPinningLocation={isPinningLocation}
              onPinLocationSelected={onPinLocationSelected}
              heightClass="h-full"
            />
          </div>

          {/* Safe Evacuation Routing Drawer Card */}
          {safeRoute && (
            <div className="bg-slate-900 border-t border-slate-800 p-3 shadow-2xl flex-shrink-0 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                <div className="flex items-center space-x-1.5">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-bold text-xs text-white">SAFE EVACUATION NAVIGATION</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                  {safeRoute.distanceKm} km • ~{safeRoute.estimatedWalkingMins} mins
                </span>
              </div>

              <div className="text-xs font-bold text-white mb-1">
                Refuge: {safeRoute.destinationShelter.name}
              </div>

              <div className="text-[11px] font-mono text-slate-400 mb-2">
                Elevation: <b className="text-emerald-400">{safeRoute.destinationShelter.elevationMeters}m</b> • 
                Radio: <b className="text-amber-400">{safeRoute.destinationShelter.contactRadio}</b>
              </div>

              <div className="space-y-1">
                {safeRoute.hazardsAvoided.map((h, i) => (
                  <div key={i} className="text-[10px] font-mono bg-slate-950 p-1.5 rounded border border-slate-800 text-slate-300 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">Detoured safely past: {h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 3: SURVIVAL GUIDE & FIRST AID + MEDICAL ID */}
      {activeTab === 'GUIDE' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* Sub-Switch: First Aid Wiki vs Medical ID */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setGuideSubTab('FIRST_AID')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                guideSubTab === 'FIRST_AID' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              FIRST AID PROTOCOLS
            </button>
            <button
              onClick={() => setGuideSubTab('MEDICAL_ID')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                guideSubTab === 'MEDICAL_ID' ? 'bg-red-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              MEDICAL ID CARD
            </button>
          </div>

          {guideSubTab === 'FIRST_AID' ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={guideSearch}
                  onChange={e => setGuideSearch(e.target.value)}
                  placeholder="Search CPR, tourniquet, collapse, water..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Guide Selector Pills */}
              <div className="flex overflow-x-auto gap-1.5 pb-1">
                {filteredGuides.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGuideId(g.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedGuideId === g.id
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {g.title}
                  </button>
                ))}
              </div>

              {/* Active Guide Content */}
              {(() => {
                const guide = survivalGuides.find(g => g.id === selectedGuideId) || survivalGuides[0];
                if (!guide) return <div className="text-slate-500 text-xs">Loading guides...</div>;

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded uppercase">
                        {guide.urgency}
                      </span>
                      <span className="text-xs text-slate-400">{guide.category}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{guide.title}</h3>
                    <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                      {guide.summary}
                    </p>

                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                        Step-by-Step Instructions:
                      </h4>
                      <ol className="space-y-2">
                        {guide.steps.map((step, idx) => (
                          <li key={idx} className="text-xs text-slate-200 flex items-start space-x-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {guide.proTips && guide.proTips.length > 0 && (
                      <div className="bg-amber-950/40 border border-amber-900/60 p-2.5 rounded-xl text-xs text-amber-200">
                        <div className="text-[10px] font-bold text-amber-300 uppercase mb-1">
                          Critical Field Note:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {guide.proTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <CivilianMedicalID />
          )}
        </div>
      )}

      {/* SCREEN 4: MESH NETWORK & STATUS */}
      {activeTab === 'MESH' && (
        <CivilianMeshScreen
          lastDispatchedSOS={lastDispatchedSOS}
          meshNodes={meshNodes}
          meshPackets={meshPackets}
          outboxCount={outboxCount}
        />
      )}

      {/* BOTTOM NAVIGATION BAR (4 TABS) */}
      <nav className="h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 flex items-center justify-around z-20 flex-shrink-0">
        <button
          onClick={() => setActiveTab('SOS')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'SOS' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight">SOS DISPATCH</span>
        </button>

        <button
          onClick={() => setActiveTab('MAP')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'MAP' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight">HAZARDS MAP</span>
        </button>

        <button
          onClick={() => setActiveTab('GUIDE')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'GUIDE' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight">SURVIVAL WIKI</span>
        </button>

        <button
          onClick={() => setActiveTab('MESH')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'MESH' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight">MESH STATUS</span>
        </button>
      </nav>
    </div>
  );
};
