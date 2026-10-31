import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  X, CheckCircle2, Clock, Calendar, Printer, 
  Phone, Mail, MapPin, Award, UserCheck, AlertTriangle
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolSettings } from '../types/attendance';

interface StudentDetailModalProps {
  student: Student | null;
  records: AttendanceRecord[];
  settings: SchoolSettings;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  records,
  settings,
  onClose,
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'card'>('history');

  // Filter records specifically for this student
  const studentRecords = student
    ? records
        .filter((r) => r.nisn === student.nisn || r.studentId === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Calculate statistics
  const totalDays = studentRecords.length;
  const hadirCount = studentRecords.filter((r) => r.status === 'HADIR').length;
  const terlambatCount = studentRecords.filter((r) => r.status === 'TERLAMBAT').length;
  const izinCount = studentRecords.filter((r) => r.status === 'IZIN').length;
  const sakitCount = studentRecords.filter((r) => r.status === 'SAKIT').length;
  const alpaCount = studentRecords.filter((r) => r.status === 'ALPA').length;

  const attendanceRate = totalDays > 0 ? Math.round(((hadirCount + terlambatCount) / totalDays) * 100) : 100;

  // Render barcode whenever card tab is visible or student changes
  useEffect(() => {
    if (barcodeSvgRef.current && student) {
      try {
        JsBarcode(barcodeSvgRef.current, student.nisn, {
          format: 'CODE128',
          lineColor: '#000',
          width: 2,
          height: 48,
          displayValue: true,
          font: 'JetBrains Mono',
          fontSize: 14,
          margin: 10,
        });
      } catch (err) {
        console.error('Failed to generate barcode:', err);
      }
    }
  }, [student, activeTab]);

  if (!student) return null;

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{student.name}</h3>
              <p className="text-xs text-slate-400">
                NISN: <span className="font-mono text-indigo-300 font-semibold">{student.nisn}</span> · Kelas {student.class}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Riwayat Presensi
              </button>
              <button
                onClick={() => setActiveTab('card')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'card' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kartu Pelajar & Barcode
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'history' ? (
            <>
              {/* Profile Overview Card */}
              <div className="flex flex-col sm:flex-row gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl items-center sm:items-start">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';
                  }}
                  className="w-24 h-24 rounded-xl object-cover border border-slate-200 bg-white shrink-0 shadow-xs"
                />

                <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-base font-bold text-slate-900">{student.name}</span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200">
                      {student.class}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Jenis Kelamin: {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Kontak Wali: {student.guardianPhone}</span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">Email: {student.email}</span>
                      </div>
                    )}
                    {student.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">Alamat: {student.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance Rate Badge */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shrink-0 min-w-[120px]">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tingkat Kehadiran
                  </div>
                  <div className="font-mono text-3xl font-bold text-emerald-600 tabular-nums mt-0.5">
                    {attendanceRate}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {hadirCount + terlambatCount} dari {totalDays} hari
                  </div>
                </div>
              </div>

              {/* Mini Stats Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                  <div className="text-xs text-emerald-700 font-medium">Hadir Tepat</div>
                  <div className="font-mono text-xl font-bold text-emerald-800 tabular-nums mt-0.5">{hadirCount}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
                  <div className="text-xs text-amber-700 font-medium">Terlambat</div>
                  <div className="font-mono text-xl font-bold text-amber-800 tabular-nums mt-0.5">{terlambatCount}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                  <div className="text-xs text-blue-700 font-medium">Izin</div>
                  <div className="font-mono text-xl font-bold text-blue-800 tabular-nums mt-0.5">{izinCount}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center">
                  <div className="text-xs text-purple-700 font-medium">Sakit</div>
                  <div className="font-mono text-xl font-bold text-purple-800 tabular-nums mt-0.5">{sakitCount}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
                  <div className="text-xs text-rose-700 font-medium">Alpa</div>
                  <div className="font-mono text-xl font-bold text-rose-800 tabular-nums mt-0.5">{alpaCount}</div>
                </div>
              </div>

              {/* Detailed History Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Riwayat Presensi Tercatat ({studentRecords.length} sesi)</span>
                  </h4>
                </div>

                {studentRecords.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    Belum ada rekaman presensi untuk siswa ini.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">Jam Masuk</th>
                          <th className="py-2.5 px-3">Jam Pulang</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {rec.date}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums font-semibold">
                              {rec.checkInTime}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">
                              {rec.checkOutTime || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                  rec.status === 'HADIR'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : rec.status === 'TERLAMBAT'
                                    ? 'bg-amber-50 text-amber-700'
                                    : rec.status === 'IZIN'
                                    ? 'bg-blue-50 text-blue-700'
                                    : rec.status === 'SAKIT'
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {rec.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Student ID Card with Scannable Barcode */
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <div className="w-full max-w-md bg-white border-2 border-slate-300 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
                {/* School Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4 text-center border-b border-indigo-800">
                  <h4 className="font-extrabold text-base tracking-wide uppercase">
                    {settings.schoolName}
                  </h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    KARTU TANDA PELAJAR RESMI
                  </p>
                  <p className="text-[10px] text-indigo-300">
                    {settings.schoolAddress}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 bg-slate-50">
                  <div className="flex gap-4 items-center">
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';
                      }}
                      className="w-24 h-28 object-cover rounded-lg border-2 border-white shadow-sm bg-white"
                    />

                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Nama Siswa</span>
                        <div className="font-bold text-slate-900 text-sm">{student.name}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">NISN</span>
                        <div className="font-mono font-bold text-indigo-700 text-xs">{student.nisn}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Kelas</span>
                        <div className="font-semibold text-slate-800">{student.class}</div>
                      </div>
                    </div>
                  </div>

                  {/* Scannable Barcode SVG */}
                  <div className="mt-5 p-3 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-xs">
                    <svg ref={barcodeSvgRef} className="max-w-full" />
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Gunakan barcode ini untuk absensi otomatis
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrintCard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kartu Siswa Ini</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
