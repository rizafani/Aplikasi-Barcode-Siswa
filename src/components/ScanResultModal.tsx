import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, X, AlertTriangle, AlertOctagon, User, Phone, BookOpen } from 'lucide-react';
import { Student, AttendanceRecord } from '../types/attendance';

export type ScanOutcome =
  | { type: 'SUCCESS'; record: AttendanceRecord; student: Student; isNewCheckIn: boolean; isCheckOut: boolean }
  | { type: 'ALREADY_CHECKED_IN'; record: AttendanceRecord; student: Student }
  | { type: 'NOT_FOUND'; nisn: string };

interface ScanResultModalProps {
  outcome: ScanOutcome | null;
  onClose: () => void;
  autoCloseSeconds?: number;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  outcome,
  onClose,
  autoCloseSeconds = 4,
}) => {
  const [countdown, setCountdown] = useState(autoCloseSeconds);

  useEffect(() => {
    if (!outcome) return;

    setCountdown(autoCloseSeconds);

    // Fire celebratory confetti only on new check-in or check-out success
    if (outcome.type === 'SUCCESS') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'],
        });
      } catch {
        // ignore
      }
    }

    // Auto-countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [outcome, autoCloseSeconds, onClose]);

  if (!outcome) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Outcome Header Banner */}
        {outcome.type === 'SUCCESS' && (
          <div
            className={`p-4 text-white flex items-center justify-between ${
              outcome.record.status === 'TERLAMBAT'
                ? 'bg-amber-600'
                : outcome.isCheckOut
                ? 'bg-indigo-600'
                : 'bg-emerald-600'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                {outcome.isCheckOut
                  ? 'Presensi Pulang Berhasil Tercatat'
                  : outcome.record.status === 'TERLAMBAT'
                  ? 'Presensi Masuk Berhasil (Terlambat)'
                  : 'Presensi Masuk Berhasil (Tepat Waktu)'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-black/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {outcome.type === 'ALREADY_CHECKED_IN' && (
          <div className="p-4 bg-sky-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Siswa Sudah Melakukan Presensi Sebelumnya</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-black/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {outcome.type === 'NOT_FOUND' && (
          <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <span>NISN Tidak Ditemukan di Basis Data</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-black/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {outcome.type === 'NOT_FOUND' ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">NISN Siswa Tidak Terdaftar</h4>
                <p className="font-mono text-sm font-semibold text-rose-600 mt-1 bg-rose-50 inline-block px-3 py-1 rounded-md">
                  {outcome.nisn}
                </p>
                <p className="text-xs text-slate-500 mt-3 max-w-sm mx-auto">
                  Pastikan barcode yang dipindai adalah NISN siswa yang telah diimpor ke database sekolah atau daftarkan siswa baru melalui menu Data Siswa.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Student Profile Card (Taken directly from school database) */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                {/* Student Photo */}
                <div className="relative shrink-0">
                  <img
                    src={outcome.student.photoUrl}
                    alt={outcome.student.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';
                    }}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {outcome.student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </div>
                </div>

                {/* Student Info */}
                <div className="space-y-1.5 text-center sm:text-left min-w-0 flex-1">
                  <div className="text-xs font-semibold text-indigo-600 flex items-center justify-center sm:justify-start gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Basis Data Siswa Terverifikasi</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 leading-tight">
                    {outcome.student.name}
                  </h3>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 pt-1">
                    <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-800">
                      NISN: {outcome.student.nisn}
                    </span>
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-800">
                      Kelas: {outcome.student.class}
                    </span>
                  </div>

                  {outcome.student.guardianPhone && outcome.student.guardianPhone !== '-' && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 pt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Kontak Wali: {outcome.student.guardianPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Details Strip */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Status Presensi
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 font-bold text-sm">
                    {outcome.record.status === 'HADIR' && (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Hadir Tepat Waktu
                      </span>
                    )}
                    {outcome.record.status === 'TERLAMBAT' && (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Terlambat
                      </span>
                    )}
                    {outcome.record.status !== 'HADIR' && outcome.record.status !== 'TERLAMBAT' && (
                      <span className="text-slate-800">{outcome.record.status}</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Waktu Scan Tercatat
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 font-mono font-bold text-sm text-slate-800">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>
                      {outcome.type === 'SUCCESS' && outcome.isCheckOut
                        ? outcome.record.checkOutTime
                        : outcome.record.checkInTime}{' '}
                      WIB
                    </span>
                  </div>
                </div>
              </div>

              {outcome.record.notes && (
                <div className="mt-3 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
                  <span className="font-semibold">Catatan:</span> {outcome.record.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Auto-Close countdown */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Menutup otomatis dalam <strong>{countdown} detik</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Selesai / Lanjut Scan
          </button>
        </div>
      </div>
    </div>
  );
};
