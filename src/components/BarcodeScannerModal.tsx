import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { 
  X, Camera, RefreshCw, Keyboard, AlertCircle, Sparkles, 
  Check, Upload, Image, Flashlight, ShieldAlert, Video 
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualNisn, setManualNisn] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-reader-container';
  const lastScannedTimeRef = useRef<number>(0);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera scanner safely
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Notice while stopping scanner:', err);
      } finally {
        setIsScanning(false);
        setIsLoadingCamera(false);
        setTorchEnabled(false);
      }
    }
  }, []);

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

  // Start camera scanner with intelligent fallback (environment -> user -> camera list)
  const startCameraScanner = useCallback(
    async (cameraIdToUse?: string) => {
      setIsLoadingCamera(true);
      setCameraError(null);

      // Check navigator.mediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Browser Anda atau lingkungan saat ini tidak mendukung API kamera (navigator.mediaDevices).'
        );
        setIsLoadingCamera(false);
        return;
      }

      // Check if container element exists
      const containerEl = document.getElementById(scannerContainerId);
      if (!containerEl) {
        console.warn('Scanner container element not yet mounted');
        setIsLoadingCamera(false);
        return;
      }

      // Cleanup existing scanner if running
      await stopScanner();

      try {
        const qrCodeScanner = new Html5Qrcode(scannerContainerId, {
          verbose: false,
        });
        html5QrCodeRef.current = qrCodeScanner;

        const config: Html5QrcodeCameraScanConfig = {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const w = Math.max(160, Math.floor(minEdge * 0.85));
            const h = Math.max(90, Math.floor(w * 0.55));
            return { width: w, height: h };
          },
          aspectRatio: 1.333333,
        };

        // If specific camera selected
        if (cameraIdToUse) {
          await qrCodeScanner.start(
            cameraIdToUse,
            config,
            (text) => handleDecodedText(text),
            () => {}
          );
          setSelectedCameraId(cameraIdToUse);
        } else {
          // Attempt 1: Start with back camera (environment)
          try {
            await qrCodeScanner.start(
              { facingMode: 'environment' },
              config,
              (text) => handleDecodedText(text),
              () => {}
            );
          } catch (envErr) {
            console.log('FacingMode environment failed, trying user webcam...', envErr);
            // Attempt 2: Start with front webcam (user)
            try {
              await qrCodeScanner.start(
                { facingMode: 'user' },
                config,
                (text) => handleDecodedText(text),
                () => {}
              );
            } catch (userErr) {
              console.log('FacingMode user failed, trying camera list...', userErr);
              // Attempt 3: Query available cameras and use the first one
              const devices = await Html5Qrcode.getCameras();
              if (devices && devices.length > 0) {
                setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id.slice(0, 5)}` })));
                setSelectedCameraId(devices[0].id);
                await qrCodeScanner.start(
                  devices[0].id,
                  config,
                  (text) => handleDecodedText(text),
                  () => {}
                );
              } else {
                throw userErr;
              }
            }
          }
        }

        setIsScanning(true);
        setIsLoadingCamera(false);

        // Populate camera list in background
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length > 0) {
              setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id.slice(0, 5)}` })));
            }
          })
          .catch(() => {});

        // Check torch capabilities
        try {
          const stream = qrCodeScanner.getRunningTrackCameraCapabilities();
          if (stream && (stream as unknown as { torchFeature?: () => { isSupported: () => boolean } }).torchFeature) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err) {
        console.error('Camera scanner start failed:', err);
        const errMsg = err instanceof Error ? err.message : String(err);

        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission') || errMsg.includes('denied')) {
          setCameraError(
            'Izin akses kamera ditolak oleh browser. Klik ikon gembok/izin kamera di address bar browser Anda, pilih "Izinkan", lalu klik "Coba Akses Kamera Lagi".'
          );
        } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
          setCameraError(
            'Tidak ada perangkat kamera yang terpasang di perangkat ini. Anda dapat menggunakan fitur "Upload Foto Kartu", "Input Manual / Barcode Gun", atau tombol simulasi.'
          );
        } else if (errMsg.includes('NotReadableError') || errMsg.includes('TrackStartError')) {
          setCameraError(
            'Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Google Meet, atau tab lain). Tutup aplikasi tersebut dan coba lagi.'
          );
        } else {
          setCameraError(
            `Kamera tidak dapat diakses (${errMsg}). Silakan gunakan opsi Upload Foto Kartu atau Barcode Scanner USB/Manual di bawah.`
          );
        }

        setIsScanning(false);
        setIsLoadingCamera(false);
      }
    },
    [handleDecodedText, stopScanner]
  );

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        const stream = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
        const torchFeature = (stream as unknown as { torchFeature?: () => { apply: (v: boolean) => Promise<void> } }).torchFeature?.();
        if (torchFeature) {
          const nextState = !torchEnabled;
          await torchFeature.apply(nextState);
          setTorchEnabled(nextState);
        }
      } catch (err) {
        console.warn('Torch toggle not supported:', err);
      }
    }
  };

  // Process file upload / image barcode
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingFile(true);

    try {
      // Create temporary scanner instance for file scanning
      const fileScanner = new Html5Qrcode('barcode-file-temp', { verbose: false });
      const decodedText = await fileScanner.scanFile(file, true);
      fileScanner.clear();

      setIsProcessingFile(false);
      handleDecodedText(decodedText);
    } catch (err) {
      setIsProcessingFile(false);
      setUploadError(
        'Barcode tidak terdeteksi pada gambar tersebut. Pastikan foto barcode/QR code jelas, tidak buram, dan memiliki pencahayaan yang cukup.'
      );
      console.warn('File barcode scan error:', err);
    }
  };

  // Modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setCameraError(null);
      setUploadError(null);

      if (activeTab === 'camera') {
        const timer = setTimeout(() => {
          startCameraScanner();
        }, 200);

        return () => {
          clearTimeout(timer);
          stopScanner();
        };
      } else if (activeTab === 'manual') {
        setTimeout(() => {
          manualInputRef.current?.focus();
        }, 200);
        stopScanner();
      } else {
        stopScanner();
      }
    } else {
      stopScanner();
    }
  }, [isOpen, activeTab, startCameraScanner, stopScanner]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualNisn.trim()) {
      onScanSuccess(manualNisn.trim());
      setManualNisn('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Pemindai Barcode NISN Siswa</h3>
              <p className="text-[11px] text-slate-400">Pindai kartu pelajar secara langsung atau unggah foto</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher for Scanner Modes */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'camera'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Kamera Langsung</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Foto Barcode</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Scanner USB / Manual</span>
          </button>
        </div>

        {/* Hidden element for file scanning */}
        <div id="barcode-file-temp" className="hidden" />

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: Live Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {/* Camera Viewport Container */}
              <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[260px] aspect-[4/3] flex items-center justify-center shadow-inner border border-slate-800">
                <div id={scannerContainerId} className="w-full h-full" />

                {/* Loading indicator */}
                {isLoadingCamera && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white p-4">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                    <p className="text-xs font-semibold">Menginisialisasi Kamera...</p>
                    <p className="text-[11px] text-slate-400 mt-1">Mohon izinkan akses kamera jika browser meminta</p>
                  </div>
                )}

                {/* Viewfinder Target Overlay Guide */}
                {isScanning && !cameraError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-32 border-2 border-indigo-400 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-400 animate-pulse" />
                      <div className="absolute -top-6 left-0 right-0 text-center text-indigo-300 text-[10px] font-mono font-medium drop-shadow-md">
                        Arahkan Barcode NISN di Kotak Ini
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera Error Fallback Card */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/98 flex flex-col items-center justify-center p-5 text-center text-white space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div className="max-w-md">
                      <h4 className="font-bold text-sm text-amber-300">Kendala Akses Kamera</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{cameraError}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => startCameraScanner()}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Akses Kamera Lagi</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Upload Foto Kartu</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Under Camera */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {cameras.length > 1 ? (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="font-medium">Kamera:</span>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => startCameraScanner(e.target.value)}
                      className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-md text-xs font-medium text-slate-800"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Mode Pemindaian Otomatis Aktif</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {hasTorch && (
                    <button
                      onClick={handleToggleTorch}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
                        torchEnabled
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      <Flashlight className="w-3.5 h-3.5" />
                      <span>{torchEnabled ? 'Lampu Nyala' : 'Lampu'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => startCameraScanner(selectedCameraId)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Muat ulang kamera"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh Kamera</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Upload Barcode Image */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Image className="w-7 h-7" />
                </div>

                <h4 className="font-bold text-sm text-slate-800 mt-3">
                  Pilih atau Foto Kartu Pelajar
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Ambil foto kartu pelajar ber-barcode atau pilih berkas gambar dari galeri/penyimpanan perangkat Anda.
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessingFile ? 'Membaca Barcode...' : 'Pilih Gambar'}</span>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Hardware Barcode Scanner Gun / Manual NISN */}
          {activeTab === 'manual' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Keyboard className="w-4 h-4 text-indigo-600" />
                <span>Scanner Barcode Fisik (USB / Bluetooth) & Input Manual</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jika sekolah Anda memiliki alat scanner barcode pistol/gun fisik, alat tersebut akan otomatis mengetik NISN dan menekan Enter pada kotak di bawah.
              </p>

              <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
                <input
                  ref={manualInputRef}
                  type="text"
                  placeholder="Ketik atau scan 10 digit NISN..."
                  value={manualNisn}
                  onChange={(e) => setManualNisn(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Proses Absen
                </button>
              </form>
            </div>
          )}

          {/* Quick Simulation Chips */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Uji Coba Cepat (Klik untuk Simulasi Scan):</span>
              </div>
              <span className="text-[11px] text-slate-400">Database Siswa</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allStudents.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onScanSuccess(s.nisn)}
                  className="p-2 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-all cursor-pointer group"
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
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Mendukung barcode: Code 128, Code 39, QR Code, EAN
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup Pemindai
          </button>
        </div>
      </div>
    </div>
  );
};
