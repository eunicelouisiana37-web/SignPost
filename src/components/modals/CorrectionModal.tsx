import React from 'react';
import { Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';
import { StaffMember, AttendanceRecord, WorkingLocation, ManagerNotification, ObservedHoliday } from '../../types';

interface CorrectionModalProps {
  showCorrectionModal: boolean;
  setShowCorrectionModal: (show: boolean) => void;
  corrDate: string;
  setCorrDate: (date: string) => void;
  corrClockIn: string;
  setCorrClockIn: (time: string) => void;
  corrClockOut: string;
  setCorrClockOut: (time: string) => void;
  corrBreaks: number;
  setCorrBreaks: (breaks: number) => void;
  corrReason: string;
  setCorrReason: (reason: string) => void;
  activeStaffId: string;
  currentStaffDetails: StaffMember;
  activeOffice: WorkingLocation;
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<ManagerNotification[]>>;
  sendPushAlert: (notif: ManagerNotification) => void;
  holidays?: ObservedHoliday[];
}

export function CorrectionModal({
  showCorrectionModal,
  setShowCorrectionModal,
  corrDate,
  setCorrDate,
  corrClockIn,
  setCorrClockIn,
  corrClockOut,
  setCorrClockOut,
  corrBreaks,
  setCorrBreaks,
  corrReason,
  setCorrReason,
  activeStaffId,
  currentStaffDetails,
  activeOffice,
  setRecords,
  setNotifications,
  sendPushAlert,
  holidays = [],
}: CorrectionModalProps) {
  if (!showCorrectionModal) return null;

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrReason.trim()) return;

    const recordId = `rec-corr-${Date.now()}`;
    // Construct local timestamp representations for display/calculation
    const startIso = `${corrDate}T${corrClockIn}:00`;
    const endIso = `${corrDate}T${corrClockOut}:00`;

    const startObj = new Date(startIso);
    const endObj = new Date(endIso);
    const totalDiffMs = Math.max(0, endObj.getTime() - startObj.getTime());
    const totalDecimalHours = totalDiffMs / 3600000;
    const netWorkedHours = Math.max(0, totalDecimalHours - (corrBreaks / 60));
    const roundedTotal = Number(netWorkedHours.toFixed(2));

    const isHoliday = holidays.some((h) => h.date === corrDate);
    let regH = roundedTotal;
    let otH = 0;
    if (isHoliday) {
      regH = 0;
      otH = roundedTotal;
    } else if (roundedTotal > 8) {
      regH = 8;
      otH = Number((roundedTotal - 8).toFixed(2));
    }

    const newRecord: AttendanceRecord = {
      id: recordId,
      staffId: activeStaffId,
      staffName: currentStaffDetails.name,
      date: corrDate,
      clockIn: startIso,
      clockOut: endIso,
      breaks: [{ start: startIso, end: startIso, duration: corrBreaks }],
      breakDurationTotal: corrBreaks,
      totalHours: roundedTotal,
      regularHours: regH,
      overtimeHours: otH,
      latitude: activeOffice.latitude,
      longitude: activeOffice.longitude,
      distanceFromLocation: 0,
      isOutOfBounds: false,
      isHoliday: isHoliday,
      status: 'Pending',
      notes: isHoliday ? `Holiday Corr Req: ${corrReason}` : `Corr Req: ${corrReason}`,
    };

    setRecords((prev) => [newRecord, ...prev]);

    // Send Manager alert
    const notifId = `notif-${Date.now()}`;
    const newNotif: ManagerNotification = {
      id: notifId,
      staffId: activeStaffId,
      staffName: currentStaffDetails.name,
      type: 'CORRECTION_REQUEST',
      timestamp: new Date().toISOString(),
      details: `Requested correction for ${corrDate} (${corrClockIn} - ${corrClockOut}). Reason: "${corrReason}"`,
      recordId: recordId,
      read: false,
      status: 'Pending',
      extraData: {
        date: corrDate,
        reqClockIn: startIso,
        reqClockOut: endIso,
        reason: corrReason,
      }
    };

    setNotifications((prev) => [newNotif, ...prev]);
    sendPushAlert(newNotif);
    setShowCorrectionModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f172a] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.56)] overflow-hidden max-w-md w-full border border-white/10"
      >
        <div className="bg-[#1A3C6E]/40 text-white p-5 flex justify-between items-center border-b border-white/5">
          <h3 className="font-bold text-base flex items-center gap-1.5 font-sans">
            <Calendar className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
            Submit Shift Correction
          </h3>
          <button 
            type="button"
            onClick={() => setShowCorrectionModal(false)} 
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleCorrectionSubmit} className="p-6 space-y-4 font-sans">
          <div className="space-y-3 font-medium text-xs">
            
            <div>
              <label className="text-slate-300 block mb-1">Target Work Date</label>
              <input
                type="date"
                required
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
                className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Proposed Clock-In Time</label>
                <input
                  type="time"
                  required
                  value={corrClockIn}
                  onChange={(e) => setCorrClockIn(e.target.value)}
                  className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Proposed Clock-Out Time</label>
                <input
                  type="time"
                  required
                  value={corrClockOut}
                  onChange={(e) => setCorrClockOut(e.target.value)}
                  className="w-full text-xs bg-[#090d16] text-slate-105 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Cumulative Lunch Break Deduction (Minutes)</label>
              <input
                type="number"
                required
                min={0}
                max={120}
                value={corrBreaks}
                onChange={(e) => setCorrBreaks(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Reflects unpaid lunch break minutes deducted from gross.</p>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Justification Reason for Manual Override</label>
              <textarea
                required
                rows={3}
                placeholder="Forgot to clock out yesterday due to power outage... Chimaobi witnessed."
                value={corrReason}
                onChange={(e) => setCorrReason(e.target.value)}
                className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843] resize-none"
              />
            </div>

          </div>

          <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setShowCorrectionModal(false)}
              className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#D4A843] text-slate-950 hover:bg-amber-500 px-5 py-2.5 rounded-xl shadow-lg border-0 cursor-pointer font-black"
            >
              Submit Correction Request
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
