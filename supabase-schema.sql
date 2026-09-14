-- ==============================================================================
-- SKEMA DATABASE LENGKAP P MABAR (Platform Manajemen Belajar Daring)
-- Dijalankan pada: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABEL: USERS (Guru & Siswa)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('guru', 'siswa')),
    avatar TEXT,
    id_number TEXT UNIQUE NOT NULL, -- NIP untuk Guru / NISN untuk Siswa
    password TEXT NOT NULL,
    is_password_changed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL: CLASSES (Ruang Kelas)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    teacher_name TEXT NOT NULL,
    teacher_avatar TEXT,
    theme TEXT DEFAULT 'purple',
    description TEXT,
    total_modules INTEGER DEFAULT 0,
    sequential_locking BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL: CLASS_MEMBERS (Keanggotaan Siswa di Kelas)
CREATE TABLE IF NOT EXISTS public.class_members (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_nisn TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id, student_id)
);

-- 4. TABEL: LEARNING_ITEMS (Alur Pembelajaran: Modul, Video, Kuis, Tugas)
CREATE TABLE IF NOT EXISTS public.learning_items (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    chapter_title TEXT DEFAULT 'Bab 1: Dasar Logika & Algoritma',
    meeting_session TEXT DEFAULT 'Pertemuan 1: Fondasi Logika',
    is_session_locked BOOLEAN DEFAULT false,
    release_date_label TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('reading', 'video', 'assessment')),
    order_num INTEGER NOT NULL DEFAULT 1,
    tag TEXT DEFAULT 'Modul Ajar',
    duration_label TEXT DEFAULT '15 Menit',
    content_markdown TEXT,
    document_file JSONB, -- { name, size, url }
    youtube_video_id TEXT,
    assessment_format TEXT CHECK (assessment_format IN ('mcq', 'essay', 'upload')),
    duration_minutes INTEGER DEFAULT 20,
    deadline TIMESTAMP WITH TIME ZONE,
    enable_anti_cheat BOOLEAN DEFAULT true,
    questions JSONB, -- Array of { id, order, type, questionText, points, options }
    max_score INTEGER DEFAULT 100,
    show_instant_result BOOLEAN DEFAULT true,
    allowed_formats JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL: SUBMISSIONS (Pengumpulan Tugas & Lembar Jawaban Kuis Siswa)
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY,
    learning_item_id TEXT NOT NULL REFERENCES public.learning_items(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_avatar TEXT,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('quiz_answers', 'file_upload')),
    file_name TEXT,
    file_size TEXT,
    file_url TEXT,
    notes TEXT,
    answers JSONB, -- { [questionId]: optionId | textAnswer }
    is_late BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    score NUMERIC,
    max_score INTEGER DEFAULT 100,
    teacher_feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE
);

-- 6. TABEL: STUDENT_PROGRESS (Pelacak Penyelesaian & Sequential Lock Siswa)
CREATE TABLE IF NOT EXISTS public.student_progress (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_item_ids JSONB DEFAULT '[]'::jsonb,
    last_accessed_item_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id, student_id)
);

-- ==============================================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS) DENGAN KEBIJAKAN AKSES LENGKAP
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (CRUD) untuk integrasi Frontend Client API Key
CREATE POLICY "Allow public all access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on class_members" ON public.class_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on learning_items" ON public.learning_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on student_progress" ON public.student_progress FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- PENYIMPANAN BERKAS / STORAGE BUCKET (lms-files)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('lms-files', 'lms-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public uploads on lms-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lms-files');
CREATE POLICY "Allow public read on lms-files" ON storage.objects FOR SELECT USING (bucket_id = 'lms-files');
CREATE POLICY "Allow public delete on lms-files" ON storage.objects FOR DELETE USING (bucket_id = 'lms-files');

-- ==============================================================================
-- DATA AWAL AKUN GURU UTAMA (Yusril Wahyudi, S.Pd)
-- ==============================================================================

INSERT INTO public.users (id, name, email, role, avatar, id_number, password, is_password_changed)
VALUES (
    'teacher-yusril',
    'Yusril Wahyudi, S.Pd',
    'yusril.wahyudi@smkn5gowa.sch.id',
    'guru',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    '199304122020121005',
    'guru123password',
    false
)
ON CONFLICT (id_number) DO UPDATE 
SET name = EXCLUDED.name, email = EXCLUDED.email;
