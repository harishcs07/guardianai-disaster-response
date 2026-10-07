import React, { useState } from 'react';
import { MeshNode, MeshPacket, SOSRequest } from '../../types/disaster';
import { 
  Radio, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  Share2, 
  ArrowUpRight, 
  Layers, 
  RefreshCw, 
  ShieldAlert, 
  Send,
  Cpu
} from 'lucide-react';
import { meshEngine } from '../../services/meshService';

interface CivilianMeshScreenProps {
  lastDispatchedSOS: SOSRequest | null;
  meshNodes: MeshNode[];
  meshPackets: MeshPacket[];
  outboxCount: number;
}

export const CivilianMeshScreen: React.FC<CivilianMeshScreenProps> = ({
  lastDispatchedSOS,
  meshNodes,
  meshPackets,
  outboxCount
}) => {
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);

  const handleManualSync = () => {
    setIsSimulatingSync(true);
    meshEngine.flushOutbox();
    setTimeout(() => {
      setIsSimulatingSync(false);
    }, 1200);
  };

  // Determine SOS lifecycle stage
  const getSOSLifecycle = () => {
    if (!lastDispatchedSOS) {
      return { stage: 0, label: 'STANDBY (NO SOS BROADCAST ACTIVE)' };
    }
    if (lastDispatchedSOS.status === 'RESCUED' || lastDispatchedSOS.status === 'TRANSFERRED') {
      return { stage: 4, label: 'RESCUE COMPLETE' };
    }
    if (lastDispatchedSOS.status === 'EN_ROUTE') {
      return { stage: 3, label: 'ACKNOWLEDGED & RESCUE UNIT EN-ROUTE' };
    }
    if (lastDispatchedSOS.meshHops > 1) {
      return { stage: 2, label: 'RELAYED THROUGH MULTI-HOP MESH' };
    }
    return { stage: 1, label: 'QUEUED ON LOCAL BLE BEACON' };
  };

  const lifecycle = getSOSLifecycle();

  return (
    <div className="w-full h-full flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Mesh Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">STORE-&-FORWARD MESH PROTOCOL</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            ZERO INTERNET REQUIRED
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
          Emulates opportunistic Bluetooth Low Energy (BLE 5.2) and Wi-Fi Direct peer-to-peer ad-hoc hops. Packets travel node-to-node across neighbor devices, airborne drone relays, and emergency rovers until reaching the Command Center.
        </p>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-500">OUTBOX QUEUE</div>
            <div className="font-bold text-amber-400 text-sm">{outboxCount} pkts</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">DETECTED PEERS</div>
            <div className="font-bold text-cyan-400 text-sm">{meshNodes.length} nodes</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">AIRBORNE RELAYS</div>
            <div className="font-bold text-emerald-400 text-sm">1 Active</div>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSimulatingSync}
          className="w-full mt-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-mono text-xs py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSimulatingSync ? 'animate-spin' : ''}`} />
          <span>{isSimulatingSync ? 'PROBING NEARBY BLE BEACONS...' : 'FORCE MESH PROBE & STORE-SYNC'}</span>
        </button>
      </div>

      {/* Live SOS Lifecycle Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>TRANSMISSION LIFECYCLE TRACKER</span>
        </h4>

        {lastDispatchedSOS ? (
          <div>
            {/* 4-Step Progress Bar */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center mb-3">
              {[
                { step: 1, label: 'QUEUED' },
                { step: 2, label: 'RELAYED' },
                { step: 3, label: 'EN-ROUTE' },
                { step: 4, label: 'RESCUED' }
              ].map(s => {
                const isActive = lifecycle.stage >= s.step;
                const isCurrent = lifecycle.stage === s.step;

                return (
                  <div
                    key={s.step}
                    className={`p-2 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-600 border-amber-400 text-white font-bold ring-1 ring-amber-400 shadow'
                        : isActive
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div>{s.step}. {s.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">SOS Identifier:</span>
                <span className="font-bold text-red-400">{lastDispatchedSOS.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="text-amber-300 font-bold">{lifecycle.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Simulated Hops:</span>
                <span className="text-cyan-400 font-bold">{lastDispatchedSOS.meshHops} Relays</span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 mt-1 text-[11px] text-slate-400">
                <span className="text-slate-500">Forwarding Path: </span>
                {lastDispatchedSOS.meshRelayPath.join(' ➔ ')}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs font-mono">
            No SOS currently transmitted. To broadcast, use Screen 1 (SOS Dispatcher).
          </div>
        )}
      </div>

      {/* Nearby Detected Mesh Relays */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
          <span>NEARBY DETECTED PEER RELAYS ({meshNodes.length})</span>
          <span className="text-[10px] text-cyan-400 font-mono">RSSI -42 to -78 dBm</span>
        </h4>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {meshNodes.map(node => (
            <div key={node.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">{node.name}</div>
                <div className="text-[10px] text-slate-400">{node.type} • Batt: {node.battery}%</div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-bold text-[11px]">{node.rssiDbm} dBm</div>
                <div className="text-[9px] text-emerald-400">CONNECTABLE</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
