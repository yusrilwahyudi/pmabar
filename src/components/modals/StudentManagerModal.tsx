import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { X, Users, UserPlus, UploadCloud, CheckCircle2, Trash2, Key } from 'lucide-react';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({ isOpen, onClose }) => {
  const { users, registerStudent, deleteStudent, resetStudentPassword } = useLMS();

  const [activeTab, setActiveTab] = useState<'list' | 'single' | 'batch'>('list');
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [batchText, setBatchText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const students = users.filter(u => u.role === 'siswa');

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim() || !name.trim()) return;

    const res = registerStudent({
      idNumber: nisn.trim(),
      name: name.trim(),
      email: email.trim() || `${nisn.trim()}@siswa.sch.id`
    });

    if (res.success) {
      setMessage(`Siswa ${name} berhasil didaftarkan dengan kata sandi bawaan: ${nisn}`);
      setNisn('');
      setName('');
      setEmail('');
      setActiveTab('list');
    } else {
      setMessage(res.message);
    }
  };

  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) return;

    const lines = batchText.trim().split('\n');
    let addedCount = 0;

    lines.forEach(line => {
      // Split by comma or semicolon or tab
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        const studentNisn = parts[0];
        const studentName = parts[1];
        const studentEmail = parts[2] || `${studentNisn}@siswa.sch.id`;

        if (studentNisn && studentName) {
          const res = registerStudent({
            idNumber: studentNisn,
            name: studentName,
            email: studentEmail
          });
          if (res.success) addedCount++;
        }
      }
    });

    setMessage(`Berhasil mengimpor ${addedCount} data siswa!`);
    setBatchText('');
    setActiveTab('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-4xl p-6 md:p-8 shadow-modal border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Kelola Data Siswa & Akun NISN
              </h3>
              <p className="text-xs text-slate-400">Total {students.length} Siswa Terdaftar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            Daftar Siswa ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'single' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            + Tambah Siswa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'batch' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            📥 Impor Massal (CSV/Teks)
          </button>
        </div>

        {message && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <span>{message}</span>
          </div>
        )}

        {/* TAB 1: LIST SISWA */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">Kata Sandi Bawaan</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{s.idNumber}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {s.isPasswordChanged ? (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                            Sudah Diubah Siswa
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">Sama dgn NISN</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            resetStudentPassword(s.id);
                            setMessage(`Kata sandi siswa ${s.name} direset ke NISN (${s.idNumber})`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Reset Password ke NISN"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteStudent(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TAMBAH SINGLE */}
        {activeTab === 'single' && (
          <form onSubmit={handleAddSingle} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nomor NISN Siswa</label>
              <input
                type="text"
                required
                placeholder="Contoh: 0078129010"
                value={nisn}
                onChange={e => setNisn(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap Siswa</label>
              <input
                type="text"
                required
                placeholder="Contoh: Muhammad Rizky"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Siswa (Opsional)</label>
              <input
                type="email"
                placeholder="Contoh: rizky@siswa.sch.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              * Password awal siswa otomatis disetel sama dengan nomor NISN.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                Daftarkan Siswa
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: BATCH IMPORT */}
        {activeTab === 'batch' && (
          <form onSubmit={handleBatchImport} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tempel Data Siswa (Format: NISN, Nama Siswa per baris)
              </label>
              <textarea
                rows={7}
                required
                placeholder={`0078129011, Arya Pratama\n0078129012, Cindy Claudia\n0078129013, Dika Anggara`}
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none leading-relaxed"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Salin kolom NISN dan Nama dari file Excel Anda lalu tempel di atas. Sistem akan mendaftarkan seluruh siswa secara otomatis.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                Impor Seluruh Siswa
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
