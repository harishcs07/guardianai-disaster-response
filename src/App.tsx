import React, { useState, useEffect, useCallback } from 'react';
import {
  Hazard,
  MeshNode,
  MeshPacket,
  Role,
  SafeRoute,
  Shelter,
  SOSRequest,
  VictimStatus,
  WalkieMessage,
  WeatherCondition
} from './types/disaster';

import {
  INITIAL_HAZARDS,
  INITIAL_MESH_NODES,
  INITIAL_SHELTERS,
  INITIAL_VICTIMS,
  INITIAL_WEATHER
} from './data/seedData';

import { calculateSafeRoute } from './services/routingService';
import { calculatePriorityScore } from './services/triageEngine';
import { meshEngine } from './services/meshService';
import { beaconService } from './services/beaconService';

import { AuthModal } from './components/common/AuthModal';
import { CivilianMobileApp } from './components/civilian/CivilianMobileApp';
import { RescueMobileApp } from './components/rescue/RescueMobileApp';
import { ControlDashboard } from './components/control/ControlDashboard';
import { DisasterMap } from './components/map/DisasterMap';

import {
  Smartphone,
  Monitor,
  ShieldAlert,
  WifiOff,
  BatteryMedium,
  Signal,
  Users,
  Flame,
  Building2
} from 'lucide-react';

