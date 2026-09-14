import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  Plus,
  Copy,
  Check,
  Award,
  ArrowRight,
  CopyPlus,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { ClassItem } from '../../types/lms';

interface TeacherDashboardProps {
  onSelectClass: (classId: string) => void;
  onOpenCreateClassModal: () => void;
  onOpenGradeBook: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onSelectClass,
  onOpenCreateClassModal,
  onOpenGradeBook
}) => {
  const { classes, submissions, learningItems, currentUser, duplicateClass, deleteClass } = useLMS();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [duplicateModalClass, setDuplicateModalClass] = useState<ClassItem | null>(null);
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<ClassItem | null>(null);
  const [newDuplicatedTitle, setNewDuplicatedTitle] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const teacherName = currentUser?.name || 'Bapak/Ibu Guru';
  const myClasses = classes.filter(c => c.teacherId === currentUser?.id || true);
  const pendingSubmissions = submissions.filter(s => s.score === null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenDuplicateModal = (cls: ClassItem) => {
    setDuplicateModalClass(cls);
    setNewDuplicatedTitle(`${cls.title} - Rombel 2`);
  };

  const handleConfirmDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateModalClass || !newDuplicatedTitle.trim()) return;

    const created = duplicateClass(duplicateModalClass.id, newDuplicatedTitle.trim());
    if (created) {
      setSuccessToast(`Kelas "${created.title}" berhasil disalin dengan Kode: ${created.code}`);
      setDuplicateModalClass(null);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-xs font-bold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Welcome & Stats Bar */}
      <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              Meja Guru & Pengajar
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Halo, {teacherName}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Kelola materi ajar terstruktur, monitor pengerjaan kuis siswa, dan berikan nilai tugas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenGradeBook}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Buku Nilai & Ekspor Excel</span>
            </button>

            <button
              onClick={onOpenCreateClassModal}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Ruang Kelas Baru</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 block">Total Kelas Aktif</span>
            <span className="text-2xl font-black text-slate-900">{myClasses.length}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 block">Materi & Modul</span>
            <span className="text-2xl font-black text-slate-900">{learningItems.length}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 block">Tugas Perlu Dinilai</span>
            <span className="text-2xl font-black text-amber-600">{pendingSubmissions.length}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 block">Tugas Selesai Dinilai</span>
            <span className="text-2xl font-black text-emerald-600">
              {submissions.filter(s => s.score !== null).length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Classes Management Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Daftar Kelas yang Anda Kelola
            </h2>
            <p className="text-xs text-slate-500">
              Bagikan kode 6 digit kepada siswa untuk bergabung ke kelas masing-masing.
            </p>
          </div>
          <button
            onClick={onOpenCreateClassModal}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kelas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myClasses.map(cls => (
            <div
              key={cls.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft card-hover-effect flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    {cls.subject}
                  </span>
                  <button
                    onClick={() => handleCopyCode(cls.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold transition-all"
                    title="Salin Kode Kelas Siswa"
                  >
                    <span>{cls.code}</span>
                    {copiedCode === cls.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1 mb-1">
                  {cls.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {cls.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 truncate">
                  {learningItems.filter(i => i.classId === cls.id).length} Materi
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenDuplicateModal(cls)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all text-xs font-bold flex items-center gap-1"
                    title="Salin Kelas & Seluruh Kurikulum ke Rombel Lain"
                  >
                    <CopyPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Salin</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmClass(cls)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-all text-xs font-bold flex items-center"
                    title="Hapus Kelas Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectClass(cls.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>Kelola Kelas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delete Class Confirmation Modal */}
      {deleteConfirmClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-slate-900 text-lg">Hapus Ruang Kelas?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus kelas <strong className="text-slate-800">"{deleteConfirmClass.title}"</strong>? Seluruh alur modul, materi, kuis, dan lembar nilai siswa pada kelas ini akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmClass(null)}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteClass(deleteConfirmClass.id);
                  setSuccessToast(`Kelas "${deleteConfirmClass.title}" berhasil dihapus.`);
                  setDeleteConfirmClass(null);
                  setTimeout(() => setSuccessToast(null), 3000);
                }}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Kelas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Class Modal */}
      {duplicateModalClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Salin Seluruh Kurikulum Kelas</h3>
                  <p className="text-xs text-slate-400">Untuk kelas/rombel paralel baru dengan materi yang sama</p>
                </div>
              </div>
              <button
                onClick={() => setDuplicateModalClass(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2 text-xs text-indigo-900 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-indigo-700">
                <Sparkles className="w-4 h-4" />
                <span>Kelas Sumber: {duplicateModalClass.title}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1">
                <li>Seluruh modul PDF, materi teks, video YouTube, dan soal kuis akan diduplikasi secara otomatis.</li>
                <li>Kelas baru akan mendapatkan <strong>Kode Kelas 6 Digit baru yang unik</strong>.</li>
                <li>Data siswa yang bergabung serta lembar nilai akan <strong>terpisah 100%</strong> dan tidak bercampur.</li>
              </ul>
            </div>

            <form onSubmit={handleConfirmDuplicate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Ruang Kelas Baru
                </label>
                <input
                  type="text"
                  required
                  value={newDuplicatedTitle}
                  onChange={e => setNewDuplicatedTitle(e.target.value)}
                  placeholder="Contoh: Rekayasa Perangkat Lunak X-RPL 2"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicateModalClass(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <CopyPlus className="w-4 h-4" />
                  <span>Salin Kelas Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

