import React from 'react';
import { 
  Users, 
  Bell, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Settings, 
  Play, 
  FileText, 
  Download,
  Calendar,
  Trash2,
  Compass,
  MapPin,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StaffMember, AttendanceRecord, ManagerNotification, ObservedHoliday, WorkingLocation } from '../types';

interface ManagerDashboardProps {
  presentCount: number;
  staff: StaffMember[];
  notifications: ManagerNotification[];
  totalOvertimeToday: number;
  totalWagesToday: number;
  selectedNotifIds: string[];
  handleToggleSelectAll: () => void;
  toggleSelectNotif: (id: string) => void;
  resolveNotification: (id: string, action: 'Approved' | 'Rejected') => void;
  setShowAddStaffModal: (show: boolean) => void;
  strictGeofence: boolean;
  setStrictGeofence: (strict: boolean) => void;
  shiftStartTime: string;
  setShiftStartTime: (time: string) => void;
  nativePermission: string;
  requestNotificationPermission: () => void;
  autoSchedulerEnabled: boolean;
  setAutoSchedulerEnabled: (enabled: boolean) => void;
  autoSchedulerFormats: 'PDF' | 'CSV' | 'Both';
  setAutoSchedulerFormats: (format: 'PDF' | 'CSV' | 'Both') => void;
  recipientEmail: string;
  setRecipientEmail: (email: string) => void;
  triggerScheduledRunSimulation: () => void;
  schedulerHistory: any[];
  todayRecords: AttendanceRecord[];
  filteredReportRecords: AttendanceRecord[];
  reportMonth: string;
  setReportMonth: (month: string) => void;
  reportStaffFilter: string;
  setReportStaffFilter: (filter: string) => void;
  reportDeptFilter: string[];
  setReportDeptFilter: (filter: string[]) => void;
  currentStaffDetails: StaffMember;
  formatNaira: (val: number) => string;
  formatDateStr: (date: string) => string;
  formatTimeRaw: (time: string) => string;
  exportToCSV: (data: AttendanceRecord[], filename: string) => void;
  exportToPDF: (data: AttendanceRecord[], monthLabel: string, staffLabel?: string, staffList?: StaffMember[]) => void;
  handleBulkApprove: () => void;
  holidays: ObservedHoliday[];
  setHolidays: React.Dispatch<React.SetStateAction<ObservedHoliday[]>>;

  // GPS/Dev simulation props
  isDeveloperMode: boolean;
  setIsDeveloperMode: (active: boolean) => void;
  isMockingGPS: boolean;
  setIsMockingGPS: (active: boolean) => void;
  mockLat: number;
  setMockLat: (lat: number) => void;
  mockLng: number;
  setMockLng: (lng: number) => void;
  isSimulateLate: boolean;
  setIsSimulateLate: (active: boolean) => void;
  forceMockToOffice: () => void;
  activeOffice: WorkingLocation;
  isLocating: boolean;
  geoError: string | null;
  userCoords: { latitude: number; longitude: number } | null;
}

