import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { X, Gamepad2, ArrowRight, Zap, Users } from 'lucide-react';
import { ClassItem } from '../../types/lms';

interface SelectClassForGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClassForGame: (classId: string) => void;
}

export const SelectClassForGameModal: React.FC<SelectClassForGameModalProps> = ({
  isOpen,
  onClose,
  onSelectClassForGame
}) => {
  const { classes, classMembers, currentUser } = useLMS();

  if (!isOpen) return null;

  // Filter accessible classes
  const availableClasses = classes.filter(cls => {
    if (currentUser?.role === 'guru') return true;
    return classMembers.some(m => m.classId === cls.id && m.studentId === currentUser?.id);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl md:rounded-4xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Pilih Kelas Cerdas Cermat
              </h3>
              <p className="text-xs text-slate-500">
                Pilih kelas untuk masuk ke arena adu cepat bel
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

        {/* Class List */}
        <div className="overflow-y-auto max-h-[380px] space-y-3 pr-1">
          {availableClasses.length > 0 ? (
            availableClasses.map(cls => (
              <button
                key={cls.id}
                onClick={() => {
                  onSelectClassForGame(cls.id);
                  onClose();
                }}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-3 group active:scale-98 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                        {cls.subject}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cls.code}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 truncate mt-0.5 group-hover:text-indigo-600 transition-colors">
                      {cls.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 shrink-0 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-xs group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Belum Ada Kelas</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Gabung ke ruang kelas terlebih dahulu dengan memasukkan kode kelas.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[11px] text-slate-400">
          💡 Pastikan guru sudah membuka sesi cerdas cermat di kelas terkait.
        </div>
      </div>
    </div>
  );
};
