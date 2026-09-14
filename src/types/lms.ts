export type UserRole = 'guru' | 'siswa';

export type PastelTheme = 'pink' | 'blue' | 'yellow' | 'green' | 'purple' | 'peach';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  idNumber: string; // NISN untuk siswa, NIP/Email untuk guru
  password?: string;
  isPasswordChanged?: boolean;
}

export interface ClassItem {
  id: string;
  title: string;
  subject: string;
  code: string; // Kode unik untuk gabung, misal: 'RPL-5G'
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  theme: PastelTheme;
  description: string;
  totalModules: number;
  bannerImage?: string;
  sequentialLocking: boolean; // Jika true, materi berikutnya terkunci sebelum item sebelumnya selesai
  createdAt: string;
}

export interface ClassMember {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentEmail: string;
  joinedAt: string;
}

// 3 Tipe Utama Pembelajaran
export type LearningItemType = 'reading' | 'video' | 'assessment';

// Sub-tipe Asesmen / Penugasan
export type AssessmentFormat = 'mcq' | 'essay' | 'upload' | 'mixed';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AssessmentQuestion {
  id: string;
  order: number;
  type: 'mcq' | 'essay';
  questionText: string;
  options?: QuizOption[]; // untuk pilihan ganda
  points: number;
}

export interface LearningItem {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: LearningItemType;
  order: number;
  tag?: string;
  durationLabel?: string;
  points?: number;

  // Struktur Hierarki Bab & Pertemuan
  chapterTitle?: string; // misal: 'Bab 2: Pemrograman Berorientasi Objek (OOP)'
  meetingSession?: string; // misal: 'Pertemuan 1: Class & Object' atau 'Pertemuan 2: Enkapsulasi'
  isSessionLocked?: boolean; // Jika true, materi dikunci guru untuk pertemuan berikutnya
  releaseDateLabel?: string; // misal: 'Aktif Hari Ini' atau 'Dijadwalkan Pertemuan Depan'

  // Modul Bacaan & Dokumen
  contentMarkdown?: string;
  documentFile?: {
    name: string;
    size: string;
    url: string;
  };

  // Video YouTube (Anti-Skip)
  youtubeVideoId?: string;
  videoDurationSeconds?: number;

  // Asesmen & Penugasan Fleksibel
  assessmentFormat?: AssessmentFormat;
  durationMinutes?: number;
  deadline?: string;
  maxScore?: number;
  enableAntiCheat?: boolean;
  shuffleQuestions?: boolean;
  showInstantResult?: boolean;
  allowedFormats?: string[];
  questions?: AssessmentQuestion[];
}

export interface CheatLog {
  timestamp: string;
  reason: 'TAB_SWITCH' | 'COPY_PASTE_ATTEMPT' | 'PRINT_SCREEN_ATTEMPT' | 'DEVTOOLS_ATTEMPT' | 'CONTEXT_MENU';
  description: string;
}

export interface Submission {
  id: string;
  learningItemId: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  submissionType: 'file_upload' | 'quiz_answers';
  
  // Jika upload file
  fileName?: string;
  fileUrl?: string;
  fileSize?: string;
  notes?: string;

  // Jika pengerjaan kuis/esai
  answers?: Record<string, {
    selectedOptionId?: string;
    essayAnswer?: string;
    isCorrect?: boolean;
    scoreEarned?: number;
  }>;
  cheatStrikes?: number;
  cheatLogs?: CheatLog[];
  isFlagged?: boolean;

  submittedAt: string;
  isLate: boolean;
  score: number | null; // null jika belum dinilai
  maxScore: number;
  teacherFeedback?: string;
  gradedAt?: string;
}

export interface StudentProgress {
  studentId: string;
  classId: string;
  completedItemIds: string[];
  lastAccessedItemId?: string;
  updatedAt: string;
}
