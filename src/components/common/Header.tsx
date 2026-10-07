import React, { useState, useEffect } from 'react';
import { Role } from '../../types/disaster';
import { 
  ShieldAlert, 
  Radio, 
  BatteryMedium, 
  WifiOff, 
  Users, 
  Flame, 
  Building2, 
  Volume2, 
  VolumeX, 
  Flashlight,
  Cpu,
  Layers
} from 'lucide-react';
import { beaconService } from '../../services/beaconService';

interface HeaderProps {
  currentRole: Role;
  onSwitchRoleClick: () => void;
  outboxCount: number;
  batteryLevel: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSwitchRoleClick,
  outboxCount,
  batteryLevel
}) => {
  const [isAudioBeaconOn, setIsAudioBeaconOn] = useState(false);
  const [isVisualBeaconOn, setIsVisualBeaconOn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const nextState = beaconService.toggleAudioBeacon();
    setIsAudioBeaconOn(nextState);
  };

  const handleToggleVisual = async () => {
    const nextState = await beaconService.toggleVisualBeacon();
    setIsVisualBeaconOn(nextState);
  };

  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg select-none">
      {/* Brand & System Status */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 shadow-inner">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-black tracking-widest text-slate-100 uppercase">
              GUARDIAN<span className="text-amber-500">AI</span>
            </h1>
            <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-800">
              v3.2 OFFLINE-FIRST
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-400 mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>STORE-&-FORWARD MESH ACTIVE</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-amber-500" /> ZERO-NETWORK AUTONOMY
            </span>
          </div>
        </div>
      </div>

      {/* Center Tactical Actions & Beacons */}
      <div className="flex items-center space-x-2">
        {/* Acoustic Beacon Button */}
        <button
          onClick={handleToggleAudio}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-1.5 border transition-all ${
            isAudioBeaconOn
              ? 'bg-red-600 text-white border-red-400 animate-pulse ring-2 ring-red-500/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle Acoustic Homing Beacon Siren"
        >
          {isAudioBeaconOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{isAudioBeaconOn ? 'SIREN ACTIVE' : 'SIREN BEACON'}</span>
        </button>

        {/* Visual Flashlight Strobe */}
        <button
          onClick={handleToggleVisual}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-1.5 border transition-all ${
            isVisualBeaconOn
              ? 'bg-amber-500 text-slate-950 border-amber-300 animate-bounce ring-2 ring-amber-400/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle High-Cadence SOS Strobe"
        >
          <Flashlight className="w-3.5 h-3.5" />
          <span>{isVisualBeaconOn ? 'STROBE ACTIVE' : 'SOS STROBE'}</span>
        </button>
      </div>

      {/* Right Controls: Role Badge, Outbox & Telemetry */}
      <div className="flex items-center space-x-3">
        {/* Device Telemetry */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center space-x-1">
            <BatteryMedium className={`w-3.5 h-3.5 ${batteryLevel <= 20 ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className={batteryLevel <= 20 ? 'text-red-400 font-bold' : ''}>{batteryLevel}%</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1 text-cyan-400">
            <Radio className="w-3 h-3" />
            <span>OUTBOX: {outboxCount}</span>
          </div>
          <span>•</span>
          <span>{currentTime}</span>
        </div>

        {/* Current Role Indicator & Switcher Button */}
        <button
          onClick={onSwitchRoleClick}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
          title="Switch Operating Portal Role"
        >
          {currentRole === 'CIVILIAN' && (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300">CIVILIAN VIEW</span>
            </>
          )}
          {currentRole === 'RESCUE' && (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300">NDRF RESCUE TEAM</span>
            </>
          )}
          {currentRole === 'CONTROL' && (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">COMMAND EOC</span>
            </>
          )}
          <span className="text-[10px] text-slate-400 ml-1 underline decoration-dotted">SWITCH</span>
        </button>
      </div>
    </header>
  );
};
