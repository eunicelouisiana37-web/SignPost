import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bell, 
  User, 
  Briefcase, 
  X,
  Lock,
  Activity,
  ShieldCheck,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { StaffMember, AttendanceRecord, WorkingLocation, ManagerNotification, ObservedHoliday } from './types';
import { 
  INITIAL_LOCATIONS, 
  INITIAL_STAFF, 
  INITIAL_RECORDS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_HOLIDAYS
} from './data/mockData';
import { 
  calculateDistance, 
  formatNaira, 
  formatHours, 
  formatTimeRaw, 
  formatDateStr, 
  exportToCSV, 
  exportToPDF,
  getLocalDateStr
} from './utils';

// Extracted Modular Components & Modals
import { ClockPortal } from './components/ClockPortal';
import { ManagerDashboard } from './components/ManagerDashboard';
import { RemoteClockInModal } from './components/modals/RemoteClockInModal';
import { CorrectionModal } from './components/modals/CorrectionModal';
import { AddStaffModal } from './components/modals/AddStaffModal';
import { EmployeeSignInPortal } from './components/EmployeeSignInPortal';

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
  const [activeStaffId, setActiveStaffId] = useState<string>(() => {
    return localStorage.getItem('co_active_staff_id') || 'staff-1';
  }); // Currently selected employee to perform clock action
  const [isEmployeeSignedIn, setIsEmployeeSignedIn] = useState<boolean>(() => {
    return localStorage.getItem('co_is_employee_signed_in') === 'true';
  });
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
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

  // --- Add Staff Modal & Inputs ---
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffDept, setNewStaffDept] = useState('Administration');
  const [newStaffRate, setNewStaffRate] = useState<number>(2500);

  // --- Correction Timesheet Request Modals & Inputs ---
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState('');
  const [corrClockIn, setCorrClockIn] = useState('08:00');
  const [corrClockOut, setCorrClockOut] = useState('17:00');
  const [corrReason, setCorrReason] = useState('');
  const [corrBreaks, setCorrBreaks] = useState<number>(60);

  // --- Administration Core Configuration states ---
  const [strictGeofence, setStrictGeofence] = useState<boolean>(() => {
    const saved = localStorage.getItem('co_strict_geofence');
    return saved === 'true';
  });
  const [shiftStartTime, setShiftStartTime] = useState<string>(() => {
    return localStorage.getItem('co_shift_start') || '08:30';
  });

  const [isSimulateLate, setIsSimulateLate] = useState<boolean>(false);

  // --- Automated Scheduler Delivery Configuration Slots ---
  const [autoSchedulerEnabled, setAutoSchedulerEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('co_auto_scheduler');
    return saved ? saved === 'true' : true;
  });
  const [autoSchedulerFormats, setAutoSchedulerFormats] = useState<'PDF' | 'CSV' | 'Both'>(() => {
    return (localStorage.getItem('co_scheduler_formats') as any) || 'Both';
  });
  const [recipientEmail, setRecipientEmail] = useState<string>(() => {
    return localStorage.getItem('co_recipient_email') || 'eunicelouisiana37@gmail.com';
  });

  const [schedulerHistory, setSchedulerHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('co_scheduler_history');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'hist-1',
        month: 'May 2026',
        generatedAt: '2026-05-31T23:59:00Z',
        formats: 'Both (PDF + CSV)',
        deliveredTo: 'eunicelouisiana37@gmail.com',
        status: 'Downloaded (Manual Run)'
      },
      {
        id: 'hist-2',
        month: 'April 2026',
        generatedAt: '2026-04-30T23:59:00Z',
        formats: 'Both (PDF + CSV)',
        deliveredTo: 'eunicelouisiana37@gmail.com',
        status: 'Downloaded (Manual Run)'
      }
    ];
  });

  const [holidays, setHolidays] = useState<ObservedHoliday[]>(() => {
    const saved = localStorage.getItem('co_holidays');
    return saved ? JSON.parse(saved) : INITIAL_HOLIDAYS;
  });

  // Native notification permission tracking
  const [nativePermission, setNativePermission] = useState<string>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  });

  // Any active virtual toast alerts
  const [showPushNotification, setShowPushNotification] = useState<ManagerNotification | null>(null);

  // PIN-based Authentication Gate for Manager Panel
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Sync locations to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_locations', JSON.stringify(locations));
  }, [locations]);

  // Sync staff to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_staff', JSON.stringify(staff));
  }, [staff]);

  // Sync records to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_records', JSON.stringify(records));
  }, [records]);

  // Sync notifications to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Sync holidays to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_holidays', JSON.stringify(holidays));
  }, [holidays]);

  // Sync employee active ID and signed in status to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_is_employee_signed_in', String(isEmployeeSignedIn));
  }, [isEmployeeSignedIn]);

  useEffect(() => {
    localStorage.setItem('co_active_staff_id', activeStaffId);
  }, [activeStaffId]);

  // --- Inactivity / Idle Timer for Employee Portal ---
  useEffect(() => {
    if (!isEmployeeSignedIn || currentRole !== 'Employee') {
      return;
    }

    const resetActivity = () => {
      setLastActivity(Date.now());
    };

    // User activity events
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((ev) => {
      window.addEventListener(ev, resetActivity);
    });

    // Setup initial activity time
    setLastActivity(Date.now());

    return () => {
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, resetActivity);
      });
    };
  }, [isEmployeeSignedIn, currentRole]);

  const remainingTimeSeconds = Math.max(
    0,
    Math.floor((lastActivity + 15 * 60 * 1000 - time.getTime()) / 1000)
  );

  useEffect(() => {
    if (isEmployeeSignedIn && currentRole === 'Employee' && remainingTimeSeconds <= 0) {
      setIsEmployeeSignedIn(false);
    }
  }, [remainingTimeSeconds, isEmployeeSignedIn, currentRole]);

  // Sync strictGeofence and shiftStartTime to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_strict_geofence', String(strictGeofence));
    localStorage.setItem('co_shift_start', shiftStartTime);
  }, [strictGeofence, shiftStartTime]);

  // Sync autoSchedulerEnabled, autoSchedulerFormats, and recipientEmail to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_auto_scheduler', String(autoSchedulerEnabled));
    localStorage.setItem('co_scheduler_formats', autoSchedulerFormats);
    localStorage.setItem('co_recipient_email', recipientEmail);
  }, [autoSchedulerEnabled, autoSchedulerFormats, recipientEmail]);

  // Sync schedulerHistory to LocalStorage
  useEffect(() => {
    localStorage.setItem('co_scheduler_history', JSON.stringify(schedulerHistory));
  }, [schedulerHistory]);

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Shift Timer state for active user on load / activeStaffId change
  useEffect(() => {
    const todayStr = getLocalDateStr();
    const todayOpenRecord = records.find(
      (r) => r.staffId === activeStaffId && r.date === todayStr && !r.clockOut
    );

    if (todayOpenRecord) {
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
        setIsMockingGPS(true); // default option to ensure simulator works
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleEmployeeSignIn = (enteredName: string, enteredId: string, enteredDept: string) => {
    const cleanId = enteredId.trim();
    const cleanName = enteredName.trim();
    const cleanDept = enteredDept.trim();

    if (!cleanId || !cleanName || !cleanDept) {
      return { success: false, error: 'Please enter all details.' };
    }

    // Match existing staff by id (case insensitive)
    const existing = staff.find((s) => s.id.toLowerCase() === cleanId.toLowerCase());

    if (existing) {
      // Validate name & department (case insensitive for user friendliness but strict matching)
      const nameMatches = existing.name.toLowerCase() === cleanName.toLowerCase();
      const deptMatches = existing.department.toLowerCase() === cleanDept.toLowerCase();

      if (!nameMatches || !deptMatches) {
        let mismatchDetails = [];
        if (!nameMatches) mismatchDetails.push('Name');
        if (!deptMatches) mismatchDetails.push('Department');
        return { 
          success: false, 
          error: `Staff ID "${cleanId}" is registered, but the entered ${mismatchDetails.join(' and ')} does not match our records. Please verify or contact your manager.` 
        };
      }

      // Successful Match
      setActiveStaffId(existing.id);
      setIsEmployeeSignedIn(true);
      setLastActivity(Date.now());
      return { success: true, message: `Welcome back, ${existing.name}!` };
    } else {
      // Create a brand new staff with entered details
      const newStaff: StaffMember = {
        id: cleanId,
        name: cleanName,
        email: `${cleanId.toLowerCase()}@churchos.ng`,
        department: cleanDept,
        role: 'Employee',
        hourlyRate: 3000,
        overtimeRate: 4500,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=1A3C6E&textColor=ffffff`,
      };

      setStaff((prev) => [...prev, newStaff]);
      setActiveStaffId(newStaff.id);
      setIsEmployeeSignedIn(true);
      setLastActivity(Date.now());
      return { success: true, message: `Profile registered! Welcome to the portal, ${cleanName}.` };
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // derived values
  const currentStaffDetails = staff.find((s) => s.id === activeStaffId) || staff[0];
  const activeOffice = locations.find((l) => l.id === selectedOfficeId) || locations[0];
  const userLat = isMockingGPS ? mockLat : (userCoords?.latitude || activeOffice.latitude);
  const userLng = isMockingGPS ? mockLng : (userCoords?.longitude || activeOffice.longitude);
  const distance = Math.round(calculateDistance(userLat, userLng, activeOffice.latitude, activeOffice.longitude));
  const isOutOfBounds = distance > activeOffice.radiusMeters;

  // Derived Manager Name (from Requirement 2: formats `${name} (Manager)`)
  const currentManagerName = (() => {
    const activeStaff = staff.find((s) => s.id === activeStaffId) || currentStaffDetails;
    return `${activeStaff.name} (Manager)`;
  })();

  const forceMockToOffice = (offsetMeters: any = 0) => {
    setIsMockingGPS(true);
    const meters = typeof offsetMeters === 'number' ? offsetMeters : 0;
    // Rough coordinate translation (1 meter ~ 0.000009 degrees)
    const delta = (meters / 111111);
    setMockLat(activeOffice.latitude + delta);
    setMockLng(activeOffice.longitude);
  };

  const checkIsLate = () => {
    if (isSimulateLate) return true;
    const [gateH, gateM] = shiftStartTime.split(':').map(Number);
    const nowH = time.getHours();
    const nowM = time.getMinutes();
    if (nowH > gateH) return true;
    if (nowH === gateH && nowM > gateM) return true;
    return false;
  };

  // --- Push action alerts dispatcher helper ---
  const sendPushAlert = (notif: ManagerNotification) => {
    setShowPushNotification(notif);
    // Auto-dim push notification banner
    setTimeout(() => {
      setShowPushNotification((curr) => (curr && curr.id === notif.id ? null : curr));
    }, 6000);

    // Trigger local HTML5 audio alert or synthesis if requested
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`SignPost: ${notif.staffName}`, {
          body: notif.details,
          icon: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=150'
        });
      } catch (e) {
        console.warn('Silent local system toast error:', e);
      }
    }
  };

  const requestNotificationPermission = () => {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then((permission) => {
      setNativePermission(permission);
    });
  };

  // --- Clock Actions Core Handlers ---
  const handleClockIn = (overrideReason?: string) => {
    const nowIso = new Date().toISOString();
    const todayStrIn = getLocalDateStr();
    const activeHoliday = holidays.find((h) => h.date === todayStrIn);

    const newRecord: AttendanceRecord = {
      id: `rec-${Date.now()}`,
      staffId: activeStaffId,
      staffName: currentStaffDetails.name,
      date: todayStrIn,
      clockIn: nowIso,
      clockOut: '',
      breaks: [],
      breakDurationTotal: 0,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      latitude: userLat,
      longitude: userLng,
      distanceFromLocation: distance,
      isOutOfBounds: isOutOfBounds,
      isHoliday: !!activeHoliday,
      status: isOutOfBounds ? 'Pending' : 'Approved',
      notes: overrideReason || (activeHoliday ? `Observed Holiday: ${activeHoliday.name}` : checkIsLate() ? 'System Flagged Late Arrival' : 'Standard Gate Clock-in'),
    };

    setRecords((prev) => [newRecord, ...prev]);
    setActiveShift({
      startTime: nowIso,
      isOnBreak: false,
    });

    // Send push alerting sequence to simulation notifications list
    if (isOutOfBounds) {
      const notifId = `notif-${Date.now()}`;
      const newNotif: ManagerNotification = {
        id: notifId,
        staffId: activeStaffId,
        staffName: currentStaffDetails.name,
        type: 'CLOCK_IN_BOUNDS_VIOLATION',
        timestamp: nowIso,
        details: overrideReason || 'Remote clock-in waiver requested.',
        recordId: newRecord.id,
        read: false,
        status: 'Pending',
      };
      setNotifications((prev) => [newNotif, ...prev]);
      sendPushAlert(newNotif);
    } else if (checkIsLate()) {
      const notifId = `notif-${Date.now()}`;
      const newNotif: ManagerNotification = {
        id: notifId,
        staffId: activeStaffId,
        staffName: currentStaffDetails.name,
        type: 'LATE_CLOCK_IN',
        timestamp: nowIso,
        details: `Late intake logged. Arrived past threshold time of ${shiftStartTime}.`,
        recordId: newRecord.id,
        read: false,
        status: 'Approved',
      };
      setNotifications((prev) => [newNotif, ...prev]);
      sendPushAlert(newNotif);
    }
  };

  const handleToggleBreak = () => {
    if (!activeShift) return;
    const nowIso = new Date().toISOString();
    const todayStrBreak = getLocalDateStr();

    const updatedRecords = [...records];
    const todayRecordIdx = updatedRecords.findIndex(
      (r) => r.staffId === activeStaffId && r.date === todayStrBreak && !r.clockOut
    );

    if (todayRecordIdx === -1) return;
    const record = { ...updatedRecords[todayRecordIdx] };

    if (!activeShift.isOnBreak) {
      // Starting Break
      record.breaks = [...record.breaks, { start: nowIso, end: '' }];
      setActiveShift((prev) => prev ? { ...prev, isOnBreak: true, breakStartTime: nowIso } : null);
    } else {
      // Ending Break
      const breakIdx = record.breaks.findIndex((b) => !b.end);
      if (breakIdx !== -1) {
        const breakStartTime = record.breaks[breakIdx].start;
        const diffMs = Math.max(0, new Date(nowIso).getTime() - new Date(breakStartTime).getTime());
        const durationMins = Math.round(diffMs / 60000);

        const updatedBreaks = [...record.breaks];
        updatedBreaks[breakIdx] = {
          ...updatedBreaks[breakIdx],
          end: nowIso,
          duration: durationMins,
        };
        record.breaks = updatedBreaks;
        record.breakDurationTotal = record.breaks.reduce((acc, b) => acc + (b.duration || 0), 0);
      }
      setActiveShift((prev) => prev ? { ...prev, isOnBreak: false, breakStartTime: undefined } : null);
    }

    updatedRecords[todayRecordIdx] = record;
    setRecords(updatedRecords);
  };

  const handleClockOut = () => {
    if (!activeShift) return;
    const nowIso = new Date().toISOString();
    const todayStrOut = getLocalDateStr();

    const updatedRecords = [...records];
    const todayRecordIdx = updatedRecords.findIndex(
      (r) => r.staffId === activeStaffId && r.date === todayStrOut && !r.clockOut
    );

    if (todayRecordIdx === -1) return;
    const record = { ...updatedRecords[todayRecordIdx] };

    // Finalize shift clock-out
    record.clockOut = nowIso;

    // Handle open breaks if any
    const openBreakIdx = record.breaks.findIndex((b) => !b.end);
    if (openBreakIdx !== -1) {
      const bStart = record.breaks[openBreakIdx].start;
      const diffMs = Math.max(0, new Date(nowIso).getTime() - new Date(bStart).getTime());
      const durationMins = Math.round(diffMs / 60000);
      record.breaks[openBreakIdx] = {
        ...record.breaks[openBreakIdx],
        end: nowIso,
        duration: durationMins,
      };
      record.breakDurationTotal = record.breaks.reduce((acc, b) => acc + (b.duration || 0), 0);
    }

    // Calculate total hours worked decimal
    const startMs = new Date(record.clockIn).getTime();
    const endMs = new Date(nowIso).getTime();
    const rawHours = (endMs - startMs) / 3600000;
    const unpaidLunchHours = record.breakDurationTotal / 60;
    const netWorkedHours = Math.max(0, rawHours - unpaidLunchHours);

    const isHoliday = holidays.some((h) => h.date === record.date);
    record.totalHours = Number(netWorkedHours.toFixed(2));
    if (isHoliday) {
      record.isHoliday = true;
      record.regularHours = 0;
      record.overtimeHours = Number(netWorkedHours.toFixed(2));
    } else {
      if (netWorkedHours > 8) {
        record.regularHours = 8;
        record.overtimeHours = Number((netWorkedHours - 8).toFixed(2));
      } else {
        record.regularHours = Number(netWorkedHours.toFixed(2));
        record.overtimeHours = 0;
      }
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

  // --- Manager Approvals Queue Commands ---
  const resolveNotification = (notifId: string, action: 'Approved' | 'Rejected') => {
    setSelectedNotifIds((prev) => prev.filter((id) => id !== notifId));

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, status: action, read: true } : n))
    );

    const targetNotif = notifications.find((n) => n.id === notifId);
    if (targetNotif) {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id === targetNotif.recordId) {
            return {
              ...r,
              status: action,
              approvedBy: currentManagerName,
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

    const actualPendingSelections = notifications.filter(
      (n) => selectedNotifIds.includes(n.id) && n.status === 'Pending'
    );
    if (actualPendingSelections.length === 0) {
      setSelectedNotifIds([]);
      return;
    }

    const approvedIds = actualPendingSelections.map((n) => n.id);
    const approvedRecordIds = actualPendingSelections.map((n) => n.recordId);

    setNotifications((prev) =>
      prev.map((n) =>
        approvedIds.includes(n.id) ? { ...n, status: 'Approved', read: true } : n
      )
    );

    setRecords((prev) =>
      prev.map((r) => {
        if (approvedRecordIds.includes(r.id)) {
          return {
            ...r,
            status: 'Approved',
            approvedBy: currentManagerName,
            approvedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

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
    setSelectedNotifIds([]);
  };

  // State selection inside Manager Queue
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);

  // Simulation triggered Automated Delivery run
  const triggerScheduledRunSimulation = () => {
    const monthFormatter = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const targetId = `sim-run-${Date.now()}`;
    const newEntry = {
      id: targetId,
      month: monthFormatter,
      generatedAt: new Date().toISOString(),
      formats: autoSchedulerFormats === 'Both' ? 'Both (PDF + CSV)' : `${autoSchedulerFormats} Timesheet File`,
      deliveredTo: recipientEmail || 'eunicelouisiana37@gmail.com',
      status: 'Downloaded (Manual Run)'
    };

    setSchedulerHistory((prev) => [newEntry, ...prev]);

    const notif: ManagerNotification = {
      id: `notif-sch-${Date.now()}`,
      staffId: 'system-sched',
      staffName: 'Automated Billing Service',
      type: 'CORRECTION_REQUEST',
      timestamp: new Date().toISOString(),
      details: `${monthFormatter} payroll files downloaded successfully. Deliver to ${recipientEmail || 'eunicelouisiana37@gmail.com'} manually or connect an email service.`,
      recordId: '',
      read: false,
      status: 'Approved'
    };
    sendPushAlert(notif);
  };

  // PIN authentication logic
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPin === '1234') { // Hardcoded correct PIN - replace with backend credential validation
      setIsManagerAuthenticated(true);
      setCurrentRole('Manager');
      setShowManagerPinModal(false);
      setPinError(null);
    } else {
      setPinError('Incorrect PIN');
    }
  };

  // --- Financial Stats & Summary Payroll Calculations ---
  const todayStr = getLocalDateStr();
  const todayRecords = records.filter((r) => r.date === todayStr);
  const presentCount = new Set(todayRecords.map((r) => r.staffId)).size;
  const onBreakCount = todayRecords.filter((r) => {
    if (r.clockOut) return false;
    const hasOpenBreak = r.breaks.some((b) => !b.end);
    return hasOpenBreak;
  }).length;

  const totalOvertimeToday = todayRecords.reduce((sum, r) => sum + r.overtimeHours, 0);

  const totalWagesToday = todayRecords.reduce((sum, r) => {
    const assocStaff = staff.find((s) => s.id === r.staffId) || currentStaffDetails;
    const regularPay = r.regularHours * assocStaff.hourlyRate;
    const overtimePay = r.overtimeHours * assocStaff.overtimeRate;
    return sum + regularPay + overtimePay;
  }, 0);

  // Filter records for monthly timesheet summary
  const [reportMonth, setReportMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  });
  const [reportStaffFilter, setReportStaffFilter] = useState<string>('All');
  const [reportDeptFilter, setReportDeptFilter] = useState<string[]>([]);

  const filteredReportRecords = records.filter((r) => {
    const rMonth = r.date.substring(0, 7); // 'YYYY-MM'
    const matchMonth = rMonth === reportMonth;
    const matchStaff = reportStaffFilter === 'All' || r.staffId === reportStaffFilter;
    const assocStaff = staff.find((s) => s.id === r.staffId);
    const matchDept = reportDeptFilter.length === 0 || (assocStaff && reportDeptFilter.includes(assocStaff.department));
    return matchMonth && matchStaff && matchDept;
  });

  // Developer mode parameters for GPS simulation
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(true);

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
            className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-[#0F1729]/95 text-slate-100 px-5 py-4 rounded-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-start gap-3 max-w-sm w-full font-sans cursor-pointer backdrop-blur-md"
            onClick={() => {
              if (currentRole === 'Employee') {
                if (isManagerAuthenticated) {
                  setCurrentRole('Manager');
                } else {
                  setManagerPin('');
                  setPinError(null);
                  setShowManagerPinModal(true);
                }
              }
              setShowPushNotification(null);
            }}
          >
            <div className="bg-[#D4A843]/10 text-[#D4A843] p-2 rounded-lg border border-[#D4A843]/20 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-[#D4A843] tracking-widest font-mono">Push Notification</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPushNotification(null);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="font-extrabold text-white text-xs mt-1 shrink-0 block">From: {showPushNotification.staffName}</p>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
                {showPushNotification.details}
              </p>
              <div className="flex gap-2 items-center text-[10px] text-slate-450 mt-2 font-mono">
                <Activity className="h-3.5 w-3.5" />
                <span>Click to view Approval Queue</span>
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
            <div className="text-[#D4A843] font-semibold">{formatDateStr(getLocalDateStr())}</div>
          </div>

          {/* Active Controls & Profile Selector */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            
            {/* Staff Selector (Now secure, based on entered details) */}
            {currentRole === 'Employee' && (
              isEmployeeSignedIn ? (
                <div className="flex items-center bg-[#070b14] rounded-lg px-3 py-1.5 border border-emerald-500/10 text-xs gap-2 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-slate-300 font-medium">
                    Portal Active: <span className="text-white font-bold">{currentStaffDetails?.name}</span>
                  </span>
                  <span className="text-slate-500 font-mono text-[10px] hidden md:inline">
                    ({currentStaffDetails?.department})
                  </span>
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 select-none shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Inactivity logout in {formatCountdown(remainingTimeSeconds)}</span>
                  </div>
                  <button
                    onClick={() => setIsEmployeeSignedIn(false)}
                    className="ml-1 text-[10px] uppercase tracking-wider font-extrabold text-[#D4A843] hover:text-red-400 transition bg-transparent border-0 cursor-pointer"
                  >
                    Change User
                  </button>
                </div>
              ) : (
                <div className="flex items-center bg-slate-950/40 rounded-lg px-3 py-1.5 border border-white/5 text-[11px] font-medium text-slate-400 gap-1.5">
                  🔐 Gate Secure &bull; Please Sign In
                </div>
              )
            )}

            {/* Manager View vs Employee View Toggler (Golden Accent) */}
            <div className="flex bg-[#070b14] p-0.5 rounded-xl border border-white/10 text-xs shadow-inner">
              <button
                onClick={() => {
                  setCurrentRole('Employee');
                  setIsManagerAuthenticated(false);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer border-0 ${
                  currentRole === 'Employee' 
                    ? 'bg-gradient-to-r from-[#1A3C6E] to-[#255496] text-white shadow-md' 
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Staff Portal
              </button>
              <button
                onClick={() => {
                  if (isManagerAuthenticated) {
                    setCurrentRole('Manager');
                  } else {
                    setManagerPin('');
                    setPinError(null);
                    setShowManagerPinModal(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer border-0 ${
                  currentRole === 'Manager' 
                    ? 'bg-[#D4A843] text-slate-950 font-bold shadow-md' 
                    : 'text-slate-400 hover:text-white bg-transparent'
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
          !isEmployeeSignedIn ? (
            <EmployeeSignInPortal 
              staff={staff}
              onSignIn={handleEmployeeSignIn}
            />
          ) : (
            <ClockPortal
              currentStaffDetails={currentStaffDetails}
              time={time}
              isOutOfBounds={isOutOfBounds}
              distance={distance}
              activeOffice={activeOffice}
              strictGeofence={strictGeofence}
              checkIsLate={checkIsLate}
              shiftStartTime={shiftStartTime}
              setShowRemoteModal={setShowRemoteModal}
              handleClockIn={handleClockIn}
              activeShift={activeShift}
              handleToggleBreak={handleToggleBreak}
              handleClockOut={handleClockOut}
              records={records}
              activeStaffId={activeStaffId}
              todayStr={todayStr}
              formatNaira={formatNaira}
              formatHours={formatHours}
              formatTimeRaw={formatTimeRaw}
              setCorrDate={setCorrDate}
              setCorrReason={setCorrReason}
              setShowCorrectionModal={setShowCorrectionModal}
              locations={locations}
              selectedOfficeId={selectedOfficeId}
              setSelectedOfficeId={setSelectedOfficeId}
              isDeveloperMode={isDeveloperMode}
              setIsDeveloperMode={setIsDeveloperMode}
              isMockingGPS={isMockingGPS}
              setIsMockingGPS={setIsMockingGPS}
              mockLat={mockLat}
              setMockLat={setMockLat}
              mockLng={mockLng}
              setMockLng={setMockLng}
              isLocating={isLocating}
              geoError={geoError}
              userCoords={userCoords}
              forceMockToOffice={forceMockToOffice}
              isSimulateLate={isSimulateLate}
              setIsSimulateLate={setIsSimulateLate}
              triggerRealGPS={triggerRealGPS}
            />
          )
        )}

        {/* === FACE 2: MANAGER / ADMIN CONTROL CENTER === */}
        {currentRole === 'Manager' && (
          <ManagerDashboard
            presentCount={presentCount}
            staff={staff}
            notifications={notifications}
            totalOvertimeToday={totalOvertimeToday}
            totalWagesToday={totalWagesToday}
            selectedNotifIds={selectedNotifIds}
            handleToggleSelectAll={handleToggleSelectAll}
            toggleSelectNotif={toggleSelectNotif}
            resolveNotification={resolveNotification}
            setShowAddStaffModal={setShowAddStaffModal}
            strictGeofence={strictGeofence}
            setStrictGeofence={setStrictGeofence}
            shiftStartTime={shiftStartTime}
            setShiftStartTime={setShiftStartTime}
            nativePermission={nativePermission}
            requestNotificationPermission={requestNotificationPermission}
            autoSchedulerEnabled={autoSchedulerEnabled}
            setAutoSchedulerEnabled={setAutoSchedulerEnabled}
            autoSchedulerFormats={autoSchedulerFormats}
            setAutoSchedulerFormats={setAutoSchedulerFormats}
            recipientEmail={recipientEmail}
            setRecipientEmail={setRecipientEmail}
            triggerScheduledRunSimulation={triggerScheduledRunSimulation}
            schedulerHistory={schedulerHistory}
            todayRecords={todayRecords}
            filteredReportRecords={filteredReportRecords}
            reportMonth={reportMonth}
            setReportMonth={setReportMonth}
            reportStaffFilter={reportStaffFilter}
            setReportStaffFilter={setReportStaffFilter}
            reportDeptFilter={reportDeptFilter}
            setReportDeptFilter={setReportDeptFilter}
            currentStaffDetails={currentStaffDetails}
            formatNaira={formatNaira}
            formatDateStr={formatDateStr}
            formatTimeRaw={formatTimeRaw}
            exportToCSV={exportToCSV}
            exportToPDF={exportToPDF}
            handleBulkApprove={handleBulkApprove}
            holidays={holidays}
            setHolidays={setHolidays}

            isDeveloperMode={isDeveloperMode}
            setIsDeveloperMode={setIsDeveloperMode}
            isMockingGPS={isMockingGPS}
            setIsMockingGPS={setIsMockingGPS}
            mockLat={mockLat}
            setMockLat={setMockLat}
            mockLng={mockLng}
            setMockLng={setMockLng}
            isSimulateLate={isSimulateLate}
            setIsSimulateLate={setIsSimulateLate}
            forceMockToOffice={forceMockToOffice}
            activeOffice={activeOffice}
            isLocating={isLocating}
            geoError={geoError}
            userCoords={userCoords}
          />
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
              Geofence-restricted attendance validation • Records verified and timestamped at generation.
            </p>
          </div>
          <p className="text-slate-500 text-[10.5px]">
            &copy; 1989 - 2026 SignPost Suite. All rights registered. Made with precision visual styling.
          </p>
        </div>
      </footer>

      {/* --- OUT OF BOUNDS REMOTELY OVERRIDE ENTRY SHEET FORM (Modal) --- */}
      <RemoteClockInModal
        showRemoteModal={showRemoteModal}
        setShowRemoteModal={setShowRemoteModal}
        remoteReason={remoteReason}
        setRemoteReason={setRemoteReason}
        handleClockIn={handleClockIn}
      />

      {/* --- ADD NEW STAFF MODAL (Admin panel tool) --- */}
      <AddStaffModal
        showAddStaffModal={showAddStaffModal}
        setShowAddStaffModal={setShowAddStaffModal}
        newStaffName={newStaffName}
        setNewStaffName={setNewStaffName}
        newStaffEmail={newStaffEmail}
        setNewStaffEmail={setNewStaffEmail}
        newStaffDept={newStaffDept}
        setNewStaffDept={setNewStaffDept}
        newStaffRate={newStaffRate}
        setNewStaffRate={setNewStaffRate}
        setStaff={setStaff}
      />

      {/* --- MANUAL TIMESHEET CORRECTION MODAL --- */}
      <CorrectionModal
        showCorrectionModal={showCorrectionModal}
        setShowCorrectionModal={setShowCorrectionModal}
        corrDate={corrDate}
        setCorrDate={setCorrDate}
        corrClockIn={corrClockIn}
        setCorrClockIn={setCorrClockIn}
        corrClockOut={corrClockOut}
        setCorrClockOut={setCorrClockOut}
        corrBreaks={corrBreaks}
        setCorrBreaks={setCorrBreaks}
        corrReason={corrReason}
        setCorrReason={setCorrReason}
        activeStaffId={activeStaffId}
        currentStaffDetails={currentStaffDetails}
        activeOffice={activeOffice}
        setRecords={setRecords}
        setNotifications={setNotifications}
        sendPushAlert={sendPushAlert}
        holidays={holidays}
      />

      {/* --- MANAGER PIN AUTHENTICATION MODAL --- */}
      {showManagerPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.56)] overflow-hidden max-w-sm w-full border border-white/10"
          >
            <div className="bg-[#1A3C6E]/40 text-white p-5 flex justify-between items-center border-b border-white/5">
              <h3 className="font-bold text-base flex items-center gap-1.5 font-sans">
                <Lock className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
                Manager Access Verification
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setShowManagerPinModal(false);
                  setManagerPin('');
                  setPinError(null);
                }} 
                className="text-white/80 hover:text-white cursor-pointer bg-transparent border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handlePinSubmit} className="p-6 space-y-4 font-sans">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 text-xs text-slate-300 text-center">
                <p>This area requires elevated administrator privileges. Please input your secure security PIN.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 text-center">
                  Enter 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••"
                  value={managerPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 4) {
                      setManagerPin(value);
                      setPinError(null);
                    }
                  }}
                  className="w-full text-center tracking-[0.5em] text-lg font-black bg-slate-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                  maxLength={4}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                
                {pinError && (
                  <p className="text-red-400 text-xs font-bold mt-2 text-center flex items-center justify-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-red-450" />
                    {pinError}
                  </p>
                )}
                
                <p className="text-[10px] text-slate-500 mt-2 text-center italic">
                  Note: Demands a standard verification code (Hint: Try 1234)
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setShowManagerPinModal(false);
                    setManagerPin('');
                    setPinError(null);
                  }}
                  className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={managerPin.length !== 4}
                  className={`px-5 py-2.5 rounded-xl shadow-lg border-0 font-black flex items-center gap-1.5 transition ${
                    managerPin.length === 4
                      ? 'bg-[#D4A843] text-slate-950 hover:bg-amber-500 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Verify & Enter
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
