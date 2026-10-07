import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, AlertCircle, Phone, Save, Edit3, UserCheck, Stethoscope } from 'lucide-react';

export interface MedicalIDData {
  fullName: string;
  bloodType: string;
  allergies: string;
  medications: string;
  chronicConditions: string;
  iceName: string;
  icePhone: string;
  iceRelation: string;
  organDonor: boolean;
}

const DEFAULT_MEDICAL_ID: MedicalIDData = {
  fullName: 'Arun Sundaram',
  bloodType: 'O+',
  allergies: 'Penicillin, NSAIDs',
  medications: 'Metformin 500mg, Salbutamol Inhaler',
  chronicConditions: 'Type 2 Diabetes, Mild Asthma',
  iceName: 'Kavitha Sundaram (Spouse)',
  icePhone: '+91 98401 92831',
  iceRelation: 'Spouse',
  organDonor: true
};

export const CivilianMedicalID: React.FC = () => {
  const [medicalData, setMedicalData] = useState<MedicalIDData>(DEFAULT_MEDICAL_ID);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('guardian_medical_id');
      if (stored) {
        setMedicalData(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('guardian_medical_id', JSON.stringify(medicalData));
      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center text-red-400">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">OFFLINE MEDICAL ID CARD</h4>
            <p className="text-[10px] text-slate-400 font-mono">Accessible by Responders without network</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>{isEditing ? 'CANCEL' : 'EDIT'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 text-[11px] font-mono p-2 rounded-xl mb-3 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>Medical ID stored in secure device flash storage.</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Full Legal Name</label>
            <input
              type="text"
              value={medicalData.fullName}
              onChange={e => setMedicalData({ ...medicalData, fullName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-mono text-[10px] mb-1">Blood Type</label>
              <select
                value={medicalData.bloodType}
                onChange={e => setMedicalData({ ...medicalData, bloodType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[10px] mb-1">Organ Donor</label>
              <select
                value={medicalData.organDonor ? 'YES' : 'NO'}
                onChange={e => setMedicalData({ ...medicalData, organDonor: e.target.value === 'YES' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Allergies & Sensitivities</label>
            <input
              type="text"
              value={medicalData.allergies}
              onChange={e => setMedicalData({ ...medicalData, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Peanuts"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Critical Daily Medications</label>
            <input
              type="text"
              value={medicalData.medications}
              onChange={e => setMedicalData({ ...medicalData, medications: e.target.value })}
              placeholder="e.g. Insulin 10 units, Asthma Inhaler"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">In Case of Emergency (ICE) Contact</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Contact Name"
                value={medicalData.iceName}
                onChange={e => setMedicalData({ ...medicalData, iceName: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none text-xs"
              />
              <input
                type="text"
                placeholder="Radio/Phone Number"
                value={medicalData.icePhone}
                onChange={e => setMedicalData({ ...medicalData, icePhone: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 font-bold font-mono text-white py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE TO EMERGENCY NFC / FLASH</span>
          </button>
        </form>
      ) : (
        <div className="space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <div>
              <div className="text-[10px] text-slate-500">CITIZEN IDENTITY</div>
              <div className="font-bold text-white text-sm">{medicalData.fullName}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">BLOOD GROUP</div>
              <div className="text-base font-black text-red-400">{medicalData.bloodType}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-500">ALLERGIES</div>
              <div className="text-amber-400 font-bold truncate">{medicalData.allergies || 'None'}</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-500">CONDITIONS</div>
              <div className="text-slate-200 truncate">{medicalData.chronicConditions || 'None'}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-500">DAILY MEDICATIONS</div>
            <div className="text-cyan-300">{medicalData.medications || 'None specified'}</div>
          </div>

          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500">ICE (IN CASE OF EMERGENCY)</div>
              <div className="text-white font-bold">{medicalData.iceName}</div>
            </div>
            <div className="text-right text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{medicalData.icePhone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