export default function App() {
  // ============================================================
  // AUTHENTICATION / ENTRY STATE
  // ============================================================

  // Keep the role type unchanged so the rest of the application
  // does not need unnecessary type changes.
  const [currentRole, setCurrentRole] = useState<Role>('CIVILIAN');

  // IMPORTANT:
  // The application starts unauthenticated.
  // This prevents the civilian dashboard from appearing first.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentication modal is open by default.
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);

  // ============================================================
  // DISPLAY MODE
  // ============================================================

  const [displayMode, setDisplayMode] =
    useState<'MOBILE' | 'DESKTOP'>('MOBILE');

  // ============================================================
  // CORE DATASETS
  // ============================================================

  const [weather, setWeather] =
    useState<WeatherCondition>(INITIAL_WEATHER);

  const [shelters, setShelters] =
    useState<Shelter[]>(INITIAL_SHELTERS);

  const [hazards, setHazards] =
    useState<Hazard[]>(INITIAL_HAZARDS);

  const [victims, setVictims] =
    useState<SOSRequest[]>(INITIAL_VICTIMS);

  const [meshNodes, setMeshNodes] =
    useState<MeshNode[]>(INITIAL_MESH_NODES);

  const [walkieMessages, setWalkieMessages] =
    useState<WalkieMessage[]>([]);

  const [meshPackets, setMeshPackets] =
    useState<MeshPacket[]>([]);

  // ============================================================
  // USER LOCATION
  // ============================================================

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: 13.0575,
    lng: 80.2420
  });

  // ============================================================
  // SELECTION / UI STATE
  // ============================================================

  const [selectedVictimId, setSelectedVictimId] =
    useState<string | null>(null);

  const [lastDispatchedSOS, setLastDispatchedSOS] =
    useState<SOSRequest | null>(null);

  const [safeRoute, setSafeRoute] =
    useState<SafeRoute | null>(null);

  const [selectedShelterId, setSelectedShelterId] =
    useState<string | undefined>(undefined);

  const [isPinningLocation, setIsPinningLocation] =
    useState(false);

  // ============================================================
  // STROBE SCREEN FLASH STATE
  // ============================================================

  const [strobeScreen, setStrobeScreen] = useState(false);
  const [strobeColor, setStrobeColor] = useState('#ffffff');

  // ============================================================
  // DEVICE TELEMETRY
  // ============================================================

  const [batteryLevel, setBatteryLevel] = useState<number>(84);
  const [outboxCount, setOutboxCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  // ============================================================
  // CLOCK
  // ============================================================

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const hours = now
        .getHours()
        .toString()
        .padStart(2, '0');

      const minutes = now
        .getMinutes()
        .toString()
        .padStart(2, '0');

      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();

    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // BEACON STROBE LISTENER
  // ============================================================

  useEffect(() => {
    const unsub = beaconService.subscribeStrobe(
      (active, color) => {
        setStrobeScreen(active);
        setStrobeColor(color);
      }
    );

    return () => unsub();
  }, []);

  // ============================================================
  // FETCH STATE WITH OFFLINE RESILIENCE
  // ============================================================

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');

      if (res.ok) {
        const data = await res.json();

        if (data.weather) {
          setWeather(data.weather);
        }

        if (data.shelters) {
          setShelters(data.shelters);
        }

        if (data.hazards) {
          setHazards(data.hazards);
        }

        if (data.victims) {
          setVictims(data.victims);
        }

        if (data.meshNodes) {
          setMeshNodes(data.meshNodes);
        }

        if (data.walkieMessages) {
          setWalkieMessages(data.walkieMessages);
        }

        if (data.meshPackets) {
          setMeshPackets(data.meshPackets);
        }
      }
    } catch {
      // Standalone client offline fallback
      setMeshPackets(meshEngine.getPackets());
    }
  }, []);

  useEffect(() => {
    refreshState();

    const interval = setInterval(
      refreshState,
      3500
    );

    return () => clearInterval(interval);
  }, [refreshState]);

  // ============================================================
  // SAFE EVACUATION ROUTE
  // ============================================================

  useEffect(() => {
    const route = calculateSafeRoute(
      userLocation.lat,
      userLocation.lng,
      shelters,
      hazards,
      selectedShelterId
    );

    setSafeRoute(route);
  }, [
    userLocation,
    shelters,
    hazards,
    selectedShelterId
  ]);

  // ============================================================
  // MESH PROTOCOL
  // ============================================================

  useEffect(() => {
    const unsub = meshEngine.subscribe(packet => {
      setOutboxCount(meshEngine.getOutboxCount());

      setMeshPackets(prev => {
        const exists = prev.find(
          p => p.id === packet.id
        );

        if (exists) {
          return prev.map(p =>
            p.id === packet.id
              ? packet
              : p
          );
        }

        return [packet, ...prev];
      });

      // Receive SOS through mesh
      if (
        packet.type === 'SOS_BROADCAST' &&
        packet.payload
      ) {
        setVictims(prev => {
          if (
            !prev.find(
              v => v.id === packet.payload.id
            )
          ) {
            return [
              packet.payload,
              ...prev
            ];
          }

          return prev;
        });
      }

      // Receive hazard through mesh
      if (
        packet.type === 'HAZARD_ALERT' &&
        packet.payload
      ) {
        setHazards(prev => {
          if (
            !prev.find(
              h => h.id === packet.payload.id
            )
          ) {
            return [
              packet.payload,
              ...prev
            ];
          }

          return prev;
        });
      }
    });

    return () => unsub();
  }, []);

  // ============================================================
  // SOS DISPATCH HANDLER
  // ============================================================

  const handleDispatchSOS = async (
    sosData: Omit<
      SOSRequest,
      | 'id'
      | 'timestamp'
      | 'status'
      | 'priorityScore'
      | 'meshHops'
      | 'meshRelayPath'
    >
  ) => {
    const priorityScore =
      calculatePriorityScore(
        sosData,
        {
          lat: 13.0600,
          lng: 80.2400
        }
      );

    const localId =
      'SOS-' +
      Math.floor(
        1000 +
        Math.random() * 9000
      );

    const newSOS: SOSRequest = {
      ...sosData,

      id: localId,

      timestamp:
        new Date().toISOString(),

      status: 'PENDING',

      assignedTeam: null,

      priorityScore,

      meshHops: 2,

      meshRelayPath: [
        'Civilian-Phone-' + localId,
        'SkyGuard-Drone-Relay',
        'District-EOC-Base'
      ]
    };

    setLastDispatchedSOS(newSOS);

    setVictims(prev => [
      newSOS,
      ...prev
    ]);

    meshEngine.broadcastPacket(
      'SOS_BROADCAST',
      newSOS,
      'Civilian-Phone-' + localId
    );

    try {
      await fetch('/api/sos', {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify(sosData)
      });

      refreshState();
    } catch {
      // Handled in mesh outbox
    }
  };

  // ============================================================
  // VICTIM STATUS UPDATE
  // ============================================================

  const handleUpdateVictimStatus = async (
    id: string,
    status: VictimStatus,
    teamName: string =
      'NDRF UNIT ALPHA'
  ) => {
    setVictims(prev =>
      prev.map(v =>
        v.id === id
          ? {
              ...v,
              status,
              assignedTeam: teamName
            }
          : v
      )
    );

    meshEngine.broadcastPacket(
      'STATUS_UPDATE',
      {
        victimId: id,
        status,
        teamName
      },
      teamName
    );

    try {
      await fetch(
        `/api/victim/${id}/status`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            status,
            assignedTeam: teamName
          })
        }
      );

      refreshState();
    } catch {
      // Offline fallback
    }
  };

  // ============================================================
  // HAZARD HANDLER
  // ============================================================

  const handleDropHazard = async (
    hazardData: Omit<
      Hazard,
      'id' | 'timestamp' | 'active'
    >
  ) => {
    const localId =
      'haz-' +
      Math.floor(
        100 +
        Math.random() * 900
      );

    const newHazard: Hazard = {
      ...hazardData,

      id: localId,

      timestamp:
        new Date().toISOString(),

      active: true
    };

    setHazards(prev => [
      newHazard,
      ...prev
    ]);

    meshEngine.broadcastPacket(
      'HAZARD_ALERT',
      newHazard,
      hazardData.reportedBy
    );

    try {
      await fetch('/api/hazard', {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify(hazardData)
      });

      refreshState();
    } catch {
      // Offline fallback
    }
  };

  // ============================================================
  // SHELTER UPDATE
  // ============================================================

  const handleUpdateShelter = async (
    shelterId: string,
    updates: Partial<Shelter>
  ) => {
    setShelters(prev =>
      prev.map(s =>
        s.id === shelterId
          ? {
              ...s,
              ...updates
            }
          : s
      )
    );

    try {
      await fetch(
        `/api/shelter/${shelterId}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify(updates)
        }
      );

      refreshState();
    } catch {
      // Offline fallback
    }
  };

  // ============================================================
  // WALKIE MESSAGE
  // ============================================================

  const handleSendWalkieMessage =
    async (
      msgData: Omit<
        WalkieMessage,
        'id' | 'timestamp'
      >
    ) => {
      const localId =
        'MSG-' +
        Math.floor(
          100 +
          Math.random() * 900
        );

      const newMsg: WalkieMessage = {
        ...msgData,

        id: localId,

        timestamp:
          new Date().toISOString()
      };

      setWalkieMessages(prev => [
        ...prev,
        newMsg
      ]);

      meshEngine.broadcastPacket(
        'WALKIE_MSG',
        newMsg,
        msgData.senderCallsign
      );

      try {
        await fetch('/api/walkie', {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify(msgData)
        });
      } catch {
        // Offline fallback
      }
    };

  // ============================================================
  // LOCATION PINNING
  // ============================================================

  const handlePinLocationSelected = (
    lat: number,
    lng: number
  ) => {
    setUserLocation({
      lat,
      lng
    });

    setIsPinningLocation(false);
  };

  // ============================================================
  // LOGIN / ROLE SELECTION
  // ============================================================

  const handleRoleSelection = (
    role: Role
  ) => {
    // Set selected role
    setCurrentRole(role);

    // Authentication successful
    setIsAuthenticated(true);

    // Close login portal
    setIsAuthModalOpen(false);

    // Command room automatically opens
    // in desktop mode.
    if (role === 'CONTROL') {
      setDisplayMode('DESKTOP');
    } else {
      setDisplayMode('MOBILE');
    }
  };

  // ============================================================
  // MANDATORY GUARDIANAI ENTRY SCREEN
  // ============================================================
  //
  // IMPORTANT:
  // Until a role is selected, NONE of the actual
  // application dashboards are rendered.
  //
  // This fixes the previous problem where the
  // CIVILIAN dashboard appeared immediately.
  // ============================================================

  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen bg-[#060913] text-slate-100 flex items-center justify-center overflow-hidden font-sans">
        <AuthModal
          isOpen={true}
          currentRole="CIVILIAN"
          onSelectRole={handleRoleSelection}
        />
      </div>
    );
  }

  // ============================================================
  // AUTHENTICATED APPLICATION
  // ============================================================

  return (
    <div className="w-screen h-screen bg-[#060913] text-slate-100 flex flex-col items-center justify-between overflow-hidden select-none font-sans">

      {/* ======================================================
          FULLSCREEN STROBE FLASH EFFECT
          ====================================================== */}

      {strobeScreen && (
        <div
          className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-75"
          style={{
            backgroundColor: strobeColor,
            opacity: 0.9
          }}
        />
      )}

      {/* ======================================================
          TOP UNIVERSAL ECOSYSTEM CONTROL BAR
          ====================================================== */}

      <header className="w-full bg-[#0a0f1d] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between text-xs z-30 flex-shrink-0">

        {/* GuardianAI Branding */}

        <div className="flex items-center space-x-2.5">

          <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>

          <div>

            <div className="flex items-center space-x-1.5">

              <span className="font-black tracking-wider text-white">
                GUARDIAN
                <span className="text-amber-500">
                  AI
                </span>
              </span>

              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-800">
                100% OFFLINE MESH
              </span>

            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">

              <WifiOff className="w-2.5 h-2.5 text-amber-500" />

              <span>
                ZERO-NETWORK SIMULATION
              </span>

            </div>

          </div>

        </div>

        {/* ==================================================
            VIEWPORT SWITCHER + ROLE SWITCHER
            ================================================== */}

        <div className="flex items-center space-x-2">

          {/* Mobile / Desktop Switch */}

          <div className="flex bg-[#060913] p-0.5 rounded-xl border border-[#1e293b]">

            <button
              onClick={() =>
                setDisplayMode('MOBILE')
              }
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1 transition-all ${
                displayMode === 'MOBILE'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile Native Viewport"
            >

              <Smartphone className="w-3 h-3" />

              <span className="hidden sm:inline">
                MOBILE APP
              </span>

            </button>

            <button
              onClick={() =>
                setDisplayMode('DESKTOP')
              }
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1 transition-all ${
                displayMode === 'DESKTOP'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop Command Room (EOC)"
            >

              <Monitor className="w-3 h-3" />

              <span className="hidden sm:inline">
                DESKTOP EOC
              </span>

            </button>

          </div>

          {/* Role Switcher */}

          <button
            onClick={() =>
              setIsAuthModalOpen(true)
            }
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl text-xs transition-all font-mono"
            title="Switch User Role"
          >

            {currentRole === 'CIVILIAN' && (
              <>
                <Users className="w-3.5 h-3.5 text-blue-400" />

                <span className="text-blue-300 text-[11px] font-bold">
                  CIVILIAN
                </span>
              </>
            )}

            {currentRole === 'RESCUE' && (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-400" />

                <span className="text-amber-300 text-[11px] font-bold">
                  NDRF TEAM
                </span>
              </>
            )}

            {currentRole === 'CONTROL' && (
              <>
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />

                <span className="text-emerald-300 text-[11px] font-bold">
                  EOC COMMAND
                </span>
              </>
            )}

            <span className="text-[9px] text-slate-500 underline ml-0.5">
              CHANGE
            </span>

          </button>

        </div>

      </header>

      {/* ======================================================
          MAIN APPLICATION AREA
          ====================================================== */}

      <div className="flex-1 w-full min-h-0 flex items-center justify-center p-0 sm:p-3 overflow-hidden">

        {/* ====================================================
            MOBILE VIEW
            ==================================================== */}

        {displayMode === 'MOBILE' ? (

          <div className="w-full h-full sm:h-[844px] sm:max-h-[96vh] sm:max-w-[412px] bg-slate-950 sm:border sm:border-slate-800 sm:rounded-[42px] sm:ring-8 sm:ring-slate-900/60 shadow-2xl flex flex-col overflow-hidden relative">

            {/* Mobile Status Bar */}

            <div className="h-10 bg-slate-950 px-6 flex items-center justify-between text-xs font-mono text-slate-300 select-none z-30 flex-shrink-0 pt-1">

              <span className="font-bold text-xs">
                {currentTime}
              </span>

              <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-800/80 flex items-center justify-center">

                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>

              </div>

              <div className="flex items-center space-x-1.5 text-[11px]">

                <span className="text-[10px] text-cyan-400 font-bold">
                  BLE
                </span>

                <Signal className="w-3 h-3 text-emerald-400" />

                <div className="flex items-center space-x-0.5">

                  <BatteryMedium
                    className={`w-3.5 h-3.5 ${
                      batteryLevel < 20
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  />

                  <span className="text-[10px]">
                    {batteryLevel}%
                  </span>

                </div>

              </div>

            </div>

            {/* Mobile Body */}

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

              {/* ==================================================
                  CIVILIAN APP
                  ================================================== */}

              {currentRole === 'CIVILIAN' && (
                <CivilianMobileApp
                  userLocation={userLocation}
                  shelters={shelters}
                  hazards={hazards}
                  victims={victims}
                  meshNodes={meshNodes}
                  meshPackets={meshPackets}
                  weather={weather}
                  safeRoute={safeRoute}
                  onDispatchSOS={handleDispatchSOS}
                  lastDispatchedSOS={
                    lastDispatchedSOS
                  }
                  onStartPinningLocation={() =>
                    setIsPinningLocation(true)
                  }
                  isPinningLocation={
                    isPinningLocation
                  }
                  onPinLocationSelected={
                    handlePinLocationSelected
                  }
                  onSelectShelterForRoute={id =>
                    setSelectedShelterId(id)
                  }
                  batteryLevel={
                    batteryLevel
                  }
                  outboxCount={
                    outboxCount
                  }
                />
              )}

              {/* ==================================================
                  RESCUE APP
                  ================================================== */}

              {currentRole === 'RESCUE' && (
                <RescueMobileApp
                  victims={victims}
                  hazards={hazards}
                  walkieMessages={
                    walkieMessages
                  }
                  meshNodes={meshNodes}
                  weather={weather}
                  selectedVictimId={
                    selectedVictimId
                  }
                  onSelectVictim={
                    setSelectedVictimId
                  }
                  onUpdateVictimStatus={
                    handleUpdateVictimStatus
                  }
                  onDropHazardPin={
                    handleDropHazard
                  }
                  onSendWalkieMessage={
                    handleSendWalkieMessage
                  }
                  userLocation={
                    userLocation
                  }
                />
              )}

              {/* ==================================================
                  CONTROL MOBILE VIEW
                  ================================================== */}

              {currentRole === 'CONTROL' && (
                <div className="flex-1 flex flex-col p-3 overflow-y-auto">

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center mb-3">

                    <Building2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />

                    <h3 className="font-bold text-white text-sm">
                      CONTROL ROOM MOBILE CONSOLE
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      For full multi-sector situational matrices and shelter logistics, switch to Desktop View above.
                    </p>

                    <button
                      onClick={() =>
                        setDisplayMode(
                          'DESKTOP'
                        )
                      }
                      className="mt-3 bg-emerald-600 hover:bg-emerald-500 font-mono font-bold text-xs text-slate-950 px-4 py-2 rounded-xl"
                    >
                      EXPAND TO FULL DESKTOP VIEW
                    </button>

                  </div>

                  <div className="flex-1 min-h-0">

                    <ControlDashboard
                      victims={victims}
                      shelters={shelters}
                      hazards={hazards}
                      meshNodes={meshNodes}
                      meshPackets={
                        meshPackets
                      }
                      onBroadcastHazardZone={
                        handleDropHazard
                      }
                      onUpdateShelter={
                        handleUpdateShelter
                      }
                    />

                  </div>

                </div>
              )}

            </div>

            {/* Mobile Home Bar */}

            <div className="h-4 bg-slate-950 flex items-center justify-center flex-shrink-0">

              <div className="w-28 h-1 bg-slate-700/60 rounded-full"></div>

            </div>

          </div>

        ) : (

          /* ====================================================
             DESKTOP COMMAND CENTER
             ==================================================== */

          <div className="w-full h-full flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">

            {/* ==================================================
                LEFT: TACTICAL MAP
                ================================================== */}

            <div className="w-full lg:w-5/12 h-[45%] lg:h-full border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">

              <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">

                <span className="font-bold text-slate-200">
                  TACTICAL GEOSPATIAL MAP ENGINE
                </span>

                <span className="text-[10px] text-cyan-400">
                  SECTOR GRID DELTA
                </span>

              </div>

              <div className="flex-1 relative">

                <DisasterMap
                  currentRole={
                    currentRole
                  }
                  shelters={shelters}
                  hazards={hazards}
                  victims={victims}
                  meshNodes={
                    meshNodes
                  }
                  selectedVictimId={
                    selectedVictimId
                  }
                  onSelectVictim={
                    setSelectedVictimId
                  }
                  safeRoute={
                    safeRoute
                  }
                  userLocation={
                    userLocation
                  }
                  weather={weather}
                  isPinningLocation={
                    isPinningLocation
                  }
                  onPinLocationSelected={
                    handlePinLocationSelected
                  }
                  heightClass="h-full"
                />

              </div>

            </div>

            {/* ==================================================
                RIGHT: OPERATIONS CONSOLE
                ================================================== */}

            <div className="w-full lg:w-7/12 h-[55%] lg:h-full border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-slate-900/50 p-2">

              <ControlDashboard
                victims={victims}
                shelters={shelters}
                hazards={hazards}
                meshNodes={
                  meshNodes
                }
                meshPackets={
                  meshPackets
                }
                onBroadcastHazardZone={
                  handleDropHazard
                }
                onUpdateShelter={
                  handleUpdateShelter
                }
              />

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          ROLE SWITCHER AUTH MODAL
          ====================================================== */}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() =>
          setIsAuthModalOpen(false)
        }
        currentRole={currentRole}
        onSelectRole={
          handleRoleSelection
        }
      />

    </div>
  );
}