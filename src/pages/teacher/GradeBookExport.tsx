import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Download, FileSpreadsheet, ShieldAlert, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

interface GradeBookExportProps {
  onBack: () => void;
}

export const GradeBookExport: React.FC<GradeBookExportProps> = ({ onBack }) => {
  const { classes, users, learningItems, submissions } = useLMS();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const students = users.filter(u => u.role === 'siswa');
  const classAssessments = learningItems.filter(i => i.classId === selectedClass?.id && i.type === 'assessment');

  // Matrix generation
  const gradeMatrix = students.map(student => {
    const studentSubs = classAssessments.map(item => {
      const sub = submissions.find(s => s.learningItemId === item.id && s.studentId === student.id);
      return {
        itemTitle: item.title,
        score: sub ? sub.score : null,
        isLate: sub ? sub.isLate : false,
        cheatStrikes: sub?.cheatStrikes || 0
      };
    });

    let totalScore = 0;
    let count = 0;
    studentSubs.forEach(s => {
      if (s.score !== null) {
        totalScore += s.score;
        count++;
      }
    });

    const average = count > 0 ? Math.round(totalScore / count) : 0;
    const totalStrikes = studentSubs.reduce((acc, s) => acc + s.cheatStrikes, 0);

    return {
      student,
      studentSubs,
      average,
      totalStrikes
    };
  });

  const handleExportExcel = (format: 'xlsx' | 'csv') => {
    if (!selectedClass) return;

    const dataRows = gradeMatrix.map((row, idx) => {
      const obj: Record<string, any> = {
        No: idx + 1,
        'Nama Siswa': row.student.name,
        'NISN': row.student.idNumber,
        'Email': row.student.email
      };

      row.studentSubs.forEach(s => {
        obj[`Nilai: ${s.itemTitle}`] = s.score !== null ? s.score : 'Belum Selesai';
      });

      obj['Rata-Rata Kelas'] = row.average;
      obj['Pelanggaran Ujian (Strikes)'] = row.totalStrikes;

      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai');

    const fileName = `Rekap_Nilai_${selectedClass.code}_${new Date().toISOString().slice(0, 10)}.${format}`;
    XLSX.writeFile(workbook, fileName, { bookType: format });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Export Actions */}
      <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Buku Rekap Nilai Resmi
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Rekapitulasi Nilai & Integritas Siswa
              </h1>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>

            <button
              onClick={() => handleExportExcel('xlsx')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.XLSX)</span>
            </button>

            <button
              onClick={() => handleExportExcel('csv')}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Matrix Table */}
      <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft">
        <h3 className="font-extrabold text-slate-900 text-base mb-4">
          Matriks Nilai Kelas: {selectedClass?.title}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 rounded-l-2xl">Siswa</th>
                <th className="py-3 px-4">NISN</th>
                {classAssessments.map(a => (
                  <th key={a.id} className="py-3 px-4">
                    {a.title}
                  </th>
                ))}
                <th className="py-3 px-4 font-black text-indigo-900">Rata-Rata</th>
                <th className="py-3 px-4 rounded-r-2xl">Catatan Ujian (Strikes)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gradeMatrix.map(row => (
                <tr key={row.student.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <img
                      src={row.student.avatar}
                      alt={row.student.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span>{row.student.name}</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-mono">
                    {row.student.idNumber}
                  </td>

                  {row.studentSubs.map((s, sIdx) => (
                    <td key={sIdx} className="py-4 px-4 font-semibold">
                      {s.score !== null ? (
                        <span className="text-slate-800 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                          {s.score}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  ))}

                  <td className="py-4 px-4">
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                      {row.average}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    {row.totalStrikes > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 inline-flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{row.totalStrikes} Pelanggaran Tab</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Integritas Baik
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
