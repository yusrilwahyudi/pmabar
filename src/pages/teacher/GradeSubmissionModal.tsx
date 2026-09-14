import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  X,
  FileText,
  Send,
  Download,
  ClipboardList,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Award,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface GradeSubmissionModalProps {
  submissionId: string | null;
  onClose: () => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  submissionId,
  onClose
}) => {
  const { submissions, learningItems, gradeSubmission } = useLMS();

  const submission = submissions.find(s => s.id === submissionId);
  const item = submission ? learningItems.find(i => i.id === submission.learningItemId) : null;

  const [score, setScore] = useState<number | string>(submission?.score ?? 85);
  const [feedback, setFeedback] = useState<string>(submission?.teacherFeedback ?? '');

  if (!submission || !item) return null;

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    gradeSubmission(submission.id, Number(score), feedback);
    onClose();
  };

  const questions = item.questions || [];
  const studentAnswers = submission.answers || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl md:rounded-4xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto animate-scale-up overflow-hidden">
        
        {/* 1. MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                  Pemeriksaan Jawaban Siswa
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    submission.isLate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {submission.isLate ? 'Terlambat' : 'Tepat Waktu'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {item.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE CONTENT BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Student Profile & Meta Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={submission.studentAvatar}
                alt={submission.studentName}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20"
              />
              <div>
                <p className="text-sm font-extrabold text-slate-900">{submission.studentName}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Dikumpulkan pada:{' '}
                    {new Date(submission.submittedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Anti-cheat status badge */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Proteksi Anti-Cheat: Aman
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {submission.cheatStrikes || 0} Pelanggaran Tab
                </span>
              </div>
            </div>
          </div>

          {/* DETAIL JAWABAN SISWA (SOAL PER SOAL) */}
          {submission.submissionType === 'quiz_answers' || questions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <span>Lembar Jawaban Siswa ({questions.length} Butir Soal)</span>
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  Total Nilai Otomatis: {submission.score ?? 0} / {submission.maxScore}
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const studentAns = studentAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                              {q.type === 'mcq' ? 'Pilihan Ganda' : 'Esai Refleksi / Uraian'} • {q.points} Poin
                            </span>
                            <p className="text-xs font-bold text-slate-900 leading-relaxed">
                              {q.questionText}
                            </p>
                          </div>
                        </div>

                        {/* Question Score Badge */}
                        {q.type === 'mcq' && studentAns && (
                          <div className="shrink-0">
                            {studentAns.isCorrect ? (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                +{q.points} Poin
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                0 Poin
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Question Options or Essay Answer */}
                      {q.type === 'mcq' && q.options ? (
                        <div className="space-y-1.5 pl-8">
                          {q.options.map(opt => {
                            const isSelected = studentAns?.selectedOptionId === opt.id;
                            const isCorrectAnswer = opt.isCorrect;

                            let optStyle = 'bg-white border-slate-200 text-slate-700';
                            if (isSelected && isCorrectAnswer) {
                              optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                            } else if (isSelected && !isCorrectAnswer) {
                              optStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-bold';
                            } else if (!isSelected && isCorrectAnswer) {
                              optStyle = 'bg-emerald-50/50 border-emerald-200 text-emerald-800';
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${optStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected ? (
                                    isCorrectAnswer ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    )
                                  ) : isCorrectAnswer ? (
                                    <span className="w-4 h-4 rounded-full border border-emerald-500 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="w-4 h-4 rounded-full border border-slate-300 text-slate-400"></span>
                                  )}
                                  <span>{opt.text}</span>
                                </div>

                                <div className="text-[10px] font-bold shrink-0">
                                  {isSelected && (
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white mr-1.5">
                                      Jawaban Siswa
                                    </span>
                                  )}
                                  {isCorrectAnswer && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                                      Kunci Benar
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Essay Answer Box */
                        <div className="pl-8">
                          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                              Jawaban Esai Siswa:
                            </span>
                            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {studentAns?.essayAnswer || (
                                <span className="text-slate-400 italic">Siswa tidak mengisi jawaban esai ini.</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* DETAIL UPLOAD BERKAS TUGAS (JIKA TIPE UPLOAD) */}
          {submission.submissionType === 'file_upload' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Berkas Tugas yang Diunggah Siswa</span>
              </h4>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{submission.fileName}</span>
                    <span className="text-[10px] text-slate-400">{submission.fileSize || '2.5 MB'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Mengunduh berkas tugas siswa: ${submission.fileName}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh & Periksa Berkas</span>
                </button>
              </div>

              {submission.notes && (
                <div className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-0.5">Catatan Pengumpulan dari Siswa:</span>
                  <p className="italic">"{submission.notes}"</p>
                </div>
              )}
            </div>
          )}

          {/* 3. GRADING & FEEDBACK SECTION */}
          <form id="grading-form" onSubmit={handleSaveGrade} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Formulir Penilaian & Umpan Balik Guru</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Total Nilai Siswa (Maks: {submission.maxScore})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={submission.maxScore}
                    required
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    / {submission.maxScore}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Catatan / Umpan Balik Guru untuk Siswa
                </label>
                <textarea
                  rows={2}
                  placeholder="Berikan apresiasi atau arahan perbaikan tugas siswa..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </form>

        </div>

        {/* 4. MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-all"
          >
            Tutup
          </button>
          <button
            type="submit"
            form="grading-form"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simpan Nilai & Perbarui Rapor</span>
          </button>
        </div>

      </div>
    </div>
  );
};
