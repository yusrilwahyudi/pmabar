import React from 'react';
import { ShieldAlert, AlertTriangle, XCircle } from 'lucide-react';

interface CheatWarningModalProps {
  violation: { reason: string; description: string } | null;
  strikes: number;
  maxStrikes: number;
  onDismiss: () => void;
}

export const CheatWarningModal: React.FC<CheatWarningModalProps> = ({
  violation,
  strikes,
  maxStrikes,
  onDismiss
}) => {
  if (!violation) return null;

  const isLastStrike = strikes >= maxStrikes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-modal border border-rose-100 transform transition-all text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          {isLastStrike ? (
            <XCircle className="w-9 h-9" />
          ) : (
            <ShieldAlert className="w-9 h-9" />
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {isLastStrike ? 'Pelanggaran Batas Ujian!' : 'Peringatan Keamanan Ujian!'}
        </h3>

        <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-800 text-sm font-medium mb-4">
          <p className="font-bold mb-1">Aktivitas Terlarang Terdeteksi:</p>
          <p>{violation.description}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-xs font-semibold text-slate-500">Tingkat Peringatan (Strike):</span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxStrikes }).map((_, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  idx < strikes ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {isLastStrike
            ? 'Anda telah mencapai batas maksimal peringatan (3x). Catatan pelanggaran ini akan dikirimkan langsung ke laporan buku nilai Guru.'
            : 'Dilarang keras copy-paste, screenshot, atau berpindah tab browser selama pengerjaan kuis/esai.'}
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-md active:scale-95"
        >
          {isLastStrike ? 'Lanjutkan Ujian (Tercatat)' : 'Saya Mengerti & Kembali ke Ujian'}
        </button>
      </div>
    </div>
  );
};
