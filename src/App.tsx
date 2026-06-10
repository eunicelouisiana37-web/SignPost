import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Settings, 
  FileText, 
  Download, 
  Bell, 
  Play, 
  Coffee, 
  Square, 
  Building, 
  Briefcase, 
  ArrowRight, 
  Check, 
  X,
  Plus,
  Compass,
  DollarSign,
  BriefcaseBusiness,
  ShieldCheck,
  Send,
  Sparkles,
  HelpCircle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { StaffMember, AttendanceRecord, WorkingLocation, ManagerNotification } from './types';
import { 
  INITIAL_LOCATIONS, 
  INITIAL_STAFF, 
  INITIAL_RECORDS, 
  INITIAL_NOTIFICATIONS 
} from './data/mockData';
import { 
  calculateDistance, 
  formatNaira, 
  formatHours, 
  formatTimeRaw, 
  formatDateStr, 
  exportToCSV, 
  exportToPDF 
} from './utils';

export default function App() {
  // --- Core Persistent State ---
  const [locations, setLocations] = useState<WorkingLocation[]>(() => {
    const saved = localStorage.getItem('co_locations');
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('co_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('co_records');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  const [notifications, setNotifications] = useState<ManagerNotification[]>(() => {
    const saved = localStorage.getItem('co_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(locations[0]?.id || 'lag-hq');

  // --- UI Control States ---
  const [currentRole, setCurrentRole] = useState<'Employee' | 'Manager'>('Employee');
  const [activeStaffId, setActiveStaffId] = useState<string>('staff-1'); // Currently selected employee to perform clock action
  const [time, setTime] = useState(new Date());

  // --- Geolocation State ---
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Custom manual coordinate inputs (Mock Override for testing out of bounds)
  const [isMockingGPS, setIsMockingGPS] = useState(true);
  const [mockLat, setMockLat] = useState<number>(INITIAL_LOCATIONS[0].latitude); // Lagos HQ by default
  const [mockLng, setMockLng] = useState<number>(INITIAL_LOCATIONS[0].longitude);

  // --- Work State Tickers & Timers ---
  const [activeShift, setActiveShift] = useState<{
    startTime: string;
    isOnBreak: boolean;
    breakStartTime?: string;
  } | null>(null);

  // --- Remote/Out-Of-Bounds Modals & Fields ---
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteReason, setRemoteReason] = useState('');

  // --- Strict Geofencing & Late Shift Configurations ---
  const [strictGeofence, setStrictGeofence] = useState<boolean>(() => localStorage.getItem('co_strict_geofence') === 'true');
  const [shiftStartTime, setShiftStartTime] = useState<string>(() => localStorage.getItem('co_shift_start') || '08:30');
  const [isSimulateLate, setIsSimulateLate] = useState<boolean>(false);

  // --- Manual Timesheet Correction Form Modal ---
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState('2026-06-10');
  const [corrClockIn, setCorrClockIn] = useState('08:00');
  const [corrClockOut, setCorrClockOut] = useState('17:00');
  const [corrBreaks, setCorrBreaks] = useState(60);
  const [corrReason, setCorrReason] = useState('');
  
  // --- Admin Add Staff Form Modal ---
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffDept, setNewStaffDept] = useState('Administration');
  const [newStaffRate, setNewStaffRate] = useState(2500);

  // --- Reports Config & Auto-Scheduler State ---
  const [reportMonth, setReportMonth] = useState('2026-06');
  const [reportStaffFilter, setReportStaffFilter] = useState('All');
  
  // --- Selected Manager Approvals for Bulk Actions ---
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);
  
  const [autoSchedulerEnabled, setAutoSchedulerEnabled] = useState<boolean>(() => localStorage.getItem('co_auto_scheduler') !== 'false');
  const [autoSchedulerFormats, setAutoSchedulerFormats] = useState<'PDF' | 'CSV' | 'Both'>(() => (localStorage.getItem('co_scheduler_formats') as any) || 'Both');
  const [recipientEmail, setRecipientEmail] = useState<string>(() => localStorage.getItem('co_recipient_email') || 'eunicelouisiana37@gmail.com');
  const [schedulerHistory, setSchedulerHistory] = useState<{
    id: string;
    month: string;
    generatedAt: string;
    formats: string;
    deliveredTo: string;
    status: string;
  }[]>(() => {
    const saved = localStorage.getItem('co_scheduler_history');
    return saved ? JSON.parse(saved) : [
      {
        id: 'hist-1',
        month: 'May 2026',
        generatedAt: '2026-05-31T23:59:00Z',
        formats: 'Both (PDF + CSV)',
        deliveredTo: 'eunicelouisiana37@gmail.com',
        status: 'Delivered (Auto-Run)'
      },
      {
        id: 'hist-2',
        month: 'April 2026',
        generatedAt: '2026-04-30T23:59:00Z',
        formats: 'Both (PDF + CSV)',
        deliveredTo: 'eunicelouisiana37@gmail.com',
        status: 'Delivered (Auto-Run)'
      }
    ];
  });

  // Native notification permission tracking
  const [nativePermission, setNativePermission] = useState<string>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  });

  // Any active virtual toast alerts
  const [showPushNotification, setShowPushNotification] = useState<ManagerNotification | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_locations', JSON.stringify(locations));
    localStorage.setItem('co_staff', JSON.stringify(staff));
    localStorage.setItem('co_records', JSON.stringify(records));
    localStorage.setItem('co_notifications', JSON.stringify(notifications));
    localStorage.setItem('co_strict_geofence', String(strictGeofence));
    localStorage.setItem('co_shift_start', shiftStartTime);
    localStorage.setItem('co_auto_scheduler', String(autoSchedulerEnabled));
    localStorage.setItem('co_scheduler_formats', autoSchedulerFormats);
    localStorage.setItem('co_recipient_email', recipientEmail);
    localStorage.setItem('co_scheduler_history', JSON.stringify(schedulerHistory));
  }, [locations, staff, records, notifications, strictGeofence, shiftStartTime, autoSchedulerEnabled, autoSchedulerFormats, recipientEmail, schedulerHistory]);

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Shift Timer state for active user on load / activeStaffId change
  useEffect(() => {
    // Find if active staff member has an open attendance record today (no clock Out)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOpenRecord = records.find(
      (r) => r.staffId === activeStaffId && r.date === todayStr && !r.clockOut
    );

    if (todayOpenRecord) {
      // Find if there is an open break (last break has no end time)
      const openBreak = todayOpenRecord.breaks.find((b) => !b.end);
      setActiveShift({
        startTime: todayOpenRecord.clockIn,
        isOnBreak: !!openBreak,
        breakStartTime: openBreak?.start,
      });
    } else {
      setActiveShift(null);
    }
  }, [activeStaffId, records]);

  // Attempt real GPS lock on launch or if Mock GPS turned off
  useEffect(() => {
    if (!isMockingGPS) {
      triggerRealGPS();
    }
  }, [isMockingGPS]);

  // GPS Trigger
  const triggerRealGPS = () => {
    setIsLocating(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      setIsMockingGPS(true); // fall back to mock
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setIsLocating(false);
        // Also update the input fields to coordinate representation
        setMockLat(latitude);
        setMockLng(longitude);
      },
      (error) => {
        let msg = 'Failed to fetch GPS coordinates.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permission denied. Please enable location access in browser/settings.';
        }
        setGeoError(msg);
        setIsLocating(false);
        setIsMockingGPS(true); // switch back to mock to let them test
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Compute Active Location Geofence target
  const activeOffice = locations.find((l) => l.id === selectedOfficeId) || locations[0];
  
  // Real or mock latitude/longitude to use for active calculations
  const currentLatitude = isMockingGPS ? mockLat : (userCoords?.latitude || mockLat);
  const currentLongitude = isMockingGPS ? mockLng : (userCoords?.longitude || mockLng);

  // Distance calculating
  const distance = calculateDistance(
    currentLatitude,
    currentLongitude,
    activeOffice.latitude,
    activeOffice.longitude
  );

  const isOutOfBounds = distance > activeOffice.radiusMeters;

  // Set the mock coordinates directly to the selected office target coordinates to simulate inside-bounds instantly!
  const forceMockToOffice = () => {
    setIsMockingGPS(true);
    setMockLat(activeOffice.latitude);
    setMockLng(activeOffice.longitude);
  };

  // Setup current user details
  const currentStaffDetails = staff.find((s) => s.id === activeStaffId) || staff[0];

  // --- Clock Actions (Clock In, Out, Breaks) ---
  
  // Custom push notification dispatcher with physical synthesizer sound and Native Notification API triggers
  const sendPushAlert = (notif: ManagerNotification) => {
    // 1. Show simulated UI badge overlay
    setShowPushNotification(notif);
    setTimeout(() => {
      setShowPushNotification((curr) => (curr && curr.id === notif.id ? null : curr));
    }, 8500);

    // 2. Play subtle system alert sound (Synthesized)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // High pitch D5 frequency
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio context block ignored
    }

    // 3. Dispatch real browser desktop notifications if enabled
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const displayType = notif.type.replace(/_/g, ' ');
          new Notification(`🔔 SignPost: ${displayType}`, {
            body: `${notif.staffName}: ${notif.details}`,
            tag: notif.id
          });
        } catch (err) {
          console.error('Desktop notification failed:', err);
        }
      }
    }
  };

  const checkIsLate = () => {
    if (isSimulateLate) return true;
    const now = new Date();
    const [targetHrs, targetMins] = shiftStartTime.split(':').map(Number);
    const hrs = now.getHours();
    const mins = now.getMinutes();
    return hrs > targetHrs || (hrs === targetHrs && mins > targetMins);
  };
  
  const handleClockIn = (reason?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if already open
    const alreadyClocked = records.some(
      (r) => r.staffId === activeStaffId && r.date === todayStr && !r.clockOut
    );
    if (alreadyClocked) return;

    const isLateCheckIn = checkIsLate();
    const recordId = `rec-${Date.now()}`;
    const needsApproval = isOutOfBounds || isLateCheckIn;

    const newRecord: AttendanceRecord = {
      id: recordId,
      staffId: activeStaffId,
      staffName: currentStaffDetails.name,
      date: todayStr,
      clockIn: new Date().toISOString(),
      breaks: [],
      breakDurationTotal: 0,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      latitude: currentLatitude,
      longitude: currentLongitude,
      distanceFromLocation: Number(distance.toFixed(0)),
      isOutOfBounds: isOutOfBounds,
      isLate: isLateCheckIn,
      lateReason: isLateCheckIn ? (reason || 'Late shift clock-in justification') : undefined,
      status: needsApproval ? 'Pending' : 'Approved', // Requires review if out of bounds or late
      notes: reason || (isOutOfBounds ? 'Clocked in outside authorized zone' : (isLateCheckIn ? 'Late clock-in' : 'Normal clock-in')),
      approvedBy: needsApproval ? undefined : 'System Auto-Verify',
      approvedAt: needsApproval ? undefined : new Date().toISOString(),
    };

    setRecords((prev) => [newRecord, ...prev]);
    
    // Toggle Shift timer states
    setActiveShift({
      startTime: newRecord.clockIn,
      isOnBreak: false,
    });

    // Create Manager alert if clocked out-of-bounds or late
    if (isOutOfBounds) {
      const notifId = `notif-${Date.now()}`;
      const newNotif: ManagerNotification = {
        id: notifId,
        staffId: activeStaffId,
        staffName: currentStaffDetails.name,
        type: 'CLOCK_IN_BOUNDS_VIOLATION',
        timestamp: new Date().toISOString(),
        details: `Clocked in ${distance.toFixed(0)}m away from ${activeOffice.name}. Reason stated: "${reason || 'Generic Remote'}"`,
        recordId: recordId,
        read: false,
        status: 'Pending',
      };
      
      setNotifications((prev) => [newNotif, ...prev]);
      sendPushAlert(newNotif);
    } else if (isLateCheckIn) {
      const notifId = `notif-${Date.now()}`;
      const newNotif: ManagerNotification = {
        id: notifId,
        staffId: activeStaffId,
        staffName: currentStaffDetails.name,
        type: 'LATE_CLOCK_IN',
        timestamp: new Date().toISOString(),
        details: `Clocked in late. Threshold: ${shiftStartTime}. Reason stated: "${reason || 'Late shift initiation'}"`,
        recordId: recordId,
        read: false,
        status: 'Pending',
      };
      
      setNotifications((prev) => [newNotif, ...prev]);
      sendPushAlert(newNotif);
    }
  };

  const handleToggleBreak = () => {
    if (!activeShift) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecordIdx = records.findIndex(
      (r) => r.staffId === activeStaffId && r.date === todayStr && !r.clockOut
    );
    if (todayRecordIdx === -1) return;

    const nowIso = new Date().toISOString();
    const updatedRecords = [...records];
    const record = { ...updatedRecords[todayRecordIdx] };

    if (!activeShift.isOnBreak) {
      // START BREAK
      record.breaks = [...record.breaks, { start: nowIso, duration: 0 }];
      setActiveShift(prev => prev ? { ...prev, isOnBreak: true, breakStartTime: nowIso } : null);
    } else {
      // END BREAK
      const activeBreakIdx = record.breaks.findIndex((b) => !b.end);
      if (activeBreakIdx !== -1) {
        const breakStart = new Date(record.breaks[activeBreakIdx].start);
        const breakEnd = new Date(nowIso);
        const diffMins = Math.max(0, Math.round((breakEnd.getTime() - breakStart.getTime()) / 60000));
        
        const updatedBreaks = [...record.breaks];
        updatedBreaks[activeBreakIdx] = {
          ...updatedBreaks[activeBreakIdx],
          end: nowIso,
          duration: diffMins,
        };
        
        record.breaks = updatedBreaks;
        record.breakDurationTotal = updatedBreaks.reduce((sum, b) => sum + b.duration, 0);
      }
      setActiveShift(prev => prev ? { ...prev, isOnBreak: false, breakStartTime: undefined } : null);
    }

    updatedRecords[todayRecordIdx] = record;
    setRecords(updatedRecords);
  };

  const handleClockOut = () => {
    if (!activeShift) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecordIdx = records.findIndex(
      (r) => r.staffId === activeStaffId && r.date === todayStr && !r.clockOut
    );
    if (todayRecordIdx === -1) return;

    let nowIso = new Date().toISOString();
    const updatedRecords = [...records];
    const record = { ...updatedRecords[todayRecordIdx] };

    // End break first if still open on break
    if (activeShift.isOnBreak && activeShift.breakStartTime) {
      const activeBreakIdx = record.breaks.findIndex((b) => !b.end);
      if (activeBreakIdx !== -1) {
        const breakStart = new Date(record.breaks[activeBreakIdx].start);
        const breakEnd = new Date(nowIso);
        const diffMins = Math.max(0, Math.round((breakEnd.getTime() - breakStart.getTime()) / 60000));
        record.breaks[activeBreakIdx] = {
          ...record.breaks[activeBreakIdx],
          end: nowIso,
          duration: diffMins,
        };
        record.breakDurationTotal = record.breaks.reduce((sum, b) => sum + b.duration, 0);
      }
    }

    record.clockOut = nowIso;
    
    // Capture check-out coordinates during exit
    record.clockOutLatitude = currentLatitude;
    record.clockOutLongitude = currentLongitude;
    record.clockOutDistanceFromLocation = Number(distance.toFixed(0));
    record.isClockOutOutOfBounds = isOutOfBounds;
    
    // Calculate total hours
    const startObj = new Date(record.clockIn);
    const endObj = new Date(nowIso);
    const totalDiffMs = endObj.getTime() - startObj.getTime();
    const totalDecimalHours = Math.max(0, totalDiffMs / 3600000);
    
    // Deduct total cumulative break minutes
    const netWorkedHours = Math.max(0, totalDecimalHours - (record.breakDurationTotal / 60));
    record.totalHours = Number(netWorkedHours.toFixed(2));

    // Overtime tracking logic: Cap of 8 hours, extra counts as Overtime!
    if (netWorkedHours > 8) {
      record.regularHours = 8;
      record.overtimeHours = Number((netWorkedHours - 8).toFixed(2));
    } else {
      record.regularHours = Number(netWorkedHours.toFixed(2));
      record.overtimeHours = 0;
    }

    updatedRecords[todayRecordIdx] = record;
    setRecords(updatedRecords);
    setActiveShift(null);

    // If clocked out with major overtime (e.g., > 1 hour), trigger simulated notification alert for manager review
    if (record.overtimeHours > 1) {
      const notifId = `notif-${Date.now()}`;
      const newNotif: ManagerNotification = {
        id: notifId,
        staffId: activeStaffId,
        staffName: currentStaffDetails.name,
        type: 'OVERTIME_REQUEST',
        timestamp: new Date().toISOString(),
        details: `Logged ${record.overtimeHours.toFixed(1)} hrs of overtime today (Total: ${record.totalHours.toFixed(1)} hrs).`,
        recordId: record.id,
        read: false,
        status: 'Pending',
      };
      setNotifications((prev) => [newNotif, ...prev]);
      sendPushAlert(newNotif);
    }
  };

  // --- Remote Waiver Modal Confirm ---
  const handleRemoteClockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteReason.trim()) return;
    handleClockIn(remoteReason);
    setRemoteReason('');
    setShowRemoteModal(false);
  };

  // --- Manual Timesheet Correction Form Submit ---
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrReason.trim()) return;

    const recordId = `rec-corr-${Date.now()}`;
    // Construct local timestamp representations for display/calculation
    const startIso = `${corrDate}T${corrClockIn}:00.000Z`;
    const endIso = `${corrDate}T${corrClockOut}:00.000Z`;

    const startObj = new Date(startIso);
    const endObj = new Date(endIso);
    const totalDiffMs = Math.max(0, endObj.getTime() - startObj.getTime());
    const totalDecimalHours = totalDiffMs / 3600000;
    const netWorkedHours = Math.max(0, totalDecimalHours - (corrBreaks / 60));
    const roundedTotal = Number(netWorkedHours.toFixed(2));

    let regH = roundedTotal;
    let otH = 0;
    if (roundedTotal > 8) {
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
      status: 'Pending',
      notes: `Corr Req: ${corrReason}`,
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

    setCorrReason('');
    setShowCorrectionModal(false);
  };

  // --- Manager Approvals Queue Commands ---
  const resolveNotification = (notifId: string, action: 'Approved' | 'Rejected') => {
    // Clear from selection if present
    setSelectedNotifIds((prev) => prev.filter((id) => id !== notifId));

    // Update Notification status
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, status: action, read: true } : n))
    );

    // Update corresponding attendance record
    const targetNotif = notifications.find((n) => n.id === notifId);
    if (targetNotif) {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id === targetNotif.recordId) {
            return {
              ...r,
              status: action,
              approvedBy: 'Tunde Bakare (Admin)',
              approvedAt: new Date().toISOString(),
            };
          }
          return r;
        })
      );
    }
  };

  const toggleSelectNotif = (notifId: string) => {
    setSelectedNotifIds((prev) =>
      prev.includes(notifId)
        ? prev.filter((id) => id !== notifId)
        : [...prev, notifId]
    );
  };

  const handleToggleSelectAll = () => {
    const pendingNotifs = notifications.filter((n) => n.status === 'Pending');
    const allPendingIds = pendingNotifs.map((n) => n.id);
    const isAllSelected = allPendingIds.every((id) => selectedNotifIds.includes(id)) && allPendingIds.length > 0;

    if (isAllSelected) {
      setSelectedNotifIds((prev) => prev.filter((id) => !allPendingIds.includes(id)));
    } else {
      setSelectedNotifIds((prev) => {
        const otherSelectedIds = prev.filter((id) => !allPendingIds.includes(id));
        return [...otherSelectedIds, ...allPendingIds];
      });
    }
  };

  const handleBulkApprove = () => {
    if (selectedNotifIds.length === 0) return;

    // Filter to selection that's actually pending
    const actualPendingSelections = notifications.filter(
      (n) => selectedNotifIds.includes(n.id) && n.status === 'Pending'
    );
    if (actualPendingSelections.length === 0) {
      setSelectedNotifIds([]);
      return;
    }

    const approvedIds = actualPendingSelections.map((n) => n.id);
    const approvedRecordIds = actualPendingSelections.map((n) => n.recordId);

    // Update selected notifications to Approved
    setNotifications((prev) =>
      prev.map((n) =>
        approvedIds.includes(n.id) ? { ...n, status: 'Approved', read: true } : n
      )
    );

    // Update corresponding attendance records
    setRecords((prev) =>
      prev.map((r) => {
        if (approvedRecordIds.includes(r.id)) {
          return {
            ...r,
            status: 'Approved',
            approvedBy: 'Tunde Bakare (Admin)',
            approvedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // Create custom push notification alert sound and banner
    const alertNotif: ManagerNotification = {
      id: `bulk-alert-${Date.now()}`,
      staffId: 'system',
      staffName: 'Admin System',
      type: 'CORRECTION_REQUEST',
      timestamp: new Date().toISOString(),
      details: `Successfully approved & verified ${approvedIds.length} waiver request(s) in bulk!`,
      recordId: '',
      read: false,
      status: 'Approved'
    };
    sendPushAlert(alertNotif);

    // Reset selection
    setSelectedNotifIds([]);
  };

  // --- Add New Staff Member Form Submit ---
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const newEmp: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      department: newStaffDept,
      role: 'Employee',
      hourlyRate: Number(newStaffRate),
      overtimeRate: Math.round(Number(newStaffRate) * 1.5),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80` // generic template
    };

    setStaff((prev) => [...prev, newEmp]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffRate(2500);
    setShowAddStaffModal(false);
  };

  // --- Native Notification Permission Request ---
  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setNativePermission(permission);
        if (permission === 'granted') {
          // Send test alert
          const notof: ManagerNotification = {
            id: `notif-perm-${Date.now()}`,
            staffId: 'system',
            staffName: 'Admin System',
            type: 'CORRECTION_REQUEST',
            timestamp: new Date().toISOString(),
            details: 'Real browser desktop notifications activated successfully!',
            recordId: '',
            read: false,
            status: 'Approved'
          };
          sendPushAlert(notof);
        }
      });
    } else {
      console.warn('Desktop Notification API is not supported in this browser environment.');
    }
  };

  // --- Automated Report scheduler run simulator ---
  const triggerScheduledRunSimulation = () => {
    const monthFormatter = new Date(reportMonth + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const staffLabel = reportStaffFilter === 'All' ? 'All Staff Group' : (staff.find(s => s.id === reportStaffFilter)?.name || 'Filtered');

    if (autoSchedulerFormats === 'PDF' || autoSchedulerFormats === 'Both') {
      exportToPDF(filteredReportRecords, monthFormatter, staffLabel);
    }
    if (autoSchedulerFormats === 'CSV' || autoSchedulerFormats === 'Both') {
      exportToCSV(filteredReportRecords, `${monthFormatter.replace(' ', '_')}_automated_payroll_timesheet`);
    }

    const newLog = {
      id: `hist-${Date.now()}`,
      month: monthFormatter,
      generatedAt: new Date().toISOString(),
      formats: autoSchedulerFormats === 'Both' ? 'Both (PDF + CSV)' : `${autoSchedulerFormats} Document`,
      deliveredTo: recipientEmail || 'eunicelouisiana37@gmail.com',
      status: 'Delivered (Auto-Run)'
    };

    setSchedulerHistory(prev => [newLog, ...prev]);

    // Send visual audio notification
    const notif: ManagerNotification = {
      id: `notif-${Date.now()}`,
      staffId: 'system',
      staffName: 'Automated Mailer',
      type: 'CLOCK_IN_BOUNDS_VIOLATION',
      timestamp: new Date().toISOString(),
      details: `${monthFormatter} payroll files compiled & emailed successfully to ${recipientEmail || 'eunicelouisiana37@gmail.com'}!`,
      recordId: '',
      read: false,
      status: 'Approved'
    };
    sendPushAlert(notif);
  };

  // --- Financial Stats & Summary Payroll Calculations ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === todayStr);
  const presentCount = new Set(todayRecords.map((r) => r.staffId)).size;
  const onBreakCount = todayRecords.filter((r) => {
    // Active record for staff that is on break
    if (r.clockOut) return false;
    // Check if open shift is active and on break
    const hasOpenBreak = r.breaks.some((b) => !b.end);
    return hasOpenBreak;
  }).length;

  const totalOvertimeToday = todayRecords.reduce((sum, r) => sum + r.overtimeHours, 0);

  // Computes estimated gross earnings today for all checked-in staff
  const totalWagesToday = todayRecords.reduce((sum, r) => {
    const hourlyVal = currentStaffDetails.hourlyRate; // simplification or fetch associated rates
    const assocStaff = staff.find((s) => s.id === r.staffId) || currentStaffDetails;
    const regularPay = r.regularHours * assocStaff.hourlyRate;
    const overtimePay = r.overtimeHours * assocStaff.overtimeRate;
    return sum + regularPay + overtimePay;
  }, 0);

  // Filter records for monthly timesheet summary
  const filteredReportRecords = records.filter((r) => {
    const rMonth = r.date.substring(0, 7); // 'YYYY-MM'
    const matchMonth = rMonth === reportMonth;
    const matchStaff = reportStaffFilter === 'All' || r.staffId === reportStaffFilter;
    return matchMonth && matchStaff;
  });

  return (
    <div className="min-h-screen text-[#f1f5f9] flex flex-col antialiased">
      
      {/* --- SIMULATED PUSH NOTIFICATION ALERTS OVERLAY (Manager Notification System) --- */}
      <AnimatePresence>
        {showPushNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            id="manager-push-alert"
            className="fixed top-4 right-4 z-50 bg-[#0f172a]/95 backdrop-blur-lg text-white p-4 rounded-xl shadow-[0_0_30px_rgba(212,168,67,0.15)] border border-[#D4A843]/40 border-l-4 border-l-[#D4A843] max-w-sm w-full cursor-pointer hover:bg-slate-900 transition"
            onClick={() => {
              setCurrentRole('Manager');
              setShowPushNotification(null);
              // scroll to approval section if possible
              const el = document.getElementById('pending-approvals-queue');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="flex gap-3">
              <div className="bg-[#D4A843]/20 p-2 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center text-[#D4A843]">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#D4A843] font-bold">Manager Alert Triggered</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPushNotification(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h4 className="font-semibold text-sm mt-1">{showPushNotification.staffName}</h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                  {showPushNotification.details}
                </p>
                <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-2 font-mono">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Click to view Approval Queue</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN HEADER SYSTEM --- */}
      <header className="bg-[#070b14]/80 backdrop-blur-xl text-white shadow-[0_4px_30px_rgba(0,0,0,0.4)] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#1A3C6E] to-[#D4A843] flex items-center justify-center shadow-lg border border-[#D4A843]/40">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold tracking-widest text-[#D4A843] uppercase bg-[#D4A843]/20 px-2 py-0.5 rounded-full border border-[#D4A843]/25 immersive-glow-gold">
                  SignPost Pro
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Staff Attendance Tracker
              </h1>
            </div>
          </div>

          {/* Quick Stats Panel in Header */}
          <div className="hidden lg:flex items-center gap-4 bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 animate-pulse">●</span>
              <span className="text-slate-300">{presentCount} Online</span>
            </div>
            <div className="border-r border-white/10 h-3" />
            <div className="text-slate-300">{onBreakCount} On Break</div>
            <div className="border-r border-white/10 h-3" />
            <div className="text-[#D4A843] font-semibold">{formatDateStr(time.toISOString().split('T')[0])}</div>
          </div>

          {/* Active Controls & Profile Selector */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            
            {/* Staff Selector (Useful for simulating multiple employee actions) */}
            {currentRole === 'Employee' && (
              <div className="flex items-center bg-[#070b14] rounded-lg px-2 py-1 border border-white/10 text-xs gap-1.5 shadow-inner">
                <span className="text-slate-400">Acting As:</span>
                <select 
                  value={activeStaffId}
                  onChange={(e) => setActiveStaffId(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0b0f19] text-white">
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manager View vs Employee View Toggler (Golden Accent) */}
            <div className="flex bg-[#070b14] p-0.5 rounded-xl border border-white/10 text-xs shadow-inner">
              <button
                onClick={() => setCurrentRole('Employee')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                  currentRole === 'Employee' 
                    ? 'bg-gradient-to-r from-[#1A3C6E] to-[#255496] text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Staff Portal
              </button>
              <button
                onClick={() => setCurrentRole('Manager')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                  currentRole === 'Manager' 
                    ? 'bg-[#D4A843] text-slate-950 font-bold shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Manager Panel
                {notifications.filter(n => n.status === 'Pending').length > 0 && (
                  <span className="bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono animate-bounce shrink-0">
                    {notifications.filter(n => n.status === 'Pending').length}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* --- APP CONTAINER --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* === FACE 1: EMPLOYEE STAFF CLOCK PORTAL === */}
        {currentRole === 'Employee' && (
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
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Live Server Time (West African Standard)</span>
                    <span className="text-5xl font-black font-mono tracking-tight text-white mt-2 immersive-glow-gold">
                      {time.toLocaleTimeString('en-US', { hour12: true })}
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
              <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-5">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
                      Geofence Guard Area & GPS Simulator
                    </h3>
                    <p className="text-xs text-slate-400">Restricts employee checkins to within designated site radius</p>
                  </div>
                  
                  {/* Select target Workplace */}
                  <div className="flex gap-2">
                    <select 
                      value={selectedOfficeId} 
                      onChange={(e) => setSelectedOfficeId(e.target.value)}
                      className="text-xs bg-[#070b14] text-white border border-white/10 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A843] cursor-pointer"
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.id} className="bg-[#0b0f19] text-white">{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Simulated GIS map representation */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Interactive Visual Radar Plot */}
                  <div className="md:col-span-3 bg-slate-950/70 h-64 rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
                    <div className="absolute inset-0 opacity-10" style={{ 
                      backgroundImage: 'radial-gradient(ellipse at center, #10b981 1px, transparent 1px)', 
                      backgroundSize: '16px 16px' 
                    }} />

                    {/* Concentric Circle geofence radar sweep animation */}
                    <div className="absolute h-48 w-48 rounded-full border border-[#D4A843]/15 flex items-center justify-center animate-pulse" />
                    <div className="absolute h-36 w-36 rounded-full border border-[#D4A843]/20 flex items-center justify-center" />
                    <div className="absolute h-20 w-20 rounded-full bg-[#1A3C6E]/20 border border-[#D4A843]/30 flex items-center justify-center" />

                    {/* Workplace coordinate focal pin */}
                    <div className="absolute z-10 text-center">
                      <div className="h-6 w-6 bg-[#D4A843] rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 mx-auto animate-bounce">
                        <Building className="h-3 w-3 text-slate-950" />
                      </div>
                      <span className="text-[9px] text-slate-300 font-bold block mt-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-white/5">
                        {activeOffice.name.split(' ')[0]} HQ
                      </span>
                    </div>

                    {/* Employee virtual placement dot */}
                    <motion.div 
                      animate={{ 
                        x: isOutOfBounds ? 70 : 15, 
                        y: isOutOfBounds ? -60 : 15 
                      }} 
                      transition={{ type: 'spring', damping: 15 }}
                      className="absolute z-20"
                    >
                      <div className="relative">
                        <span className="absolute -top-1 -left-1 inline-flex h-4 w-4 rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
                        <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-md border-2 border-white ${isOutOfBounds ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`}>
                          <User className="h-2 w-2 text-white" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Radar Line sweep */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent origin-center animate-spin" style={{ animationDuration: '6s' }} />

                    {/* Map Labels details overlays */}
                    <div className="absolute top-2 left-2 bg-slate-950/90 px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400 flex flex-col border border-white/5">
                      <span>Office Lat: {activeOffice.latitude.toFixed(4)}</span>
                      <span>Office Lng: {activeOffice.longitude.toFixed(4)}</span>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-slate-950/90 px-2.5 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 border border-white/5">
                      <span className={`h-2 w-2 rounded-full ${isOutOfBounds ? 'bg-brand-danger' : 'bg-brand-success'}`} />
                      <span className="text-white">Emp Distance: {distance.toLocaleString()}m</span>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-[#D4A843] px-2 py-0.5 rounded border border-white/5">
                        Radar Lock
                      </span>
                    </div>
                  </div>

                  {/* Geofencing Tuning Controls (To make Out of bounds super testable) */}
                  <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A843]">GPS Testing Controller</h4>
                      
                      {/* Toggle Manual Override */}
                      <label className="flex items-center gap-2 cursor-pointer pt-1 pb-1">
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
                            <span className="text-[10px] text-slate-400 block">GPS Latitude Coordinate</span>
                            <input 
                              type="number" 
                              step="0.0001"
                              value={mockLat}
                              onChange={(e) => setMockLat(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono bg-slate-950 border border-white/10 text-white rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">GPS Longitude Coordinate</span>
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
                        onClick={forceMockToOffice}
                        className="w-full py-2 bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 border border-[#10B981]/35 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Simulating INSIDE Geofence
                      </button>

                      <button
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

                      {!isMockingGPS && (
                        <button
                          onClick={triggerRealGPS}
                          className="w-full py-2 bg-sky-950 hover:bg-sky-900 border border-sky-800/50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Compass className="h-3.5 w-3.5 text-[#D4A843]" /> Re-poll Real Coordinates
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

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
                            <p className="text-slate-400 mt-0.5">Logged: <strong className="font-semibold text-slate-200">{formatHours(todayRec.totalHours)}</strong> work hours</p>
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
        )}
         {/* === FACE 2: MANAGER / ADMIN CONTROL CENTER === */}
        {currentRole === 'Manager' && (
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
                        <label className="text-slate-400 font-semibold block mb-1">Target Payroll Contact Email</label>
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
                        Trigger Monthly Auto-Run Now
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
                                Delivered
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* DAILY ATTENDANCE DATABASE LOGS TABLE */}
              <div className="xl:col-span-2 bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 overflow-hidden font-sans">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#1A3C6E]/20">
                  <div>
                    <h3 className="font-bold text-base text-white">Today's Live Attendance Dashboard</h3>
                    <p className="text-xs text-slate-400">All registered check-ins logged for: {formatDateStr(todayStr)}</p>
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
                          const empDetails = staff.find((s) => s.id === r.staffId) || { avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' };
                          return (
                            <tr key={r.id} className="hover:bg-white/5 text-slate-200 border-white/5">
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <img src={empDetails.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                  <div>
                                    <p className="font-bold text-white">{r.staffName}</p>
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
                                <p className="font-semibold text-slate-200">Worked: <span className="font-bold text-[#D4A843] font-mono">{r.totalHours} hrs</span></p>
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
                      className="bg-transparent focus:outline-none focus:ring-0 text-white font-bold border-0 cursor-pointer"
                    />
                  </div>

                  {/* Filter Staff */}
                  <div className="text-white text-xs shrink-0 flex items-center bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 shadow shadow-indigo-950/20 font-medium">
                    <span className="text-slate-400 mr-1.5 text-[11px]">Staff filter:</span>
                    <select 
                      value={reportStaffFilter}
                      onChange={(e) => setReportStaffFilter(e.target.value)}
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer border-0"
                    >
                      <option value="All" className="bg-[#0b0f19] text-white">All Staff Registry</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0b0f19] text-white">{s.name}</option>
                      ))}
                    </select>
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
                        // Determine staff filter string for PDF
                        const staffLabel = reportStaffFilter === 'All' ? 'All Staff Group' : (staff.find(s => s.id === reportStaffFilter)?.name || 'Filtered');
                        exportToPDF(filteredReportRecords, monthName, staffLabel);
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
                            <tr key={r.id} className="hover:bg-white/5">
                              <td className="p-4 font-mono font-semibold text-slate-300">{formatDateStr(r.date)}</td>
                              <td className="p-4">
                                <span className="font-bold text-white">{r.staffName}</span>
                                <span className="text-[10px] text-slate-450 block">{assocStaff.department}</span>
                              </td>
                              <td className="p-4 font-mono text-slate-300">{r.regularHours} hrs</td>
                              <td className="p-4 font-mono text-red-400 font-bold">{r.overtimeHours} hrs</td>
                              <td className="p-4 font-mono font-bold text-[#D4A843] immersive-glow-gold">{formatNaira(grossPaid || 0)}</td>
                              <td className="p-4">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                                  r.isOutOfBounds 
                                    ? 'bg-[#EF4444]/15 text-red-300 border-[#EF4444]/25' 
                                    : 'bg-[#10B981]/15 text-emerald-355 border-[#10B981]/25'
                                }`}>
                                  {r.isOutOfBounds ? `Out (${r.distanceFromLocation}m)` : `In Office (${r.distanceFromLocation}m)`}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                                  r.status === 'Approved' 
                                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' 
                                    : r.status === 'Pending' 
                                      ? 'bg-amber-500/15 text-amber-350 border-amber-500/30' 
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
        )}

      </main>

      {/* --- REVERENT VISUAL FOOTER --- */}
      <footer className="bg-[#0F1729] text-slate-400 text-xs py-8 border-t border-slate-800/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1 text-white">
              <ShieldCheck className="h-4.5 w-4.5 text-[#D4A843]" />
              <span className="font-bold tracking-tight text-white/90">SignPost Security Protocol Guard Enabled</span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium">
              Geofence-restricted attendance validation • Secured with standard cryptographic SHA256 hashes
            </p>
          </div>
          <p className="text-slate-500 text-[10.5px]">
            &copy; 1989 - 2026 SignPost Suite. All rights registered. Made with precision visual styling.
          </p>
        </div>
      </footer>

      {/* --- OUT OF BOUNDS REMOTELY OVERRIDE ENTRY SHEET FORM (Modal) --- */}
      {showRemoteModal && (
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
              <button onClick={() => setShowRemoteModal(false)} className="text-white/80 hover:text-white cursor-pointer">
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
      )}

      {/* --- ADD NEW STAFF MODAL (Admin panel tool) --- */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.56)] overflow-hidden max-w-md w-full border border-white/10"
          >
            <div className="bg-[#1A3C6E]/40 text-white p-5 flex justify-between items-center border-b border-white/5">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Plus className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
                Register New Employee Profile
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
              <div className="space-y-3 font-medium text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Full Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Chimaobi Adeleke"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Workplace Email</label>
                  <input
                    type="email"
                    required
                    placeholder="chimaobi.a@churchos.ng"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1">Department</label>
                    <select
                      value={newStaffDept}
                      onChange={(e) => setNewStaffDept(e.target.value)}
                      className="w-full text-xs border border-white/10 rounded-xl p-3 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-[#D4A843] cursor-pointer"
                    >
                      <option value="Administration" className="bg-[#0b0f19] text-white">Administration</option>
                      <option value="Media & Communications" className="bg-[#0b0f19] text-white">Media & Comms</option>
                      <option value="Operations & Facilities" className="bg-[#0b0f19] text-white">Operations</option>
                      <option value="Finance & Accounts" className="bg-[#0b0f19] text-white">Finance & Accounts</option>
                      <option value="Pastoral & Care" className="bg-[#0b0f19] text-white">Pastoral Care</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Hourly Base Pay (₦)</label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={newStaffRate}
                      onChange={(e) => setNewStaffRate(parseInt(e.target.value) || 2500)}
                      className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A843] text-slate-950 hover:bg-amber-500 px-5 py-2.5 rounded-xl shadow-lg border-0 cursor-pointer font-black"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- MANUAL TIMESHEET CORRECTION MODAL --- */}
      {showCorrectionModal && (
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
              <button onClick={() => setShowCorrectionModal(false)} className="text-white/80 hover:text-white cursor-pointer">
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
                      className="w-full text-xs bg-[#090d16] text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
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
      )}

    </div>
  );
}

// Simple Helper Coins icon for backup
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
