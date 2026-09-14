import React, { useState, useRef, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  UploadCloud,
  Check,
  AlertTriangle,
  Clock,
  Send,
  FileText,
  ShieldCheck,
  HelpCircle,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Sparkles,
  Lock,
  Video,
  Layers
} from 'lucide-react';
import { SecureYouTubePlayer } from '../../components/learning/SecureYouTubePlayer';
import { DocumentViewer } from '../../components/learning/DocumentViewer';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LearningItem } from '../../types/lms';

interface ClassLearningViewProps {
  classId: string;
  initialItemId?: string;
  onBack: () => void;
  onStartQuiz: (itemId: string) => void;
}

export const ClassLearningView: React.FC<ClassLearningViewProps> = ({
  classId,
  initialItemId,
  onBack,
  onStartQuiz
}) => {
  const {
    classes,
    learningItems,
    submissions,
    currentUser,
    getStudentClassProgress,
    markItemAsCompleted,
    submitAssessment,
    classMembers
  } = useLMS();

  const contentTopRef = useRef<HTMLDivElement>(null);
  const currentClass = classes.find(c => c.id === classId);
  const isEnrolled = currentUser?.role === 'guru' || classMembers.some(m => m.classId === classId && m.studentId === currentUser?.id);

  const rawItems = learningItems
    .filter(i => i.classId === classId)
    .sort((a, b) => a.order - b.order);

  // Group & order hierarchically by Bab -> Pertemuan -> Order
  const items: LearningItem[] = [];
  const chapters = Array.from(new Set(rawItems.map(i => i.chapterTitle || 'Bab 1: Dasar Logika & Algoritma')));
  chapters.forEach(ch => {
    const chItems = rawItems.filter(i => (i.chapterTitle || 'Bab 1: Dasar Logika & Algoritma') === ch);
    const sessions = Array.from(new Set(chItems.map(i => i.meetingSession || 'Pertemuan 1: Fondasi Logika')));
    sessions.forEach(sess => {
      const sessItems = chItems
        .filter(i => (i.meetingSession || 'Pertemuan 1: Fondasi Logika') === sess)
        .sort((a, b) => a.order - b.order);
      items.push(...sessItems);
    });
  });

  const { percentage, completedCount, totalCount, isItemCompleted, isItemUnlocked } =
    getStudentClassProgress(classId);

  // Active item state
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (initialItemId && items.some(i => i.id === initialItemId)) {
      return initialItemId;
    }
    const firstActive = items.find(i => isItemUnlocked(i.id) && !isItemCompleted(i.id));
    return firstActive ? firstActive.id : items[0]?.id || '';
  });

  // Collapsible accordion states
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [collapsedSessions, setCollapsedSessions] = useState<Record<string, boolean>>({});
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Assignment upload form state
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeItem = items.find(i => i.id === selectedItemId) || items[0];
  const activeIndex = items.findIndex(i => i.id === (activeItem?.id || ''));
  const nextItem = activeIndex >= 0 && activeIndex < items.length - 1 ? items[activeIndex + 1] : null;
  const isLastItem = activeIndex === items.length - 1;

  // Auto-expand the active item's chapter and session
  useEffect(() => {
    if (activeItem) {
      const ch = activeItem.chapterTitle || 'Bab 1: Dasar Logika & Algoritma';
      const sess = `${ch}_${activeItem.meetingSession || 'Pertemuan 1: Fondasi Logika'}`;
      setCollapsedChapters(prev => ({ ...prev, [ch]: false }));
      setCollapsedSessions(prev => ({ ...prev, [sess]: false }));
    }
  }, [activeItem?.id]);

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsMobileNavOpen(false);

    // Smooth scroll to top of content viewer without forcing page bounce
    setTimeout(() => {
      contentTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const toggleChapterCollapse = (chapterName: string) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapterName]: !prev[chapterName]
    }));
  };

  const toggleSessionCollapse = (sessionKey: string) => {
    setCollapsedSessions(prev => ({
      ...prev,
      [sessionKey]: !prev[sessionKey]
    }));
  };

  const handleToggleExpandAll = () => {
    const hasAnyCollapsed = Object.values(collapsedSessions).some(Boolean) || Object.values(collapsedChapters).some(Boolean);
    if (hasAnyCollapsed) {
      setCollapsedChapters({});
      setCollapsedSessions({});
    } else {
      const allCh: Record<string, boolean> = {};
      const allSess: Record<string, boolean> = {};
      chapters.forEach(ch => {
        const chItems = items.filter(i => (i.chapterTitle || 'Bab 1: Dasar Logika & Algoritma') === ch);
        const sessions = Array.from(new Set(chItems.map(i => i.meetingSession || 'Pertemuan 1: Fondasi Logika')));
        sessions.forEach(sess => {
          allSess[`${ch}_${sess}`] = true;
        });
        allCh[ch] = true;
      });

      // Keep active item's chapter and session open
      if (activeItem) {
        const ch = activeItem.chapterTitle || 'Bab 1: Dasar Logika & Algoritma';
        const sess = `${ch}_${activeItem.meetingSession || 'Pertemuan 1: Fondasi Logika'}`;
        allCh[ch] = false;
        allSess[sess] = false;
      }
      setCollapsedChapters(allCh);
      setCollapsedSessions(allSess);
    }
  };

  if (!currentClass) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl">
        <p>Kelas tidak ditemukan.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs">
          Kembali
        </button>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-soft space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Akses Terkunci</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Anda belum terdaftar di kelas <strong>{currentClass.title}</strong>. Masukkan kode kelas 6-digit yang diberikan oleh guru Anda untuk bergabung.
        </p>
        <button
          onClick={onBack}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const userSubmission = activeItem && currentUser
    ? submissions.find(
        s => s.learningItemId === activeItem.id && s.studentId === currentUser.id
      )
    : null;

  const handleCompleteReading = () => {
    if (activeItem) {
      markItemAsCompleted(classId, activeItem.id);
    }
  };

  const handleVideoCompleted = () => {
    if (activeItem) {
      markItemAsCompleted(classId, activeItem.id);
    }
  };

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      setUploadFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !uploadFileName || !currentUser) return;

    setIsSubmitting(true);
    setTimeout(() => {
      submitAssessment({
        learningItemId: activeItem.id,
        classId: activeItem.classId,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentAvatar: currentUser.avatar,
        submissionType: 'file_upload',
        fileName: uploadFileName,
        fileSize: uploadFileSize || '2.5 MB',
        fileUrl: 'https://example.com/files/' + uploadFileName,
        notes: assignmentNotes,
        isLate: activeItem.deadline ? new Date() > new Date(activeItem.deadline) : false,
        score: null,
        maxScore: activeItem.maxScore || 100
      });
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Class Header */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  {currentClass.subject}
                </span>
                <span className="text-xs text-slate-400 font-mono">Kode: {currentClass.code}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
                {currentClass.title}
              </h1>
            </div>
          </div>

          {/* Right Header Controls: Progress Bar Only */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="w-full md:w-64 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                <span>Progres Belajar:</span>
                <span className="text-indigo-600">{percentage}% Selesai</span>
              </div>
              <ProgressBar progress={percentage} color="indigo" size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE QUICK NAVIGATOR / TOP DRAWER TOGGLE (lg:hidden) */}
      <div className="lg:hidden bg-white rounded-3xl p-4 border border-slate-200 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {activeIndex + 1}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-indigo-600 block truncate">
                {activeItem?.meetingSession || 'Pertemuan Aktif'}
              </span>
              <h4 className="text-xs font-black text-slate-900 truncate">
                {activeItem?.title}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all"
          >
            <span>{isMobileNavOpen ? 'Tutup Daftar' : 'Ganti Modul'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Stepper & Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Sticky, Independently Scrollable Accordion Stepper (4 Cols) */}
        <div className={`lg:col-span-4 ${isMobileNavOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="lg:sticky lg:top-6 bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-soft lg:max-h-[calc(100vh-4.5rem)] flex flex-col">
            {/* Sidebar Fixed Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Alur Belajar Berjenjang</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {completedCount}/{items.length} Materi Selesai
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                title="Buka / Tutup Seluruh Bab"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                <span>Lipat/Buka</span>
              </button>
            </div>

            {/* Scrollable Accordion List (Independent Scroll) */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-3.5 max-h-[500px] lg:max-h-none">
              {chapters.map((chapterName, cIdx) => {
                const chapterItems = items.filter(i => (i.chapterTitle || 'Bab 1: Dasar Logika & Algoritma') === chapterName);
                const chapterSessions = Array.from(new Set(chapterItems.map(i => i.meetingSession || 'Pertemuan 1: Fondasi Logika')));
                const isChapterCollapsed = Boolean(collapsedChapters[chapterName]);
                const completedInChapter = chapterItems.filter(i => isItemCompleted(i.id)).length;

                return (
                  <div key={chapterName} className="bg-slate-50/80 rounded-2xl border border-slate-200/70 overflow-hidden transition-all">
                    {/* Chapter Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleChapterCollapse(chapterName)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                          {cIdx + 1}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {chapterName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {completedInChapter}/{chapterItems.length}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isChapterCollapsed ? '-rotate-90' : ''}`} />
                      </div>
                    </button>

                    {/* Sessions inside this Chapter */}
                    {!isChapterCollapsed && (
                      <div className="p-2 pt-0 space-y-2.5">
                        {chapterSessions.map(sessionName => {
                          const sessionKey = `${chapterName}_${sessionName}`;
                          const sessionItems = chapterItems.filter(i => (i.meetingSession || 'Pertemuan 1: Fondasi Logika') === sessionName);
                          const isSessionLocked = sessionItems.some(i => i.isSessionLocked);
                          const isSessionCollapsed = Boolean(collapsedSessions[sessionKey]);
                          const completedInSession = sessionItems.filter(i => isItemCompleted(i.id)).length;
                          const hasActiveItem = sessionItems.some(i => i.id === selectedItemId);

                          return (
                            <div
                              key={sessionName}
                              className={`bg-white rounded-xl border transition-all ${
                                hasActiveItem
                                  ? 'border-indigo-200 shadow-xs'
                                  : 'border-slate-200/80 shadow-2xs'
                              }`}
                            >
                              {/* Session Header Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleSessionCollapse(sessionKey)}
                                className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                  <span className="text-[11px] font-extrabold text-slate-800 truncate">
                                    🔹 {sessionName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isSessionLocked ? (
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                                      <span>Terkunci</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      {completedInSession}/{sessionItems.length}
                                    </span>
                                  )}
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isSessionCollapsed ? '-rotate-90' : ''}`} />
                                </div>
                              </button>

                              {/* Items inside Session */}
                              {!isSessionCollapsed && (
                                <div className="p-2 pt-0 space-y-1.5">
                                  {sessionItems.map((item) => {
                                    const globalIdx = items.findIndex(i => i.id === item.id);
                                    const unlocked = isItemUnlocked(item.id);
                                    const completed = isItemCompleted(item.id);
                                    const isSelected = item.id === selectedItemId;

                                    return (
                                      <button
                                        key={item.id}
                                        disabled={!unlocked}
                                        onClick={() => handleSelectItem(item.id)}
                                        className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 border ${
                                          isSelected
                                            ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400/30'
                                            : !unlocked
                                            ? 'bg-slate-50/50 border-slate-200/40 opacity-50 cursor-not-allowed'
                                            : completed
                                            ? 'bg-emerald-50/25 border-emerald-100 hover:bg-emerald-50/60'
                                            : 'bg-white border-slate-100 hover:bg-slate-50'
                                        }`}
                                      >
                                        <div className="flex-shrink-0 mt-0.5">
                                          {!unlocked ? (
                                            <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                                              <Lock className="w-2.5 h-2.5" />
                                            </div>
                                          ) : completed ? (
                                            <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                                              <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                          ) : (
                                            <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                                              {globalIdx + 1}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                              {item.type === 'reading'
                                                ? 'Modul'
                                                : item.type === 'video'
                                                ? 'Video'
                                                : 'Kuis/Tugas'}
                                            </span>
                                          </div>
                                          <h5
                                            className={`text-xs font-bold leading-snug line-clamp-1 ${
                                              isSelected ? 'text-indigo-900' : 'text-slate-800'
                                            }`}
                                          >
                                            {item.title}
                                          </h5>
                                          <span className="text-[9px] text-slate-400 mt-0.5 block">
                                            {item.durationLabel || '15 Menit'}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Item Content Viewer (8 Cols) */}
        <div ref={contentTopRef} className="lg:col-span-8 scroll-mt-6">
          {activeItem && activeItem.isSessionLocked ? (
            <div className="bg-white rounded-4xl p-8 md:p-12 border border-slate-200/80 shadow-soft text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{activeItem.title}</h3>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                🔒 Terkunci untuk Pertemuan Berikutnya
              </span>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Materi ini merupakan bagian dari <strong>{activeItem.meetingSession || 'Pertemuan Berikutnya'}</strong> dan dijadwalkan oleh Bapak/Ibu Guru untuk sesi pertemuan tatap muka / jadwal berikutnya. Silakan selesaikan materi pada pertemuan aktif terlebih dahulu.
              </p>
            </div>
          ) : activeItem && (
            <div className="space-y-6">
              {/* 1. VIEW TYPE: READING MODULE & DOCUMENT/PPT VIEWER */}
              {activeItem.type === 'reading' && (
                <DocumentViewer
                  itemId={activeItem.id}
                  title={activeItem.title}
                  documentFile={activeItem.documentFile}
                  textContent={activeItem.contentMarkdown}
                  minReadingSeconds={30}
                  isAlreadyCompleted={isItemCompleted(activeItem.id)}
                  onCompleted={handleCompleteReading}
                  nextItem={nextItem}
                  onNavigateNext={(nextId) => handleSelectItem(nextId)}
                  isLastItem={isLastItem}
                />
              )}

              {/* 2. VIEW TYPE: SECURE YOUTUBE VIDEO */}
              {activeItem.type === 'video' && (
                <SecureYouTubePlayer
                  videoId={activeItem.youtubeVideoId || 'M2qGq_b8n0s'}
                  title={activeItem.title}
                  isAlreadyCompleted={isItemCompleted(activeItem.id)}
                  onCompleted={handleVideoCompleted}
                  nextItem={nextItem}
                  onNavigateNext={(nextId) => handleSelectItem(nextId)}
                  isLastItem={isLastItem}
                />
              )}

              {/* 3. VIEW TYPE: ASESMEN & TUGAS (FLEKSIBEL) */}
              {activeItem.type === 'assessment' && (
                <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                        Penugasan & Evaluasi
                      </span>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2">
                        {activeItem.title}
                      </h2>
                    </div>
                    {isItemCompleted(activeItem.id) && (
                      <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Tugas Telah Dikumpulkan</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    {activeItem.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {activeItem.durationMinutes && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-400 block font-semibold">Durasi Waktu</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {activeItem.durationMinutes} Menit
                        </span>
                      </div>
                    )}

                    {activeItem.questions && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <HelpCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-400 block font-semibold">Jumlah Soal</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {activeItem.questions.length} Soal
                        </span>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <span className="text-[11px] text-slate-400 block font-semibold">Maksimal Skor</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {activeItem.maxScore || 100} Poin
                      </span>
                    </div>
                  </div>

                  {/* If Interactive Questions (MCQ / Essay) */}
                  {activeItem.questions && activeItem.questions.length > 0 && (
                    <div className="space-y-4">
                      {isItemCompleted(activeItem.id) || userSubmission ? (
                        <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-3xl space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <span className="font-extrabold text-emerald-950 text-sm">
                                Asesmen Telah Diselesaikan
                              </span>
                            </div>
                            {userSubmission?.score !== null && userSubmission?.score !== undefined ? (
                              <span className="px-3.5 py-1.5 bg-white border border-emerald-200 rounded-2xl text-xs font-black text-emerald-700">
                                Skor Anda: {userSubmission.score} / {activeItem.maxScore || 100}
                              </span>
                            ) : (
                              <span className="px-3.5 py-1 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                                Jawaban Terkirim (Menunggu Penilaian Guru)
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-emerald-800 leading-relaxed">
                            Jawaban Anda telah berhasil tersimpan dan dinilai. Berdasarkan ketentuan akademik SMK Negeri 5 Gowa, asesmen terproteksi ini dikerjakan 1 kali (tidak dapat diulang).
                          </p>

                          {nextItem ? (
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => handleSelectItem(nextItem.id)}
                                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all"
                              >
                                <span>
                                  {nextItem.type === 'reading'
                                    ? 'Lanjut ke Modul Selanjutnya'
                                    : nextItem.type === 'video'
                                    ? 'Lanjut ke Video Pembelajaran'
                                    : 'Lanjut ke Tugas Berikutnya'}
                                </span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2 text-right text-xs font-bold text-emerald-700 flex items-center justify-end gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>🎉 Selamat! Anda telah menyelesaikan seluruh rangkaian materi kelas ini.</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {activeItem.enableAntiCheat && (
                            <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1">
                              <p className="font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                Ketentuan Ujian Terproteksi (Anti-Cheat Active):
                              </p>
                              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                                <li>Dilarang melakukan copy-paste soal atau jawaban.</li>
                                <li>Dilarang screenshot / berpindah ke tab browser lain.</li>
                                <li>Ujian hanya dapat dikerjakan 1 kali pengumpulan.</li>
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => onStartQuiz(activeItem.id)}
                              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center gap-2.5 shadow-lg active:scale-95 transition-all"
                            >
                              <ClipboardList className="w-4 h-4" />
                              <span>Mulai Kerjakan Asesmen</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* If File Upload Task Format */}
                  {activeItem.assessmentFormat === 'upload' && (
                    userSubmission ? (
                      <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="font-extrabold text-emerald-900 text-sm">
                              Tugas Anda Telah Dikirim
                            </span>
                          </div>
                          <span className="text-xs text-emerald-700">
                            {new Date(userSubmission.submittedAt).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-emerald-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-indigo-600" />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{userSubmission.fileName}</p>
                              <span className="text-[10px] text-slate-400">{userSubmission.fileSize}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                            {userSubmission.isLate ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        </div>

                        {userSubmission.score !== null ? (
                          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-indigo-900">Nilai dari Guru:</span>
                              <span className="text-base font-black text-indigo-700">
                                {userSubmission.score} / {userSubmission.maxScore}
                              </span>
                            </div>
                            {userSubmission.teacherFeedback && (
                              <p className="text-xs text-slate-700 italic">
                                "{userSubmission.teacherFeedback}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            Menunggu pemeriksaan dan nilai dari Guru Pengajar.
                          </p>
                        )}

                        {nextItem && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleSelectItem(nextItem.id)}
                              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all"
                            >
                              <span>
                                {nextItem.type === 'reading'
                                  ? 'Lanjut ke Modul Selanjutnya'
                                  : nextItem.type === 'video'
                                  ? 'Lanjut ke Video Pembelajaran'
                                  : 'Lanjut ke Tugas Berikutnya'}
                              </span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitTask} className="space-y-4 pt-2">
                        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-6 text-center cursor-pointer bg-slate-50/50 transition-all">
                          <input
                            type="file"
                            id="file-upload-task"
                            className="hidden"
                            onChange={handleFileUploadSim}
                          />
                          <label htmlFor="file-upload-task" className="cursor-pointer block">
                            <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-800">
                              {uploadFileName ? uploadFileName : 'Klik atau Tarik file ke sini untuk mengunggah tugas'}
                            </p>
                            <span className="text-xs text-slate-400 block mt-1">
                              Format didukung: PDF, Word, Gambar, ZIP (Maks. 25MB)
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Catatan untuk Guru (Opsional):
                          </label>
                          <textarea
                            rows={3}
                            value={assignmentNotes}
                            onChange={e => setAssignmentNotes(e.target.value)}
                            placeholder="Tuliskan keterangan tugas Anda di sini..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={!uploadFileName || isSubmitting}
                            className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
                              !uploadFileName
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95'
                            }`}
                          >
                            <Send className="w-4 h-4" />
                            <span>{isSubmitting ? 'Mengirim...' : 'Kumpulkan Tugas'}</span>
                          </button>
                        </div>
                      </form>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
