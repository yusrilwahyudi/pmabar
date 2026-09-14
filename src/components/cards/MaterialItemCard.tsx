import React from 'react';
import {
  BookOpen,
  Video,
  ClipboardList,
  Lock,
  CheckCircle2,
  ArrowRight,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { LearningItem } from '../../types/lms';
import { CircularProgress } from '../common/ProgressBar';

interface MaterialItemCardProps {
  item: LearningItem;
  isUnlocked: boolean;
  isCompleted: boolean;
  onOpen: () => void;
}

export const MaterialItemCard: React.FC<MaterialItemCardProps> = ({
  item,
  isUnlocked,
  isCompleted,
  onOpen
}) => {
  const getItemDetails = () => {
    switch (item.type) {
      case 'video':
        return {
          icon: <Video className="w-5 h-5 text-indigo-600" />,
          typeBadge: 'Video YouTube',
          typeColor: 'bg-indigo-50 text-indigo-700',
          actionText: isCompleted ? 'Tonton Ulang' : 'Tonton Video'
        };
      case 'assessment':
        return {
          icon: <ClipboardList className="w-5 h-5 text-amber-600" />,
          typeBadge: 'Asesmen & Tugas',
          typeColor: 'bg-amber-50 text-amber-700',
          actionText: isCompleted ? 'Lihat Hasil' : 'Mulai Kerjakan'
        };
      default:
        return {
          icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
          typeBadge: 'Modul Ajar PDF',
          typeColor: 'bg-emerald-50 text-emerald-700',
          actionText: isCompleted ? 'Buka Ulang' : 'Buka Modul'
        };
    }
  };

  const details = getItemDetails();

  return (
    <div
      className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
        !isUnlocked
          ? 'bg-slate-50/80 border-slate-200/60 opacity-75'
          : isCompleted
          ? 'bg-white border-emerald-100 shadow-soft hover:border-emerald-200'
          : 'bg-white border-slate-200 shadow-soft card-hover-effect'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${details.typeColor}`}>
              {details.typeBadge}
            </span>
            {item.documentFile && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                <Download className="w-3 h-3" /> PDF
              </span>
            )}
          </div>

          {!isUnlocked ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-200/70 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3" />
              <span>Terkunci</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Selesai</span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Tahap Aktif
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            {details.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
              {item.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>

        {/* Duration / Points info */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 font-medium">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{item.durationLabel || '15 Menit'}</span>
          </div>
          {item.points && (
            <span className="text-amber-600 font-bold">{item.points} Poin</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        {!isUnlocked ? (
          <p className="text-[11px] text-slate-400 flex items-center gap-1 italic">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Selesaikan tahap sebelumnya</span>
          </p>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CircularProgress progress={isCompleted ? 100 : 0} size={22} />
              <span className="text-xs font-semibold text-slate-600">
                {isCompleted ? 'Tuntas' : 'Siap Dipelajari'}
              </span>
            </div>

            <button
              onClick={onOpen}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                isCompleted
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              <span>{details.actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
