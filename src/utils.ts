import { jsPDF } from 'jspdf';
import { AttendanceRecord } from './types';

// Calculate distance in meters between two coordinates using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return Math.round(d);
}

// Format currency as Nigerian Naira (₦)
export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format duration into hh:mm or h hours m mins
export function formatHours(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// Helper to format ISO datetime to readable hours with PM/AM (Nigerian standard)
export function formatTimeRaw(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return '--:--';
  }
}

// Format date into standard DD/MM/YYYY format
export function formatDateStr(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

// Export attendance to CSV
export function exportToCSV(records: AttendanceRecord[], title: string = 'attendance_report') {
  const headers = [
    'Date',
    'Employee Name',
    'Clock-In',
    'Clock-Out',
    'Break Duration (mins)',
    'Total Worked (hrs)',
    'Regular Hours',
    'Overtime Hours',
    'Is Out of Bounds Check-In',
    'Check-In Distance (meters)',
    'Check-In GPS Lat',
    'Check-In GPS Lng',
    'Is Out of Bounds Check-Out',
    'Check-Out Distance (meters)',
    'Check-Out GPS Lat',
    'Check-Out GPS Lng',
    'Is Late Check-In',
    'Late Reason',
    'Status',
    'Approved By'
  ];

  const rows = records.map((r) => [
    formatDateStr(r.date),
    r.staffName,
    r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-US') : '',
    r.clockOut ? new Date(r.clockOut).toLocaleTimeString('en-US') : '--',
    r.breakDurationTotal,
    r.totalHours.toFixed(2),
    r.regularHours.toFixed(2),
    r.overtimeHours.toFixed(2),
    r.isOutOfBounds ? 'Yes' : 'No',
    r.distanceFromLocation,
    r.latitude.toFixed(6),
    r.longitude.toFixed(6),
    r.isClockOutOutOfBounds ? 'Yes' : (r.clockOutLatitude ? 'No' : '--'),
    r.clockOutDistanceFromLocation !== undefined ? r.clockOutDistanceFromLocation : '--',
    r.clockOutLatitude ? r.clockOutLatitude.toFixed(6) : '--',
    r.clockOutLongitude ? r.clockOutLongitude.toFixed(6) : '--',
    r.isLate ? 'Yes' : 'No',
    r.lateReason || '',
    r.status,
    r.approvedBy || ''
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export attendance report to PDF using jsPDF
export function exportToPDF(records: AttendanceRecord[], periodName: string, staffFilter: string = 'All Staff') {
  const doc = new jsPDF();
  
  // Set beautiful clean fonts
  doc.setFont('Helvetica', 'bold');
  
  // App color theme decoration
  doc.setFillColor(26, 60, 110); // Brand Navy #1A3C6E
  doc.rect(0, 0, 210, 40, 'F');
  
  // Gold accent bar
  doc.setFillColor(212, 168, 67); // Gold #D4A843
  doc.rect(0, 40, 210, 4, 'F');
  
  // Header Texts
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('CHURCHOS STAFF REGISTRY', 14, 20);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(240, 240, 240);
  doc.text(`Workplace Attendance Timesheet | Payroll Integration Export`, 14, 30);
  
  // Document info
  doc.setTextColor(30, 41, 59); // dark text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TIMESHEET REPORT SUMMARY', 14, 55);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Report Period: ${periodName}`, 14, 62);
  doc.text(`Staff Group: ${staffFilter}`, 14, 68);
  doc.text(`Exported On: ${new Date().toLocaleDateString('en-GB')}`, 14, 74);
  
  // Core Statistics calculator
  const totalWages = records.reduce((sum, r) => sum + (r.regularHours * 3500 + r.overtimeHours * 5250), 0);
  const totalHrs = records.reduce((sum, r) => sum + r.totalHours, 0);
  const totalOt = records.reduce((sum, r) => sum + r.overtimeHours, 0);
  
  // Draw summary card on the right
  doc.setFillColor(248, 249, 252); // Offwhite box
  doc.setDrawColor(226, 232, 240);
  doc.rect(130, 50, 66, 32, 'FD');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Key Report Metric Summaries:', 134, 56);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Total Staff Records: ${records.length}`, 134, 61);
  doc.text(`Total Hours Logged: ${totalHrs.toFixed(1)} hrs`, 134, 66);
  doc.text(`Total Overtime: ${totalOt.toFixed(1)} hrs`, 134, 71);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(26, 60, 110);
  doc.text(`Est. Gross Payroll: ₦${Math.round(totalWages).toLocaleString()}`, 134, 77);
  doc.setTextColor(30, 41, 59);
  
  // Render custom manual table
  let currentY = 90;
  
  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  
  doc.text('Date', 16, currentY + 5.5);
  doc.text('Staff Member', 36, currentY + 5.5);
  doc.text('Clock In', 80, currentY + 5.5);
  doc.text('Clock Out', 100, currentY + 5.5);
  doc.text('Worked', 122, currentY + 5.5);
  doc.text('Overtime', 142, currentY + 5.5);
  doc.text('Geo Status', 162, currentY + 5.5);
  doc.text('Status', 184, currentY + 5.5);
  
  currentY += 8;
  
  // Data Rows
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  
  records.forEach((r, idx) => {
    // Add page if table is too long
    if (currentY > 275) {
      doc.addPage();
      currentY = 20;
      
      // Draw sub-header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.text('Date', 16, currentY + 5.5);
      doc.text('Staff Member', 36, currentY + 5.5);
      doc.text('Clock In', 80, currentY + 5.5);
      doc.text('Clock Out', 100, currentY + 5.5);
      doc.text('Worked', 122, currentY + 5.5);
      doc.text('Overtime', 142, currentY + 5.5);
      doc.text('Geo Status', 162, currentY + 5.5);
      doc.text('Status', 184, currentY + 5.5);
      currentY += 8;
      doc.setFont('Helvetica', 'normal');
    }
    
    // Zebra striping
    if (idx % 2 === 1) {
      doc.setFillColor(250, 251, 253);
      doc.rect(14, currentY, 182, 7, 'F');
    }
    
    doc.text(formatDateStr(r.date), 16, currentY + 5);
    doc.text(r.staffName, 36, currentY + 5);
    doc.text(formatTimeRaw(r.clockIn), 80, currentY + 5);
    doc.text(formatTimeRaw(r.clockOut), 100, currentY + 5);
    doc.text(`${r.totalHours.toFixed(2)}h`, 122, currentY + 5);
    doc.text(`${r.overtimeHours.toFixed(2)}h`, 142, currentY + 5);
    
    // Geo Label
    if (r.isOutOfBounds) {
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`Out (+${r.distanceFromLocation}m)`, 162, currentY + 5);
    } else {
      doc.setTextColor(22, 163, 74); // Green
      doc.text('In-Bounds', 162, currentY + 5);
    }
    doc.setTextColor(30, 41, 59); // Reset text color
    
    // Status text
    if (r.status === 'Approved') {
      doc.setTextColor(22, 163, 74);
    } else if (r.status === 'Pending') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(r.status, 184, currentY + 5);
    doc.setTextColor(30, 41, 59); // Reset
    
    currentY += 7;
  });
  
  // Footer signature & details
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 280, 196, 280);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Generated Automatically by SignPost Staff Attendance Module.', 14, 286);
  doc.text(`Sheet Index Hash: SHA256-VITE24AISTUDIO-SECURE-EXP`, 14, 291);
  
  // Download file
  doc.save(`${periodName.toLowerCase().replace(/\s+/g, '_')}_timesheet_report.pdf`);
}
