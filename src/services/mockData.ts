import { User, ClassItem, ClassMember, LearningItem, Submission, StudentProgress } from '../types/lms';

// Akun Pengajar Resmi (Yusril Wahyudi, S.Pd)
export const INITIAL_USERS: User[] = [
  {
    id: 'teacher-yusril',
    name: 'Yusril Wahyudi, S.Pd',
    email: 'yusril.wahyudi@smkn5gowa.sch.id',
    role: 'guru',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    idNumber: '199304122020121005',
    password: 'guru123password',
    isPasswordChanged: false
  }
];

// Kelas kosong siap pakai untuk Guru membuat kelas baru
export const INITIAL_CLASSES: ClassItem[] = [];

// Data Keanggotaan Kelas Kosong
export const INITIAL_CLASS_MEMBERS: ClassMember[] = [];

// Kurikulum & Materi Belajar Kosong
export const INITIAL_LEARNING_ITEMS: LearningItem[] = [];

// Pengumpulan Tugas & Kuis Kosong
export const INITIAL_SUBMISSIONS: Submission[] = [];

// Progres Siswa Kosong
export const INITIAL_STUDENT_PROGRESS: StudentProgress[] = [];
