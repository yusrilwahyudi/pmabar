import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { X, BookOpen, Sparkles, Lock } from 'lucide-react';
import { PastelTheme } from '../../types/lms';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (classId: string) => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { createClass } = useLMS();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<PastelTheme>('purple');
  const [code, setCode] = useState(() => `CLS-${Math.floor(100 + Math.random() * 900)}`);
  const [sequentialLocking, setSequentialLocking] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCls = createClass({
      title,
      subject: subject || 'Umum',
      description,
      theme,
      code: code.trim().toUpperCase(),
      sequentialLocking
    });

    onSuccess(newCls.id);
    onClose();
  };

  const themes: { id: PastelTheme; label: string; bg: string }[] = [
    { id: 'purple', label: 'Lavender', bg: 'bg-[#F5F3FF] border-[#EDE9FE]' },
    { id: 'pink', label: 'Pastel Rose', bg: 'bg-[#FDF2F4] border-[#FCE7EB]' },
    { id: 'blue', label: 'Soft Sky', bg: 'bg-[#F0F7FF] border-[#E0F0FE]' },
    { id: 'yellow', label: 'Amber Warm', bg: 'bg-[#FEF9EE] border-[#FEF08A]' },
    { id: 'green', label: 'Mint Green', bg: 'bg-[#F0FDF4] border-[#DCFCE7]' },
    { id: 'peach', label: 'Peach Sun', bg: 'bg-[#FFF7ED] border-[#FFEDD5]' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-4xl p-6 md:p-8 shadow-modal border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Buat Ruang Kelas Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kelas / Mata Pelajaran</label>
            <input
              type="text"
              required
              placeholder="Contoh: UI/UX Product Design Batch 2"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Kategori / Jurusan</label>
              <input
                type="text"
                placeholder="Contoh: DKV / RPL"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Kode Gabung Siswa</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat Kelas</label>
            <textarea
              rows={2}
              placeholder="Jelaskan ringkasan materi dan kompetensi yang akan dicapai..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none"
            />
          </div>

          {/* Theme selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Pilihan Warna Kartu Pastel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-2.5 rounded-2xl border text-center text-xs font-bold transition-all ${t.bg} ${
                    theme === t.id ? 'ring-2 ring-indigo-500 shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sequential Locking Switch */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Kunci Alur Belajar Bertahap</span>
                <span className="text-[10px] text-slate-500">Materi berikutnya terkunci sebelum item sebelumnya selesai.</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sequentialLocking}
              onChange={e => setSequentialLocking(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
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
              Buat Kelas Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
