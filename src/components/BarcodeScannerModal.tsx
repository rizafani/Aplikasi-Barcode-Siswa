import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, Keyboard, AlertCircle, Sparkles, Check } from 'lucide-react';
import { Student } from '../types/attendance';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedNisn: string) => void;
  allStudents: Student[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  allStudents,
}) => {
  const [manualNisn, setManualNisn] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reader-viewport';
  const lastScannedTimeRef = useRef<number>(0);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        setIsScanning(false);
      }
    }
  }, [isScanning]);

  // Handle successful detection
  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      // Debounce 1.5 seconds to avoid multi-fire on same scan
      if (now - lastScannedTimeRef.current < 1500) {
        return;
      }
      lastScannedTimeRef.current = now;

      // Extract cleaned NISN digits
      const cleaned = decodedText.trim().replace(/[^0-9]/g, '');
      if (cleaned.length > 0) {
        onScanSuccess(cleaned);
      } else {
        onScanSuccess(decodedText.trim());
      }
    },
    [onScanSuccess]
  );

  // Initialize and start scanner
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    try {
      setCameraError(null);

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('Tidak ada kamera video yang terdeteksi di perangkat Anda.');
        return;
      }

      setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id.slice(0, 5)}` })));

      const activeId = cameraIdToUse || devices[devices.length - 1].id; // default back camera if multiple
      setSelectedCameraId(activeId);

      // Destroy previous instance if any
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch {
          // ignore
        }
      }

      const qrCodeScanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = qrCodeScanner;

      await qrCodeScanner.start(
        activeId,
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // scanning frame, no barcode in sight yet
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('Izin akses kamera ditolak oleh browser. Silakan izinkan akses kamera atau gunakan input manual / barcode scanner USB di bawah.');
      } else {
        setCameraError('Tidak dapat mengakses kamera. Anda tetap dapat menggunakan input manual atau barcode scanner USB.');
      }
      setIsScanning(false);
    }
  }, [handleDecodedText]);

  // Lifecycle when open
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM element #reader-viewport is mounted
      const timer = setTimeout(() => {
        startScanner();
      }, 150);

      // Auto-focus manual input for barcode gun
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 300);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualNisn.trim()) {
      onScanSuccess(manualNisn.trim());
      setManualNisn('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pemindai Barcode NISN Siswa</h3>
              <p className="text-xs text-slate-400">Arahkan barcode kartu pelajar ke kamera</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 space-y-5">
          {/* Camera Viewport Container */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center shadow-inner">
            <div id={scannerContainerId} className="w-full h-full" />

            {/* Visual Viewfinder Overlay Guide */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-36 border-2 border-indigo-400/90 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                  {/* Scanning beam animation */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-400 animate-pulse shadow-sm shadow-indigo-300" />
                  <div className="absolute -top-6 left-0 right-0 text-center text-indigo-300 text-[11px] font-mono font-medium drop-shadow-md">
                    Pas-kan Barcode NISN di sini
                  </div>
                </div>
              </div>
            )}

            {/* Error or No Camera Fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <h4 className="font-semibold text-sm">Kamera Tidak Aktif</h4>
                <p className="text-xs text-slate-300 max-w-sm mt-1">{cameraError}</p>
                <button
                  onClick={() => startScanner()}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Akses Kamera Lagi
                </button>
              </div>
            )}
          </div>

          {/* Camera Switcher if multiple cameras */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Ganti Kamera:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => startScanner(e.target.value)}
                className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-md text-xs font-medium text-slate-800"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hardware Barcode Gun / Manual Input Fallback */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Keyboard className="w-4 h-4 text-indigo-600" />
              <span>Input Manual / Scanner Barcode USB / Bluetooth</span>
            </div>
            <p className="text-xs text-slate-500">
              Jika menggunakan alat scanner barcode eksternal, cukup scan dan alat akan otomatis mengisi kolom di bawah.
            </p>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                ref={manualInputRef}
                type="text"
                placeholder="Ketik atau scan 10 digit NISN..."
                value={manualNisn}
                onChange={(e) => setManualNisn(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Proses Absen
              </button>
            </form>
          </div>

          {/* Quick Click-to-Test buttons for instant reviewer testing */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Uji Coba Cepat (Klik NISN Siswa):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allStudents.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onScanSuccess(s.nisn)}
                  className="p-2 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                    {s.name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    {s.nisn}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Scan Siswa Ini</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Tutup Pemindai
          </button>
        </div>
      </div>
    </div>
  );
};
