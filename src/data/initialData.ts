import { Student, AttendanceRecord, SchoolSettings } from '../types/attendance';

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'SMA Negeri 1 Nusantara',
  schoolAddress: 'Jl. Pendidikan Merdeka No. 45, Jakarta',
  schoolLogoText: 'SMAN 1',
  checkInStartTime: '06:00',
  lateThresholdTime: '07:15',
  checkOutStartTime: '14:30',
  soundEnabled: true,
  autoCloseModalSeconds: 4,
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    nisn: '0072819201',
    name: 'Indra Pratama',
    class: 'XII MIPA 1',
    gender: 'L',
    guardianPhone: '081234567890',
    email: 'indra.pratama@sekolah.id',
    photoUrl: '/src/assets/images/student_indra_pratama_1793386806099.jpg',
    address: 'Jl. Melati No. 12, Kebayoran Baru',
  },
  {
    id: 'std-2',
    nisn: '0073910283',
    name: 'Anisa Rahma Wijaya',
    class: 'XII MIPA 1',
    gender: 'P',
    guardianPhone: '081398765432',
    email: 'anisa.rahma@sekolah.id',
    photoUrl: '/src/assets/images/student_anisa_rahma_1793386807469.jpg',
    address: 'Jl. Anggrek No. 5, Tebet',
  },
  {
    id: 'std-3',
    nisn: '0081029384',
    name: 'Dimas Saputra',
    class: 'XII MIPA 2',
    gender: 'L',
    guardianPhone: '085711223344',
    email: 'dimas.saputra@sekolah.id',
    photoUrl: '/src/assets/images/student_dimas_saputra_1793386807409.jpg',
    address: 'Jl. Flamboyan No. 8, Cilandak',
  },
  {
    id: 'std-4',
    nisn: '0079182374',
    name: 'Siti Dian Nurhaliza',
    class: 'XI IPS 1',
    gender: 'P',
    guardianPhone: '087899001122',
    email: 'siti.dian@sekolah.id',
    photoUrl: '/src/assets/images/student_siti_nurhaliza_1793386807467.jpg',
    address: 'Jl. Kenanga No. 24, Pancoran',
  },
  {
    id: 'std-5',
    nisn: '0085612345',
    name: 'Muhammad Farhan',
    class: 'XII MIPA 2',
    gender: 'L',
    guardianPhone: '081255443322',
    email: 'farhan.m@sekolah.id',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    address: 'Jl. Cempaka Putih No. 17',
  },
  {
    id: 'std-6',
    nisn: '0087723491',
    name: 'Nadhira Putri Aurelia',
    class: 'XI IPS 1',
    gender: 'P',
    guardianPhone: '081311998877',
    email: 'nadhira.aurelia@sekolah.id',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    address: 'Jl. Wijaya Kusuma No. 3',
  },
  {
    id: 'std-7',
    nisn: '0091238475',
    name: 'Bima Arya Sakti',
    class: 'X-A',
    gender: 'L',
    guardianPhone: '085699887766',
    email: 'bima.arya@sekolah.id',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    address: 'Jl. Kemang Raya No. 40',
  },
  {
    id: 'std-8',
    nisn: '0092348571',
    name: 'Cantika Zahra Maulida',
    class: 'X-A',
    gender: 'P',
    guardianPhone: '081822334455',
    email: 'cantika.zahra@sekolah.id',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    address: 'Jl. Antasari No. 19',
  },
];

// Helper to format date YYYY-MM-DD
export function getFormattedDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate pre-seeded attendance history for past few days
export function generateInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  // Seed for past 3 days and today
  for (let offset = 3; offset >= 0; offset--) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - offset);
    const dateStr = getFormattedDateString(targetDate);
    const dayOfWeek = targetDate.getDay();

    // Skip Sunday (0) and Saturday (6) if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    INITIAL_STUDENTS.forEach((student, index) => {
      // For today, only seed some so teachers can test live scanning!
      if (offset === 0 && index >= 3) {
        return; // Left un-scanned for today so user can scan them!
      }

      // Varied realistic check-in times
      let checkInTime = '06:55:20';
      let status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' = 'HADIR';

      if (index === 2) {
        checkInTime = '07:22:15';
        status = 'TERLAMBAT';
      } else if (index === 0) {
        checkInTime = '06:48:10';
      } else if (index === 1) {
        checkInTime = '07:05:42';
      } else if (index === 4 && offset > 0) {
        status = 'SAKIT';
        checkInTime = '-';
      } else if (index === 5 && offset > 0) {
        status = 'IZIN';
        checkInTime = '-';
      }

      records.push({
        id: `att-${dateStr}-${student.nisn}`,
        studentId: student.id,
        nisn: student.nisn,
        studentName: student.name,
        studentClass: student.class,
        photoUrl: student.photoUrl,
        date: dateStr,
        checkInTime: checkInTime,
        checkOutTime: offset > 0 ? '14:35:10' : undefined,
        status: status,
        notes: status === 'TERLAMBAT' ? 'Terlambat 7 menit karena macet' : undefined,
        scannedAt: new Date(`${dateStr}T${checkInTime === '-' ? '07:00:00' : checkInTime}`).getTime(),
      });
    });
  }

  return records;
}
