import React, { useState } from 'react';
import { Bell, Users, Plus, Key, LogOut, ChevronDown, BookOpen, Award, Layers } from 'lucide-react';
import { useLMS } from '../../context/LMSContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenJoinClassModal: () => void;
  onOpenCreateClassModal: () => void;
  onOpenChangePasswordModal: () => void;
  onOpenStudentManagerModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenJoinClassModal,
  onOpenCreateClassModal,
  onOpenChangePasswordModal,
  onOpenStudentManagerModal
}) => {
  const { currentUser, logout } = useLMS();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* 1. LEFT: Brand & School Identity (Clean Single-Line) */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
            <div
              onClick={() => setActiveTab('learning')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0"
            >
              <img
                src="/logo.png"
                alt="Logo SMKN 5 Gowa"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight whitespace-nowrap">
                    P Mabar
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md tracking-wide whitespace-nowrap">
                    SMKN 5 GOWA
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 font-medium whitespace-nowrap -mt-0.5">
                  <span className="font-semibold text-indigo-600">Platform Manajemen Belajar Daring</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">by Yusril Wahyudi, S.Pd</span>
                </div>
              </div>
            </div>

            {/* Nav Tabs (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('learning')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'learning'
                    ? 'text-indigo-600 bg-indigo-50/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {currentUser.role === 'guru' ? 'Ruang Guru & Kelas' : 'Pembelajaran'}
              </button>

              <button
                onClick={() => setActiveTab('classes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'classes'
                    ? 'text-indigo-600 bg-indigo-50/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Katalog Kelas
              </button>

              <button
                onClick={() => setActiveTab('grades')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'grades'
                    ? 'text-indigo-600 bg-indigo-50/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {currentUser.role === 'guru' ? 'Buku Nilai' : 'Rapor Nilai'}
              </button>
            </nav>
          </div>

          {/* 2. RIGHT: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Guru Quick Actions */}
            {currentUser.role === 'guru' ? (
              <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={onOpenStudentManagerModal}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Data Siswa</span>
                </button>

                <button
                  onClick={onOpenCreateClassModal}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Kelas</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenJoinClassModal}
                className="hidden md:flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gabung Kelas</span>
              </button>
            )}

            {/* Notification Icon */}
            <button className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">
              <Bell className="w-4 h-4" />
            </button>

            {/* User Profile Pill */}
            <div className="relative border-l border-slate-200 pl-1.5 sm:pl-2">
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div className="hidden sm:block max-w-[100px] md:max-w-[130px] xl:max-w-[160px]">
                  <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize block leading-tight">
                    {currentUser.role === 'guru' ? 'Pengajar' : `NISN: ${currentUser.idNumber}`}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  onMouseLeave={() => setIsDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl p-2 shadow-modal border border-slate-100 z-50 animate-fade-in"
                >
                  <div className="p-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <span className="text-[10px] text-slate-400 block truncate">{currentUser.email}</span>
                  </div>

                  <div className="py-1 space-y-0.5 text-xs font-semibold text-slate-700">
                    {currentUser.role === 'guru' && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenStudentManagerModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Kelola Siswa (NISN)</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenChangePasswordModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>Ganti Kata Sandi</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