export function ManagerDashboard({
  presentCount,
  staff,
  notifications,
  totalOvertimeToday,
  totalWagesToday,
  selectedNotifIds,
  handleToggleSelectAll,
  toggleSelectNotif,
  resolveNotification,
  setShowAddStaffModal,
  strictGeofence,
  setStrictGeofence,
  shiftStartTime,
  setShiftStartTime,
  nativePermission,
  requestNotificationPermission,
  autoSchedulerEnabled,
  setAutoSchedulerEnabled,
  autoSchedulerFormats,
  setAutoSchedulerFormats,
  recipientEmail,
  setRecipientEmail,
  triggerScheduledRunSimulation,
  schedulerHistory,
  todayRecords,
  filteredReportRecords,
  reportMonth,
  setReportMonth,
  reportStaffFilter,
  setReportStaffFilter,
  reportDeptFilter,
  setReportDeptFilter,
  currentStaffDetails,
  formatNaira,
  formatDateStr,
  formatTimeRaw,
  exportToCSV,
  exportToPDF,
  handleBulkApprove,
  holidays,
  setHolidays,

  isDeveloperMode,
  setIsDeveloperMode,
  isMockingGPS,
  setIsMockingGPS,
  mockLat,
  setMockLat,
  mockLng,
  setMockLng,
  isSimulateLate,
  setIsSimulateLate,
  forceMockToOffice,
  activeOffice,
  isLocating,
  geoError,
  userCoords,
}: ManagerDashboardProps) {
  const [newHolDate, setNewHolDate] = React.useState('');
  const [newHolName, setNewHolName] = React.useState('');
  const [showDeptDropdown, setShowDeptDropdown] = React.useState(false);

  const allDepartments = React.useMemo(() => {
    return Array.from(new Set(staff.map((s) => s.department).filter(Boolean)));
  }, [staff]);

  const handleToggleDeptFilter = (dept: string) => {
    if (reportDeptFilter.length === 0) {
      const others = allDepartments.filter((d) => d !== dept);
      setReportDeptFilter(others);
    } else {
      if (reportDeptFilter.includes(dept)) {
        const next = reportDeptFilter.filter((d) => d !== dept);
        setReportDeptFilter(next);
      } else {
        const next = [...reportDeptFilter, dept];
        if (next.length === allDepartments.length) {
          setReportDeptFilter([]);
        } else {
          setReportDeptFilter(next);
        }
      }
    }
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolDate || !newHolName.trim()) return;
    
    if (holidays.some((h) => h.date === newHolDate)) {
      return;
    }

    const newHoliday: ObservedHoliday = {
      id: `hol-${Date.now()}`,
      name: newHolName.trim(),
      date: newHolDate
    };

    setHolidays((prev) => [...prev, newHoliday]);
    setNewHolDate('');
    setNewHolName('');
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* CORE COUNTER BENTO BLOCK SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] border border-white/5 p-5 flex items-center gap-4">
          <div className="bg-[#1A3C6E]/20 h-11 w-11 rounded-lg flex items-center justify-center text-[#D4A843] border border-white/5">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block">Logged Present Today</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block immersive-glow-gold">{presentCount} Staff</span>
            <span className="text-[10.5px] text-slate-400 font-medium">Out of {staff.length} registered</span>
          </div>
        </div>

        <div id="pending-counter-badge" className="bg-[#0f172a]/55 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] border border-[#D4A843]/30 p-5 flex items-center gap-4">
          <div className="bg-amber-500/10 h-11 w-11 rounded-lg flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-slate-450 text-[10px] uppercase font-bold tracking-widest block">Pending Geo Override Approvals</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-amber-300 font-mono block">
                {notifications.filter(n => n.status === 'Pending').length}
              </span>
              {notifications.filter(n => n.status === 'Pending').length > 0 && (
                <span className="bg-[#EF4444]/25 text-red-300 border border-[#EF4444]/40 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                  Action Required
                </span>
              )}
            </div>
            <span className="text-[10.5px] text-slate-400 font-medium">Requires manual bypass waiver</span>
          </div>
        </div>

        <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] border border-white/5 p-5 flex items-center gap-4">
          <div className="bg-emerald-500/10 h-11 w-11 rounded-lg flex items-center justify-center text-[#10B981] border border-[#10B981]/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block">Total Daily Overtime</span>
            <span className="text-2xl font-black text-[#10B981] font-mono mt-1 block font-sans">{totalOvertimeToday.toFixed(1)} hrs</span>
            <span className="text-[10.5px] text-slate-400 font-medium">Flagged for payroll integration</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1A3C6E]/60 to-[#070b14]/95 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] border border-[#D4A843]/20 p-5 flex items-center gap-4">
          <div className="bg-[#D4A843]/20 h-11 w-11 rounded-lg flex items-center justify-center text-[#D4A843]">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-white/70 text-[10px] uppercase font-bold tracking-widest block">Daily Payroll Accrual</span>
            <span className="text-2xl font-black text-[#D4A843] font-mono mt-1 block immersive-glow-gold">{formatNaira(totalWagesToday)}</span>
            <span className="text-[10.5px] text-[#D4A843] font-medium">Regular rates + OT premiums</span>
          </div>
        </div>

      </div>

      {/* SECTION: PENDING APPROVALS QUEUE */}
      <div id="pending-approvals-queue" className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 overflow-hidden">
        <div className="bg-[#1A3C6E]/40 text-white p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <h3 className="font-bold text-base text-white">Manager Approval Queue</h3>
          </div>
          <span className="bg-slate-950/70 border border-white/5 text-[#D4A843] text-xs px-3 py-1 rounded-full font-mono text-[11px] immersive-glow-gold">
            Waiver Approvals Pending: {notifications.filter(n => n.status === 'Pending').length} Request(s)
          </span>
        </div>

        <div className="p-6">
          {notifications.filter(n => n.status === 'Pending').length === 0 ? (
            <div className="text-center py-8 text-slate-400 flex flex-col items-center">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-200">All coordinates clearance verified! Queue Empty.</p>
              <p className="text-xs text-slate-400 mt-1">No employee out-of-bounds clock-ins are awaiting manager waivers at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bulk Action Controls Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5 text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifications.filter(n => n.status === 'Pending').length > 0 && notifications.filter(n => n.status === 'Pending').every(n => selectedNotifIds.includes(n.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-white/10 bg-slate-950 text-[#D4A843] focus:ring-[#D4A843]/30 cursor-pointer accent-[#D4A843]"
                    />
                    <span>Select All Pending ({notifications.filter(n => n.status === 'Pending').length})</span>
                  </label>
                  {selectedNotifIds.length > 0 && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({selectedNotifIds.length} item(s) selected)
                    </span>
                  )}
                </div>

                {selectedNotifIds.length > 0 ? (
                  <button
                    onClick={handleBulkApprove}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#10B981] hover:brightness-110 text-slate-950 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 border-0"
                  >
                    <CheckCircle className="h-4 w-4 text-slate-950" />
                    Bulk Approve & Sign ({selectedNotifIds.length})
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-auto px-4 py-2 bg-slate-800 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5 border border-white/5"
                  >
                    <CheckCircle className="h-4 w-4 text-slate-500/50" />
                    Bulk Approve Selected (0)
                  </button>
                )}
              </div>

              {notifications.filter(n => n.status === 'Pending').map((notif) => {
                const isSelected = selectedNotifIds.includes(notif.id);
                return (
                  <div 
                    key={notif.id} 
                    onClick={() => toggleSelectNotif(notif.id)}
                    className={`bg-slate-950/40 border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-150 cursor-pointer ${
                      isSelected ? 'border-[#D4A843]/45 bg-[#D4A843]/5' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Individual select checkbox */}
                      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectNotif(notif.id)}
                          className="w-4 h-4 rounded border-white/10 bg-slate-950 text-[#D4A843] focus:ring-[#D4A843]/30 cursor-pointer accent-[#D4A843]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white font-sans">{notif.staffName}</span>
                          <span className="bg-amber-500/10 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/25">
                            {notif.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">Justification details: <span className="font-semibold text-[#D4A843]">"{notif.details}"</span></p>
                        <div className="flex items-center gap-4 text-[10px] text-slate-450 font-mono">
                          <span>Time Requested: {new Date(notif.timestamp).toLocaleString('en-GB')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => resolveNotification(notif.id, 'Rejected')}
                        className="flex-1 md:flex-none border border-[#EF4444]/25 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-red-300 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" /> Reject Override
                      </button>
                      
                      <button
                        onClick={() => resolveNotification(notif.id, 'Approved')}
                        className="flex-1 md:flex-none bg-gradient-to-r from-emerald-600 to-[#10B981] text-slate-950 px-4 py-2 rounded-lg text-xs font-black shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1 cursor-pointer border-0"
                      >
                        <CheckCircle className="h-4 w-4 text-slate-950" /> Approve & Sign Timesheet
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TWO COLUMN ADMIN: 1. REGISTERED STAFF & GEOFENCE LIST, 2. CURRENT DATE REGISTER TABLE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STAFF REGISTER & SECURITY CONSOLE */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* STRENGTH REGISTER: EXECUTIVES / EMPS LIST */}
          <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
                  Registered Staff List
                </h3>
                <p className="text-xs text-slate-400 font-medium">Track standard pay indices</p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="p-1.5 bg-[#D4A843]/15 text-[#D4A843] hover:bg-[#D4A843]/25 border border-[#D4A843]/30 rounded-lg transition cursor-pointer"
                title="Add Employee"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {staff.map((s) => (
                <div key={s.id} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={s.avatar} alt={s.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                    <div>
                      <p className="font-bold text-xs text-slate-100">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{s.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-[#D4A843] font-mono">{formatNaira(s.hourlyRate)}/h</p>
                    <p className="text-[9px] text-slate-400">OT: {formatNaira(s.overtimeRate)}/h</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POLICY & REPORT SCHEDULER BOARD */}
          <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6 space-y-5">
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
                Policy & Report Scheduler
              </h3>
              <p className="text-xs text-slate-400 font-medium">Bypass gates & automated runs</p>
            </div>

            {/* 1. Strict Geofencing Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Strict Geofence Policy</span>
                <button 
                  onClick={() => setStrictGeofence(!strictGeofence)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer ${
                    strictGeofence 
                      ? 'bg-red-500/15 text-red-300 border-red-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {strictGeofence ? 'Strict (Blocked)' : 'Lenient (Waiver Allowed)'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                When strict, out-of-bounds clock-ins are strictly barred. Lenient allows waiver justification overrides.
              </p>
            </div>

            {/* 2. Shift Start Time & Browser Alerts */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1 text-xs">
                <label className="text-slate-300 font-bold block">Late Entry Gate</label>
                <input 
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-slate-950 border border-white/10 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-300 font-bold block">Browser Alerts</label>
                <button
                  onClick={requestNotificationPermission}
                  className={`w-full py-2 rounded-lg text-center font-bold text-[10px] border transition cursor-pointer ${
                    nativePermission === 'granted'
                      ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                      : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30'
                  }`}
                >
                  {nativePermission === 'granted' ? '🔊 Active Alerts' : '🔔 Enable Alerts'}
                </button>
              </div>
            </div>

            {/* 3. Automated Delivery Scheduler */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#D4A843] block">
                ⚡ AUTOMATED SCHEDULER (PAYROLL)
              </span>
              <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                Reports are downloaded to your device. To enable automatic email delivery, connect an email service such as Resend or Mailgun via the backend API.
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Frequency</label>
                    <select
                      value={autoSchedulerEnabled ? 'monthly' : 'disabled'}
                      onChange={(e) => setAutoSchedulerEnabled(e.target.value === 'monthly')}
                      className="w-full bg-slate-950 text-slate-100 border border-white/10 p-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A843] cursor-pointer"
                    >
                      <option value="monthly" className="bg-[#0b0f19]">End of Month</option>
                      <option value="disabled" className="bg-[#0b0f19]">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Backup Formats</label>
                    <select
                      value={autoSchedulerFormats}
                      onChange={(e) => setAutoSchedulerFormats(e.target.value as any)}
                      className="w-full bg-slate-950 text-slate-100 border border-white/10 p-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A843] cursor-pointer"
                    >
                      <option value="Both" className="bg-[#0b0f19]">Both (PDF+CSV)</option>
                      <option value="PDF" className="bg-[#0b0f19]">Only PDF</option>
                      <option value="CSV" className="bg-[#0b0f19]">Only CSV</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-slate-400 font-semibold block mb-1">Report Delivery Email (manual)</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="eunicelouisiana37@gmail.com"
                    className="w-full bg-slate-950 text-slate-100 border border-white/10 p-2 rounded-lg font-bold font-sans focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                  />
                </div>

                {/* Run simulator button */}
                <button
                  onClick={triggerScheduledRunSimulation}
                  className="w-full py-2.5 bg-[#D4A843] text-slate-950 hover:bg-amber-550 border-0 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/10"
                >
                  <Play className="h-3.5 w-3.5 text-slate-950" />
                  Generate & Download Report Now
                </button>
              </div>

              {/* Scheduler Log Runs */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">
                  Execution History logs ({schedulerHistory.length} successful):
                </span>
                {schedulerHistory.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No automated triggers recorded.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                    {schedulerHistory.map((hist) => (
                      <div key={hist.id} className="p-2 bg-slate-950/50 border border-white/5 rounded-lg flex justify-between items-center text-[10px]">
                        <div>
                          <p className="font-bold text-slate-200">{hist.month} Auto-Run</p>
                          <p className="text-slate-500 text-[9px]">{new Date(hist.generatedAt).toLocaleString()}</p>
                        </div>
                        <span className="bg-emerald-500/10 text-[#10B981] font-bold px-1.5 py-0.5 rounded border border-[#10B981]/15 text-[9px]">
                          {hist.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* OBSERVED HOLIDAYS CONFIGURATION */}
          <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6 space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
                Observed Holidays
              </h3>
              <p className="text-xs text-slate-400 font-medium">Define dates that override standard daily rates</p>
            </div>

            <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
              Shifts completed on observed holidays automatically count 100% of physical hours as Overtime (e.g. 1.5x of standard rate), exempt from the daily 8-hour requirement.
            </p>

            {/* Add Holiday Form */}
            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Holiday Date</label>
                  <input
                    type="date"
                    required
                    value={newHolDate}
                    onChange={(e) => setNewHolDate(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-slate-950 border border-white/10 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Holiday Name</label>
                  <input
                    type="text"
                    required
                    maxLength={35}
                    value={newHolName}
                    onChange={(e) => setNewHolName(e.target.value)}
                    placeholder="e.g. Workers' Day"
                    className="w-full text-xs font-sans font-bold bg-slate-950 border border-white/10 text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#D4A843]/15 text-[#D4A843] hover:bg-[#D4A843]/25 border border-[#D4A843]/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Observed Date
              </button>
            </form>

            {/* List of Holidays */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">
                Active Holidays Calendar ({holidays.length} active):
              </span>
              
              {holidays.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">No custom public holidays declared.</p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {holidays.map((hol) => (
                    <div key={hol.id} className="p-2.5 bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-slate-200">{hol.name}</p>
                        <p className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-[#D4A843]/80" />
                          {formatDateStr(hol.date)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(hol.id)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border-0 bg-transparent cursor-pointer"
                        title="Remove Holiday"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GPS SIMULATOR & DEVELOPER TESTING CONTROLS */}
          <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6 space-y-4">
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Compass className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
                  GPS Simulator & Testing
                </h3>
                <p className="text-xs text-slate-400 font-medium">Configure Mock coordinates & testing flags</p>
              </div>

              {/* Dev Mode toggle switch inside manager header panel */}
              <label className="flex items-center gap-1.5 bg-slate-950/40 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 cursor-pointer transition select-none">
                <input 
                  type="checkbox"
                  checked={isDeveloperMode}
                  onChange={(e) => setIsDeveloperMode(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/10 bg-slate-950 text-[#D4A843] focus:ring-0 accent-[#D4A843] cursor-pointer"
                />
                <span>Dev Mode</span>
              </label>
            </div>

            <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
              These controls let you simulate various GPS and arrival conditions for testing boundaries and late policies securely from the Manager Panel.
            </p>

            {isDeveloperMode ? (
              <div className="space-y-4">
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A843]">GPS Testing Controller</h4>
                  
                  {/* Toggle Manual Override */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1 pb-1 select-none">
                    <input 
                      type="checkbox" 
                      checked={isMockingGPS}
                      onChange={(e) => setIsMockingGPS(e.target.checked)}
                      className="rounded text-[#D4A843] focus:ring-[#D4A843]/40 border-white/20 bg-slate-950"
                    />
                    <span className="text-xs font-medium text-slate-300">Enable GPS Override (Mock)</span>
                  </label>

                  {isMockingGPS ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-1">GPS Latitude Coordinate</span>
                        <input 
                          type="number" 
                          step="0.0001"
                          value={mockLat}
                          onChange={(e) => setMockLat(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-mono bg-slate-950 border border-white/10 text-white rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-1">GPS Longitude Coordinate</span>
                        <input 
                          type="number" 
                          step="0.0001"
                          value={mockLng}
                          onChange={(e) => setMockLng(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-mono bg-slate-950 border border-white/10 text-white rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-white/5 text-[11px] p-2.5 rounded font-medium text-slate-300 space-y-1">
                      {isLocating ? (
                        <span className="animate-pulse flex items-center gap-1 text-slate-400">
                          <Compass className="h-4 w-4 animate-spin text-[#D4A843]" /> Querying Browser GPS Satellites...
                        </span>
                      ) : (
                        <>
                          <p className="font-bold text-white flex items-center gap-1">📡 Live Browser GPS Active</p>
                          <p>Lat: {userCoords?.latitude?.toFixed(6) || 'None'}</p>
                          <p>Lng: {userCoords?.longitude?.toFixed(6) || 'None'}</p>
                        </>
                      )}
                      {geoError && <p className="text-red-400 font-bold">{geoError}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => forceMockToOffice()}
                    className="w-full py-2 bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 border border-[#10B981]/35 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Simulating INSIDE Geofence
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMockingGPS(true);
                      setMockLat(activeOffice.latitude + 0.05); // far away
                      setMockLng(activeOffice.longitude + 0.05);
                    }}
                    className="w-full py-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/35 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5 text-[#EF4444]" />
                    Simulating OUT OF BOUNDS
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSimulateLate(!isSimulateLate)}
                    className={`w-full py-2 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isSimulateLate 
                        ? 'bg-[#D4A843]/20 text-[#D4A843] border-[#D4A843]/55 font-bold' 
                        : 'bg-slate-950/30 text-slate-400 border-white/5 hover:bg-slate-950/50'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {isSimulateLate ? '💡 Simulating LATE Check-In [ACTIVE]' : 'Simulate Late Check-In (Clock > 08:30)'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/40 border border-white/5 rounded-xl text-center">
                <span className="text-xs text-slate-400 font-semibold italic">Developer Mode is disabled. Enable to access override simulator.</span>
              </div>
            )}
          </div>

        </div>

        {/* DAILY ATTENDANCE DATABASE LOGS TABLE */}
        <div className="xl:col-span-2 bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 overflow-hidden font-sans">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#1A3C6E]/20">
            <div>
              <h3 className="font-bold text-base text-white">Today's Live Attendance Dashboard</h3>
              <p className="text-xs text-slate-400">All registered check-ins logged for: {formatDateStr(todayRecords[0]?.date || new Date().toISOString().split('T')[0])}</p>
            </div>
            <span className="bg-[#D4A843]/15 text-[#D4A843] text-xs font-semibold px-3 py-1 rounded-full border border-[#D4A843]/20">
              {todayRecords.length} Shifts Today
            </span>
          </div>

          <div className="overflow-x-auto text-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/75 text-slate-350 border-b border-white/5 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Clock Actions</th>
                  <th className="p-4">Duration Logs</th>
                  <th className="p-4">Geo Compliance</th>
                  <th className="p-4 text-center">Admin Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0b0f19]/30">
                {todayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 bg-slate-950/20">
                      No clock actions performed today. Try switching roles to "Staff Portal" to perform dummy clock actions!
                    </td>
                  </tr>
                ) : (
                  todayRecords.map((r) => {
                    const empDetails = staff.find((s) => s.id === r.staffId) || { avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.staffName)}&backgroundColor=1A3C6E&textColor=ffffff` };
                    return (
                      <tr key={r.id} className="hover:bg-white/5 text-slate-200 border-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img src={empDetails.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-white">{r.staffName}</p>
                                {r.isHoliday && (
                                  <span className="text-[8.5px] font-black uppercase text-[#D4A843] bg-[#D4A843]/15 px-1.5 py-0.5 rounded border border-[#D4A843]/30 tracking-wider">
                                    Holiday
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{r.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
                              <span>IN: {formatTimeRaw(r.clockIn)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                              <span>OUT: {formatTimeRaw(r.clockOut)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <p className="font-semibold text-slate-200">
                            Worked: <span className="font-bold text-[#D4A843] font-mono">{r.totalHours} hrs</span>
                            {r.isHoliday && (
                              <span className="ml-1.5 text-[8.5px] font-black uppercase text-red-400 bg-red-400/15 px-1.5 py-0.5 rounded border border-red-500/20">
                                Holiday Premium
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-450">Breaks Taken: {r.breakDurationTotal} mins</p>
                        </td>
                        <td className="p-4">
                          {r.isOutOfBounds ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-red-350 bg-[#EF4444]/15 px-2 py-0.5 rounded border border-[#EF4444]/30">
                                Out Bounds (+{r.distanceFromLocation}m)
                              </span>
                              <p className="text-[9px] text-slate-400 line-clamp-1 italic">"{r.notes}"</p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-350 bg-[#10B981]/15 px-3 py-0.5 rounded border border-[#10B981]/30">
                              In-Bounds ({r.distanceFromLocation}m)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            r.status === 'Approved' 
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' 
                              : r.status === 'Pending' 
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                                : 'bg-[#EF4444]/15 text-red-300 border-[#EF4444]/30'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MONTHLY TIMESHEET REPORT & EXPORT CONTROL BOARD */}
      <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 overflow-hidden">
        <div className="bg-[#1A3C6E]/40 text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
              Payroll timesheets Export Generator
            </h3>
            <p className="text-xs text-white/70">Compute detailed wage summaries and generate automated PDF/CSV timesheets</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Select Year/Month */}
            <div className="text-white text-xs shrink-0 flex items-center bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 shadow shadow-indigo-950/20 font-medium">
              <span className="text-slate-400 mr-1.5 text-[11px]">Period:</span>
              <input 
                type="month" 
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="bg-transparent focus:outline-none focus:ring-0 text-white font-bold border-0 cursor-pointer text-xs"
              />
            </div>

            {/* Filter Staff */}
            <div className="text-white text-xs shrink-0 flex items-center bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 shadow shadow-indigo-950/20 font-medium">
              <span className="text-slate-400 mr-1.5 text-[11px]">Staff:</span>
              <select 
                value={reportStaffFilter}
                onChange={(e) => setReportStaffFilter(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer border-0 text-xs"
              >
                <option value="All" className="bg-[#0b0f19] text-white">All Staff</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#0b0f19] text-white">{s.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Departments Multi-select */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="text-white text-xs flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 shadow shadow-indigo-950/20 font-medium hover:border-white/20 select-none cursor-pointer transition min-w-[130px] justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3 w-3 text-[#D4A843] immersive-glow-gold" />
                  <span className="text-slate-400 text-[11px]">Depts:</span>
                  <span className="text-white font-bold truncate max-w-[80px]">
                    {reportDeptFilter.length === 0 ? 'All' : `${reportDeptFilter.length} Selected`}
                  </span>
                </div>
                {showDeptDropdown ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
              </button>

              {showDeptDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDeptDropdown(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-white/10 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-3 z-50 space-y-2 text-left">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A843]">Filter Departments</span>
                      {reportDeptFilter.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setReportDeptFilter([])}
                          className="text-[9px] font-bold text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer"
                        >
                          Clear all (All)
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-1 max-h-[180px] overflow-y-auto pr-0.5">
                      {allDepartments.map((dept) => {
                        const isChecked = reportDeptFilter.length === 0 || reportDeptFilter.includes(dept);
                        return (
                          <label 
                            key={dept} 
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-lg text-xs text-slate-300 font-medium cursor-pointer transition select-none"
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleDeptFilter(dept)}
                              className="w-3.5 h-3.5 rounded border-white/10 bg-slate-900 text-[#D4A843] focus:ring-0 accent-[#D4A843] cursor-pointer"
                            />
                            <span className="truncate">{dept}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="border-t border-white/5 pt-1.5 mt-1 text-center">
                      <p className="text-[9px] text-slate-500 font-medium">Export summaries filter dynamically by active checkmarks.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Export buttons block */}
            <div className="flex gap-2 w-full sm:w-auto md:ml-3">
              <button
                onClick={() => {
                  const monthName = new Date(reportMonth + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  exportToCSV(filteredReportRecords, `${monthName}_attendance_summary`);
                }}
                className="flex-1 sm:flex-initial bg-slate-950 border border-white/10 hover:bg-slate-900 text-white hover:text-white px-3.5 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#D4A843]" /> Export Excel/CSV
              </button>
              
              <button
                onClick={() => {
                  const monthName = new Date(reportMonth + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  const staffLabel = reportStaffFilter === 'All' ? 'All Staff Group' : (staff.find(s => s.id === reportStaffFilter)?.name || 'Filtered');
                  exportToPDF(filteredReportRecords, monthName, staffLabel, staff);
                }}
                className="flex-1 sm:flex-initial bg-[#D4A843] text-slate-950 hover:bg-amber-500 px-4 py-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-yellow-600/10 border-0 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-slate-950" /> PDF Timesheet Report
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0b0f19]/30">
            <table className="w-full text-left text-xs text-slate-200">
              <thead>
                <tr className="bg-slate-950/75 border-b border-white/5 text-slate-400 font-mono font-bold tracking-wider text-[10px]">
                  <th className="p-4">Date Logged</th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Regular Worked Hours</th>
                  <th className="p-4">Overtime Hours</th>
                  <th className="p-4">Gross Earned Rate</th>
                  <th className="p-4">Coordinates compliance</th>
                  <th className="p-4">Billing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReportRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 bg-slate-950/20">
                      No logs matches the selected query configuration filters ({reportMonth}).
                    </td>
                  </tr>
                ) : (
                  filteredReportRecords.map((r) => {
                    const assocStaff = staff.find((s) => s.id === r.staffId) || currentStaffDetails;
                    const wageRegular = r.regularHours * assocStaff.hourlyRate;
                    const wageOvertime = r.overtimeHours * assocStaff.overtimeRate;
                    const grossPaid = wageRegular + wageOvertime;

                    return (
                      <tr key={r.id} className="hover:bg-white/5 opacity-100">
                        <td className="p-4 font-mono font-semibold text-slate-300">
                          <div className="flex flex-col">
                            <span>{formatDateStr(r.date)}</span>
                            {r.isHoliday && (
                              <span className="w-fit mt-1 text-[8px] font-black uppercase tracking-wider text-[#D4A843] bg-[#D4A843]/15 px-1.5 py-0.5 rounded border border-[#D4A843]/30">
                                Holiday
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-white">{r.staffName}</span>
                          <span className="text-[10px] text-slate-400 block">{assocStaff.department}</span>
                        </td>
                        <td className="p-4 font-mono text-slate-300">{r.regularHours} hrs</td>
                        <td className="p-4 font-mono text-red-400 font-bold">
                          <div>
                            <span>{r.overtimeHours} hrs</span>
                            {r.isHoliday && (
                              <span className="block text-[8px] text-slate-400 font-medium font-sans">100% Holiday Rate</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#D4A843] immersive-glow-gold">{formatNaira(grossPaid || 0)}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                            r.isOutOfBounds 
                              ? 'bg-[#EF4444]/15 text-red-300 border-[#EF4444]/25' 
                              : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25'
                          }`}>
                            {r.isOutOfBounds ? `Out (${r.distanceFromLocation}m)` : `In Office (${r.distanceFromLocation}m)`}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                            r.status === 'Approved' 
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' 
                              : r.status === 'Pending' 
                                ? 'bg-amber-500/15 text-amber-355 border-amber-500/30' 
                                : 'bg-[#EF4444]/15 text-red-300 border-[#EF4444]/30'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
