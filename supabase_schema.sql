-- =========================================================================
-- EDUFLOW LMS - SKEMA DATABASE SUPABASE (POSTGRESQL)
-- =========================================================================

-- 1. TABEL PROFIL PENGGUNA (GURU & SISWA)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('guru', 'siswa')) NOT NULL DEFAULT 'siswa',
  avatar_url TEXT,
  id_number TEXT, -- NISN atau NIP
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. TABEL KELAS
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Kode kelas misal: 'MTK-10A'
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'purple',
  description TEXT,
  sequential_locking BOOLEAN DEFAULT true, -- Kunci materi selanjutnya sebelum yang awal selesai
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. TABEL ANGGOTA KELAS (SISWA DALAM KELAS)
CREATE TABLE IF NOT EXISTS public.class_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(class_id, student_id)
);

-- 4. TABEL MATERI PEMBELAJARAN (LEARNING ITEMS / SEQUENCE)
CREATE TABLE IF NOT EXISTS public.learning_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('reading', 'video', 'quiz', 'assignment')) NOT NULL,
  order_sequence INT NOT NULL DEFAULT 1,
  tag TEXT DEFAULT 'Wajib',
  duration_label TEXT,
  content_markdown TEXT,
  youtube_video_id TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. TABEL TUGAS (ASSIGNMENTS)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  learning_item_id UUID REFERENCES public.learning_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  max_score INT DEFAULT 100,
  allowed_formats TEXT DEFAULT '.pdf,.docx,.zip,.png,.jpg',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. TABEL PENGUMPULAN TUGAS (SUBMISSIONS)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  is_late BOOLEAN DEFAULT false,
  score NUMERIC(5, 2) DEFAULT NULL,
  teacher_feedback TEXT,
  graded_at TIMESTAMPTZ
);

-- 7. TABEL KUIS (QUIZZES)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  learning_item_id UUID REFERENCES public.learning_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 30,
  shuffle_questions BOOLEAN DEFAULT true,
  show_instant_result BOOLEAN DEFAULT true,
  passing_score INT DEFAULT 75,
  enable_anti_cheat BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 8. TABEL SOAL KUIS (QUIZ QUESTIONS)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  order_sequence INT DEFAULT 1,
  type TEXT CHECK (type IN ('mcq', 'essay')) NOT NULL,
  question_text TEXT NOT NULL,
  points INT DEFAULT 10
);

-- 9. TABEL OPSI JAWABAN PILIHAN GANDA (QUIZ OPTIONS)
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

-- 10. TABEL RIWAYAT PENGERJAAN KUIS SISWA (QUIZ ATTEMPTS & PROCTOR LOGS)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  submit_time TIMESTAMPTZ,
  total_score NUMERIC(5, 2) DEFAULT 0,
  max_score INT DEFAULT 100,
  is_passed BOOLEAN DEFAULT false,
  cheat_strikes INT DEFAULT 0,
  cheat_logs JSONB DEFAULT '[]'::jsonb,
  is_flagged BOOLEAN DEFAULT false
);

-- 11. TABEL PROGRESS BELAJAR BERTINGKAT (STUDENT PROGRESS CHECKLIST)
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  completed_item_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(student_id, class_id)
);

-- ROW LEVEL SECURITY (RLS) DASAR
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Kebijakan baca profil: Semua pengguna terautentikasi bisa membaca data profil pengguna lain di kelasnya
CREATE POLICY "Allow authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
