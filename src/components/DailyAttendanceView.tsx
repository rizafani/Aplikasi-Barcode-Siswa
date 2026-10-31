import React, { useState, useMemo } from 'react';
import { 
  Calendar, Search, Filter, Download, UserCheck, 
  AlertCircle, CheckCircle2, Clock, Edit2, X, PlusCircle, Check
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types/attendance';
import { exportAttendanceToExcel } from '../utils/excel';

interface DailyAttendanceViewProps {
  students: Student[];
  records: AttendanceRecord[];
  onUpdateRecord: (updatedRecord: AttendanceRecord) => void;
  onAddManualRecord: (record: AttendanceRecord) => void;
  onOpenStudentDetail: (student: Student) => void;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  students,
  records,
  onUpdateRecord,
  onAddManualRecord,
  onOpenStudentDetail,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing state for teacher manual override
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('HADIR');
  const [editNotes, setEditNotes] = useState<string>('');

  // Manual record for un-scanned student
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('IZIN');
  const [manualNotes, setManualNotes] = useState<string>('');

  // Unique classes from students
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.class));
    return Array.from(set).sort();
  }, [students]);

  // Combine students with attendance records for selectedDate
  const dailyData = useMemo(() => {
    const dateRecordsMap = new Map<string, AttendanceRecord>();
    records
      .filter((r) => r.date === selectedDate)
      .forEach((r) => dateRecordsMap.set(r.nisn, r));

    return students.map((student) => {
      const record = dateRecordsMap.get(student.nisn);
      return {
        student,
        record: record || null,
        status: (record ? record.status : 'ALPA') as AttendanceStatus,
        checkInTime: record ? record.checkInTime : '-',
        checkOutTime: record?.checkOutTime || '-',
      };
    });
  }, [students, records, selectedDate]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return dailyData.filter(({ student, status }) => {
      // Class filter
      if (selectedClass !== 'ALL' && student.class !== selectedClass) return false;

      // Status filter
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = student.name.toLowerCase().includes(query);
        const matchNisn = student.nisn.includes(query);
        const matchClass = student.class.toLowerCase().includes(query);
        if (!matchName && !matchNisn && !matchClass) return false;
      }

      return true;
    });
  }, [dailyData, selectedClass, statusFilter, searchQuery]);

  // Summary counts for this date
  const summary = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    dailyData.forEach(({ status }) => {
      if (status === 'HADIR') hadir++;
      else if (status === 'TERLAMBAT') terlambat++;
      else if (status === 'IZIN') izin++;
      else if (status === 'SAKIT') sakit++;
      else alpa++;
    });

    return { total: dailyData.length, hadir, terlambat, izin, sakit, alpa };
  }, [dailyData]);

  // Export handlers
  const handleExport = () => {
    // Generate records for export from currently visible table
    const exportRecords: AttendanceRecord[] = filteredData.map(({ student, record, status }) => {
      if (record) return record;
      return {
        id: `virtual-${selectedDate}-${student.nisn}`,
        studentId: student.id,
        nisn: student.nisn,
        studentName: student.name,
        studentClass: student.class,
        photoUrl: student.photoUrl,
        date: selectedDate,
        checkInTime: '-',
        status: status,
        notes: status === 'ALPA' ? 'Belum melakukan absensi' : undefined,
        scannedAt: 0,
      };
    });

    exportAttendanceToExcel(exportRecords, `Laporan_Absensi_${selectedDate}`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const updated: AttendanceRecord = {
      ...editingRecord,
      status: editStatus,
      notes: editNotes,
    };

    onUpdateRecord(updated);
    setEditingRecord(null);
  };

  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === manualStudentId);
    if (!student) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newRecord: AttendanceRecord = {
      id: `att-manual-${selectedDate}-${student.nisn}-${Date.now()}`,
      studentId: student.id,
      nisn: student.nisn,
      studentName: student.name,
      studentClass: student.class,
      photoUrl: student.photoUrl,
      date: selectedDate,
      checkInTime: manualStatus === 'IZIN' || manualStatus === 'SAKIT' ? '-' : timeStr,
      status: manualStatus,
      notes: manualNotes,
      scannedAt: Date.now(),
    };

    onAddManualRecord(newRecord);
    setShowManualModal(false);
    setManualStudentId('');
    setManualNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar Absensi Harian Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau dan kelola kehadiran harian seluruh siswa berdasarkan tanggal dan kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Catat Izin / Sakit Manual</span>
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export ke Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip for Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Siswa</div>
          <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1">{summary.total}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Hadir Tepat</div>
          <div className="font-mono text-2xl font-bold text-emerald-600 tabular-nums mt-1">{summary.hadir}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Terlambat</div>
          <div className="font-mono text-2xl font-bold text-amber-600 tabular-nums mt-1">{summary.terlambat}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">Izin</div>
          <div className="font-mono text-2xl font-bold text-blue-600 tabular-nums mt-1">{summary.izin}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">Sakit</div>
          <div className="font-mono text-2xl font-bold text-purple-600 tabular-nums mt-1">{summary.sakit}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Alpa / Belum</div>
          <div className="font-mono text-2xl font-bold text-rose-600 tabular-nums mt-1">{summary.alpa}</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            />
            {selectedDate === todayStr && (
              <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">
                Hari Ini
              </span>
            )}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Semua Kelas ({students.length})</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 mr-2 font-medium">Status:</span>
          {[
            { id: 'ALL', label: 'Semua Status', count: dailyData.length },
            { id: 'HADIR', label: 'Hadir Tepat Waktu', count: summary.hadir },
            { id: 'TERLAMBAT', label: 'Terlambat', count: summary.terlambat },
            { id: 'IZIN', label: 'Izin', count: summary.izin },
            { id: 'SAKIT', label: 'Sakit', count: summary.sakit },
            { id: 'ALPA', label: 'Alpa / Belum Absen', count: summary.alpa },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 opacity-80 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Pulang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada data absensi siswa yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map(({ student, record, status, checkInTime, checkOutTime }, idx) => {
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => onOpenStudentDetail(student)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';
                            }}
                            className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate">
                              {student.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* NISN */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 tabular-nums">
                        {student.nisn}
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {student.class}
                      </td>

                      {/* Check In */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 tabular-nums">
                        {checkInTime}
                      </td>

                      {/* Check Out */}
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                        {checkOutTime}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] ${
                            status === 'HADIR'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'TERLAMBAT'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : status === 'IZIN'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : status === 'SAKIT'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {status === 'HADIR' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'TERLAMBAT' && <Clock className="w-3 h-3" />}
                          {status === 'ALPA' ? 'Alpa / Belum' : status}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {record?.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (record) {
                              setEditingRecord(record);
                              setEditStatus(record.status);
                              setEditNotes(record.notes || '');
                            } else {
                              // If un-scanned, prepare manual record
                              setManualStudentId(student.id);
                              setManualStatus('IZIN');
                              setManualNotes('');
                              setShowManualModal(true);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Ubah Status Kehadiran"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Ubah Status Presensi Siswa</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-slate-500">Nama Siswa:</span>
                <p className="font-bold text-slate-900">{editingRecord.studentName}</p>
                <p className="text-xs font-mono text-slate-500">
                  NISN: {editingRecord.nisn} · Kelas {editingRecord.studentClass}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kehadiran
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value="HADIR">Hadir Tepat Waktu</option>
                  <option value="TERLAMBAT">Terlambat</option>
                  <option value="IZIN">Izin</option>
                  <option value="SAKIT">Sakit</option>
                  <option value="ALPA">Alpa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Alasan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Surat dokter terlampir, izin acara keluarga..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Record Modal for un-scanned student */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Catat Kehadiran / Izin Manual</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRecord} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Siswa
                </label>
                <select
                  required
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value="HADIR">Hadir</option>
                  <option value="TERLAMBAT">Terlambat</option>
                  <option value="IZIN">Izin (Surat Keterangan)</option>
                  <option value="SAKIT">Sakit</option>
                  <option value="ALPA">Alpa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Alasan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan surat izin atau sakit..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!manualStudentId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                >
                  Catat Kehadiran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
