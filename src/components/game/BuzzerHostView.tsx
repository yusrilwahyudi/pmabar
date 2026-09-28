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
  Edit3,
  Trash2,
  X
} from 'lucide-react';

interface BuzzerHostViewProps {
  session: BuzzerGameSession;
  onUpdateSession?: (updated: BuzzerGameSession) => void;
  onClose?: () => void;
  onExit?: () => void;
}

const AVAILABLE_AVATARS = ['🦅', '🦁', '🐯', '🐉', '🦚', '⚡', '🦏', '🦈', '🚀', '🐺', '👑', '🔥', '🦄', '🐼', '🦖', '🎯'];
const AVAILABLE_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

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
  const [isGroupConfigModalOpen, setIsGroupConfigModalOpen] = useState(false);
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [customPointsInput, setCustomPointsInput] = useState(100);

  // Group edit state inside config modal
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('🦅');
  const [editGroupColor, setEditGroupColor] = useState('#EF4444');

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

  const lastHostPhaseRef = useRef(session.phase);
  const lastWinnerRef = useRef(session.buzzerWinner?.pressedAt);

  // Realtime Host Heartbeat: Keep all student devices automatically in sync with 0 refresh needed
  useEffect(() => {
    // Initial broadcast when host mounts or session updates
    buzzerService.broadcast(session, 'STATE_SYNC');

    // Continuous heartbeat pulse every 1.5s
    const heartbeat = setInterval(() => {
      buzzerService.broadcastHeartbeat(session);
    }, 1500);

    return () => {
      clearInterval(heartbeat);
    };
  }, [session]);

  // Audio triggers for Realtime Network State Changes on Host
  useEffect(() => {
    if (session.phase !== lastHostPhaseRef.current) {
      if (session.phase === 'buzzer_open') {
        soundEngine.playBuzzerOpen();
      } else if (session.phase === 'answering' && session.buzzerWinner) {
        soundEngine.playBuzzerPress();
      } else if (session.phase === 'game_over') {
        soundEngine.playVictory();
      }
      lastHostPhaseRef.current = session.phase;
    } else if (
      session.phase === 'answering' &&
      session.buzzerWinner &&
      session.buzzerWinner.pressedAt !== lastWinnerRef.current
    ) {
      soundEngine.playBuzzerPress();
      lastWinnerRef.current = session.buzzerWinner.pressedAt;
    }
  }, [session.phase, session.buzzerWinner]);

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

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session.phase, session.buzzerWinner, session.answerTimeLimitSeconds]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (session.phase === 'lobby' || session.phase === 'ready') {
          handleOpenBuzzer();
        } else if (session.phase === 'round_result') {
          handleResetRound();
        }
      } else if (e.code === 'KeyB' || e.code === 'KeyY') {
        if (session.phase === 'answering' && session.buzzerWinner) {
          handleAwardPoints(true);
        }
      } else if (e.code === 'KeyS' || e.code === 'KeyN') {
        if (session.phase === 'answering' && session.buzzerWinner) {
          handleAwardPoints(false);
        }
      } else if (e.code === 'KeyR') {
        if (session.phase === 'round_result' || session.phase === 'answering') {
          handleResetRound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session]);

  // Actions
  const handleToggleMute = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleOpenBuzzer = () => {
    soundEngine.playBuzzerOpen();
    const updated = buzzerService.openBuzzer(session);
    onUpdateSession?.(updated);
  };

  const handleUpdatePoints = (points: number) => {
    const validPoints = Math.max(10, Math.min(2000, points));
    const updated = buzzerService.updateQuestionPoints(session, validPoints);
    onUpdateSession?.(updated);
  };

  const handleAwardPoints = (isCorrect: boolean) => {
    const currentPoints = session.currentQuestion?.points ?? session.pointsForCorrect ?? 100;
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

    const updated = buzzerService.awardPoints(session, isCorrect, currentPoints);
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

  const handleDisqualifyWinner = () => {
    soundEngine.playWrongAnswer();
    const updated = buzzerService.disqualifyWinner(session, false);
    onUpdateSession?.(updated);
  };

  const handleKickGroup = (groupId: string) => {
    const updated = buzzerService.kickGroupClaim(session, groupId);
    onUpdateSession?.(updated);
  };

  const handleRestartNewGame = () => {
    if (window.confirm('Mulai game baru dari awal? Ini akan mereset ronde kembali ke Ronde 1 dan seluruh skor kelompok menjadi 0.')) {
      const updated = buzzerService.restartNewGame(session);
      onUpdateSession?.(updated);
    }
  };

  // Group Management Handlers for Guru
  const handleAddGroup = () => {
    const updated = buzzerService.addGroup(session);
    onUpdateSession?.(updated);
  };

  const handleRemoveGroup = (groupId: string) => {
    if (session.groups.length <= 2) {
      alert('Minimal harus ada 2 kelompok!');
      return;
    }
    if (window.confirm('Hapus kelompok ini dari permainan?')) {
      const updated = buzzerService.removeGroup(session, groupId);
      onUpdateSession?.(updated);
    }
  };

  const handleOpenEditGroup = (group: GameGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupAvatar(group.avatarIcon);
    setEditGroupColor(group.color);
  };

  const handleSaveEditGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroupId) return;
    const updated = buzzerService.updateGroupCustomization(
      session,
      editingGroupId,
      editGroupName,
      editGroupAvatar,
      editGroupColor
    );
    onUpdateSession?.(updated);
    setEditingGroupId(null);
  };

  // Sort groups by score descending for podium/ranking
  const sortedGroups = [...session.groups].sort((a, b) => b.score - a.score);

  return (
    <div
      ref={containerRef}
      className="h-screen max-h-screen overflow-hidden bg-slate-950 text-white flex flex-col justify-between p-3 sm:p-4 select-none"
    >
      {/* 1. TOP HEADER & PROCTOR TOOLS BAR */}
      <header className="h-13 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2 flex items-center justify-between shrink-0 shadow-lg">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                LIVE ARENA
              </span>
              <span className="text-[11px] font-bold text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
                {session.className}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
              Adu Cepat Cerdas Cermat
            </h1>
          </div>
        </div>

        {/* Center Round & Phase Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-xl">
          <span className="text-xs font-bold text-slate-400">
            Ronde: <strong className="text-white font-mono text-sm">{session.roundNumber}</strong> / {session.totalRounds}
          </span>
          <div className="h-3.5 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-ping" style={{
              backgroundColor: session.phase === 'buzzer_open' ? '#10B981' : session.phase === 'answering' ? '#F59E0B' : '#64748B'
            }} />
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Pilih Soal dari Bank Kelas"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bank Soal ({bankQuestions.length})</span>
          </button>

          <button
            onClick={handleRestartNewGame}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Mulai Game Baru dari Ronde 1 & Skor 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Reset Game</span>
          </button>

          <button
            onClick={() => soundEngine.playTestSound()}
            className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Uji Coba Bunyi Bel & Fanfare Audio"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xl:inline">Tes Suara</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Layar Penuh Proyektor"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleExit}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 hover:text-white transition-all"
            title="Keluar dari Arena"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN BATTLE ARENA (ZERO-SCROLL VIEWPORT GRID) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center my-2 min-h-0 overflow-hidden">
        
        {/* LEFT/CENTER 8 COLS: Projector Main Stage */}
        <div className="lg:col-span-8 flex flex-col items-center justify-between h-full py-1 space-y-2 overflow-hidden">
          
          {/* Question Prompt Card */}
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden backdrop-blur-md shrink-0">
            {/* Question Header: Category & Interactive Point / Bonus Round Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {session.currentQuestion?.category || 'Pertanyaan Lisan Guru'}
                </span>
                {(session.currentQuestion?.points ?? session.pointsForCorrect ?? 100) >= 200 && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30 animate-pulse flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-white" /> BABAK BONUS
                  </span>
                )}
              </div>

              {/* Point Quick Selector for Guru */}
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 pl-1 pr-0.5 hidden sm:inline">
                  Poin:
                </span>
                {[100, 200, 300, 500].map(pt => {
                  const currentPt = session.currentQuestion?.points ?? session.pointsForCorrect ?? 100;
                  const isSelected = currentPt === pt;
                  return (
                    <button
                      key={pt}
                      onClick={() => handleUpdatePoints(pt)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
                        isSelected
                          ? pt >= 200
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400 scale-105'
                            : 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 scale-105'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={pt >= 200 ? `Atur sebagai Babak Bonus ${pt} Poin` : `Atur ${pt} Poin`}
                    >
                      {pt === 100 ? '100' : pt === 500 ? '🔥 500' : `+${pt}`}
                    </button>
                  );
                })}

                {/* Custom Point Stepper */}
                <div className="flex items-center gap-0.5 pl-1 border-l border-slate-800">
                  <button
                    onClick={() => handleUpdatePoints(Math.max(10, (session.currentQuestion?.points ?? session.pointsForCorrect ?? 100) - 50))}
                    className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold"
                    title="-50 Poin"
                  >
                    -
                  </button>
                  <span className="font-mono text-[11px] font-black text-amber-400 px-1 min-w-[32px] text-center">
                    {session.currentQuestion?.points ?? session.pointsForCorrect ?? 100}
                  </span>
                  <button
                    onClick={() => handleUpdatePoints((session.currentQuestion?.points ?? session.pointsForCorrect ?? 100) + 50)}
                    className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold"
                    title="+50 Poin"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight leading-snug line-clamp-3">
              {session.currentQuestion?.questionText ? (
                session.currentQuestion.questionText
              ) : (
                <span className="text-slate-400 italic font-normal text-sm sm:text-base">
                  "Guru membacakan pertanyaan lisan langsung di depan kelas..."
                </span>
              )}
            </h2>

            {session.currentQuestion?.correctAnswer && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Kunci Jawaban Guru:
                </span>
                <span className="font-black text-emerald-400">
                  {session.currentQuestion.correctAnswer}
                </span>
              </div>
            )}
          </div>

          {/* MAIN BUZZER STATUS STAGE (Middle Center) */}
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
            {session.phase === 'lobby' || session.phase === 'ready' ? (
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                  <Bell className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-200">
                    Bel Masih Terkunci
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                    Bacakan soal lalu tekan <strong>"Buka Bel"</strong> atau <strong>Spacebar</strong>.
                  </p>
                </div>

                <button
                  onClick={handleOpenBuzzer}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-sm md:text-base shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2.5 mx-auto"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Buka Bel Sekarang! (Space)</span>
                </button>
              </div>
            ) : session.phase === 'buzzer_open' ? (
              /* BUZZER OPEN - PULSING NEON READY STATE */
              <div className="text-center space-y-3 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                  <Radio className="w-10 h-10 text-emerald-300 animate-spin" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-wide">
                    BEL DIBUKA! SIAPA CEPAT DIA DAPAT!
                  </h3>
                  <p className="text-xs text-emerald-400/80 font-semibold mt-0.5">
                    Menunggu perwakilan kelompok menekan tombol bel di HP...
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleResetRound}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                  >
                    Batal / Kunci Kembali Bel
                  </button>
                </div>
              </div>
            ) : session.phase === 'answering' && session.buzzerWinner ? (
              /* TEAM BUZZER WINNER - ANSWERING STAGE WITH TIMER & ANTI-CHEAT VERIFICATION */
              <div className="w-full max-w-lg bg-slate-900 border-2 rounded-3xl p-4 sm:p-5 text-center space-y-3 shadow-2xl animate-scale-up" style={{
                borderColor: session.buzzerWinner.groupColor
              }}>
                <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-left">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{session.buzzerWinner.avatarIcon}</span>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        Tercepat ({session.buzzerWinner.timeTakenMs} ms)
                      </span>
                      <h3 className="text-lg font-black text-white" style={{ color: session.buzzerWinner.groupColor }}>
                        {session.buzzerWinner.groupName}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                      Ditekan Oleh:
                    </span>
                    <span className="text-xs font-black text-emerald-400 block truncate max-w-[120px]">
                      {session.buzzerWinner.studentName}
                    </span>
                    {session.buzzerWinner.studentNisn && (
                      <span className="text-[9px] font-mono text-slate-500">
                        NISN: {session.buzzerWinner.studentNisn}
                      </span>
                    )}
                  </div>
                </div>

                {/* Countdown Circular Timer */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                    answerTimer <= 3
                      ? 'border-rose-500 bg-rose-500/20 animate-ping text-rose-400'
                      : 'border-amber-400 bg-amber-500/10 text-amber-300'
                  }`}>
                    <span className="text-2xl font-black font-mono">{answerTimer}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider">Detik</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium">
                    Waktu menjawab bagi <strong>{session.buzzerWinner.studentName}</strong>
                  </span>
                </div>

                {/* Decision Buttons */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAwardPoints(true)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>BENAR (+{session.currentQuestion?.points || session.pointsForCorrect}) (B)</span>
                    </button>

                    <button
                      onClick={() => handleAwardPoints(false)}
                      className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 active:scale-95 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>SALAH (-{session.penaltyForWrong}) (S)</span>
                    </button>
                  </div>

                  <button
                    onClick={handleDisqualifyWinner}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-600 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                    title="Batalkan jika ditekan oleh siswa yang tidak sah"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Diskualifikasi Ronde (Salah Orang)</span>
                  </button>
                </div>
              </div>
            ) : session.phase === 'round_result' ? (
              /* ROUND RESULT SUMMARY */
              <div className="text-center space-y-3 py-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Ronde {session.roundNumber} Selesai!
                </h3>
                <p className="text-xs text-slate-400">
                  Papan skor telah diperbarui. Siapkan soal berikutnya untuk melanjutkan.
                </p>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleResetRound}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Lanjut Ronde Berikutnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleEndGame}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Selesaikan & Lihat Juara</span>
                  </button>
                </div>
              </div>
            ) : (
              /* GAME OVER PODIUM */
              <div className="text-center space-y-3 py-2 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-xl">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CHAMPION OF THE CLASS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
                    🎉 Selamat {sortedGroups[0]?.name}! 🎉
                  </h2>
                  <p className="text-sm text-amber-400 font-extrabold mt-0.5">
                    Total Skor Juara 1: {sortedGroups[0]?.score} Poin
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleRestartNewGame}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mulai Pertandingan Baru (Ronde 1)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Custom Question Input Bar */}
          <div className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Ketik pertanyaan dadakan di sini (opsional)..."
              value={customQuestionInput}
              onChange={e => setCustomQuestionInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSetCustomQuestion()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={10}
                max={500}
                step={10}
                value={customPointsInput}
                onChange={e => setCustomPointsInput(Number(e.target.value))}
                className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-amber-400 font-bold text-center"
                title="Poin Pertanyaan"
              />
              <span className="text-[10px] text-slate-500 font-bold">Poin</span>
            </div>
            <button
              onClick={handleSetCustomQuestion}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-all"
            >
              Tampilkan
            </button>
          </div>
        </div>

        {/* RIGHT 4 COLS: ZERO-SCROLL LEADERBOARD & GROUP STATUS */}
        <div className="lg:col-span-4 h-full flex flex-col justify-between bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-white">
                Papan Skor ({session.groups.length} Tim)
              </h3>
            </div>
            
            {/* Manage Group Button for Teacher */}
            <button
              onClick={() => setIsGroupConfigModalOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 px-2 py-0.5 rounded-lg transition"
              title="Atur Jumlah & Nama Kelompok"
            >
              <Settings2 className="w-3 h-3" />
              <span>Atur Tim</span>
            </button>
          </div>

          {/* Group Items: Auto-proportioned to FIT seamlessly in 1 screen */}
          <div className="flex-1 flex flex-col justify-around py-1 space-y-1.5 overflow-hidden min-h-0">
            {sortedGroups.map((group, rankIdx) => {
              const isWinner = session.buzzerWinner?.groupId === group.id;

              return (
                <div
                  key={group.id}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 shrink-0 ${
                    isWinner
                      ? 'bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-500/40 shadow-md'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left rank + Avatar + Name + HP claim */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
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

                    <span className="text-base shrink-0">{group.avatarIcon}</span>

                    <div className="min-w-0 leading-tight">
                      <span className="text-xs font-black text-white truncate block max-w-[110px] sm:max-w-[130px]">
                        {group.name}
                      </span>
                      <span className="text-[9px] text-slate-400 truncate block">
                        HP: {group.claimedByStudentName ? (
                          <strong className="text-emerald-400">{group.claimedByStudentName}</strong>
                        ) : (
                          <span className="text-slate-500 italic">Belum terhubung</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right Score + Adjust buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm font-black font-mono text-amber-400 min-w-[28px] text-right">
                      {group.score}
                    </span>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleAdjustScore(group.id, 50)}
                        className="w-5 h-5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center transition"
                        title="+50 Poin"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleAdjustScore(group.id, -50)}
                        className="w-5 h-5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center transition"
                        title="-50 Poin"
                      >
                        -
                      </button>
                      {group.claimedByStudentName && (
                        <button
                          onClick={() => handleKickGroup(group.id)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-300 text-[10px] flex items-center justify-center transition"
                          title="Reset koneksi HP siswa ini"
                        >
                          🔄
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Shortcuts Guide */}
          <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-500 flex items-center justify-between shrink-0">
            <span>Shortcut: <code className="text-indigo-300 font-bold">[Space]</code> Buka Bel</span>
            <span><code className="text-emerald-300 font-bold">[B]</code> Benar</span>
            <span><code className="text-rose-300 font-bold">[S]</code> Salah</span>
          </div>
        </div>

      </main>

      {/* 3. MODAL: GURU KELOLA KELOMPOK (ADD / REMOVE / CUSTOMIZE) */}
      {isGroupConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">
                  Kelola Jumlah & Nama Kelompok
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsGroupConfigModalOpen(false);
                  setEditingGroupId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editing Box */}
            {editingGroupId ? (
              <form onSubmit={handleSaveEditGroup} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-indigo-400">Edit Kelompok</div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Nama Kelompok:</label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={e => setEditGroupName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Pilih Maskot / Avatar:</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {AVAILABLE_AVATARS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditGroupAvatar(emoji)}
                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border transition ${
                          editGroupAvatar === emoji ? 'border-amber-400 bg-amber-500/20 scale-110' : 'border-slate-800 bg-slate-900'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Pilih Warna Tim:</label>
                  <div className="flex items-center gap-2">
                    {AVAILABLE_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditGroupColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          editGroupColor === c ? 'border-white scale-125' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingGroupId(null)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : null}

            {/* List of Current Groups */}
            <div className="overflow-y-auto max-h-[320px] space-y-2 pr-1">
              {session.groups.map((group, idx) => (
                <div
                  key={group.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">{group.avatarIcon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate" style={{ color: group.color }}>
                        {group.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {group.claimedByStudentName ? `Perwakilan: ${group.claimedByStudentName}` : 'Belum terhubung'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditGroup(group)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                      title="Edit Nama & Maskot"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {session.groups.length > 2 && (
                      <button
                        onClick={() => handleRemoveGroup(group.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs"
                        title="Hapus Kelompok"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">
                Total: {session.groups.length} / 8 Kelompok
              </span>

              {session.groups.length < 8 && (
                <button
                  onClick={handleAddGroup}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kelompok</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: BANK SOAL KELAS */}
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
