import React, { useState } from 'react';
import { ShieldCheck, User, Folder, Key, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { StaffMember } from '../types';

interface EmployeeSignInPortalProps {
  staff: StaffMember[];
  onSignIn: (name: string, staffId: string, department: string) => { success: boolean; message?: string; error?: string };
}

const PRESET_DEPARTMENTS = [
  'Administration',
  'Media & Communications',
  'Operations & Facilities',
  'Engineering',
  'Production',
];

export function EmployeeSignInPortal({ staff, onSignIn }: EmployeeSignInPortalProps) {
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanName = name.trim();
    const cleanStaffId = staffId.trim();
    const cleanDept = (isCustomDept ? customDept : department).trim();

    if (!cleanName || !cleanStaffId || !cleanDept) {
      setErrorMsg('Please complete all form fields to request access.');
      return;
    }

    // Attempt sign in via parent handler
    const result = onSignIn(cleanName, cleanStaffId, cleanDept);

    if (result.success) {
      setInfoMsg(result.message);
    } else {
      setErrorMsg(result.error || 'Failed to authenticate.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-[#0f172a]/60 backdrop-blur-2xl rounded-2xl p-8 border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#D4A843]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#1A3C6E]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-tr from-[#1A3C6E] to-[#D4A843] items-center justify-center border border-[#D4A843]/30 shadow-md">
            <ShieldCheck className="h-6 w-6 text-white immersive-glow-gold" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Staff Portal Sign-In</h2>
          <p className="text-xs text-slate-400 font-medium">Auto-verification & Geofence Gateway Check-In</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs flex gap-2 items-start animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex gap-2 items-start">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="font-semibold leading-relaxed">{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Staff ID */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1">
              <Key className="h-3.5 w-3.5 text-[#D4A843]/80" /> Staff ID Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. staff-1"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full text-xs font-mono font-bold bg-slate-950 border border-white/10 text-slate-100 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
            />
            <span className="text-[10px] text-slate-500 font-sans mt-1 block">
              Enter your standard ID (e.g., <code className="text-slate-400 font-bold bg-white/5 px-1 py-0.5 rounded">staff-1</code>, <code className="text-slate-400 font-bold bg-white/5 px-1 py-0.5 rounded">staff-2</code>)
            </span>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-[#D4A843]/80" /> Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Eunice Louisiana"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-sans font-semibold bg-slate-950 border border-white/10 text-slate-100 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1">
              <Folder className="h-3.5 w-3.5 text-[#D4A843]/80" /> Department
            </label>
            
            {!isCustomDept ? (
              <div className="flex gap-2">
                <select
                  required
                  value={department}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomDept(true);
                      setDepartment('');
                    } else {
                      setDepartment(e.target.value);
                    }
                  }}
                  className="flex-1 text-xs font-sans font-semibold bg-slate-950 border border-white/10 text-slate-100 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                >
                  <option value="">-- Choose Department --</option>
                  {PRESET_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="custom">+ Type New Department...</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales & Logistics"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  className="w-full text-xs font-sans font-semibold bg-slate-950 border border-white/10 text-slate-100 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDept(false);
                    setCustomDept('');
                  }}
                  className="text-[10px] text-[#D4A843] hover:underline bg-transparent border-none cursor-pointer"
                >
                  &larr; Back to Preset Departments list
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#1A3C6E] to-[#255496] hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg border border-white/10 transition duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            Access My Check-In Dashboard &rarr;
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            New employees auto-register instantly off this gateway on their first sign-in request.
          </p>
        </div>
      </div>
    </div>
  );
}
