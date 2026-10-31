import { Student, AttendanceRecord, SchoolSettings } from '../types/attendance';
import { INITIAL_STUDENTS, generateInitialAttendance, DEFAULT_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'absensi_students_v1',
  ATTENDANCE: 'absensi_records_v1',
  SETTINGS: 'absensi_settings_v1',
};

export const storage = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        return INITIAL_STUDENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents(students: Student[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to localStorage', e);
    }
  },

  getAttendance(): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (!data) {
        const seeded = generateInitialAttendance();
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(data);
    } catch {
      return generateInitialAttendance();
    }
  },

  saveAttendance(records: AttendanceRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save attendance records to localStorage', e);
    }
  },

  getSettings(): SchoolSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: SchoolSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  },

  resetAllToDefault() {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return {
      students: INITIAL_STUDENTS,
      attendance: generateInitialAttendance(),
      settings: DEFAULT_SETTINGS,
    };
  },
};
