import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, Clock, AlertCircle, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { AttendanceRecord, SchoolSettings, Student } from '../types/attendance';

interface DigitalClockProps {
  onStartScan: () => void;
  onQuickSimulate: (nisn: string) => void;
  todayRecords: AttendanceRecord[];
  allStudents: Student[];
  settings: SchoolSettings;
  onViewDaily: () => void;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  onStartScan,
  onQuickSimulate,
  todayRecords,
  allStudents,
  settings,
  onViewDaily,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time parts
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  // Format Indonesian date
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const indonesianDate = currentTime.toLocaleDateString('id-ID', dateOptions);

  // Time comparison logic
  const currentHM = `${hours}:${minutes}`;
  const isCheckOutSession = currentHM >= settings.checkOutStartTime;
  const isLate = !isCheckOutSession && currentHM > settings.lateThresholdTime;

  // Today stats
  const totalStudents = allStudents.length;
  const hadirCount = todayRecords.filter((r) => r.status === 'HADIR').length;
  const terlambatCount = todayRecords.filter((r) => r.status === 'TERLAMBAT').length;
  const totalScanned = todayRecords.length;
  const belumHadirCount = Math.max(0, totalStudents - totalScanned);

  // Recent scans (sorted by scannedAt desc)
  const recentScans = [...todayRecords]
    .sort((a, b) => b.scannedAt - a.scannedAt)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero Clock & Scan Trigger Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left: Clock Display */}
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Waktu Resmi Presensi Sekolah</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">WIB (GMT+7)</span>
              </div>

              {/* Big Tabular Digits */}
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white tabular-nums">
                  {hours}:{minutes}
                </span>
                <span className="font-mono text-2xl sm:text-4xl text-indigo-300 font-semibold tabular-nums w-14">
                  :{seconds}
                </span>
              </div>

              {/* Date */}
              <p className="text-base sm:text-lg text-slate-300 font-medium mt-3">
                {indonesianDate}
              </p>

              {/* Active session guideline */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-200">
                  <span className="text-slate-400">Batas Masuk:</span>
                  <span className="font-mono font-bold text-amber-400">{settings.lateThresholdTime} WIB</span>
                </span>

                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-200">
                  <span className="text-slate-400">Jam Pulang:</span>
                  <span className="font-mono font-bold text-indigo-300">{settings.checkOutStartTime} WIB</span>
                </span>

                {isCheckOutSession ? (
                  <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg font-medium">
                    <UserCheck className="w-3.5 h-3.5" />
                    Sesi Presensi Pulang Berjalan
                  </span>
                ) : isLate ? (
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Lewat Batas Waktu Masuk (Status Terlambat)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sesi Masuk Tepat Waktu
                  </span>
                )}
              </div>
            </div>

            {/* Right: Primary Scan Button */}
            <div className="shrink-0 flex flex-col sm:items-start lg:items-end gap-3">
              <button
                onClick={onStartScan}
                className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-indigo-500 hover:bg-indigo-400 active:scale-98 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs uppercase tracking-wider text-indigo-100 font-semibold">
                    Kamera / Barcode Scanner
                  </div>
                  <div className="text-xl font-bold leading-tight">
                    Mulai Pemindaian Barcode
                  </div>
                </div>
              </button>

              <p className="text-xs text-slate-400 text-left lg:text-right max-w-xs">
                Arahkan kartu pelajar ber-barcode NISN ke depan kamera atau gunakan scanner barcode USB.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Simulator Bar for Instant Testing without camera */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium shrink-0">
            <span className="text-slate-400">Simulasi Cepat (Klik untuk Uji Scan):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {allStudents.slice(0, 4).map((student) => (
              <button
                key={student.id}
                onClick={() => onQuickSimulate(student.nisn)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg font-medium transition-colors cursor-pointer"
                title={`NISN: ${student.nisn}`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>{student.name.split(' ')[0]}</span>
                <span className="font-mono text-[11px] text-slate-400">({student.class})</span>
              </button>
            ))}
            <button
              onClick={() => onQuickSimulate('9999999999')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-700 rounded-lg font-medium transition-colors cursor-pointer"
              title="Test simulasi NISN tidak terdaftar"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>NISN Tak Terdaftar</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Siswa
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              {totalStudents}
            </span>
            <span className="text-xs text-slate-500">Terdaftar</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            Hadir Tepat Waktu
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-emerald-600 tabular-nums">
              {hadirCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {totalStudents > 0 ? `${Math.round((hadirCount / totalStudents) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">
            Terlambat
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-amber-600 tabular-nums">
              {terlambatCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              {totalStudents > 0 ? `${Math.round((terlambatCount / totalStudents) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Belum Hadir
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-slate-700 tabular-nums">
              {belumHadirCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Siswa
            </span>
          </div>
        </div>
      </div>

      {/* Live Recent Scans Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Aktivitas Presensi Terkini Hari Ini
            </h2>
            <span className="text-xs text-slate-500">· {recentScans.length} data terbaru</span>
          </div>
          <button
            onClick={onViewDaily}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Lihat Semua Absensi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Belum ada siswa yang melakukan absensi hari ini.</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol "Mulai Pemindaian Barcode" di atas untuk memulai pemindaian kartu siswa.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentScans.map((rec) => {
              const isHadir = rec.status === 'HADIR';
              const isTerlambat = rec.status === 'TERLAMBAT';

              return (
                <div key={rec.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={rec.photoUrl}
                      alt={rec.studentName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {rec.studentName}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {rec.nisn}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{rec.studentClass}</span>
                        <span>·</span>
                        <span>Check-in: <strong className="font-mono text-slate-700">{rec.checkInTime}</strong></span>
                        {rec.checkOutTime && (
                          <>
                            <span>·</span>
                            <span>Check-out: <strong className="font-mono text-slate-700">{rec.checkOutTime}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                        isHadir
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isTerlambat
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {rec.status === 'HADIR' ? 'Hadir Tepat Waktu' : rec.status === 'TERLAMBAT' ? 'Terlambat' : rec.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
