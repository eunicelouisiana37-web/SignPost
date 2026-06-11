export interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Employee' | 'Manager' | 'Admin';
  hourlyRate: number; // in NGN (₦)
  overtimeRate: number; // in NGN (₦)
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO string or HH:MM
  clockOut?: string; // ISO string or HH:MM
  breaks: { start: string; end?: string; duration: number }[]; // durations in mins
  breakDurationTotal: number; // minutes
  totalHours: number; // decimal hours
  regularHours: number;
  overtimeHours: number;
  latitude: number;
  longitude: number;
  distanceFromLocation: number; // meters at clock in
  isOutOfBounds: boolean; // at clock in
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockOutDistanceFromLocation?: number;
  isClockOutOutOfBounds?: boolean;
  isLate?: boolean;
  lateReason?: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  isHoliday?: boolean;
}

export interface ObservedHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export interface WorkingLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface ManagerNotification {
  id: string;
  staffId: string;
  staffName: string;
  type: 'CLOCK_IN_BOUNDS_VIOLATION' | 'OVERTIME_REQUEST' | 'CORRECTION_REQUEST' | 'LATE_CLOCK_IN';
  timestamp: string;
  details: string;
  recordId: string;
  read: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  extraData?: {
    date?: string;
    reqClockIn?: string;
    reqClockOut?: string;
    reason?: string;
  };
}
