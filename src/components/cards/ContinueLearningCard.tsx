import React from 'react';
import { Video, BookOpen, ClipboardList, ArrowRight } from 'lucide-react';
import { LearningItem, ClassItem } from '../../types/lms';
import { ProgressBar } from '../common/ProgressBar';

interface ContinueLearningCardProps {
  learningItem: LearningItem;
  classItem: ClassItem;
  progressPercentage: number;
  onContinue: () => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  learningItem,
  classItem,
  progressPercentage,
  onContinue
}) => {
  const getItemIcon = () => {
    switch (learningItem.type) {
      case 'video':
        return <Video className="w-5 h-5 text-indigo-600" />;
      case 'assessment':
        return <ClipboardList className="w-5 h-5 text-amber-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getItemBadge = () => {
    switch (learningItem.type) {
      case 'video':
        return { label: 'Video YouTube', bg: 'bg-indigo-50', text: 'text-indigo-700' };
      case 'assessment':
        return { label: 'Asesmen & Tugas', bg: 'bg-amber-50', text: 'text-amber-700' };
      default:
        return { label: 'Modul Ajar PDF', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    }
  };

  const badge = getItemBadge();

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft card-hover-effect flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {classItem.subject}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {learningItem.durationLabel || '15 Menit'}
          </span>
        </div>

        <div className="flex gap-3.5 items-start mb-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
            {getItemIcon()}
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug line-clamp-2">
              {learningItem.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {classItem.title}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span>Progres Kelas:</span>
          <span className="font-bold text-indigo-600">{progressPercentage}%</span>
        </div>
        <ProgressBar progress={progressPercentage} color="indigo" size="sm" className="mb-4" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Langkah berikutnya</span>
          <button
            onClick={onContinue}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
          >
            <span>Lanjutkan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
