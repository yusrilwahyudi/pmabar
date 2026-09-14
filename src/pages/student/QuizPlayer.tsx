import React, { useState, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { useExamProctor } from '../../hooks/useExamProctor';
import { ExamWatermark } from '../../components/exam/ExamWatermark';
import { CheatWarningModal } from '../../components/exam/CheatWarningModal';
import {
  Clock,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Send,
  Trophy,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizPlayerProps {
  itemId: string;
  onClose: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ itemId, onClose }) => {
  const { learningItems, currentUser, submitAssessment } = useLMS();
  const item = learningItems.find(i => i.id === itemId);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string; essayAnswer?: string }>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    totalScore: number;
    maxScore: number;
    isPassed: boolean;
    correctMcqCount: number;
    totalMcqCount: number;
  } | null>(null);

  const studentName = currentUser?.name || 'Siswa';
  const studentIdNumber = currentUser?.idNumber || '0000000000';

  const {
    cheatStrikes,
    cheatLogs,
    currentViolation,
    clearCurrentViolation,
    isFlagged
  } = useExamProctor({
    enabled: !isSubmitted && (item?.enableAntiCheat ?? true),
    studentName: studentName,
    maxAllowedStrikes: 3
  });

  useEffect(() => {
    if (item && item.durationMinutes) {
      setTimeLeftSeconds(item.durationMinutes * 60);
    } else {
      setTimeLeftSeconds(20 * 60); // default 20 mins
    }
  }, [item]);

  useEffect(() => {
    if (isSubmitted || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeftSeconds]);

  if (!item || !currentUser) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl">
        <p>Asesmen tidak ditemukan atau Anda belum masuk akun.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs">
          Kembali
        </button>
      </div>
    );
  }

  const questions = item.questions || [];
  const currentQ = questions[currentQuestionIdx];

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptionId: optionId
      }
    }));
  };

  const handleEssayChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        essayAnswer: text
      }
    }));
  };

  const handleSubmitQuiz = () => {
    if (isSubmitted) return;

    let totalScore = 0;
    let maxScore = 0;
    let correctMcqCount = 0;
    let totalMcqCount = 0;

    const formattedAnswers: Record<string, any> = {};

    questions.forEach(q => {
      maxScore += q.points;
      const userAns = answers[q.id];

      if (q.type === 'mcq') {
        totalMcqCount++;
        const correctOpt = q.options?.find(opt => opt.isCorrect);
        const isCorrect = userAns?.selectedOptionId === correctOpt?.id;

        if (isCorrect) {
          totalScore += q.points;
          correctMcqCount++;
        }

        formattedAnswers[q.id] = {
          selectedOptionId: userAns?.selectedOptionId,
          isCorrect,
          scoreEarned: isCorrect ? q.points : 0
        };
      } else {
        formattedAnswers[q.id] = {
          essayAnswer: userAns?.essayAnswer || '',
          scoreEarned: q.points
        };
        totalScore += q.points;
      }
    });

    const isPassed = totalScore >= 70;

    submitAssessment({
      learningItemId: item.id,
      classId: item.classId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentAvatar: currentUser.avatar,
      submissionType: 'quiz_answers',
      answers: formattedAnswers,
      cheatStrikes,
      cheatLogs,
      isFlagged,
      isLate: item.deadline ? new Date() > new Date(item.deadline) : false,
      score: totalScore,
      maxScore: maxScore || 100
    });

    setFinalResult({
      totalScore,
      maxScore: maxScore || 100,
      isPassed,
      correctMcqCount,
      totalMcqCount
    });

    setIsSubmitted(true);

    if (isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isSubmitted && finalResult) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-4xl p-8 md:p-10 border border-slate-200/80 shadow-modal text-center">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md ${
              finalResult.isPassed
                ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100'
                : 'bg-rose-100 text-rose-600 shadow-rose-100'
            }`}
          >
            {finalResult.isPassed ? <Trophy className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
          </div>

          <span
            className={`px-3.5 py-1 rounded-full text-xs font-bold ${
              finalResult.isPassed
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {finalResult.isPassed ? 'LULUS (MEMENUHI SYARAT)' : 'EVALUASI SELESAI'}
          </span>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 mb-2">
            Hasil Pengerjaan Asesmen
          </h2>
          <p className="text-xs text-slate-500 mb-8">{item.title}</p>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-6 flex items-center justify-around">
            <div>
              <span className="text-xs font-bold text-slate-400 block">Skor Akhir</span>
              <span className="text-4xl font-black text-slate-900">{finalResult.totalScore}</span>
              <span className="text-xs text-slate-400 font-bold block">/ {finalResult.maxScore} Poin</span>
            </div>

            <div className="h-12 w-[1px] bg-slate-200" />

            <div>
              <span className="text-xs font-bold text-slate-400 block">Pilihan Ganda Benar</span>
              <span className="text-2xl font-black text-emerald-600">
                {finalResult.correctMcqCount} / {finalResult.totalMcqCount}
              </span>
              <span className="text-xs text-slate-400 font-bold block">Koreksi Otomatis</span>
            </div>
          </div>

          {cheatStrikes > 0 && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-left mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Catatan Integritas Ujian: {cheatStrikes} Pelanggaran Terdeteksi</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Sistem merekam {cheatStrikes} kali aktivitas mencurigakan (seperti ganti tab / copy-paste).
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            Selesai & Kembali ke Materi Pembelajaran
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 px-4 md:px-8 exam-secure-mode relative">
      <ExamWatermark studentName={studentName} studentIdNumber={studentIdNumber} />

      <CheatWarningModal
        violation={currentViolation}
        strikes={cheatStrikes}
        maxStrikes={3}
        onDismiss={clearCurrentViolation}
      />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Mode Asesmen Terproteksi (Anti-Cheat)
              </span>
              {cheatStrikes > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{cheatStrikes} Peringatan</span>
                </span>
              )}
            </div>
            <h2 className="font-extrabold text-slate-900 text-base md:text-lg mt-1 line-clamp-1">
              {item.title}
            </h2>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-black text-sm md:text-base ${
              timeLeftSeconds < 180
                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Sisa Waktu: {formatTimer(timeLeftSeconds)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center gap-2 overflow-x-auto">
          {questions.map((q, idx) => {
            const hasAnswered = answers[q.id]?.selectedOptionId || answers[q.id]?.essayAnswer;
            const isCurrent = idx === currentQuestionIdx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all flex-shrink-0 ${
                  isCurrent
                    ? 'bg-slate-900 text-white ring-2 ring-indigo-500/30 shadow-xs'
                    : hasAnswered
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentQ && (
          <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200 shadow-soft">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Soal Nomor {currentQuestionIdx + 1} dari {questions.length} ({currentQ.type === 'mcq' ? 'Pilihan Ganda' : 'Esai'})
              </span>
              <span className="text-xs font-bold text-slate-400">
                Bobot: {currentQ.points} Poin
              </span>
            </div>

            <h3 className="text-base md:text-lg font-extrabold text-slate-900 leading-relaxed mb-6 select-none">
              {currentQ.questionText}
            </h3>

            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-3 select-none">
                {currentQ.options.map(opt => {
                  const isSelected = answers[currentQ.id]?.selectedOptionId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'essay' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">
                  Tuliskan uraian jawaban Anda:
                </label>
                <textarea
                  rows={6}
                  value={answers[currentQ.id]?.essayAnswer || ''}
                  onChange={e => handleEssayChange(currentQ.id, e.target.value)}
                  placeholder="Ketik jawaban secara mandiri..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-sans"
                />
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentQuestionIdx === 0
                    ? 'opacity-40 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              {currentQuestionIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Jawaban Asesmen</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
