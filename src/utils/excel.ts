import * as XLSX from 'xlsx';
import { Student, AttendanceRecord } from '../types/attendance';

export interface ExcelImportResult {
  validStudents: Student[];
  errors: string[];
  totalRows: number;
}

// Generate template workbook for downloading
export function downloadStudentTemplate() {
  const templateRows = [
    {
      NISN: '0072819201',
      Nama: 'Indra Pratama',
      Kelas: 'XII MIPA 1',
      Jenis_Kelamin: 'L',
      Kontak_Wali: '081234567890',
      Email: 'indra.pratama@sekolah.id',
      Alamat: 'Jl. Melati No. 12',
      Foto_URL: '',
    },
    {
      NISN: '0073910283',
      Nama: 'Anisa Rahma Wijaya',
      Kelas: 'XII MIPA 1',
      Jenis_Kelamin: 'P',
      Kontak_Wali: '081398765432',
      Email: 'anisa.rahma@sekolah.id',
      Alamat: 'Jl. Anggrek No. 5',
      Foto_URL: '',
    },
    {
      NISN: '0081029384',
      Nama: 'Dimas Saputra',
      Kelas: 'XII MIPA 2',
      Jenis_Kelamin: 'L',
      Kontak_Wali: '085711223344',
      Email: 'dimas.saputra@sekolah.id',
      Alamat: 'Jl. Flamboyan No. 8',
      Foto_URL: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // NISN
    { wch: 25 }, // Nama
    { wch: 15 }, // Kelas
    { wch: 14 }, // Jenis_Kelamin
    { wch: 18 }, // Kontak_Wali
    { wch: 25 }, // Email
    { wch: 30 }, // Alamat
    { wch: 25 }, // Foto_URL
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

  // Trigger browser download
  XLSX.writeFile(workbook, 'Template_Import_Siswa_NISN.xlsx');
}

// Parse Excel file buffer into students
export async function parseStudentExcelFile(file: File): Promise<ExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        const validStudents: Student[] = [];
        const errors: string[] = [];
        const seenNisns = new Set<string>();

        rawRows.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1

          // Support varying column naming conventions (case-insensitive)
          const findVal = (keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
              if (matchedKey && row[matchedKey] !== undefined) {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const rawNisn = findVal(['nisn', 'nomor induk', 'no_induk', 'id_siswa']);
          const rawName = findVal(['nama', 'nama siswa', 'name', 'nama lengkap']);
          const rawClass = findVal(['kelas', 'class', 'tingkat', 'rombel']) || 'Umum';
          const rawGender = findVal(['jenis kelamin', 'jenis_kelamin', 'jk', 'gender']).toUpperCase();
          const rawPhone = findVal(['kontak wali', 'kontak_wali', 'no hp wali', 'phone', 'telepon', 'hp']);
          const rawEmail = findVal(['email', 'surel']);
          const rawAddress = findVal(['alamat', 'address']);
          const rawPhoto = findVal(['foto', 'foto_url', 'photo', 'url_foto']);

          // Clean NISN: remove spaces, dots, dashes
          const cleanNisn = rawNisn.replace(/[^0-9]/g, '');

          if (!cleanNisn) {
            errors.push(`Baris ${rowNum}: NISN tidak boleh kosong.`);
            return;
          }

          if (cleanNisn.length < 8 || cleanNisn.length > 12) {
            errors.push(`Baris ${rowNum}: Format NISN "${rawNisn}" tidak valid (umumnya 10 digit angka).`);
            return;
          }

          if (!rawName) {
            errors.push(`Baris ${rowNum}: Nama siswa tidak boleh kosong (NISN: ${cleanNisn}).`);
            return;
          }

          if (seenNisns.has(cleanNisn)) {
            errors.push(`Baris ${rowNum}: Duplikasi NISN "${cleanNisn}" ditemukan pada berkas.`);
            return;
          }

          seenNisns.add(cleanNisn);

          // Standardize gender
          let gender: 'L' | 'P' = 'L';
          if (rawGender.startsWith('P') || rawGender === 'F' || rawGender.includes('PEREMPUAN') || rawGender.includes('WANITA')) {
            gender = 'P';
          }

          validStudents.push({
            id: `std-imp-${cleanNisn}-${Date.now()}`,
            nisn: cleanNisn,
            name: rawName,
            class: rawClass,
            gender: gender,
            guardianPhone: rawPhone || '-',
            email: rawEmail || undefined,
            address: rawAddress || undefined,
            photoUrl: rawPhoto || (gender === 'L' 
              ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
          });
        });

        resolve({
          validStudents,
          errors,
          totalRows: rawRows.length,
        });
      } catch (err) {
        reject(new Error(`Gagal membaca berkas Excel: ${err instanceof Error ? err.message : 'Format berkas rusak'}`));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsArrayBuffer(file);
  });
}

// Export attendance records to Excel
export function exportAttendanceToExcel(records: AttendanceRecord[], title: string = 'Rekap_Absensi_Siswa') {
  const exportRows = records.map((rec, idx) => ({
    No: idx + 1,
    Tanggal: rec.date,
    NISN: rec.nisn,
    'Nama Siswa': rec.studentName,
    Kelas: rec.studentClass,
    'Jam Masuk': rec.checkInTime,
    'Jam Pulang': rec.checkOutTime || '-',
    'Status Kehadiran': rec.status,
    Keterangan: rec.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 16 }, // NISN
    { wch: 26 }, // Nama Siswa
    { wch: 14 }, // Kelas
    { wch: 14 }, // Jam Masuk
    { wch: 14 }, // Jam Pulang
    { wch: 18 }, // Status Kehadiran
    { wch: 30 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${title}_${todayStr}.xlsx`);
}
