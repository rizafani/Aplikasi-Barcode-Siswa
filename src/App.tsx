import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DigitalClock } from './components/DigitalClock';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ScanResultModal, ScanOutcome } from './components/ScanResultModal';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { StudentsManagementView } from './components/StudentsManagementView';
import { StudentDetailModal } from './components/StudentDetailModal';
import { ImportExcelView } from './components/ImportExcelView';
import { SettingsModal } from './components/SettingsModal';
import { Student, AttendanceRecord, SchoolSettings } from './types/attendance';
import { storage } from './utils/storage';
import { soundEffects } from './utils/audio';
import { getFormattedDateString } from './data/initialData';
import { firestoreService } from './services/firestoreService';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => storage.getStudents());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storage.getAttendance());
  const [settings, setSettings] = useState<SchoolSettings>(() => storage.getSettings());
  const [isDbConnected, setIsDbConnected] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanOutcome, setScanOutcome] = useState<ScanOutcome | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Subscribe to real-time Firestore database synchronization
  useEffect(() => {
    const unsubStudents = firestoreService.subscribeStudents(
      (remoteStudents) => {
        if (remoteStudents.length > 0) {
          setStudents(remoteStudents);
          storage.saveStudents(remoteStudents);
        }
        setIsDbConnected(true);
      },
      () => setIsDbConnected(false)
    );

    const unsubAttendance = firestoreService.subscribeAttendance(
      (remoteRecords) => {
        if (remoteRecords.length > 0) {
          setAttendance(remoteRecords);
          storage.saveAttendance(remoteRecords);
        }
        setIsDbConnected(true);
      },
      () => setIsDbConnected(false)
    );

    const unsubSettings = firestoreService.subscribeSettings(
      (remoteSettings) => {
        setSettings(remoteSettings);
        storage.saveSettings(remoteSettings);
        setIsDbConnected(true);
      },
      () => setIsDbConnected(false)
    );

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubSettings();
    };
  }, []);

  // Today's records
  const todayStr = useMemo(() => getFormattedDateString(new Date()), []);
  const todayRecords = useMemo(
    () => attendance.filter((r) => r.date === todayStr),
    [attendance, todayStr]
  );

  // Core Barcode Scanning Process
  const handleProcessScan = useCallback(
    async (scannedNisn: string) => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}:${seconds}`;
      const currentHM = `${hours}:${minutes}`;

      // 1. Check if student exists in database
      const student = students.find(
        (s) => s.nisn === scannedNisn || s.nisn.replace(/^0+/, '') === scannedNisn.replace(/^0+/, '')
      );

      if (!student) {
        if (settings.soundEnabled) soundEffects.playError();
        setScanOutcome({
          type: 'NOT_FOUND',
          nisn: scannedNisn,
        });
        return;
      }

      // 2. Check if student already checked in today
      const existingToday = attendance.find(
        (r) => (r.nisn === student.nisn || r.studentId === student.id) && r.date === todayStr
      );

      // Sesi Pulang logic
      const isCheckOutTime = currentHM >= settings.checkOutStartTime;

      if (existingToday) {
        if (isCheckOutTime && !existingToday.checkOutTime) {
          // Record checkout
          const updated: AttendanceRecord = {
            ...existingToday,
            checkOutTime: currentTimeStr,
          };
          setAttendance((prev) => prev.map((r) => (r.id === existingToday.id ? updated : r)));
          await firestoreService.saveAttendanceRecord(updated);

          if (settings.soundEnabled) soundEffects.playSuccess();
          setScanOutcome({
            type: 'SUCCESS',
            record: updated,
            student,
            isNewCheckIn: false,
            isCheckOut: true,
          });
        } else {
          // Already recorded
          if (settings.soundEnabled) soundEffects.playWarning();
          setScanOutcome({
            type: 'ALREADY_CHECKED_IN',
            record: existingToday,
            student,
          });
        }
        return;
      }

      // 3. New Check-In record
      const isLate = currentHM > settings.lateThresholdTime;
      const status = isLate ? 'TERLAMBAT' : 'HADIR';

      let notes: string | undefined = undefined;
      if (isLate) {
        notes = `Tiba pukul ${currentTimeStr} (Batas ${settings.lateThresholdTime})`;
      }

      const newRecord: AttendanceRecord = {
        id: `att-${todayStr}-${student.nisn}-${Date.now()}`,
        studentId: student.id,
        nisn: student.nisn,
        studentName: student.name,
        studentClass: student.class,
        photoUrl: student.photoUrl,
        date: todayStr,
        checkInTime: currentTimeStr,
        status,
        notes,
        scannedAt: Date.now(),
      };

      setAttendance((prev) => [newRecord, ...prev]);
      await firestoreService.saveAttendanceRecord(newRecord);

      if (settings.soundEnabled) soundEffects.playSuccess();
      setScanOutcome({
        type: 'SUCCESS',
        record: newRecord,
        student,
        isNewCheckIn: true,
        isCheckOut: false,
      });
    },
    [students, attendance, todayStr, settings]
  );

  // Student CRUD connected to Firestore
  const handleAddStudent = async (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
    await firestoreService.saveStudent(newStudent);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    await firestoreService.saveStudent(updatedStudent);
  };

  const handleDeleteStudent = async (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    await firestoreService.deleteStudent(studentId);
  };

  // Attendance manual overrides connected to Firestore
  const handleUpdateAttendanceRecord = async (updatedRecord: AttendanceRecord) => {
    setAttendance((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    await firestoreService.saveAttendanceRecord(updatedRecord);
  };

  const handleAddManualAttendanceRecord = async (newRecord: AttendanceRecord) => {
    setAttendance((prev) => {
      const filtered = prev.filter(
        (r) => !(r.date === newRecord.date && (r.nisn === newRecord.nisn || r.studentId === newRecord.studentId))
      );
      return [newRecord, ...filtered];
    });
    await firestoreService.saveAttendanceRecord(newRecord);
  };

  // Excel import connected to Firestore
  const handleImportComplete = async (importedStudents: Student[], mode: 'merge' | 'replace') => {
    await firestoreService.batchImportStudents(importedStudents, mode);
    setActiveTab('students');
  };

  // Reset defaults connected to Firestore
  const handleResetDefaults = async () => {
    await firestoreService.resetToDefaults();
  };

  // Settings update connected to Firestore
  const handleSaveSettings = async (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    await firestoreService.saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar with Cloud Database Active indicator */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        settings={settings}
        databaseConnected={isDbConnected}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scan' && (
          <DigitalClock
            onStartScan={() => setIsScannerOpen(true)}
            onQuickSimulate={handleProcessScan}
            todayRecords={todayRecords}
            allStudents={students}
            settings={settings}
            onViewDaily={() => setActiveTab('daily')}
          />
        )}

        {activeTab === 'daily' && (
          <DailyAttendanceView
            students={students}
            records={attendance}
            onUpdateRecord={handleUpdateAttendanceRecord}
            onAddManualRecord={handleAddManualAttendanceRecord}
            onOpenStudentDetail={(st) => setSelectedStudentForDetail(st)}
          />
        )}

        {activeTab === 'students' && (
          <StudentsManagementView
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenDetail={(st) => setSelectedStudentForDetail(st)}
            onNavigateImport={() => setActiveTab('import')}
          />
        )}

        {activeTab === 'import' && (
          <ImportExcelView
            onImportComplete={handleImportComplete}
            onResetDefaults={handleResetDefaults}
            currentStudentCount={students.length}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {settings.schoolName} · Sistem Presensi Barcode NISN Otomatis
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-600 font-medium">Cloud Database: Terhubung</span>
            <span>·</span>
            <span>{students.length} Siswa Terdaftar</span>
          </div>
        </div>
      </footer>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedNisn) => {
          handleProcessScan(scannedNisn);
        }}
        allStudents={students}
      />

      {/* Scan Result Notification Modal with Student Photo & Status */}
      <ScanResultModal
        outcome={scanOutcome}
        onClose={() => setScanOutcome(null)}
        autoCloseSeconds={settings.autoCloseModalSeconds}
      />

      {/* Student Detailed Attendance & ID Card Modal */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        records={attendance}
        settings={settings}
        onClose={() => setSelectedStudentForDetail(null)}
      />

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
}
