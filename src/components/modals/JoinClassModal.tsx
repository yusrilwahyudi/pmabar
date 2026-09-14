import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { X, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (classId: string) => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { joinClassByCode, classes } = useLMS();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = joinClassByCode(code);
    if (result.success && result.classItem) {
      onSuccess(result.classItem.id);
      onClose();
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-4xl p-6 md:p-8 shadow-modal border border-slate-100">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Gabung ke Ruang Kelas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Masukkan 6-digit kode kelas yang diberikan oleh guru pengajar Anda (contoh kode demo: <span className="font-mono font-bold text-indigo-600">UIX-101</span>, <span className="font-mono font-bold text-indigo-600">FSW-202</span>).
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Kode Kelas (Case-Insensitive):
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: UIX-101"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center font-mono font-black text-lg tracking-widest text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              Gabung Kelas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
