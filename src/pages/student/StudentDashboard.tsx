import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { PastelClassCard } from '../../components/cards/PastelClassCard';
import { ContinueLearningCard } from '../../components/cards/ContinueLearningCard';
import { BookOpen, Plus, Sparkles, Key, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface StudentDashboardProps {
  onSelectClass: (classId: string) => void;
  onOpenItem: (classId: string, itemId: string) => void;
  onOpenJoinClassModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectClass,
  onOpenItem,
  onOpenJoinClassModal
}) => {
  const { classes, classMembers, learningItems, currentUser, getStudentClassProgress } = useLMS();

  // Enrolled Classes: Hanya kelas yang sudah digabung oleh siswa dengan kode kelas
  const enrolledClasses = classes.filter(cls =>
    classMembers.some(m => m.classId === cls.id && m.studentId === currentUser?.id)
  );

  // Rekomendasi Lanjutkan Belajar hanya dari kelas yang diikuti
  const activeClassItems = enrolledClasses.map(cls => {
    const progress = getStudentClassProgress(cls.id);
    const classItems = learningItems
      .filter(i => i.classId === cls.id)
      .sort((a, b) => a.order - b.order);

    const nextItem = classItems.find(i => progress.isItemUnlocked(i.id) && !progress.isItemCompleted(i.id)) || classItems[0];

    return {
      cls,
      progress,
      nextItem
    };
  }).filter(item => item.nextItem);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* 1. SLIM & COMPACT HERO HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 p-0.5 border border-white/20 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.name}`}
                alt={currentUser?.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.2 rounded-md text-[9px] sm:text-[10px] font-bold bg-white/20 text-white">
                  Siswa SMKN 5 Gowa
                </span>
                <span className="text-[10px] sm:text-xs text-indigo-200 font-mono">
                  NISN: {currentUser?.idNumber}
                </span>
              </div>
              <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate mt-0.5">
                Halo, {currentUser?.name?.split(' ')[0] || 'Siswa'} 👋
              </h1>
            </div>
          </div>

          {/* Desktop Join Class button */}
          {enrolledClasses.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenJoinClassModal}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md border border-white/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gabung Kelas</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN BODY CONTENT */}
      {enrolledClasses.length === 0 ? (
        /* ONBOARDING STATE KETIKA BELUM ADA KELAS */
        <div className="bg-white rounded-3xl md:rounded-4xl p-6 sm:p-10 border border-slate-200/80 shadow-soft text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
            <Key className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Mulai Belajar dengan Kode Kelas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Anda belum terdaftar di ruang kelas manapun. Masukkan 6 digit kode kelas yang diberikan oleh Bapak/Ibu Guru untuk mengakses materi.
          </p>

          {/* 3 Step Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 sm:my-8 text-left">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">1</span>
              <h4 className="font-bold text-xs text-slate-800">Minta Kode Kelas</h4>
              <p className="text-[11px] text-slate-500 mt-1">Dapatkan kode 6 digit dari guru pengajar (contoh: <code>5G-7501</code>).</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">2</span>
              <h4 className="font-bold text-xs text-slate-800">Klik Gabung</h4>
              <p className="text-[11px] text-slate-500 mt-1">Tekan tombol di bawah atau tombol (+) di bilah bawah.</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">3</span>
              <h4 className="font-bold text-xs text-slate-800">Mulai Belajar</h4>
              <p className="text-[11px] text-slate-500 mt-1">Baca modul, tonton video, dan kerjakan kuis secara bertahap.</p>
            </div>
          </div>

          {/* SINGLE PRIMARY CTA ON EMPTY STATE */}
          <button
            onClick={onOpenJoinClassModal}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Masukkan Kode Kelas Sekarang</span>
          </button>
        </div>
      ) : (
        /* KETIKA SUDAH PUNYA KELAS */
        <div className="space-y-6 md:space-y-8">
          {/* Section A: Lanjutkan Belajar (Hanya jika ada) */}
          {activeClassItems.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    Lanjutkan Belajar
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>
                <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                  Akses instan ke materi berikutnya
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeClassItems.slice(0, 2).map(({ cls, progress, nextItem }) => (
                  <ContinueLearningCard
                    key={cls.id}
                    classItem={cls}
                    learningItem={nextItem}
                    progressPercentage={progress.percentage}
                    onContinue={() => onOpenItem(cls.id, nextItem.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section B: Ruang Kelas Saya */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Ruang Kelas Saya
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {enrolledClasses.length} Kelas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {enrolledClasses.map(cls => (
                <PastelClassCard
                  key={cls.id}
                  classItem={cls}
                  onSelectClass={onSelectClass}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

