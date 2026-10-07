import React, { useState } from 'react';
import { Role } from '../../types/disaster';
import { Users, Flame, Building2, KeyRound, ShieldAlert, CheckCircle2, Lock, ArrowRight, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectRole: (role: Role) => void;
  currentRole: Role;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  currentRole
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setPinInput('');
    setErrorMsg('');
    setSuccessMsg('');

    // Civilian requires zero barrier
    if (role === 'CIVILIAN') {
      onSelectRole('CIVILIAN');
    }
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (selectedRole === 'RESCUE') {
      if (pinInput.trim() === '1122') {
        setSuccessMsg('Field Responder PIN Verified. Authenticating...');
        setTimeout(() => {
          onSelectRole('RESCUE');
        }, 300);
      } else {
        setErrorMsg('Invalid Rescue Team PIN. Default offline passcode is 1122.');
      }
    } else if (selectedRole === 'CONTROL') {
      if (pinInput.trim() === '9900') {
        setSuccessMsg('EOC Command Authorization Verified. Loading...');
        setTimeout(() => {
          onSelectRole('CONTROL');
        }, 300);
      } else {
        setErrorMsg('Invalid Command Room PIN. Default offline passcode is 9900.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Close Button if switching */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black tracking-wider text-slate-100 uppercase">
            GUARDIAN<span className="text-amber-500">AI</span> PORTAL
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Offline-First Role Segmentation • Zero Internet Required
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="space-y-3 mb-6">
          {/* Civilian Role Option */}
          <button
            type="button"
            onClick={() => handleRoleClick('CIVILIAN')}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              selectedRole === 'CIVILIAN'
                ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg ring-1 ring-blue-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>Civilian / Trapped Person</span>
                  <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded font-mono">1-TAP</span>
                </div>
                <div className="text-[11px] text-slate-400">SOS dispatch, acoustic beacon & evacuation routes</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </button>

          {/* Rescue Team Option */}
          <button
            type="button"
            onClick={() => handleRoleClick('RESCUE')}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              selectedRole === 'RESCUE'
                ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>Field Responder / NDRF</span>
                  <span className="text-[10px] bg-amber-900 text-amber-200 px-1.5 py-0.2 rounded font-mono">PIN: 1122</span>
                </div>
                <div className="text-[11px] text-slate-400">AI triage queue, hazard pins & tactical walkie</div>
              </div>
            </div>
            <Lock className="w-4 h-4 text-amber-400" />
          </button>

          {/* Control Room Option */}
          <button
            type="button"
            onClick={() => handleRoleClick('CONTROL')}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              selectedRole === 'CONTROL'
                ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>Command & Coordination</span>
                  <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.2 rounded font-mono">PIN: 9900</span>
                </div>
                <div className="text-[11px] text-slate-400">Sector EOC metrics, shelters, mesh node health</div>
              </div>
            </div>
            <Lock className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* PIN Authentication Panel for RESCUE / CONTROL */}
        {selectedRole !== 'CIVILIAN' && (
          <form onSubmit={handleVerifyPin} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Enter Pre-Configured Offline Passcode</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                Default: {selectedRole === 'RESCUE' ? '1122' : '9900'}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="4-digit PIN"
                autoFocus
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-white outline-none"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all"
              >
                AUTHORIZE
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 mt-2 font-mono flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-400 mt-2 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{successMsg}</span>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
