import React from 'react';
import { ClassItem, PastelTheme } from '../../types/lms';
import { ProgressBar } from '../common/ProgressBar';
import { BookOpen, Lock, ArrowRight, Key, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useLMS } from '../../context/LMSContext';

interface PastelClassCardProps {
  classItem: ClassItem;
  onSelectClass: (classId: string) => void;
}

export const PastelClassCard: React.FC<PastelClassCardProps> = ({ classItem, onSelectClass }) => {
  const { getStudentClassProgress, currentUser, classMembers } = useLMS();
  const { percentage, completedCount, totalCount } = getStudentClassProgress(classItem.id);

  const themeMap: Record<
    PastelTheme,
    {
      bg: string;
      border: string;
      badgeBg: string;
      badgeText: string;
      progressColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
      accentEmoji: string;
    }
  > = {
    pink: {
      bg: 'bg-[#FDF2F4]',
      border: 'border-[#FCE7EB]',
      badgeBg: 'bg-white/80',
      badgeText: 'text-[#BE185D]',
      progressColor: 'rose',
      accentEmoji: '👩‍💻'
    },
    blue: {
      bg: 'bg-[#F0F7FF]',
      border: 'border-[#E0F0FE]',
      badgeBg: 'bg-white/80',
      badgeText: 'text-[#0369A1]',
      progressColor: 'indigo',
      accentEmoji: '🕵️‍♀️'
    },
    yellow: {
      bg: 'bg-[#FEF9EE]',
      border: 'border-[#FEF08A]',
      badgeBg: 'bg-white/80',
      badgeText: 'text-[#B45309]',
      progressColor: 'amber',
      accentEmoji: '🧑‍🏫'
    },
    green: {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#DCFCE7]',
      badgeBg: 'bg-white/80',
      badgeText: 'text-[#15803D]',
      progressColor: 'emerald',
      accentEmoji: '👩‍🎨'
    },
    purple: {
      bg: 'bg-[#F5F3FF]',
      border: 'border-[#EDE9FE]',
      badgeBg: 'bg-white/80',
      badgeText: 'text-[#6D28D9]',
      progressColor: 'purple',
      accentEmoji: '🚀'
    },
    peach: {
      bg: 'bg-[#FFF7ED]',
      border: 'border-[#FFEDD5]',
      badgeBg: 'bg-white/80',
      badgeText: 'text-[#C2410C]',
      progressColor: 'amber',
      accentEmoji: '💡'
    }
  };

  const style = themeMap[classItem.theme] || themeMap.purple;
  const isTeacher = currentUser?.role === 'guru';
  const isEnrolled = isTeacher || classMembers.some(m => m.classId === classItem.id && m.studentId === currentUser?.id);

  return (
    <div
      onClick={() => onSelectClass(classItem.id)}
      className={`relative rounded-3xl p-6 border ${style.border} ${style.bg} card-hover-effect cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-soft transition-all`}
    >
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {isTeacher ? (
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${style.badgeBg} ${style.badgeText} shadow-xs border border-black/5`}>
                Kelas Anda
              </span>
            ) : isEnrolled ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                Terdaftar (Siswa)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                <Lock className="w-3 h-3" />
                Terkunci (Perlu Kode)
              </span>
            )}

            {isEnrolled ? (
              <span className="ml-2 inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/60 text-slate-600">
                Kode: {classItem.code}
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100/90 text-slate-500 border border-slate-200/60">
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                Akses Terbatas
              </span>
            )}
          </div>

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/90 shadow-sm border border-black/5 flex items-center justify-center text-3xl overflow-hidden p-1">
              <img
                src={classItem.teacherAvatar}
                alt={classItem.teacherName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-2">
            {classItem.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {classItem.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mb-6">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>{totalCount || classItem.totalModules} modul materi</span>
          </div>
          {classItem.sequentialLocking && (
            <div className="flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-lg">
              <Lock className="w-3 h-3" />
              <span>Jalur Bertahap</span>
            </div>
          )}
        </div>
      </div>

      {isEnrolled ? (
        <div className="pt-4 border-t border-black/5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Progres Belajar</span>
            <span className="text-slate-900">{percentage}%</span>
          </div>

          <ProgressBar progress={percentage} color={style.progressColor} size="sm" className="mb-4" />

          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] font-medium text-slate-500">
              {completedCount}/{totalCount} Materi Selesai
            </span>

            <button className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm">
              <span>{isTeacher ? 'Kelola Kelas' : percentage > 0 ? 'Lanjutkan' : 'Mulai Belajar'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-black/5">
          <div className="p-2.5 bg-white/70 rounded-2xl border border-black/5 flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Butuh kode kelas dari guru</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Belum Gabung
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectClass(classItem.id);
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Key className="w-3.5 h-3.5" />
            <span>+ Masukkan Kode Kelas</span>
          </button>
        </div>
      )}
    </div>
  );
};

