import React from 'react';
import { 
  Calendar, 
  AlertCircle, 
  XCircle, 
  Send, 
  Play, 
  Coffee, 
  Square, 
  Activity, 
  Clock, 
  Check, 
  CheckCircle,
  ArrowRight, 
  Plus 
} from 'lucide-react';
import { StaffMember, AttendanceRecord, WorkingLocation } from '../types';
import { GeofenceWidget } from './GeofenceWidget';

interface ClockPortalProps {
  currentStaffDetails: StaffMember;
  time: Date;
  isOutOfBounds: boolean;
  distance: number;
  activeOffice: WorkingLocation;
  strictGeofence: boolean;
  checkIsLate: () => boolean;
  shiftStartTime: string;
  setShowRemoteModal: (show: boolean) => void;
  handleClockIn: (reason?: string) => void;
  activeShift: {
    startTime: string;
    isOnBreak: boolean;
    breakStartTime?: string;
  } | null;
  handleToggleBreak: () => void;
  handleClockOut: () => void;
  records: AttendanceRecord[];
  activeStaffId: string;
  todayStr: string;
  formatNaira: (val: number) => string;
  formatHours: (val: number) => string;
  formatTimeRaw: (val: string) => string;
  setCorrDate: (date: string) => void;
  setCorrReason: (reason: string) => void;
  setShowCorrectionModal: (show: boolean) => void;

  // Passed-through GeofenceWidget props:
  locations: WorkingLocation[];
  selectedOfficeId: string;
  setSelectedOfficeId: (id: string) => void;
  isDeveloperMode: boolean;
  setIsDeveloperMode: (active: boolean) => void;
  isMockingGPS: boolean;
  setIsMockingGPS: (mocking: boolean) => void;
  mockLat: number;
  setMockLat: (lat: number) => void;
  mockLng: number;
  setMockLng: (lng: number) => void;
  isLocating: boolean;
  geoError: string | null;
  userCoords: { latitude: number; longitude: number } | null;
  forceMockToOffice: () => void;
  isSimulateLate: boolean;
  setIsSimulateLate: (simulate: boolean) => void;
  triggerRealGPS: () => void;
}

