import React, { useState } from 'react';
import { Settings, Clock, School, Volume2, X, Check, RotateCcw } from 'lucide-react';
import { SchoolSettings } from '../types/attendance';

interface SettingsModalProps {
  settings: SchoolSettings;
  onSave: (newSettings: SchoolSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">
              Pengaturan Sistem Absensi Sekolah
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Pengaturan berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* School identity */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
              <School className="w-3.5 h-3.5" />
              <span>Identitas Sekolah</span>
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Sekolah (Untuk Kartu Pelajar)
              </label>
              <input
                type="text"
                value={formData.schoolAddress}
                onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
              />
            </div>
          </div>

          {/* Time & Attendance Rules */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Aturan Jam & Batas Presensi</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Batas Waktu Tepat Waktu (WIB)
                </label>
                <input
                  type="time"
                  required
                  value={formData.lateThresholdTime}
                  onChange={(e) => setFormData({ ...formData, lateThresholdTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">Scan setelah jam ini terhitung terlambat</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jam Mulai Presensi Pulang (WIB)
                </label>
                <input
                  type="time"
                  required
                  value={formData.checkOutStartTime}
                  onChange={(e) => setFormData({ ...formData, checkOutStartTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">Scan setelah jam ini mencatat jam pulang</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Preferensi & Suara</span>
            </h4>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-semibold text-slate-800">Suara Notifikasi Scan</div>
                <div className="text-[11px] text-slate-400">Mainkan bunyi chime/beep saat scan berhasil</div>
              </div>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Durasi Popup Hasil Scan Menutup Otomatis (Detik)
              </label>
              <select
                value={formData.autoCloseModalSeconds}
                onChange={(e) => setFormData({ ...formData, autoCloseModalSeconds: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value={2}>2 Detik (Sangat Cepat)</option>
                <option value={3}>3 Detik (Cepat)</option>
                <option value={4}>4 Detik (Standar Rekomendasi)</option>
                <option value={6}>6 Detik (Santai)</option>
                <option value={10}>10 Detik (Lebih Lama)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Simpan Setelan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
