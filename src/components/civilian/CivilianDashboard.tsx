import React, { useState, useEffect } from 'react';
import { Hazard, SafeRoute, Shelter, SOSRequest, SurvivalGuide, TriageSeverity } from '../../types/disaster';
import { calculatePriorityScore, getTriageBadge } from '../../services/triageEngine';
import { 
  AlertOctagon, 
  MapPin, 
  Users, 
  HeartHandshake, 
  Battery, 
  Droplets, 
  Send, 
  Compass, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle, 
  Volume2, 
  Flashlight, 
  Crosshair,
  Info,
  Clock,
  Radio,
  FileText
} from 'lucide-react';
import { beaconService } from '../../services/beaconService';

interface CivilianDashboardProps {
  userLocation: { lat: number; lng: number };
  shelters: Shelter[];
  hazards: Hazard[];
  safeRoute: SafeRoute | null;
  onDispatchSOS: (sos: Omit<SOSRequest, 'id' | 'timestamp' | 'status' | 'priorityScore' | 'meshHops' | 'meshRelayPath'>) => void;
  lastDispatchedSOS: SOSRequest | null;
  onStartPinningLocation: () => void;
  isPinningLocation: boolean;
  onSelectShelterForRoute: (shelterId: string) => void;
}

export const CivilianDashboard: React.FC<CivilianDashboardProps> = ({
  userLocation,
  shelters,
  hazards,
  safeRoute,
  onDispatchSOS,
  lastDispatchedSOS,
  onStartPinningLocation,
  isPinningLocation,
  onSelectShelterForRoute
}) => {
  // SOS Form State
  const [senderName, setSenderName] = useState('Anand & Neighbors (Flat 302)');
  const [addressDesc, setAddressDesc] = useState('Near St. Theresa School, Water Tank Road');
  const [severity, setSeverity] = useState<TriageSeverity>(3);
  const [trappedCount, setTrappedCount] = useState<number>(3);
  const [vulnerabilities, setVulnerabilities] = useState<string[]>(['elderly', 'infants']);
  const [waterDepthCm, setWaterDepthCm] = useState<number>(110);
  const [notes, setNotes] = useState('Ground floor submerged, electricity cut. Water rising approximately 10cm/hr.');
  const [batteryLevel, setBatteryLevel] = useState<number>(24);

  // Survival Wiki Modal
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [survivalGuides, setSurvivalGuides] = useState<SurvivalGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('cpr');

  // Beacon UI states
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isVisualActive, setIsVisualActive] = useState(false);

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
        console.warn('Failed to load survival guides locally:', err);
      });
  }, []);

  // Update battery level if Battery API is supported
  useEffect(() => {
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  }, []);

  const toggleVulnerability = (vKey: string) => {
    if (vulnerabilities.includes(vKey)) {
      setVulnerabilities(vulnerabilities.filter(k => k !== vKey));
    } else {
      setVulnerabilities([...vulnerabilities, vKey]);
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-1">
      {/* Active Broadcast Alert Card if SOS already dispatched */}
      {lastDispatchedSOS && (
        <div className="bg-gradient-to-r from-red-950/90 to-slate-900 border-2 border-red-500 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-red-500/30 pb-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-mono font-bold text-xs text-red-300 uppercase tracking-wider">
                SOS TRANSMITTED VIA STORE-&-FORWARD MESH
              </span>
            </div>
            <span className="text-[10px] font-mono bg-red-900 text-red-200 px-2 py-0.5 rounded">
              ID: {lastDispatchedSOS.id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-2">
            <div>Status: <b className="text-amber-400">{lastDispatchedSOS.status}</b></div>
            <div>Triage Score: <b className="text-red-400">{lastDispatchedSOS.priorityScore}</b></div>
            <div>Mesh Hops: <b className="text-cyan-400">{lastDispatchedSOS.meshHops} Relays</b></div>
            <div>Assigned: <b className="text-white">{lastDispatchedSOS.assignedTeam || 'Triage Queue'}</b></div>
          </div>

          <div className="text-[11px] font-mono text-slate-300 bg-black/40 p-2 rounded border border-red-900/50">
            <span className="text-slate-400">Mesh Propagation Path: </span>
            {lastDispatchedSOS.meshRelayPath.join(' ➔ ')}
          </div>
        </div>
      )}

      {/* Quick Action Bar: Beacons & Survival Wiki */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Acoustic Beacon Siren */}
        <button
          onClick={() => {
            const next = beaconService.toggleAudioBeacon();
            setIsAudioActive(next);
          }}
          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            isAudioActive
              ? 'bg-red-950 border-red-500 text-red-200 ring-2 ring-red-500 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAudioActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-400'}`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold uppercase">Acoustic Siren</div>
              <div className="text-[10px] text-slate-400">{isAudioActive ? 'PULSING DISTRESS' : 'Audible under rubble'}</div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-red-400">{isAudioActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Visual Flashlight Strobe */}
        <button
          onClick={async () => {
            const next = await beaconService.toggleVisualBeacon();
            setIsVisualActive(next);
          }}
          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            isVisualActive
              ? 'bg-amber-950 border-amber-500 text-amber-200 ring-2 ring-amber-500 animate-bounce'
              : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isVisualActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
              <Flashlight className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold uppercase">SOS Strobe Light</div>
              <div className="text-[10px] text-slate-400">{isVisualActive ? 'MORSE CADENCE' : 'Night visual beacon'}</div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">{isVisualActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Offline Survival Wiki Button */}
        <button
          onClick={() => setIsWikiOpen(true)}
          className="p-3.5 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 flex items-center justify-between transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold uppercase">Survival First Aid</div>
              <div className="text-[10px] text-slate-400">100% Offline Guidebook</div>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">6 GUIDES</span>
        </button>
      </div>

      {/* Main Grid: Structured SOS Broadcast & Safe Evacuation Path */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Structured SOS Broadcast Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold uppercase text-white tracking-wider">
                Structured SOS Broadcast
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${previewBadge.badgeBg}`}>
                SCORE: {currentPreviewScore}
              </span>
            </div>
          </div>

          <form onSubmit={handleDispatch} className="space-y-4 text-xs">
            {/* GPS & Pinpoint Coordinates */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Disaster Location Coordinates</span>
                </span>
                <button
                  type="button"
                  onClick={onStartPinningLocation}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                    isPinningLocation
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{isPinningLocation ? 'SELECT ON MAP...' : 'PIN ON MAP'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <span>LAT: <b className="text-white">{userLocation.lat.toFixed(4)}°N</b></span>
                <span>•</span>
                <span>LNG: <b className="text-white">{userLocation.lng.toFixed(4)}°E</b></span>
                <span className="text-emerald-400 text-[10px] ml-auto">✓ Offline Sensor Fix</span>
              </div>
              <input
                type="text"
                value={addressDesc}
                onChange={e => setAddressDesc(e.target.value)}
                placeholder="Landmark / Floor / Street description"
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
              />
            </div>

            {/* Severity Level (1 - 4) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Triage Urgency Tier (Severity)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: 1, label: '1 - Minor', desc: 'No urgent trauma', color: 'border-emerald-500 text-emerald-400' },
                  { level: 2, label: '2 - Moderate', desc: 'Water rising, stable', color: 'border-yellow-500 text-yellow-400' },
                  { level: 3, label: '3 - Severe', desc: 'Trapped / injured', color: 'border-amber-500 text-amber-400' },
                  { level: 4, label: '4 - Critical', desc: 'Immediate drowning/shock', color: 'border-red-500 text-red-400' }
                ].map(item => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSeverity(item.level as TriageSeverity)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      severity === item.level
                        ? `bg-slate-800 ${item.color} font-bold ring-2 ring-current`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px]">{item.label}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trapped Count & Vulnerabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Trapped Headcount
                </label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <Users className="w-4 h-4 text-amber-400" />
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={trappedCount}
                    onChange={e => setTrappedCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-white font-mono text-sm outline-none"
                  />
                  <span className="text-[11px] text-slate-500">people</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Flood Water Depth: <b className="text-cyan-400 font-mono">{waterDepthCm} cm</b>
                </label>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={250}
                    step={10}
                    value={waterDepthCm}
                    onChange={e => setWaterDepthCm(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Vulnerable Demographics Flags */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-red-400" />
                <span>Vulnerable Demographics Present</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'infants', label: 'Infant / Child (<5)' },
                  { id: 'elderly', label: 'Elderly (>65)' },
                  { id: 'pregnant', label: 'Pregnant' },
                  { id: 'bleeding', label: 'Active Bleeding' },
                  { id: 'unconscious', label: 'Unconscious / Shock' },
                  { id: 'chronic_illness', label: 'Oxygen / Insulin Dependent' }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVulnerability(v.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                      vulnerabilities.includes(v.id)
                        ? 'bg-red-950 border-red-500 text-red-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {vulnerabilities.includes(v.id) ? '✓ ' : '+ '}
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes / Special Circumstances */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Situation Notes / Rescue Access Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special details (e.g. 2nd floor balcony, collapsed staircase, power lines down)..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
              />
            </div>

            {/* Broadcast Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.98] text-white font-black py-3 rounded-xl text-sm font-mono tracking-wider shadow-xl shadow-red-950/60 flex items-center justify-center space-x-2 border border-red-400/30 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>TRANSMIT SOS OVER STORE-&-FORWARD MESH</span>
            </button>
          </form>
        </div>

        {/* Right Column (5 cols): Safe Evacuation Navigation Path */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase text-white tracking-wider">
                  Safe Evacuation Navigation
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                OFFLINE EDGE ROUTER
              </span>
            </div>

            {safeRoute ? (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/60">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Nearest Safe Refuge:</span>
                    <span className="text-[10px] font-mono text-emerald-400">Elevation: {safeRoute.destinationShelter.elevationMeters}m</span>
                  </div>
                  <div className="font-bold text-sm text-white mb-2">
                    {safeRoute.destinationShelter.name}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-slate-400 text-[10px]">ROUTE DISTANCE</div>
                      <div className="text-emerald-400 font-bold text-base">{safeRoute.distanceKm} km</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">EST. WADING/WALK</div>
                      <div className="text-amber-400 font-bold text-base">~{safeRoute.estimatedWalkingMins} mins</div>
                    </div>
                  </div>
                </div>

                {/* Hazards Avoided Checklist */}
                <div>
                  <div className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Hazard Corridors Bypassed:</span>
                    <span className="text-[10px] font-mono text-emerald-400">{safeRoute.hazardsAvoided.length} Cleared</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {safeRoute.hazardsAvoided.length > 0 ? (
                      safeRoute.hazardsAvoided.map((h, i) => (
                        <div key={i} className="text-[11px] font-mono bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 text-slate-300 flex items-center space-x-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">Detour around: {h}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-500 italic p-2 bg-slate-950 rounded">
                        Direct path clear of major flood polygons.
                      </div>
                    )}
                  </div>
                </div>

                {/* Switch Shelter Selector */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Change Target Evacuation Destination:
                  </label>
                  <select
                    value={safeRoute.destinationShelter.id}
                    onChange={e => onSelectShelterForRoute(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 outline-none"
                  >
                    {shelters.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.currentOccupancy}/{s.capacity} occupied • Elev {s.elevationMeters}m)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Calculating safe route to high-ground shelters...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offline Survival Wiki Modal */}
      {isWikiOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                  Offline Survival Wiki & First Aid
                </h3>
              </div>
              <button
                onClick={() => setIsWikiOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
              >
                Close (ESC)
              </button>
            </div>

            {/* Guide Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-800 p-2 gap-1.5 bg-slate-950">
              {survivalGuides.map(guide => (
                <button
                  key={guide.id}
                  onClick={() => setSelectedGuideId(guide.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGuideId === guide.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {guide.title}
                </button>
              ))}
            </div>

            {/* Guide Content View */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const guide = survivalGuides.find(g => g.id === selectedGuideId) || survivalGuides[0];
                if (!guide) return <div className="text-slate-400">Loading guide...</div>;

                return (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded uppercase">
                        {guide.urgency} PROCEDURE
                      </span>
                      <span className="text-xs text-slate-400">{guide.category}</span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2">{guide.title}</h4>
                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                      {guide.summary}
                    </p>

                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      Step-by-Step Action:
                    </h5>
                    <ol className="space-y-2 mb-4">
                      {guide.steps.map((step, idx) => (
                        <li key={idx} className="text-xs text-slate-200 flex items-start space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>

                    {guide.proTips && guide.proTips.length > 0 && (
                      <div className="bg-amber-950/40 border border-amber-900/60 p-3 rounded-xl">
                        <div className="text-[11px] font-bold text-amber-300 uppercase mb-1">
                          Critical Field Note:
                        </div>
                        <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-1">
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
          </div>
        </div>
      )}
    </div>
  );
};
