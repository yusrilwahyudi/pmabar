export type GamePhase =
  | 'lobby'          // Menunggu pemain / konfigurasi kelompok
  | 'ready'          // Soal aktif, bel masih terkunci
  | 'buzzer_open'    // Bel dibuka! Siswa adu cepat menekan
  | 'answering'      // Kelompok tercepat sedang menjawab pertanyaan
  | 'round_result'   // Guru telah memberi nilai untuk ronde ini
  | 'game_over';     // Permainan selesai / podium juara

export interface GameGroup {
  id: string;             // e.g., 'group-1'
  name: string;           // e.g., 'Kelompok 1 - Garuda'
  color: string;          // Hex or Tailwind class
  accentBg: string;       // Background badge
  borderColor: string;
  avatarIcon: string;     // Emoji icon e.g. 🦁, 🦅, 🚀, ⚡, 🐯, 🐉
  score: number;
  membersCount: number;
  claimedByStudentId?: string;    // ID akun siswa perwakilan resmi
  claimedByStudentName?: string;  // Nama siswa perwakilan resmi
  claimedByStudentNisn?: string;  // NISN siswa
  claimedAt?: number;             // Waktu slot dikunci
  lastBuzzerTime?: number;
}

export interface BuzzerWinner {
  groupId: string;
  groupName: string;
  groupColor: string;
  avatarIcon: string;
  studentId: string;
  studentName: string;
  studentNisn?: string;
  pressedAt: number;     // timestamp in ms
  timeTakenMs: number;   // reaction time in ms
}

export interface GameQuestionPrompt {
  id: string;
  questionText: string;
  correctAnswer?: string;
  points: number;
  category?: string;
}

export interface BuzzerGameSession {
  classId: string;
  className: string;
  phase: GamePhase;
  roundNumber: number;
  totalRounds: number;
  groups: GameGroup[];
  currentQuestion?: GameQuestionPrompt;
  buzzerWinner: BuzzerWinner | null;
  buzzerOpenedAt: number | null;
  answerTimeLimitSeconds: number;
  remainingAnswerSeconds: number;
  pointsForCorrect: number;
  penaltyForWrong: number;
  hostName: string;
  updatedAt: number;
}

export interface BuzzerEventPayload {
  type:
    | 'STATE_SYNC'
    | 'CLAIM_GROUP'
    | 'RELEASE_GROUP'
    | 'KICK_CLAIM'
    | 'UPDATE_GROUP'
    | 'ADD_GROUP'
    | 'REMOVE_GROUP'
    | 'OPEN_BUZZER'
    | 'PRESS_BUZZER'
    | 'LOCK_BUZZER'
    | 'DISQUALIFY_WINNER'
    | 'AWARD_POINTS'
    | 'RESET_ROUND'
    | 'UPDATE_QUESTION'
    | 'END_GAME';
  session: BuzzerGameSession;
  pressedGroupId?: string;
  pressedStudentId?: string;
  pressedStudentName?: string;
  pressedTimestamp?: number;
}