export function ClockPortal({
  currentStaffDetails,
  time,
  isOutOfBounds,
  distance,
  activeOffice,
  strictGeofence,
  checkIsLate,
  shiftStartTime,
  setShowRemoteModal,
  handleClockIn,
  activeShift,
  handleToggleBreak,
  handleClockOut,
  records,
  activeStaffId,
  todayStr,
  formatNaira,
  formatHours,
  formatTimeRaw,
  setCorrDate,
  setCorrReason,
  setShowCorrectionModal,

  locations,
  selectedOfficeId,
  setSelectedOfficeId,
  isDeveloperMode,
  setIsDeveloperMode,
  isMockingGPS,
  setIsMockingGPS,
  mockLat,
  setMockLat,
  mockLng,
  setMockLng,
  isLocating,
  geoError,
  userCoords,
  forceMockToOffice,
  isSimulateLate,
  setIsSimulateLate,
  triggerRealGPS,
}: ClockPortalProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* COLUMN 1: TRACKING CONTROLS & GEOFENCING BIND */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Main Actions Box */}
        <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 overflow-hidden">
          <div className="bg-[#1A3C6E]/40 text-white p-5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <img 
                src={currentStaffDetails.avatar} 
                alt={currentStaffDetails.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-[#D4A843] shadow-[0_0_10px_rgba(212,168,67,0.3)]"
              />
              <div>
                <h3 className="font-bold text-lg text-slate-100">{currentStaffDetails.name}</h3>
                <p className="text-xs text-white/70">{currentStaffDetails.department} • {currentStaffDetails.role}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A843] block">Hourly Rate</span>
              <span className="text-sm font-semibold font-mono text-[#D4A843]">{formatNaira(currentStaffDetails.hourlyRate)}/hr</span>
            </div>
          </div>

          <div className="p-6">
            {/* Digital Clock Display */}
            <div className="text-center py-6 bg-[#070b14]/50 rounded-xl border border-white/5 mb-6 flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Device Time (West African Standard)</span>
              <span className="text-5xl font-black font-mono tracking-tight text-white mt-2 immersive-glow-gold">
                {time.toLocaleTimeString('en-US', { hour12: true })}
              </span>
              <span className="text-slate-500 text-[10px] mt-1 text-center font-medium">
                Time sourced from your device &mdash; ensure clock is accurate.
              </span>
              <span className="text-[#D4A843] font-medium text-sm mt-1.5 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {time.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Operational Controls Flow */}
            <div className="space-y-4">
              {!activeShift ? (
                // Clock-In Phase
                <div>
                  {isOutOfBounds ? (
                    <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl p-4 mb-4 flex gap-3 text-red-200 text-xs">
                      <AlertCircle className="h-5 w-5 text-[#EF4444] shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-400">
                          {strictGeofence ? 'Geofence Restriction - CLOCK-IN BLOCKED' : 'Geofence Out Of Bounds Guard Active'}
                        </h4>
                        <p className="mt-1 text-slate-300">
                          You are currently <strong className="font-semibold">{distance.toLocaleString()}m</strong> away from your authorized working location boundary ({activeOffice.name}). 
                        </p>
                        {strictGeofence ? (
                          <p className="mt-1 font-bold text-red-400">
                            ADMIN POLICY ENFORCED: Clock-ins are strictly barred outside coordinate boundaries. You must enter the authorized radius of {activeOffice.radiusMeters}m.
                          </p>
                        ) : (
                          <p className="mt-1 font-medium text-red-300">
                            Clocking in here requires manager manual override approval. Please submit your business justification reasons below to request a remote bypass clock-in.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl p-4 mb-4 flex gap-3 text-emerald-200 text-xs">
                      <CheckCircle className="h-5 w-5 text-[#10B981] shrink-0" />
                      <div>
                        <h4 className="font-semibold text-emerald-400">Authorized Geofence Verified</h4>
                        <p className="mt-1 text-slate-300">
                          You are within the authorized work range of <strong className="font-semibold">{activeOffice.name}</strong> (<strong className="font-semibold">{distance} meters</strong> out, max: {activeOffice.radiusMeters}m). 
                        </p>
                        <p className="mt-1 font-medium text-emerald-300">
                          System auto-approved clearance active.
                        </p>
                      </div>
                    </div>
                  )}

                  {checkIsLate() && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 flex gap-3 text-amber-200 text-xs">
                      <Clock className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
                      <div>
                        <h4 className="font-semibold text-amber-300">Late Shift Intake Alert Triggered</h4>
                        <p className="mt-1 text-slate-350">
                          Submitting a clock-in file past standard start shift hour ({shiftStartTime} AM) registers an immediate manager flag for correction justification.
                        </p>
                      </div>
                    </div>
                  )}

                  {isOutOfBounds ? (
                    strictGeofence ? (
                      <button
                        disabled
                        className="w-full py-4 text-center bg-slate-900 border border-red-500/20 text-slate-500 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <XCircle className="h-5 w-5 text-red-500/50" />
                        Clock-In Blocked by Corporate Geofence Policy
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowRemoteModal(true)}
                        className="w-full py-4 text-center select-none bg-gradient-to-r from-amber-600 to-[#D4A843] text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-amber-600/10 flex items-center justify-center gap-2 transition hover:opacity-95 transform active:scale-[0.99] border-0"
                      >
                        <Send className="h-5 w-5" />
                        Request Remote Clock-In Approval
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleClockIn()}
                      className="w-full py-4 text-center select-none bg-gradient-to-r from-emerald-600 to-[#10B981] text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 transition hover:opacity-95 transform active:scale-[0.99] border-0"
                    >
                      <Play className="h-5 w-5" />
                      Verify & Clock In Now
                    </button>
                  )}
                </div>
              ) : (
                // Clock-Out and Breaks Control Phase
                <div className="space-y-3">
                  <div className="bg-[#070b14]/40 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                      </span>
                      <div>
                        <p className="text-xs uppercase text-slate-400 font-mono">Shift Status</p>
                        <p className="font-bold text-slate-200 text-sm">
                          {activeShift.isOnBreak ? 'On Lunch Break' : 'Currently Active / Clocked In'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-slate-400 font-mono">Clocked In At</p>
                      <p className="font-bold text-slate-200 text-sm font-mono">
                        {new Date(activeShift.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleToggleBreak}
                      className={`py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm border transition transform active:scale-[0.99] cursor-pointer ${
                        activeShift.isOnBreak
                          ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30'
                          : 'bg-white/5 text-slate-200 hover:bg-white/10 border-white/5'
                      }`}
                    >
                      <Coffee className="h-4 w-4" />
                      {activeShift.isOnBreak ? 'Resume Work' : 'Start Lunch Break'}
                    </button>
                    
                    <button
                      onClick={handleClockOut}
                      className="bg-red-650 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/15 transition transform active:scale-[0.99] cursor-pointer border-0"
                    >
                      <Square className="h-4 w-4" />
                      Clock Out Shift
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GEOFENCING CONFIGURATION & MAP RANGE INTERACTIVE SIMULATOR */}
        <GeofenceWidget
          locations={locations}
          selectedOfficeId={selectedOfficeId}
          setSelectedOfficeId={setSelectedOfficeId}
          activeOffice={activeOffice}
          isOutOfBounds={isOutOfBounds}
          distance={distance}
          isLocating={isLocating}
          geoError={geoError}
          userCoords={userCoords}
          triggerRealGPS={triggerRealGPS}
        />

      </div>

      {/* COLUMN 2: STAFF LOGS & TODAY STATS INSIGHT */}
      <div className="space-y-6">
        
        {/* Today's Earning Estimation Card */}
        <div className="bg-gradient-to-br from-[#1A3C6E]/60 to-[#070b14]/90 text-white rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-[#D4A843]/20 p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15">
            <CoinsIcon className="w-40 h-40 text-[#D4A843]" />
          </div>
          
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A843] bg-[#D4A843]/20 px-3 py-1 rounded-full border border-[#D4A843]/35 immersive-glow-gold">
            Wages & Payroll Estimates
          </span>
          
          <h4 className="text-sm font-medium text-slate-300 mt-4 leading-none font-sans">Today's Accumulated Earnings</h4>
          
          {/* Find current staff record today */}
          {(() => {
            const todayRec = records.find(r => r.staffId === activeStaffId && r.date === todayStr);
            if (!todayRec) {
              return (
                <div className="mt-4">
                  <span className="text-3xl font-bold font-mono text-slate-400">₦0.00</span>
                  <p className="text-xs text-slate-400 mt-1">Clock in to begin accumulating regular hour wages & overtime.</p>
                </div>
              );
            }

            const regularVal = todayRec.regularHours * currentStaffDetails.hourlyRate;
            const overtimeVal = todayRec.overtimeHours * currentStaffDetails.overtimeRate;
            const netVal = regularVal + overtimeVal;

            return (
              <div className="mt-4 space-y-4">
                <div>
                  <span className="text-3xl font-black font-mono tracking-tight text-[#D4A843] immersive-glow-gold">
                    {formatNaira(netVal)}
                  </span>
                  <p className="text-[11px] text-[#D4A843] font-medium mt-1">
                    Base worked: {todayRec.regularHours} hrs • OT: {todayRec.overtimeHours} hrs
                  </p>
                </div>

                <div className="border-t border-white/10 pt-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Wage ({todayRec.regularHours} hrs):</span>
                    <span className="font-mono text-white">{formatNaira(regularVal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Overtime Pay ({todayRec.overtimeHours} hrs):</span>
                    <span className="font-mono text-[#D4A843]">+ {formatNaira(overtimeVal)}</span>
                  </div>
                  <div className="border-t border-white/5 my-1" />
                  <div className="flex justify-between font-bold text-white">
                    <span>Verified Total:</span>
                    <span className="font-mono text-[#D4A843]">{formatNaira(netVal)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Today's Timeline Log */}
        <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6">
          <h3 className="font-bold text-base text-white flex items-center gap-2 pb-4 border-b border-white/5 mb-4">
            <Activity className="h-5 w-5 text-[#D4A843]" />
            Your Today Activity Timeline
          </h3>

          {(() => {
            const todayRec = records.find(r => r.staffId === activeStaffId && r.date === todayStr);
            if (!todayRec) {
              return (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-300">No shift files logged today yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Your exact clock actions will populate a timeline here.</p>
                </div>
              );
            }

            return (
              <div className="relative border-l border-white/10 pl-4 ml-2 space-y-6 py-1 text-xs">
                
                {/* Timeline Item 1: clock-in */}
                <div className="relative">
                  <span className="absolute -left-[21px] top-0 bg-[#10B981]/25 text-[#10B981] rounded-full p-0.5 border border-white/10">
                    <Check className="h-2.5 w-2.5 font-black" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-105 select-none">Shift Started (Clock In)</p>
                    <p className="text-[10px] text-slate-400">{formatTimeRaw(todayRec.clockIn)}</p>
                    <p className="text-slate-500 mt-0.5">Location: {todayRec.isOutOfBounds ? 'Out-Of-Bounds override' : 'Office bounds'}</p>
                  </div>
                </div>

                {/* Break Logs */}
                {todayRec.breaks.map((b, idx) => (
                  <React.Fragment key={idx}>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0 bg-amber-500/20 text-amber-400 rounded-full p-0.5 border border-white/10">
                        <Coffee className="h-2.5 w-2.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">Break Started</p>
                        <p className="text-[10px] text-slate-400">{formatTimeRaw(b.start)}</p>
                      </div>
                    </div>
                    {b.end && (
                      <div className="relative">
                        <span className="absolute -left-[21px] top-0 bg-slate-800 text-slate-300 rounded-full p-0.5 border border-white/10">
                          <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                        <div>
                          <p className="font-bold text-slate-200">Break Ended ({b.duration} mins duration)</p>
                          <p className="text-[10px] text-slate-400">{formatTimeRaw(b.end)}</p>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Timeline Item 3: clock-out */}
                {todayRec.clockOut ? (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-0 bg-red-500/20 text-red-400 rounded-full p-0.5 border border-white/10">
                      <Square className="h-2.5 w-2.5" />
                    </span>
                    <div>
                      <p className="font-bold text-slate-200">Shift Completed (Clock Out)</p>
                      <p className="text-[10px] text-slate-400">{formatTimeRaw(todayRec.clockOut)}</p>
                      <p className="text-slate-450 mt-0.5">Logged: <strong className="font-semibold text-slate-200">{formatHours(todayRec.totalHours)}</strong> work hours</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-0 bg-sky-500/20 text-sky-400 rounded-full p-0.5 border border-white/10 animate-pulse">
                      <Activity className="h-2.5 w-2.5" />
                    </span>
                    <div>
                      <p className="font-bold text-sky-400 animate-pulse">Shift Active</p>
                      <p className="text-[10px] text-slate-400">Waiting for Shift End / Clock-Out file action.</p>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

        </div>

        {/* Timesheet Adjustments Card */}
        <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Calendar className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
            <h4 className="font-bold text-sm text-slate-100 font-sans">Missed a shift clock file?</h4>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Submit a manual timesheet adjustment file request for prior working days. Upon approval, system wages compile automatically.
          </p>
          <button
            type="button"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setCorrDate(yesterday.toISOString().split('T')[0]);
              setCorrReason('');
              setShowCorrectionModal(true);
            }}
            className="w-full py-2.5 bg-[#D4A843]/15 text-[#D4A843] hover:bg-[#D4A843]/25 border border-[#D4A843]/35 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#D4A843]" />
            Request Manual Correction
          </button>
        </div>

      </div>

    </div>
  );
}

// Simple Coins icon for wage banner backgrounds
function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="18" cy="18" r="4" />
      <path d="M12 18a6 6 0 0 0-6-6" />
    </svg>
  );
}
