import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { X, Key, Plus, Gamepad2, Users, Sparkles, ChevronRight } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenJoinClass: () => void;
  onOpenCreateClass: () => void;
  onOpenGameArena: () => void;
  onOpenStudentManager: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onOpenJoinClass,
  onOpenCreateClass,
  onOpenGameArena,
  onOpenStudentManager
}) => {
  const { currentUser } = useLMS();

  if (!isOpen || !currentUser) return null;

  const isTeacher = currentUser.role === 'guru';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-4xl p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-slide-up sm:animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Menu Aksi Cepat
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih aktivitas yang ingin Anda lakukan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Items List */}
        <div className="space-y-2.5">
          {/* Action 1: Cerdas Cermat Arena (Available for both Student and Teacher) */}
          <button
            onClick={() => {
              onClose();
              onOpenGameArena();
            }}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-rose-500/20 border-2 border-amber-500/30 text-left flex items-center justify-between gap-3 group transition-all active:scale-98 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                    Arena Cerdas Cermat
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isTeacher ? 'Buka & pimpin sesi adu cepat bel di kelas' : 'Masuk ke sesi bel cerdas cermat bersama kelompok'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />
          </button>

          {/* Action 2: Join Class (For Student) */}
          {!isTeacher && (
            <button
              onClick={() => {
                onClose();
                onOpenJoinClass();
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left flex items-center justify-between gap-3 group transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Gabung Kelas Baru
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Masukkan 6 digit kode kelas dari guru Anda
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            </button>
          )}

          {/* Action 3: Create Class (For Teacher) */}
          {isTeacher && (
            <button
              onClick={() => {
                onClose();
                onOpenCreateClass();
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left flex items-center justify-between gap-3 group transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Buat Ruang Kelas Baru
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rancang alur modul ajar dan pertemuan mingguan
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            </button>
          )}

          {/* Action 4: Manage Students (For Teacher) */}
          {isTeacher && (
            <button
              onClick={() => {
                onClose();
                onOpenStudentManager();
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left flex items-center justify-between gap-3 group transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 group-hover:text-slate-700 transition-colors">
                    Kelola Akun Siswa
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tambah atau impor daftar akun siswa kelas
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
