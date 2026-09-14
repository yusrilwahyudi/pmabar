import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { PastelClassCard } from '../../components/cards/PastelClassCard';
import { ContinueLearningCard } from '../../components/cards/ContinueLearningCard';
import { BookOpen, Sparkles, Plus, GraduationCap } from 'lucide-react';

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

    // First unlocked and uncompleted item
    const nextItem = classItems.find(i => progress.isItemUnlocked(i.id) && !progress.isItemCompleted(i.id)) || classItems[0];

    return {
      cls,
      progress,
      nextItem
    };
  }).filter(item => item.nextItem);

  return (
    <div className="space-y-8 pb-16">
      {/* 1. SECTION: Lanjutkan Belajar */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Lanjutkan Belajar
            </h2>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          </div>
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Akses cepat ke materi dan tugas aktif Anda
          </span>
        </div>

        {activeClassItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
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
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-soft">
            <GraduationCap className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Belum ada materi aktif</p>
            <p className="text-xs text-slate-400 mt-1">Gabung ke ruang kelas Anda menggunakan kode 6 digit dari guru.</p>
          </div>
        )}
      </section>

      {/* 2. SECTION: Ruang Kelas Saya */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Ruang Kelas Saya
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              {enrolledClasses.length} Kelas Diikuti
            </span>
          </div>

          <button
            onClick={onOpenJoinClassModal}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gabung Kelas Baru</span>
          </button>
        </div>

        {enrolledClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledClasses.map(cls => (
              <PastelClassCard
                key={cls.id}
                classItem={cls}
                onSelectClass={onSelectClass}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/80 shadow-soft">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-800 text-base mb-1">Anda Belum Terdaftar di Kelas Manapun</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Mintalah kode kelas 6 digit (contoh: <code>5G-7501</code>) kepada Bapak/Ibu Guru pengajar Anda.
            </p>
            <button
              onClick={onOpenJoinClassModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              + Gabung Kelas Sekarang
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
