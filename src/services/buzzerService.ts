import { supabase, isSupabaseConfigured } from './supabaseClient';
import { BuzzerGameSession, GameGroup, BuzzerEventPayload } from '../types/game';

const DEFAULT_GROUPS: GameGroup[] = [
  {
    id: 'group-1',
    name: 'Kelompok 1 - Garuda',
    color: '#EF4444', // Red
    accentBg: 'bg-rose-50 text-rose-700',
    borderColor: 'border-rose-400 ring-rose-200',
    avatarIcon: '🦅',
    score: 0,
    membersCount: 0
  },
  {
    id: 'group-2',
    name: 'Kelompok 2 - Harimau',
    color: '#3B82F6', // Blue
    accentBg: 'bg-blue-50 text-blue-700',
    borderColor: 'border-blue-400 ring-blue-200',
    avatarIcon: '🐯',
    score: 0,
    membersCount: 0
  },
  {
    id: 'group-3',
    name: 'Kelompok 3 - Komodo',
    color: '#10B981', // Green
    accentBg: 'bg-emerald-50 text-emerald-700',
    borderColor: 'border-emerald-400 ring-emerald-200',
    avatarIcon: '🐉',
    score: 0,
    membersCount: 0
  },
  {
    id: 'group-4',
    name: 'Kelompok 4 - Cendrawasih',
    color: '#F59E0B', // Amber
    accentBg: 'bg-amber-50 text-amber-800',
    borderColor: 'border-amber-400 ring-amber-200',
    avatarIcon: '🦚',
    score: 0,
    membersCount: 0
  },
  {
    id: 'group-5',
    name: 'Kelompok 5 - Anoa',
    color: '#8B5CF6', // Purple
    accentBg: 'bg-purple-50 text-purple-700',
    borderColor: 'border-purple-400 ring-purple-200',
    avatarIcon: '⚡',
    score: 0,
    membersCount: 0
  },
  {
    id: 'group-6',
    name: 'Kelompok 6 - Badak',
    color: '#EC4899', // Pink/Magenta
    accentBg: 'bg-pink-50 text-pink-700',
    borderColor: 'border-pink-400 ring-pink-200',
    avatarIcon: '🦏',
    score: 0,
    membersCount: 0
  }
];

class BuzzerService {
  private channels: Record<string, any> = {};
  private broadcastChannels: Record<string, BroadcastChannel> = {};
  private listeners: Record<string, ((session: BuzzerGameSession) => void)[]> = {};

  public getDefaultGroups(count: number = 6): GameGroup[] {
    return DEFAULT_GROUPS.slice(0, Math.max(2, Math.min(count, 8)));
  }

  public getSessionKey(classId: string): string {
    return `daring_buzzer_game_${classId}`;
  }

