import { StaffMember, AttendanceRecord, WorkingLocation, ManagerNotification } from '../types';

export const INITIAL_LOCATIONS: WorkingLocation[] = [
  {
    id: 'lag-hq',
    name: 'Lagos Headquarters (Yaba)',
    latitude: 6.5244,
    longitude: 3.3792,
    radiusMeters: 100, // 100 meters
  },
  {
    id: 'abuja-reg',
    name: 'Abuja Regional Office (Wuse II)',
    latitude: 9.0765,
    longitude: 7.3986,
    radiusMeters: 150,
  },
  {
    id: 'ph-branch',
    name: 'Port Harcourt Center (GRA)',
    latitude: 4.8156,
    longitude: 7.0498,
    radiusMeters: 120,
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Eunice Louisiana',
    email: 'eunice.l@churchos.ng',
    department: 'Administration',
    role: 'Employee',
    hourlyRate: 3500, // ₦3,500/hr
    overtimeRate: 5250, // ₦5,250/hr (1.5x)
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff-2',
    name: 'Chinedu Okafor',
    email: 'chinedu.o@churchos.ng',
    department: 'Media & Communications',
    role: 'Employee',
    hourlyRate: 2800,
    overtimeRate: 4200,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff-3',
    name: 'Tunde Bakare',
    email: 'tunde.b@churchos.ng',
    department: 'Operations & Facilities',
    role: 'Manager',
    hourlyRate: 4500,
    overtimeRate: 6750,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff-4',
    name: 'Halima Yusuf',
    email: 'halima.y@churchos.ng',
    department: 'Finance & Accounts',
    role: 'Admin',
    hourlyRate: 5000,
    overtimeRate: 7500,
    avatar: 'https://images.unsplash.com/photo-1534751516642-a131ffd1037f?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff-5',
    name: 'Blessing Emmanuel',
    email: 'blessing.e@churchos.ng',
    department: 'Pastoral & Care',
    role: 'Employee',
    hourlyRate: 3000,
    overtimeRate: 4500,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_RECORDS: AttendanceRecord[] = [
  {
    id: 'rec-1',
    staffId: 'staff-1',
    staffName: 'Eunice Louisiana',
    date: '2026-06-09',
    clockIn: '2026-06-09T07:55:00Z',
    clockOut: '2026-06-09T17:15:00Z', // 9.33 hours total
    breaks: [
      { start: '2026-06-09T12:00:00Z', end: '2026-06-09T12:45:00Z', duration: 45 }
    ],
    breakDurationTotal: 45,
    totalHours: 8.58, // Total worked hours (excludes break duration)
    regularHours: 8.0,
    overtimeHours: 0.58,
    latitude: 6.5245,
    longitude: 3.3793,
    distanceFromLocation: 15,
    isOutOfBounds: false,
    status: 'Approved',
    approvedBy: 'Tunde Bakare',
    approvedAt: '2026-06-09T18:00:00Z'
  },
  {
    id: 'rec-2',
    staffId: 'staff-2',
    staffName: 'Chinedu Okafor',
    date: '2026-06-09',
    clockIn: '2026-06-09T08:05:00Z',
    clockOut: '2026-06-09T16:00:00Z', // 7.92 hours
    breaks: [],
    breakDurationTotal: 0,
    totalHours: 7.92,
    regularHours: 7.92,
    overtimeHours: 0,
    latitude: 6.5244,
    longitude: 3.3792,
    distanceFromLocation: 0,
    isOutOfBounds: false,
    status: 'Approved',
    approvedBy: 'Tunde Bakare',
    approvedAt: '2026-06-09T18:00:00Z'
  },
  {
    id: 'rec-3',
    staffId: 'staff-5',
    staffName: 'Blessing Emmanuel',
    date: '2026-06-09',
    clockIn: '2026-06-09T08:15:00Z',
    clockOut: '2026-06-09T18:45:00Z', // 10.5 hours
    breaks: [
      { start: '2026-06-09T13:00:00Z', end: '2026-06-09T14:00:00Z', duration: 60 }
    ],
    breakDurationTotal: 60,
    totalHours: 9.5,
    regularHours: 8.0,
    overtimeHours: 1.5,
    latitude: 6.5210, // slightly out-of-bounds
    longitude: 3.3740,
    distanceFromLocation: 680,
    isOutOfBounds: true,
    status: 'Approved',
    approvedBy: 'Tunde Bakare',
    approvedAt: '2026-06-09T19:00:00Z',
    notes: 'Had offsite pastoral home visit in Yaba suburb prior to marking in.'
  },
  {
    id: 'rec-4',
    staffId: 'staff-1',
    staffName: 'Eunice Louisiana',
    date: '2026-06-08',
    clockIn: '2026-06-08T07:48:00Z',
    clockOut: '2026-06-08T17:02:00Z',
    breaks: [
      { start: '2026-06-08T12:00:00Z', end: '2026-06-08T12:40:00Z', duration: 40 }
    ],
    breakDurationTotal: 40,
    totalHours: 8.57,
    regularHours: 8.0,
    overtimeHours: 0.57,
    latitude: 6.5244,
    longitude: 3.3792,
    distanceFromLocation: 5,
    isOutOfBounds: false,
    status: 'Approved',
    approvedBy: 'Tunde Bakare',
    approvedAt: '2026-06-08T18:15:00Z'
  },
  {
    id: 'rec-5',
    staffId: 'staff-2',
    staffName: 'Chinedu Okafor',
    date: '2026-06-08',
    clockIn: '2026-06-08T08:30:00Z',
    clockOut: '2026-06-08T17:30:00Z',
    breaks: [
      { start: '2026-06-08T12:15:00Z', end: '2026-06-08T13:15:00Z', duration: 60 }
    ],
    breakDurationTotal: 60,
    totalHours: 8.0,
    regularHours: 8.0,
    overtimeHours: 0.0,
    latitude: 6.5244,
    longitude: 3.3792,
    distanceFromLocation: 5,
    isOutOfBounds: false,
    status: 'Approved'
  }
];

export const INITIAL_NOTIFICATIONS: ManagerNotification[] = [
  {
    id: 'notif-1',
    staffId: 'staff-5',
    staffName: 'Blessing Emmanuel',
    type: 'CLOCK_IN_BOUNDS_VIOLATION',
    timestamp: '2026-06-09T08:16:00Z',
    details: 'Clocked in 680m outside geofence boundary (Yaba). Reason: Pastoral home visit.',
    recordId: 'rec-3',
    read: false,
    status: 'Approved'
  }
];
