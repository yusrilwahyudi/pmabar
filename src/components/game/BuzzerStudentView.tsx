import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BuzzerGameSession, GameGroup } from '../../types/game';
import { buzzerService } from '../../services/buzzerService';
import { audioEffects } from '../../utils/audioEffects';
import { 
  Zap, 
  Users, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Award,
  ArrowLeft,
  Flame,
  Radio,
  Lock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface BuzzerStudentViewProps {
  session: BuzzerGameSession;
  studentId: string;
  studentName: string;
  studentNisn?: string;
  onExit: () => void;
}

export const BuzzerStudentView: React.FC<BuzzerStudentViewProps> = ({
  session,
  studentId,
  studentName,
  studentNisn,
  onExit
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    return localStorage.getItem(`buzzer_selected_group_${session.classId}`) || '';
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
  
  // Anti-Spam & False Start cooldown
  const [spamWarning, setSpamWarning] = useState<string | null>(null);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const spamCountRef = useRef(0);
  const lastPhaseRef = useRef(session.phase);

  // Sync group claim status with session
  const myGroup = session.groups.find(g => g.id === selectedGroupId);
  const isClaimedByMe = myGroup?.claimedByStudentId === studentId;
  const isMyGroupWinner = session.buzzerWinner?.groupId === selectedGroupId;

  // If local selected group was released or kicked by teacher, reset
  useEffect(() => {
    if (selectedGroupId) {
      const g = session.groups.find(x => x.id === selectedGroupId);
      if (g && g.claimedByStudentId && g.claimedByStudentId !== studentId) {
        setSelectedGroupId('');
        localStorage.removeItem(`buzzer_selected_group_${session.classId}`);
      }
    }
  }, [session.groups, selectedGroupId, studentId, session.classId]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
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

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Audio & Haptic triggers on session phase transitions
  useEffect(() => {
    if (session.phase !== lastPhaseRef.current) {
      if (session.phase === 'buzzer_open') {
        // If student had spam violations, activate 1.5s penalty cooldown
        if (spamCountRef.current >= 3) {
          setIsCooldownActive(true);
          setSpamWarning('⚠️ Penalti Spam: Tombol beku 1.5 detik!');
          setTimeout(() => {
            setIsCooldownActive(false);
            setSpamWarning(null);
            spamCountRef.current = 0;
          }, 1500);
        }

        audioEffects.playBuzzerOpen();
        if ('vibrate' in navigator) {
          try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
        }
      } else if (session.phase === 'answering') {
        audioEffects.playBuzzerPress();
        if (session.buzzerWinner?.groupId === selectedGroupId) {
          if ('vibrate' in navigator) {
            try { navigator.vibrate([300, 100, 300]); } catch (e) {}
          }
        }
      } else if (session.phase === 'round_result') {
        if (isMyGroupWinner) {
          audioEffects.playCorrectAnswer();
        }
      } else if (session.phase === 'game_over') {
        audioEffects.playVictory();
      }
      lastPhaseRef.current = session.phase;
    }
  }, [session.phase, session.buzzerWinner, selectedGroupId, isMyGroupWinner]);

  // Claim Group Handler (Anti-Duplicate Device Lock)
  const handleSelectGroup = (group: GameGroup) => {
    setClaimErrorMessage(null);
    const result = buzzerService.claimGroup(
      session,
      group.id,
      studentId,
      studentName,
      studentNisn
    );

    if (result.success) {
      setSelectedGroupId(group.id);
      localStorage.setItem(`buzzer_selected_group_${session.classId}`, group.id);
    } else {
      setClaimErrorMessage(result.message || 'Kelompok ini sudah diklaim oleh perwakilan lain.');
    }
  };

  // Buzzer Press Handler
  const handleBuzzerClick = useCallback(() => {
    if (!selectedGroupId || !isClaimedByMe) {
      return;
    }

    // False Start / Early Tap Protection
    if (session.phase !== 'buzzer_open') {
      spamCountRef.current += 1;
      if (spamCountRef.current >= 3) {
        setSpamWarning('⚠️ Jangan spam klik sebelum bel dibuka!');
        setTimeout(() => setSpamWarning(null), 2000);
      }
      return;
    }

    if (isCooldownActive || session.buzzerWinner) {
      return;
    }

    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 250);

    // Haptic feedback
    if ('vibrate' in navigator) {
      try { navigator.vibrate(200); } catch (e) {}
    }

    // Trigger service with authenticated user data
    buzzerService.pressBuzzer(
      session,
      selectedGroupId,
      studentId,
      studentName,
      studentNisn
    );
  }, [session, selectedGroupId, isClaimedByMe, isCooldownActive, studentId, studentName, studentNisn]);

  // Touch handlers for maximum speed & prevent scrolling on button
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleBuzzerClick();
  };

  // Render Group Selector Modal if no group claimed yet
  if (!selectedGroupId || !myGroup || !isClaimedByMe) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onExit}
            className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Keluar
          </button>
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full text-rose-400 text-xs font-semibold animate-pulse">
            <Radio className="w-3.5 h-3.5" /> LIVE ARENA
          </div>
        </div>

        {/* Modal Selection Box */}
        <div className="max-w-md w-full mx-auto my-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Pilih Kelompok Anda</h2>
            <p className="text-slate-400 text-xs mt-1">
              Setiap kelompok hanya dapat dipegang oleh <strong>1 HP / perwakilan resmi</strong> untuk mencegah kecurangan.
            </p>
          </div>

          {claimErrorMessage && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300 font-semibold animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{claimErrorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            {session.groups.map((group, idx) => {
              const isClaimedByOther = group.claimedByStudentId && group.claimedByStudentId !== studentId;
              const isMine = group.claimedByStudentId === studentId;

              return (
                <button
                  key={group.id}
                  disabled={Boolean(isClaimedByOther)}
                  onClick={() => handleSelectGroup(group)}
                  className={`p-3.5 rounded-2xl border-2 text-left flex flex-col items-center justify-center gap-2 transition-all transform group relative ${
                    isClaimedByOther
                      ? 'border-slate-800 bg-slate-950/60 opacity-60 cursor-not-allowed'
                      : isMine
                      ? 'border-white bg-slate-800 ring-4 ring-indigo-500/30 active:scale-95'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800 active:scale-95 shadow-md'
                  }`}
                  style={{
                    borderColor: isMine ? group.color : isClaimedByOther ? '#334155' : undefined
                  }}
                >
                  {/* Status Badge */}
                  {isClaimedByOther ? (
                    <div className="absolute top-2 right-2 bg-rose-950 text-rose-400 border border-rose-800 p-1 rounded-full text-[10px]" title={`Sudah dipegang oleh ${group.claimedByStudentName}`}>
                      <Lock className="w-3 h-3" />
                    </div>
                  ) : isMine ? (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 p-1 rounded-full text-[10px]">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  ) : null}

                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${group.color}25`, border: `2px solid ${group.color}` }}
                  >
                    {group.avatarIcon}
                  </div>

                  <div className="text-center w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: group.color }}>
                      Regu {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white block truncate max-w-[120px]">
                      {group.name.replace(/Kelompok \d+ - /, '')}
                    </span>

                    {/* Show Claimed Name */}
                    {isClaimedByOther ? (
                      <span className="text-[9px] text-rose-400 font-bold block truncate mt-1 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                        🔒 {group.claimedByStudentName?.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-semibold block mt-1">
                        🟢 Tersedia
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sistem mengunci 1 HP per kelompok untuk menjamin kejujuran</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-slate-500 text-xs py-2">
          {session.className} &bull; Arena Cerdas Cermat Realtime
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col justify-between select-none overflow-hidden touch-manipulation">
      {/* Dynamic Background Glow Effect */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-all duration-700 opacity-20 ${
          session.phase === 'buzzer_open' ? 'opacity-40 bg-gradient-to-t from-emerald-600/30 via-transparent to-emerald-600/20' :
          isMyGroupWinner ? 'opacity-50 bg-gradient-to-t from-amber-500/40 via-yellow-500/20 to-amber-500/30' :
          'bg-radial from-slate-900 to-slate-950'
        }`}
      />

      {/* Top Status Bar */}
      <header className="relative z-10 p-3 md:p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        {/* Group Badge / Verified Info */}
        <div className="flex items-center gap-2.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="text-2xl">{myGroup.avatarIcon}</span>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: myGroup.color }}>
                {myGroup.name}
              </span>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-[11px] font-bold text-slate-200 truncate max-w-[110px] md:max-w-[160px]">
              {studentName}
            </div>
          </div>
        </div>

        {/* Center Round & Score */}
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 block font-semibold">RONDE</span>
            <span className="text-xs sm:text-sm font-black text-amber-400">{session.roundNumber} / {session.totalRounds}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 block font-semibold">SKOR</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400">{myGroup.score}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const next = audioEffects.toggleMute();
              setIsMuted(next);
            }}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              buzzerService.releaseGroup(session, selectedGroupId, studentId);
              setSelectedGroupId('');
              localStorage.removeItem(`buzzer_selected_group_${session.classId}`);
              onExit();
            }}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400"
            title="Keluar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area / Buzzer Arena */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 text-center max-w-lg mx-auto w-full">
        
        {/* Anti-Spam Warning Notice */}
        {spamWarning && (
          <div className="mb-3 px-4 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold animate-shake flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{spamWarning}</span>
          </div>
        )}

        {/* STATUS BANNER */}
        <div className="mb-4 w-full">
          {session.phase === 'lobby' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                <Users className="w-3.5 h-3.5" /> LOBBY PERMAINAN
              </div>
              <h3 className="text-lg font-bold text-white">Menunggu Guru Memulai</h3>
              <p className="text-slate-400 text-xs mt-1">Anda adalah perwakilan sah untuk <strong>{myGroup.name}</strong></p>
            </div>
          )}

          {session.phase === 'ready' && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 shadow-xl animate-pulse">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <Clock className="w-3.5 h-3.5" /> DENGARKAN SOAL GURU
              </div>
              <h3 className="text-lg font-bold text-amber-200">Bel Masih Terkunci</h3>
              <p className="text-amber-300/70 text-xs mt-1">Jangan spam klik! Tunggu aba-aba bel dibuka</p>
            </div>
          )}

          {session.phase === 'buzzer_open' && (
            <div className="bg-emerald-950/60 border-2 border-emerald-400 rounded-2xl p-4 shadow-2xl animate-bounce">
              <div className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 px-4 py-1 rounded-full text-xs font-black tracking-widest mb-1 shadow-lg">
                <Flame className="w-4 h-4 fill-slate-950" /> BEL DIBUKA! CEPAT TEKAN!
              </div>
              <h3 className="text-xl font-black text-emerald-300">SIAPA CEPAT DIA DAPAT!</h3>
            </div>
          )}

          {session.phase === 'answering' && (
            <div className={`rounded-2xl p-4 shadow-2xl border-2 ${
              isMyGroupWinner 
                ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-500/30 border-yellow-400' 
                : 'bg-slate-900/90 border-slate-700'
            }`}>
              {isMyGroupWinner ? (
                <div>
                  <div className="inline-flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-1 rounded-full text-xs font-black tracking-wider mb-2 animate-pulse">
                    <Sparkles className="w-4 h-4" /> KELOMPOK ANDA TERCEPAT!
                  </div>
                  <h3 className="text-xl font-black text-white">Silakan Jawab Sekarang!</h3>
                  <div className="mt-2 text-3xl font-black text-yellow-300 flex items-center justify-center gap-2">
                    <Clock className="w-6 h-6 animate-spin" />
                    <span>{session.remainingAnswerSeconds}s</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-bold mb-2">
                    <XCircle className="w-3.5 h-3.5" /> BEL TERKUNCI
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {session.buzzerWinner?.groupName} Lebih Cepat!
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Ditekan oleh: <span className="text-indigo-400 font-bold">{session.buzzerWinner?.studentName}</span> ({(session.buzzerWinner?.timeTakenMs || 0) / 1000}s)
                  </p>
                </div>
              )}
            </div>
          )}

          {session.phase === 'round_result' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h3 className="text-lg font-bold text-white">Ronde {session.roundNumber} Selesai</h3>
              <p className="text-slate-400 text-xs mt-1">Guru sedang mempersiapkan pertanyaan berikutnya...</p>
            </div>
          )}

          {session.phase === 'game_over' && (
            <div className="bg-gradient-to-b from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="text-xl font-black text-white">Permainan Selesai!</h3>
              <p className="text-indigo-300 text-xs mt-1">Lihat hasil akhir dan podium di layar utama guru</p>
            </div>
          )}
        </div>

        {/* GIANT 3D BUZZER BUTTON */}
        <div className="relative flex items-center justify-center my-auto">
          {/* Pulsing ring when active */}
          {session.phase === 'buzzer_open' && !isCooldownActive && (
            <div className="absolute -inset-6 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
          )}

          {/* 3D Button Container */}
          <div className="relative p-3 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border-4 border-slate-700 shadow-2xl shadow-black/80">
            <button
              onClick={handleBuzzerClick}
              onTouchStart={handleTouchStart}
              disabled={session.phase !== 'buzzer_open' || !!session.buzzerWinner || isCooldownActive}
              className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full font-black text-2xl tracking-wider transition-all duration-100 flex flex-col items-center justify-center gap-3 relative select-none shadow-2xl cursor-pointer ${
                isCooldownActive
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-4 border-rose-500/50'
                  : session.phase === 'buzzer_open'
                  ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 text-slate-950 shadow-emerald-500/50 hover:brightness-110 active:translate-y-2 active:shadow-inner ring-8 ring-emerald-400/40'
                  : isMyGroupWinner
                  ? 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 text-slate-950 ring-8 ring-amber-400/40 translate-y-2 shadow-inner'
                  : session.buzzerWinner
                  ? 'bg-gradient-to-b from-slate-700 to-slate-900 text-slate-500 cursor-not-allowed border-4 border-slate-700'
                  : 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800 text-white/70 shadow-rose-900/50 cursor-not-allowed opacity-80 border-4 border-rose-900/50'
              } ${isPressing ? 'scale-95 translate-y-2' : ''}`}
            >
              {/* Inner Glossy Effect */}
              <div className="absolute top-4 inset-x-10 h-16 bg-white/20 rounded-full blur-[2px] pointer-events-none" />

              {/* Icon / State */}
              {isCooldownActive ? (
                <>
                  <AlertTriangle className="w-14 h-14 text-rose-400 animate-bounce" />
                  <span className="text-base font-black text-rose-300">
                    COOLDOWN
                  </span>
                </>
              ) : session.phase === 'buzzer_open' ? (
                <>
                  <Flame className="w-16 h-16 text-slate-950 animate-bounce fill-slate-950" />
                  <span className="text-2xl font-black tracking-tight leading-tight">
                    TEKAN<br />SEKARANG!
                  </span>
                </>
              ) : isMyGroupWinner ? (
                <>
                  <Sparkles className="w-16 h-16 text-slate-950 animate-spin" />
                  <span className="text-xl font-black tracking-tight">
                    GILIRAN<br />MENJAWAB
                  </span>
                </>
              ) : session.buzzerWinner ? (
                <>
                  <XCircle className="w-14 h-14 text-slate-600" />
                  <span className="text-sm font-bold text-slate-500">
                    TERKUNCI
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-14 h-14 text-white/50" />
                  <span className="text-base font-bold text-white/80">
                    {session.phase === 'lobby' ? 'STANDBY' : 'SIAP-SIAP'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Help Subtext */}
        <p className="text-slate-500 text-xs mt-6">
          {session.phase === 'buzzer_open' 
            ? '🔥 Tekan secepat mungkin saat bel dibuka!' 
            : 'Perwakilan resmi terdaftar di proyektor guru'}
        </p>
      </main>

      {/* Bottom Live Mini Leaderboard */}
      <footer className="relative z-10 p-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-xl mx-auto scrollbar-none">
          {session.groups.map(group => {
            const isMe = group.id === selectedGroupId;
            const isWinner = session.buzzerWinner?.groupId === group.id;

            return (
              <div 
                key={group.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap transition-all ${
                  isWinner 
                    ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-yellow-300 scale-105 shadow-md' 
                    : isMe 
                    ? 'bg-slate-800 text-white font-bold border border-indigo-500/50' 
                    : 'bg-slate-950 text-slate-400 border border-slate-800/80'
                }`}
              >
                <span>{group.avatarIcon}</span>
                <span className="truncate max-w-[60px]">{group.name.replace(/Kelompok \d+ - /, '')}</span>
                <span className={`font-mono text-[11px] font-black ${isWinner ? 'text-slate-950' : 'text-emerald-400'}`}>
                  {group.score}
                </span>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