  public loadSession(classId: string, className: string = 'Kelas'): BuzzerGameSession {
    const key = this.getSessionKey(classId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    const defaultSession: BuzzerGameSession = {
      classId,
      className,
      phase: 'lobby',
      roundNumber: 1,
      totalRounds: 10,
      groups: this.getDefaultGroups(6),
      buzzerWinner: null,
      buzzerOpenedAt: null,
      answerTimeLimitSeconds: 10,
      remainingAnswerSeconds: 10,
      pointsForCorrect: 100,
      penaltyForWrong: 50,
      hostName: 'Guru Pengampu',
      updatedAt: Date.now()
    };

    this.saveSession(defaultSession);
    return defaultSession;
  }

  public saveSession(session: BuzzerGameSession) {
    const key = this.getSessionKey(session.classId);
    session.updatedAt = Date.now();
    try {
      localStorage.setItem(key, JSON.stringify(session));
    } catch (e) {}
  }

  public subscribe(classId: string, callback: (session: BuzzerGameSession) => void): () => void {
    if (!this.listeners[classId]) {
      this.listeners[classId] = [];
    }
    this.listeners[classId].push(callback);

    // 1. BroadcastChannel API for instant tab-to-tab sync
    if (typeof BroadcastChannel !== 'undefined' && !this.broadcastChannels[classId]) {
      const bc = new BroadcastChannel(`buzzer_channel_${classId}`);
      bc.onmessage = (event) => {
        if (event.data && event.data.session) {
          this.notifyListeners(classId, event.data.session);
        }
      };
      this.broadcastChannels[classId] = bc;
    }

    // 2. Storage event fallback
    const storageHandler = (e: StorageEvent) => {
      if (e.key === this.getSessionKey(classId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          this.notifyListeners(classId, parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', storageHandler);

    // 3. Supabase Realtime channel for cross-device online sync
    if (isSupabaseConfigured && supabase && !this.channels[classId]) {
      const client = supabase as any;
      const channel = client.channel(`buzzer-room-${classId}`, {
        config: { broadcast: { self: false } }
      });

      channel
        .on('broadcast', { event: 'buzzer_sync' }, (payload: any) => {
          if (payload.payload && payload.payload.session) {
            this.saveSession(payload.payload.session);
            this.notifyListeners(classId, payload.payload.session);
          }
        })
        .subscribe();

      this.channels[classId] = channel;
    }

    return () => {
      this.listeners[classId] = (this.listeners[classId] || []).filter(cb => cb !== callback);
      window.removeEventListener('storage', storageHandler);
    };
  }

  public broadcast(session: BuzzerGameSession, eventType: BuzzerEventPayload['type'] = 'STATE_SYNC') {
    this.saveSession(session);
    this.notifyListeners(session.classId, session);

    // Broadcast locally
    if (this.broadcastChannels[session.classId]) {
      try {
        this.broadcastChannels[session.classId].postMessage({
          type: eventType,
          session
        });
      } catch (e) {}
    }

    // Broadcast across devices over Supabase Realtime
    if (isSupabaseConfigured && supabase && this.channels[session.classId]) {
      try {
        this.channels[session.classId].send({
          type: 'broadcast',
          event: 'buzzer_sync',
          payload: { type: eventType, session }
        });
      } catch (e) {}
    }
  }

  private notifyListeners(classId: string, session: BuzzerGameSession) {
    if (this.listeners[classId]) {
      this.listeners[classId].forEach(cb => cb(session));
    }
  }

  // Anti-Cheat: Siswa mengunci slot perwakilan kelompok
  public claimGroup(
    session: BuzzerGameSession,
    groupId: string,
    studentId: string,
    studentName: string,
    studentNisn?: string
  ): { success: boolean; session: BuzzerGameSession; message?: string } {
    const targetGroup = session.groups.find(g => g.id === groupId);
    if (!targetGroup) {
      return { success: false, session, message: 'Kelompok tidak ditemukan.' };
    }

    // Jika kelompok sudah diklaim oleh orang lain
    if (targetGroup.claimedByStudentId && targetGroup.claimedByStudentId !== studentId) {
      return {
        success: false,
        session,
        message: `Kelompok ini sudah dipegang oleh ${targetGroup.claimedByStudentName || 'siswa lain'}. Hanya 1 perwakilan resmi per kelompok!`
      };
    }

    // Lepas klaim kelompok lama siswa ini jika pernah memilih kelompok lain
    const updatedGroups = session.groups.map(g => {
      if (g.claimedByStudentId === studentId && g.id !== groupId) {
        return {
          ...g,
          claimedByStudentId: undefined,
          claimedByStudentName: undefined,
          claimedByStudentNisn: undefined,
          claimedAt: undefined
        };
      }
      if (g.id === groupId) {
        return {
          ...g,
          claimedByStudentId: studentId,
          claimedByStudentName: studentName,
          claimedByStudentNisn: studentNisn,
          claimedAt: Date.now()
        };
      }
      return g;
    });

    const updated: BuzzerGameSession = {
      ...session,
      groups: updatedGroups
    };

    this.broadcast(updated, 'CLAIM_GROUP');
    return { success: true, session: updated };
  }

  // Anti-Cheat: Lepas klaim sukarela saat siswa keluar/ganti
  public releaseGroup(
    session: BuzzerGameSession,
    groupId: string,
    studentId: string
  ): BuzzerGameSession {
    const updatedGroups = session.groups.map(g => {
      if (g.id === groupId && g.claimedByStudentId === studentId) {
        return {
          ...g,
          claimedByStudentId: undefined,
          claimedByStudentName: undefined,
          claimedByStudentNisn: undefined,
          claimedAt: undefined
        };
      }
      return g;
    });

    const updated: BuzzerGameSession = {
      ...session,
      groups: updatedGroups
    };

    this.broadcast(updated, 'RELEASE_GROUP');
    return updated;
  }

  // Anti-Cheat: Guru me-reset/kick perwakilan kelompok jika salah orang
  public kickGroupClaim(session: BuzzerGameSession, groupId: string): BuzzerGameSession {
    const updatedGroups = session.groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          claimedByStudentId: undefined,
          claimedByStudentName: undefined,
          claimedByStudentNisn: undefined,
          claimedAt: undefined
        };
      }
      return g;
    });

    const updated: BuzzerGameSession = {
      ...session,
      groups: updatedGroups
    };

    this.broadcast(updated, 'KICK_CLAIM');
    return updated;
  }

  // Action: Ubah Nama, Avatar, & Warna Kelompok (Kustomisasi Siswa / Guru)
  public updateGroupCustomization(
    session: BuzzerGameSession,
    groupId: string,
    name: string,
    avatarIcon: string,
    color?: string
  ): BuzzerGameSession {
    const updatedGroups = session.groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          name: name.trim() || g.name,
          avatarIcon: avatarIcon || g.avatarIcon,
          color: color || g.color
        };
      }
      return g;
    });

    const updated: BuzzerGameSession = {
      ...session,
      groups: updatedGroups
    };

    this.broadcast(updated, 'UPDATE_GROUP');
    return updated;
  }

  // Action: Tambah Kelompok Baru (Maks 8)
  public addGroup(
    session: BuzzerGameSession,
    customName?: string,
    avatarIcon?: string,
    color?: string
  ): BuzzerGameSession {
    if (session.groups.length >= 8) return session;

    const nextIdx = session.groups.length + 1;
    const defaultAvatars = ['🦁', '🦅', '🐉', '🦚', '⚡', '🦏', '🦈', '🚀'];
    const defaultColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

    const newGroup: GameGroup = {
      id: `group-${Date.now()}`,
      name: customName || `Kelompok ${nextIdx}`,
      color: color || defaultColors[(nextIdx - 1) % defaultColors.length],
      accentBg: 'bg-slate-800 text-slate-200',
      borderColor: 'border-slate-600',
      avatarIcon: avatarIcon || defaultAvatars[(nextIdx - 1) % defaultAvatars.length],
      score: 0,
      membersCount: 0
    };

    const updated: BuzzerGameSession = {
      ...session,
      groups: [...session.groups, newGroup]
    };

    this.broadcast(updated, 'ADD_GROUP');
    return updated;
  }

  // Action: Hapus Kelompok (Min 2)
  public removeGroup(session: BuzzerGameSession, groupId: string): BuzzerGameSession {
    if (session.groups.length <= 2) return session;

    const updatedGroups = session.groups.filter(g => g.id !== groupId);
    const updated: BuzzerGameSession = {
      ...session,
      groups: updatedGroups
    };

    this.broadcast(updated, 'REMOVE_GROUP');
    return updated;
  }

  // Action: Guru membuka Bel (Ready for speed battle)
  public openBuzzer(session: BuzzerGameSession): BuzzerGameSession {
    const updated: BuzzerGameSession = {
      ...session,
      phase: 'buzzer_open',
      buzzerOpenedAt: Date.now(),
      buzzerWinner: null,
      remainingAnswerSeconds: session.answerTimeLimitSeconds
    };
    this.broadcast(updated, 'OPEN_BUZZER');
    return updated;
  }

  // Action: Siswa menekan bel (Strict Anti-Cheat & Fast Lock)
  public pressBuzzer(
    session: BuzzerGameSession,
    groupId: string,
    studentId: string,
    studentName: string,
    studentNisn?: string
  ): { success: boolean; session: BuzzerGameSession; errorReason?: string } {
    // 1. Validasi status sesi
    if (session.phase !== 'buzzer_open' || session.buzzerWinner !== null) {
      return { success: false, session, errorReason: 'Bel belum dibuka atau sudah terkunci!' };
    }

    const group = session.groups.find(g => g.id === groupId);
    if (!group) return { success: false, session, errorReason: 'Kelompok tidak valid' };

    // 2. Anti-Cheat: Pastikan hanya pemegang sah kelompok yang bisa menekan
    if (group.claimedByStudentId && group.claimedByStudentId !== studentId) {
      return {
        success: false,
        session,
        errorReason: `Akses Ditolak! Anda bukan perwakilan resmi ${group.name}`
      };
    }

    const pressTime = Date.now();
    const timeTakenMs = session.buzzerOpenedAt ? pressTime - session.buzzerOpenedAt : 0;

    const winner = {
      groupId: group.id,
      groupName: group.name,
      groupColor: group.color,
      avatarIcon: group.avatarIcon,
      studentId,
      studentName,
      studentNisn: studentNisn || group.claimedByStudentNisn,
      pressedAt: pressTime,
      timeTakenMs
    };

    const updated: BuzzerGameSession = {
      ...session,
      phase: 'answering',
      buzzerWinner: winner,
      remainingAnswerSeconds: session.answerTimeLimitSeconds
    };

    this.broadcast(updated, 'PRESS_BUZZER');
    return { success: true, session: updated };
  }

  // Anti-Cheat: Guru membatalkan pemenang jika ketahuan curang/salah orang
  public disqualifyWinner(session: BuzzerGameSession, reopenBuzzer: boolean = false): BuzzerGameSession {
    const updated: BuzzerGameSession = {
      ...session,
      buzzerWinner: null,
      phase: reopenBuzzer ? 'buzzer_open' : 'ready',
      buzzerOpenedAt: reopenBuzzer ? Date.now() : null
    };

    this.broadcast(updated, 'DISQUALIFY_WINNER');
    return updated;
  }

  // Action: Guru mengatur poin untuk soal aktif / babak bonus
  public updateQuestionPoints(session: BuzzerGameSession, points: number): BuzzerGameSession {
    const updated: BuzzerGameSession = {
      ...session,
      pointsForCorrect: points,
      currentQuestion: session.currentQuestion
        ? { ...session.currentQuestion, points }
        : {
            id: `oral-q-${session.roundNumber}`,
            questionText: '',
            points,
            category: points >= 200 ? '🔥 Babak Bonus' : 'Pertanyaan Lisan Guru'
          }
    };
    this.broadcast(updated, 'UPDATE_QUESTION');
    return updated;
  }

  // Action: Guru memberikan poin (Benar / Salah)
  public awardPoints(
    session: BuzzerGameSession,
    isCorrect: boolean,
    customPoints?: number
  ): BuzzerGameSession {
    if (!session.buzzerWinner) return session;

    const pointsToAward = customPoints ?? session.currentQuestion?.points ?? session.pointsForCorrect ?? 100;
    const delta = isCorrect
      ? pointsToAward
      : -session.penaltyForWrong;

    const updatedGroups = session.groups.map(g => {
      if (g.id === session.buzzerWinner?.groupId) {
        return {
          ...g,
          score: Math.max(0, g.score + delta)
        };
      }
      return g;
    });

    const updated: BuzzerGameSession = {
      ...session,
      phase: 'round_result',
      groups: updatedGroups
    };

    this.broadcast(updated, 'AWARD_POINTS');
    return updated;
  }

  // Action: Reset Ronde berikutnya
  public resetRound(session: BuzzerGameSession, advanceRound: boolean = true): BuzzerGameSession {
    const updated: BuzzerGameSession = {
      ...session,
      phase: 'ready',
      roundNumber: advanceRound ? session.roundNumber + 1 : session.roundNumber,
      buzzerWinner: null,
      buzzerOpenedAt: null,
      currentQuestion: undefined,
      pointsForCorrect: 100, // Reset default point back to 100 for each new question
      remainingAnswerSeconds: session.answerTimeLimitSeconds
    };
    this.broadcast(updated, 'RESET_ROUND');
    return updated;
  }

  // Action: Mulai Game Baru dari Awal (Ronde 1 & Skor 0)
  public restartNewGame(session: BuzzerGameSession): BuzzerGameSession {
    const resetGroups = session.groups.map(g => ({
      ...g,
      score: 0
    }));

    const updated: BuzzerGameSession = {
      ...session,
      phase: 'ready',
      roundNumber: 1,
      currentQuestion: undefined,
      pointsForCorrect: 100,
      buzzerWinner: null,
      buzzerOpenedAt: null,
      remainingAnswerSeconds: session.answerTimeLimitSeconds,
      groups: resetGroups
    };

    this.broadcast(updated, 'RESET_ROUND');
    return updated;
  }

  // Action: Selesaikan Game
  public endGame(session: BuzzerGameSession): BuzzerGameSession {
    const updated: BuzzerGameSession = {
      ...session,
      phase: 'game_over'
    };
    this.broadcast(updated, 'END_GAME');
    return updated;
  }
}

export const buzzerService = new BuzzerService();
