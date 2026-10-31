import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, ArrowRight, RotateCcw, FileText, Check 
} from 'lucide-react';
import { Student } from '../types/attendance';
import { downloadStudentTemplate, parseStudentExcelFile, ExcelImportResult } from '../utils/excel';

interface ImportExcelViewProps {
  onImportComplete: (importedStudents: Student[], mode: 'merge' | 'replace') => void;
  onResetDefaults: () => void;
  currentStudentCount: number;
}

export const ImportExcelView: React.FC<ImportExcelViewProps> = ({
  onImportComplete,
  onResetDefaults,
  currentStudentCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelImportResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const result = await parseStudentExcelFile(file);
      setParseResult(result);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Gagal memproses file Excel.');
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCommitImport = () => {
    if (!parseResult || parseResult.validStudents.length === 0) return;

    onImportComplete(parseResult.validStudents, importMode);
    setSuccessMessage(
      `Berhasil mengimpor ${parseResult.validStudents.length} siswa ke basis data sekolah dengan metode ${
        importMode === 'merge' ? 'penggabungan (merge)' : 'timpa seluruh data (replace)'
      }!`
    );
    setParseResult(null);
    setSelectedFile(null);
  };

  const handleResetConfirmation = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin memulihkan data siswa dan absensi ke setelan standar bawaan sekolah (lengkap dengan foto profil)?'
      )
    ) {
      onResetDefaults();
      setSuccessMessage('Data siswa dan absensi telah berhasil dikembalikan ke standar awal!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Import Data Siswa dari Excel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Unggah file spreadsheet (.xlsx, .xls, .csv) berisi daftar NISN dan data siswa untuk diperbarui sekaligus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadStudentTemplate}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download Format Template Excel</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold">1</span>
            <span>Download Template</span>
          </div>
          <p className="text-xs text-slate-600">
            Unduh file Excel resmi dengan kolom NISN, Nama, Kelas, Jenis Kelamin, dan Kontak Wali yang telah disesuaikan.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold">2</span>
            <span>Isi Data NISN Siswa</span>
          </div>
          <p className="text-xs text-slate-600">
            Salin atau ketik data siswa sekolah Anda ke dalam spreadsheet. Pastikan setiap NISN unik dan valid.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold">3</span>
            <span>Unggah & Verifikasi</span>
          </div>
          <p className="text-xs text-slate-600">
            Tarik file ke area upload, periksa preview validasi data, lalu klik simpan untuk langsung mengaktifkan absensi barcode.
          </p>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="bg-white border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors shadow-xs group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">
          {selectedFile ? selectedFile.name : 'Pilih File Excel atau Tarik & Letakkan di Sini'}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Mendukung format berkas .xlsx, .xls, atau .csv (Maksimal 10 MB)
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
          <Upload className="w-4 h-4" />
          <span>{isProcessing ? 'Sedang Membaca...' : 'Pilih Berkas Dari Komputer'}</span>
        </div>
      </div>

      {/* General Error Message */}
      {generalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Preview Section if file parsed */}
      {parseResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <h4 className="font-bold text-base text-slate-900">
                Pratinjau Hasil Pembacaan Berkas
              </h4>
              <p className="text-xs text-slate-500">
                Total baris: <strong>{parseResult.totalRows}</strong> | Siap diimpor:{' '}
                <strong className="text-emerald-600">{parseResult.validStudents.length} siswa valid</strong>
              </p>
            </div>

            {/* Merge vs Replace selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  importMode === 'merge' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gabungkan (Merge)
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  importMode === 'replace' ? 'bg-white text-rose-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gantikan Semua ({currentStudentCount} Lama)
              </button>
            </div>
          </div>

          {/* Validation Errors Notice */}
          {parseResult.errors.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                <span>Ditemukan {parseResult.errors.length} peringatan/kesalahan format pada baris tertentu:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5 max-h-32 overflow-y-auto pl-1">
                {parseResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table of Students */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">NISN</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Jenis Kelamin</th>
                  <th className="py-2.5 px-3">Kontak Wali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parseResult.validStudents.slice(0, 8).map((st, i) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-700">{st.nisn}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{st.name}</td>
                    <td className="py-2 px-3">{st.class}</td>
                    <td className="py-2 px-3">{st.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{st.guardianPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parseResult.validStudents.length > 8 && (
            <p className="text-center text-xs text-slate-400">
              Menampilkan 8 dari {parseResult.validStudents.length} siswa yang terdeteksi...
            </p>
          )}

          {/* Confirm Button */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => {
                setParseResult(null);
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Batalkan
            </button>
            <button
              onClick={handleCommitImport}
              disabled={parseResult.validStudents.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan {parseResult.validStudents.length} Siswa ke Database</span>
            </button>
          </div>
        </div>
      )}

      {/* Emergency Reset to Sample Data */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Ingin Mencoba Data Demo Bawaan Sekolah?
          </h4>
          <p className="text-xs text-slate-500">
            Pulihkan data awal berisi siswa SMA/SMK dengan foto profil resmi berseragam OSIS, riwayat absensi, dan pengaturan jam presensi.
          </p>
        </div>

        <button
          onClick={handleResetConfirmation}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Pulihkan Data Demo Bawaan</span>
        </button>
      </div>
    </div>
  );
};
