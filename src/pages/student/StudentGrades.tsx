import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { Award, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export const StudentGrades: React.FC = () => {
  const { submissions, learningItems, currentUser } = useLMS();

  if (!currentUser) return null;

  const mySubmissions = submissions.filter(s => s.studentId === currentUser.id);
  const scoredSubmissions = mySubmissions.filter(s => s.score !== null);
  const totalScoreSum = scoredSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const averageScore = scoredSubmissions.length > 0 ? Math.round(totalScoreSum / scoredSubmissions.length) : 0;

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Rapor & Rekap Nilai Pribadi
        </h1>
        <p className="text-xs text-slate-500">
          Pantau seluruh hasil evaluasi belajar, tugas mandiri, dan catatan umpan balik dari pengajar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Rata-Rata Nilai</span>
            <span className="text-2xl font-black text-slate-900">{averageScore}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">Skala 100 Poin</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Tugas / Asesmen Selesai</span>
            <span className="text-2xl font-black text-slate-900">{mySubmissions.length}</span>
            <span className="text-[10px] text-slate-500 font-medium block">{scoredSubmissions.length} Sudah Dinilai</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Status Siswa</span>
            <span className="text-base font-black text-slate-900">Aktif Terdaftar</span>
            <span className="text-[10px] text-slate-400 font-mono block">NISN: {currentUser.idNumber}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft">
        <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>Daftar Nilai & Hasil Evaluasi</span>
        </h3>

        {mySubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Materi / Tugas</th>
                  <th className="py-3 px-4">Waktu Selesai</th>
                  <th className="py-3 px-4">Status Pengiriman</th>
                  <th className="py-3 px-4">Nilai</th>
                  <th className="py-3 px-4 rounded-r-2xl">Catatan Umpan Balik Pengajar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mySubmissions.map(sub => {
                  const item = learningItems.find(i => i.id === sub.learningItemId);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {item?.title || 'Penugasan'}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {new Date(sub.submittedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            sub.isLate
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {sub.isLate ? 'Terlambat' : 'Tepat Waktu'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {sub.score !== null ? (
                          <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                            {sub.score} / {sub.maxScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold italic">Belum dinilai</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 italic">
                        {sub.teacherFeedback ? `"${sub.teacherFeedback}"` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-400">Belum ada tugas atau asesmen yang dikerjakan.</p>
          </div>
        )}
      </div>
    </div>
  );
};
