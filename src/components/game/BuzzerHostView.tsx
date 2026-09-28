import React, { useState, useEffect, useRef } from 'react';
import { BuzzerGameSession, GameGroup, GameQuestionPrompt } from '../../types/game';
import { buzzerService } from '../../services/buzzerService';
import { soundEngine } from '../../utils/audioEffects';
import { useLMS } from '../../context/LMSContext';
import confetti from 'canvas-confetti';
import {
  Bell,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Sparkles,
  Award,
  Flame,
  Zap,
  ArrowRight,
  Maximize2,
  Minimize2,
  Radio,
  BookOpen,
  Settings2,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface BuzzerHostViewProps {
  session: BuzzerGameSession;
  onUpdateSession?: (updated: BuzzerGameSession) => void;
  onClose?: () => void;
  onExit?: () => void;
}

export const BuzzerHostView: React.FC<BuzzerHostViewProps> = ({
  session,
  onUpdateSession,
  onClose,
  onExit
}) => {
  const handleExit = onExit || onClose || (() => {});
  const { learningItems } = useLMS();
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [answerTimer, setAnswerTimer] = useState<number>(session.remainingAnswerSeconds);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [customPointsInput, setCustomPointsInput] = useState(100);

  const containerRef = useRef<HTMLDivElement>(null);

  // Extract class assessment questions as game bank
  const classQuizItems = learningItems.filter(
    i => i.classId === session.classId && i.type === 'assessment' && i.questions && i.questions.length > 0
  );

  const bankQuestions: GameQuestionPrompt[] = classQuizItems.flatMap(item =>
    (item.questions || []).map(q => ({
      id: q.id,
      questionText: q.questionText,
      points: q.points || 100,
      category: item.title,
      correctAnswer: q.options?.find(o => o.isCorrect)?.text
    }))
  );

  // Answer countdown timer when a team locks the buzzer
  useEffect(() => {
    let interval: any = null;

    if (session.phase === 'answering' && session.buzzerWinner) {
      setAnswerTimer(session.answerTimeLimitSeconds);

      interval = setInterval(() => {
        setAnswerTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            soundEngine.playWrongAnswer();
            return 0;
          }
          if (prev <= 4) {
            soundEngine.playTick(true);
          } else {
            soundEngine.playTick(false);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [session.phase, session.buzzerWinner, session.answerTimeLimitSeconds]);

  // Keyboard hotkeys for smooth live classroom hosting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (session.phase === 'ready' || session.phase === 'lobby' || session.phase === 'round_result') {
          handleOpenBuzzer();
        }
      } else if (e.key === 'b' || e.key === 'B') {
        if (session.phase === 'answering') {
          handleAwardPoints(true);
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (session.phase === 'answering') {
          handleAwardPoints(false);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetRound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session]);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleOpenBuzzer = () => {
    soundEngine.playBuzzerOpen();
    const updated = buzzerService.openBuzzer(session);
    onUpdateSession?.(updated);
  };

  const handleAwardPoints = (isCorrect: boolean) => {
    if (isCorrect) {
      soundEngine.playCorrectAnswer();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } else {
      soundEngine.playWrongAnswer();
    }

    const updated = buzzerService.awardPoints(session, isCorrect, session.currentQuestion?.points);
    onUpdateSession?.(updated);
  };

  const handleResetRound = () => {
    const updated = buzzerService.resetRound(session, true);
    onUpdateSession?.(updated);
  };

  const handleSelectBankQuestion = (q: GameQuestionPrompt) => {
    const updated: BuzzerGameSession = {
      ...session,
      currentQuestion: q,
      phase: 'ready',
      buzzerWinner: null
    };
    buzzerService.broadcast(updated, 'UPDATE_QUESTION');
    onUpdateSession?.(updated);
    setIsBankModalOpen(false);
  };

  const handleSetCustomQuestion = () => {
    if (!customQuestionInput.trim()) return;
    const prompt: GameQuestionPrompt = {
      id: `custom-q-${Date.now()}`,
      questionText: customQuestionInput.trim(),
      points: customPointsInput,
      category: 'Soal Guru'
    };
    const updated: BuzzerGameSession = {
      ...session,
      currentQuestion: prompt,
      phase: 'ready',
      buzzerWinner: null
    };
    buzzerService.broadcast(updated, 'UPDATE_QUESTION');
    onUpdateSession?.(updated);
    setCustomQuestionInput('');
  };

  const handleAdjustScore = (groupId: string, delta: number) => {
    const updatedGroups = session.groups.map(g =>
      g.id === groupId ? { ...g, score: Math.max(0, g.score + delta) } : g
    );
    const updated: BuzzerGameSession = {
      ...session,
      groups: updatedGroups
    };
    buzzerService.broadcast(updated, 'STATE_SYNC');
    onUpdateSession?.(updated);
  };

  const handleEndGame = () => {
    soundEngine.playVictory();
    try {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    } catch (e) {}
    const updated = buzzerService.endGame(session);
    onUpdateSession?.(updated);
  };

  // Sort groups by score descending for podium/ranking
  const sortedGroups = [...session.groups].sort((a, b) => b.score - a.score);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-6 select-none overflow-y-auto"
    >
      {/* 1. TOP BAR: Branding, Round Info & Host Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                🔴 LIVE ARENA
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {session.className}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white mt-0.5">
              Adu Cepat Cerdas Cermat
            </h1>
          </div>
        </div>

        {/* Center Round & Phase Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl">
          <span className="text-xs font-bold text-slate-400">
            Ronde: <strong className="text-white text-sm">{session.roundNumber}</strong> / {session.totalRounds}
          </span>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{
              backgroundColor: session.phase === 'buzzer_open' ? '#10B981' : session.phase === 'answering' ? '#F59E0B' : '#64748B'
            }} />
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
              {session.phase === 'buzzer_open'
                ? '🟢 Bel Terbuka'
                : session.phase === 'answering'
                ? '⚡ Menjawab'
                : session.phase === 'game_over'
                ? '🏆 Game Selesai'
                : '🔒 Siaga'}
            </span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Pilih Soal dari Bank Kelas"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Bank Soal ({bankQuestions.length})</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Layar Penuh Proyektor"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleExit}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 hover:text-white transition-all"
            title="Keluar dari Arena"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN BATTLE ARENA (Center Stage) */}
      <div className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* LEFT/CENTER 8 COLS: Projector Main Display */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-6">
          
          {/* Question Prompt Card */}
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {session.currentQuestion?.category || 'Pertanyaan Lisan Guru'}
              </span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                ⭐ {session.currentQuestion?.points || session.pointsForCorrect} Poin
              </span>
            </div>

            <h2 className="text-xl md:text-3xl font-extrabold text-white text-center leading-relaxed py-2">
              {session.currentQuestion?.questionText || (
                <span className="text-slate-400 italic font-normal">
                  "Guru membacakan pertanyaan langsung di depan kelas..."
                </span>
              )}
            </h2>

            {session.currentQuestion?.correctAnswer && (
              <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Kunci Jawaban Guru:
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {session.currentQuestion.correctAnswer}
                </span>
              </div>
            )}
          </div>

          {/* MAIN BUZZER STATUS STAGE */}
          {session.phase === 'lobby' || session.phase === 'ready' ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                <Bell className="w-10 h-10 text-slate-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-200">
                  Bel Masih Terkunci
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Bacakan pertanyaan kepada siswa, lalu tekan tombol <strong>"Buka Bel"</strong> atau tekan tombol <strong>Spacebar</strong> untuk membuka bel adu cepat.
                </p>
              </div>

              <button
                onClick={handleOpenBuzzer}
                className="px-8 py-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-base md:text-lg shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6 fill-white" />
                <span>Buka Bel Sekarang! (Space)</span>
              </button>
            </div>
          ) : session.phase === 'buzzer_open' ? (
            /* BUZZER OPEN - PULSING NEON READY STATE */
            <div className="text-center space-y-4 py-4 animate-pulse">
              <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                <Radio className="w-14 h-14 text-emerald-300 animate-spin" />
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-black text-emerald-300 tracking-wide">
                  BEL DIBUKA! SIAPA CEPAT DIA DAPAT!
                </h3>
                <p className="text-sm text-emerald-400/80 font-semibold mt-1">
                  Menunggu perwakilan kelompok menekan tombol bel di HP masing-masing...
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleResetRound}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Batal / Kunci Kembali Bel
                </button>
              </div>
            </div>
          ) : session.phase === 'answering' && session.buzzerWinner ? (
            /* TEAM BUZZER WINNER - ANSWERING STAGE WITH TIMER */
            <div className="w-full max-w-xl bg-slate-900 border-2 rounded-4xl p-6 md:p-8 text-center space-y-5 shadow-2xl animate-scale-up" style={{
              borderColor: session.buzzerWinner.groupColor
            }}>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">{session.buzzerWinner.avatarIcon}</span>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                    Tercepat Menekan Bel ({session.buzzerWinner.timeTakenMs} ms)
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white" style={{ color: session.buzzerWinner.groupColor }}>
                    {session.buzzerWinner.groupName}
                  </h3>
                </div>
              </div>

              {/* Countdown Circular Progress Bar */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className={`w-28 h-28 rounded-full border-8 flex flex-col items-center justify-center transition-all ${
                  answerTimer <= 3
                    ? 'border-rose-500 bg-rose-500/20 animate-ping text-rose-400'
                    : 'border-amber-400 bg-amber-500/10 text-amber-300'
                }`}>
                  <span className="text-4xl font-black">{answerTimer}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Detik</span>
                </div>
                <span className="text-xs text-slate-400 mt-2 font-medium">
                  Waktu tersisa bagi <strong>{session.buzzerWinner.studentName}</strong> untuk menjawab lisan.
                </span>
              </div>

              {/* Teacher Decision Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => handleAwardPoints(true)}
                  className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>BENAR (+{session.currentQuestion?.points || session.pointsForCorrect}) (B)</span>
                </button>

                <button
                  onClick={() => handleAwardPoints(false)}
                  className="py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  <span>SALAH (-{session.penaltyForWrong}) (S)</span>
                </button>
              </div>
            </div>
          ) : session.phase === 'round_result' ? (
            /* ROUND RESULT SUMMARY */
            <div className="text-center space-y-4 py-4">
              <h3 className="text-2xl font-black text-white">
                Ronde {session.roundNumber} Selesai!
              </h3>
              <p className="text-xs text-slate-400">
                Papan skor kelompok telah diperbarui. Siapkan soal berikutnya untuk melanjutkan.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleResetRound}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>Lanjut Ronde Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleEndGame}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Selesaikan & Lihat Juara</span>
                </button>
              </div>
            </div>
          ) : (
            /* GAME OVER PODIUM */
            <div className="text-center space-y-6 py-6 animate-scale-up">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-2xl">
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>
              <div>
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CHAMPION OF THE CLASS
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-white mt-3">
                  🎉 Selamat {sortedGroups[0]?.name}! 🎉
                </h2>
                <p className="text-base text-amber-400 font-extrabold mt-1">
                  Total Skor Juara 1: {sortedGroups[0]?.score} Poin
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={handleResetRound}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                >
                  Mulai Pertandingan Baru
                </button>
              </div>
            </div>
          )}

          {/* Quick Custom Question Input Bar */}
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
            <input
              type="text"
              placeholder="Ketik pertanyaan dadakan di sini (opsional)..."
              value={customQuestionInput}
              onChange={e => setCustomQuestionInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSetCustomQuestion()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={10}
                max={500}
                step={10}
                value={customPointsInput}
                onChange={e => setCustomPointsInput(Number(e.target.value))}
                className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-amber-400 font-bold text-center"
                title="Poin Pertanyaan"
              />
              <span className="text-[10px] text-slate-500 font-bold">Poin</span>
            </div>
            <button
              onClick={handleSetCustomQuestion}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-all"
            >
              Tampilkan
            </button>
          </div>
        </div>

        {/* RIGHT 4 COLS: Live Scoreboard & Leaderboard Podium */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                Papan Skor Kelompok
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {session.groups.length} Tim Bertanding
            </span>
          </div>

          {/* Group Cards List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
            {sortedGroups.map((group, rankIdx) => {
              const isWinner = session.buzzerWinner?.groupId === group.id;

              return (
                <div
                  key={group.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isWinner
                      ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      rankIdx === 0
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : rankIdx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : rankIdx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {rankIdx + 1}
                    </span>

                    <span className="text-xl shrink-0">{group.avatarIcon}</span>

                    <div className="min-w-0">
                      <span className="text-xs font-black text-white block truncate">
                        {group.name}
                      </span>
                      {isWinner && (
                        <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                          🔔 Sedang Menjawab
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-black text-amber-400">
                      {group.score}
                    </span>

                    {/* Quick Manual Adjust buttons for host */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleAdjustScore(group.id, 50)}
                        className="w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center transition-all"
                        title="+50 Poin Manual"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleAdjustScore(group.id, -50)}
                        className="w-6 h-6 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center transition-all"
                        title="-50 Poin Manual"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shortcut guide footer */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>Shortcut: <code className="text-indigo-300 font-bold">[Space]</code> Buka Bel</span>
            <span><code className="text-emerald-300 font-bold">[B]</code> Benar</span>
            <span><code className="text-rose-300 font-bold">[S]</code> Salah</span>
          </div>
        </div>

      </div>

      {/* 3. MODAL: BANK SOAL KELAS */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">
                  Pilih Soal dari Materi & Kuis Kelas
                </h3>
              </div>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {bankQuestions.length > 0 ? (
                bankQuestions.map((bq, idx) => (
                  <div
                    key={bq.id}
                    onClick={() => handleSelectBankQuestion(bq)}
                    className="p-3.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">
                          {bq.category}
                        </span>
                        <p className="text-xs font-bold text-slate-200 group-hover:text-white leading-relaxed">
                          {bq.questionText}
                        </p>
                        {bq.correctAnswer && (
                          <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                            ✓ Kunci: {bq.correctAnswer}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 shrink-0">
                      {bq.points} Poin
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">
                    Belum ada kuis pada kelas ini. Guru tetap bisa membacakan pertanyaan lisan atau mengetik pertanyaan dadakan di bawah layar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
