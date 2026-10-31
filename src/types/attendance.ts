export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';

export interface Student {
  id: string;
  nisn: string;
  name: string;
  class: string;
  gender: 'L' | 'P';
  guardianPhone: string;
  photoUrl: string;
  email?: string;
  address?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nisn: string;
  studentName: string;
  studentClass: string;
  photoUrl: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  status: AttendanceStatus;
  notes?: string;
  scannedAt: number; // timestamp
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolLogoText: string;
  checkInStartTime: string; // e.g. "06:30"
  lateThresholdTime: string; // e.g. "07:30"
  checkOutStartTime: string; // e.g. "14:00"
  soundEnabled: boolean;
  autoCloseModalSeconds: number;
}
