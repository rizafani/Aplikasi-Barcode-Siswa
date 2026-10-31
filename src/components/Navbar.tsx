import React from 'react';
import { QrCode, Clock, Users, FileSpreadsheet, Settings, Database } from 'lucide-react';
import { SchoolSettings } from '../types/attendance';

export type ActiveTab = 'scan' | 'daily' | 'students' | 'import' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  settings: SchoolSettings;
  databaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  settings,
  databaseConnected = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element brand wordmark */}
          <div 
            onClick={() => setActiveTab('scan')}
            className="cursor-pointer flex items-center gap-3 shrink-0"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {settings.schoolLogoText.slice(0, 3)}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                {settings.schoolName}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                <span>Sistem Presensi Barcode NISN</span>
                {databaseConnected && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <Database className="w-3 h-3" />
                      <span>Cloud Database</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'scan'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Beranda & Scan</span>
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'daily'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Absensi Harian</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'students'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Data Siswa & Riwayat</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'import'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex border-t border-slate-200 overflow-x-auto py-1 px-2 gap-1 bg-slate-50">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 min-w-[70px] text-xs py-1.5 px-2 rounded font-medium text-center ${
            activeTab === 'scan' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Beranda
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 min-w-[70px] text-xs py-1.5 px-2 rounded font-medium text-center ${
            activeTab === 'daily' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Absensi
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 min-w-[70px] text-xs py-1.5 px-2 rounded font-medium text-center ${
            activeTab === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Siswa
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 min-w-[70px] text-xs py-1.5 px-2 rounded font-medium text-center ${
            activeTab === 'import' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Import
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[70px] text-xs py-1.5 px-2 rounded font-medium text-center ${
            activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Setelan
        </button>
      </div>
    </header>
  );
};
