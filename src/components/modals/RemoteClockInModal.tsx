import React from 'react';
import { Compass, X } from 'lucide-react';
import { motion } from 'motion/react';

interface RemoteClockInModalProps {
  showRemoteModal: boolean;
  setShowRemoteModal: (show: boolean) => void;
  remoteReason: string;
  setRemoteReason: (reason: string) => void;
  handleClockIn: (reason?: string) => void;
}

export function RemoteClockInModal({
  showRemoteModal,
  setShowRemoteModal,
  remoteReason,
  setRemoteReason,
  handleClockIn,
}: RemoteClockInModalProps) {
  if (!showRemoteModal) return null;

  const handleRemoteClockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteReason.trim()) return;
    handleClockIn(remoteReason);
    setRemoteReason('');
    setShowRemoteModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f172a] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.56)] overflow-hidden max-w-md w-full border border-white/10"
      >
        <div className="bg-[#1A3C6E]/40 text-white p-5 flex justify-between items-center border-b border-white/5">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
            Geofence Waiver Override Form
          </h3>
          <button 
            type="button"
            onClick={() => setShowRemoteModal(false)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleRemoteClockInSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1">⚠️ Warning: Spatial Restriction Triggered</p>
            <p className="text-slate-300">Your current estimated coordinates place you outside authorized zones. Submitting this form enters a pending waiver on your timesheet.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-350 block mb-1">
              Business Justification Reason (Required)
            </label>
            <textarea
              required
              placeholder="Explain why you are clocking in from this location (e.g. 'Visiting parish family in Mushin', 'Facilities hardware transit Lagos Mainland')"
              value={remoteReason}
              onChange={(e) => setRemoteReason(e.target.value)}
              className="w-full text-xs font-medium bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 h-24 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setShowRemoteModal(false)}
              className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel Action
            </button>
            <button
              type="submit"
              className="bg-[#D4A843] hover:bg-amber-550 text-slate-950 px-5 py-2.5 rounded-xl shadow-lg border-0 cursor-pointer font-black"
            >
              Submit Waiver Request
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
