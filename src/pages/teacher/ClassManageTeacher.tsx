import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Video,
  ClipboardList,
  Trash2,
  Edit3,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  FileText,
  Clock,
  Download,
  UploadCloud,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  X,
  Eye,
  Users,
  UserMinus,
  Lock,
  Unlock,
  Folder
} from 'lucide-react';
import { LearningItem, LearningItemType, AssessmentFormat, AssessmentQuestion } from '../../types/lms';

interface ClassManageTeacherProps {
  classId: string;
  onBack: () => void;
  onOpenGradeSubmissionModal: (submissionId: string) => void;
}

export const ClassManageTeacher: React.FC<ClassManageTeacherProps> = ({
  classId,
  onBack,
  onOpenGradeSubmissionModal
}) => {
  const {
    classes,
    classMembers,
    learningItems,
    submissions,
    createLearningItem,
    updateLearningItem,
    deleteLearningItem,
    reorderLearningItems,
    toggleSessionLock,
    copyLearningItemToClass,
    copySessionToClass,
    deleteClass,
    leaveClass,
    getStudentClassProgress
  } = useLMS();

  const currentClass = classes.find(c => c.id === classId);
  const otherClasses = classes.filter(c => c.id !== classId);
  const items = learningItems
    .filter(i => i.classId === classId)
    .sort((a, b) => a.order - b.order);

  // Group learning items by Chapter & Meeting Session
  interface SessionGroup {
    chapterTitle: string;
    meetingSession: string;
    isSessionLocked: boolean;
    releaseDateLabel?: string;
    items: LearningItem[];
  }

  const sessionGroups: SessionGroup[] = [];
  items.forEach(item => {
    const chapter = item.chapterTitle || 'Bab 1: Dasar Logika & Algoritma';
    const session = item.meetingSession || 'Pertemuan 1: Fondasi Logika';
    let group = sessionGroups.find(g => g.chapterTitle === chapter && g.meetingSession === session);
    if (!group) {
      group = {
        chapterTitle: chapter,
        meetingSession: session,
        isSessionLocked: Boolean(item.isSessionLocked),
        releaseDateLabel: item.releaseDateLabel,
        items: []
      };
      sessionGroups.push(group);
    }
    group.items.push(item);
    if (item.isSessionLocked !== undefined) {
      group.isSessionLocked = item.isSessionLocked;
    }
  });

  const uniqueChapters: string[] = Array.from(new Set(sessionGroups.map(g => g.chapterTitle)));

  const classSubmissions = submissions.filter(s => s.classId === classId);
  const members = classMembers.filter(m => m.classId === classId);

  // Tab State
  const [activeTab, setActiveTab] = useState<'curriculum' | 'submissions' | 'members'>('curriculum');

  // Modal Add / Edit Item State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [newItemType, setNewItemType] = useState<LearningItemType>('reading');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemDuration, setNewItemDuration] = useState('15 Menit');

  // Bab & Pertemuan Hierarchy States
  const [chapterTitle, setChapterTitle] = useState('Bab 1: Dasar Logika & Algoritma');
  const [meetingSession, setMeetingSession] = useState('Pertemuan 1: Fondasi Logika');
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Specific Modul Fields
  const [readingContent, setReadingContent] = useState('');
  const [uploadedPdfName, setUploadedPdfName] = useState('');
  const [uploadedPdfSize, setUploadedPdfSize] = useState('');
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState('');

  // Specific Video Fields
  const [youtubeVideoId, setYoutubeVideoId] = useState('');

  // Specific Asesmen & Tugas Fields
  const [assessmentFormat, setAssessmentFormat] = useState<AssessmentFormat>('mcq');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [enableAntiCheat, setEnableAntiCheat] = useState(true);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    {
      id: `q-1`,
      order: 1,
      type: 'mcq',
      questionText: '',
      points: 50,
      options: [
        { id: 'opt-1', text: '', isCorrect: true },
        { id: 'opt-2', text: '', isCorrect: false },
        { id: 'opt-3', text: '', isCorrect: false },
        { id: 'opt-4', text: '', isCorrect: false }
      ]
    }
  ]);

  const [copiedCode, setCopiedCode] = useState(false);

  // Copy Item / Session Modal States
  const [copyModal, setCopyModal] = useState<{
    isOpen: boolean;
    type: 'item' | 'session';
    item?: LearningItem;
    session?: {
      chapterTitle: string;
      meetingSession: string;
      itemCount: number;
    };
  }>({
    isOpen: false,
    type: 'session'
  });
  const [selectedTargetClassIds, setSelectedTargetClassIds] = useState<string[]>([]);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const handleOpenCopyItemModal = (item: LearningItem) => {
    setSelectedTargetClassIds([]);
    setCopyModal({
      isOpen: true,
      type: 'item',
      item
    });
  };

  const handleOpenCopySessionModal = (chapterTitle: string, meetingSession: string, itemCount: number) => {
    setSelectedTargetClassIds([]);
    setCopyModal({
      isOpen: true,
      type: 'session',
      session: {
        chapterTitle,
        meetingSession,
        itemCount
      }
    });
  };

  const handleToggleTargetClass = (targetClassId: string) => {
    setSelectedTargetClassIds(prev =>
      prev.includes(targetClassId)
        ? prev.filter(id => id !== targetClassId)
        : [...prev, targetClassId]
    );
  };

  const handleToggleSelectAllClasses = () => {
    if (selectedTargetClassIds.length === otherClasses.length) {
      setSelectedTargetClassIds([]);
    } else {
      setSelectedTargetClassIds(otherClasses.map(c => c.id));
    }
  };

  const handleExecuteCopy = () => {
    if (selectedTargetClassIds.length === 0) return;

    if (copyModal.type === 'item' && copyModal.item) {
      copyLearningItemToClass(copyModal.item.id, selectedTargetClassIds);
      const targetNames = otherClasses
        .filter(c => selectedTargetClassIds.includes(c.id))
        .map(c => c.title)
        .join(', ');
      setCopyToast(`Materi "${copyModal.item.title}" berhasil disalin ke ${targetNames}!`);
    } else if (copyModal.type === 'session' && copyModal.session) {
      copySessionToClass(
        classId,
        copyModal.session.chapterTitle,
        copyModal.session.meetingSession,
        selectedTargetClassIds
      );
      const targetNames = otherClasses
        .filter(c => selectedTargetClassIds.includes(c.id))
        .map(c => c.title)
        .join(', ');
      setCopyToast(`Seluruh "${copyModal.session.meetingSession}" (${copyModal.session.itemCount} materi) berhasil disalin ke ${targetNames}!`);
    }

    setCopyModal({ isOpen: false, type: 'session' });
    setSelectedTargetClassIds([]);
    setTimeout(() => {
      setCopyToast(null);
    }, 4000);
  };

  // Unique chapters & sessions list for dropdown suggestion
  const existingChapters = Array.from(new Set(items.map(i => i.chapterTitle).filter(Boolean))) as string[];
  const existingSessions = Array.from(new Set(items.map(i => i.meetingSession).filter(Boolean))) as string[];

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentClass.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePdfUploadSimulation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedPdfName(file.name);
      setUploadedPdfSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      try {
        const fileUrl = URL.createObjectURL(file);
        setUploadedPdfUrl(fileUrl);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingItemId(null);
    setNewItemType('reading');
    setNewItemTitle('');
    setNewItemDescription('');
    setNewItemDuration('15 Menit');
    
    // Set smart defaults based on previous items
    const lastItem = items[items.length - 1];
    setChapterTitle(lastItem?.chapterTitle || 'Bab 1: Dasar Logika & Algoritma');
    setMeetingSession(lastItem?.meetingSession || 'Pertemuan 1: Fondasi Logika');
    setIsSessionLocked(false);

    setReadingContent('');
    setUploadedPdfName('');
    setUploadedPdfSize('');
    setUploadedPdfUrl('');
    setYoutubeVideoId('');
    setAssessmentFormat('mcq');
    setDurationMinutes(20);
    setDeadlineDate('');
    setEnableAntiCheat(true);
    setQuestions([
      {
        id: `q-1`,
        order: 1,
        type: 'mcq',
        questionText: '',
        points: 50,
        options: [
          { id: 'opt-1', text: '', isCorrect: true },
          { id: 'opt-2', text: '', isCorrect: false },
          { id: 'opt-3', text: '', isCorrect: false },
          { id: 'opt-4', text: '', isCorrect: false }
        ]
      }
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: LearningItem) => {
    setEditingItemId(item.id);
    setNewItemType(item.type);
    setNewItemTitle(item.title);
    setNewItemDescription(item.description || '');
    setNewItemDuration(item.durationLabel || '15 Menit');

    setChapterTitle(item.chapterTitle || 'Bab 1: Dasar Logika & Algoritma');
    setMeetingSession(item.meetingSession || 'Pertemuan 1: Fondasi Logika');
    setIsSessionLocked(Boolean(item.isSessionLocked));

    setReadingContent(item.contentMarkdown || '');
    setUploadedPdfName(item.documentFile?.name || '');
    setUploadedPdfSize(item.documentFile?.size || '');
    setUploadedPdfUrl(item.documentFile?.url || '');

    setYoutubeVideoId(item.youtubeVideoId || '');

    setAssessmentFormat(item.assessmentFormat || 'mcq');
    setDurationMinutes(item.durationMinutes || 20);
    setDeadlineDate(item.deadline || '');
    setEnableAntiCheat(item.enableAntiCheat ?? true);

    if (item.questions && item.questions.length > 0) {
      setQuestions(JSON.parse(JSON.stringify(item.questions)));
    } else {
      setQuestions([
        {
          id: `q-1`,
          order: 1,
          type: 'mcq',
          questionText: '',
          points: 50,
          options: [
            { id: 'opt-1', text: '', isCorrect: true },
            { id: 'opt-2', text: '', isCorrect: false },
            { id: 'opt-3', text: '', isCorrect: false },
            { id: 'opt-4', text: '', isCorrect: false }
          ]
        }
      ]);
    }
    setIsModalOpen(true);
  };

  // Reordering helpers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    reorderLearningItems(classId, newItems.map(i => i.id));
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    reorderLearningItems(classId, newItems.map(i => i.id));
  };

  // Question builder helpers
  const handleAddQuestion = (type: 'mcq' | 'essay') => {
    const nextOrder = questions.length + 1;
    const newQ: AssessmentQuestion = {
      id: `q-${Date.now()}-${nextOrder}`,
      order: nextOrder,
      type,
      questionText: '',
      points: 25,
      options:
        type === 'mcq'
          ? [
              { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
              { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
              { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
              { id: `opt-${Date.now()}-4`, text: '', isCorrect: false }
            ]
          : undefined
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestionText = (idx: number, text: string) => {
    setQuestions(prev =>
      prev.map((q, i) => (i === idx ? { ...q, questionText: text } : q))
    );
  };

  const handleUpdateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIdx || !q.options) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = { ...newOpts[optIdx], text };
        return { ...q, options: newOpts };
      })
    );
  };

  const handleSetCorrectOption = (qIdx: number, optIdx: number) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIdx || !q.options) return q;
        const newOpts = q.options.map((opt, oIdx) => ({
          ...opt,
          isCorrect: oIdx === optIdx
        }));
        return { ...q, options: newOpts };
      })
    );
  };

  // Extract pure 11-char ID from full YouTube URL or shortlink
  const extractYouTubeId = (input: string): string => {
    if (!input) return '';
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const payload: Partial<LearningItem> = {
      title: newItemTitle,
      description: newItemDescription,
      type: newItemType,
      durationLabel: newItemDuration,
      tag: newItemType === 'reading' ? 'Modul Ajar' : newItemType === 'video' ? 'Video Wajib' : 'Asesmen & Tugas',

      // Bab & Pertemuan
      chapterTitle: chapterTitle.trim() || 'Bab 1: Dasar Logika & Algoritma',
      meetingSession: meetingSession.trim() || 'Pertemuan 1: Fondasi Logika',
      isSessionLocked: isSessionLocked,
      releaseDateLabel: isSessionLocked ? 'Terkunci untuk Pertemuan Berikutnya' : 'Aktif Hari Ini',

      // Reading
      contentMarkdown: newItemType === 'reading' ? readingContent : undefined,
      documentFile:
        newItemType === 'reading' && uploadedPdfName
          ? {
              name: uploadedPdfName,
              size: uploadedPdfSize || '2.4 MB',
              url: uploadedPdfUrl || '#'
            }
          : undefined,

      // Video
      youtubeVideoId: newItemType === 'video' ? extractYouTubeId(youtubeVideoId) || 'vRkIuENriKc' : undefined,

      // Assessment & Task
      assessmentFormat: newItemType === 'assessment' ? assessmentFormat : undefined,
      durationMinutes: newItemType === 'assessment' ? durationMinutes : undefined,
      deadline: newItemType === 'assessment' && deadlineDate ? deadlineDate : undefined,
      enableAntiCheat: newItemType === 'assessment' ? enableAntiCheat : undefined,
      questions: newItemType === 'assessment' ? questions : undefined,
      maxScore: 100,
      showInstantResult: true,
      allowedFormats: ['.pdf', '.docx', '.zip', '.png', '.jpg']
    };

    if (editingItemId) {
      updateLearningItem(editingItemId, payload);
    } else {
      const nextOrder = items.length + 1;
      createLearningItem({
        ...payload,
        classId,
        order: nextOrder
      } as Omit<LearningItem, 'id'>);
    }

    setIsModalOpen(false);
    setEditingItemId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft">
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
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700 hover:bg-slate-200"
                >
                  <span>Kode: {currentClass.code}</span>
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
                {currentClass.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'curriculum' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alur Materi & Tugas ({items.length})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'submissions' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pemeriksaan & Nilai ({classSubmissions.length})
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'members' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Siswa ({members.length})
              </button>
            </div>

            {/* Hapus Kelas Button */}
            <button
              onClick={() => {
                if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus kelas "${currentClass.title}" beserta seluruh alur materi dan nilai siswa di dalamnya? Tindakan ini permanen.`)) {
                  deleteClass(currentClass.id);
                  onBack();
                }
              }}
              className="p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all active:scale-95"
              title="Hapus Kelas Ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: CURRICULUM BUILDER BERBASIS BAB & PERTEMUAN */}
      {activeTab === 'curriculum' && (
        <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Alur Pembelajaran Berbasis Bab & Pertemuan
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  {uniqueChapters.length} Bab • {sessionGroups.length} Sesi Pertemuan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelompokkan topik ajar per pertemuan mingguan. Kunci sesi pertemuan berikutnya agar siswa fokus pada materi hari ini.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Materi / Tugas</span>
            </button>
          </div>

          {/* Grouped by Chapters and Sessions */}
          {uniqueChapters.length > 0 ? (
            <div className="space-y-6">
              {uniqueChapters.map((chapterName, cIdx) => {
                const chapterSessions = sessionGroups.filter(g => g.chapterTitle === chapterName);

                return (
                  <div key={chapterName} className="space-y-4 bg-slate-50/50 p-5 rounded-3xl border border-slate-200/60">
                    {/* Chapter Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {cIdx + 1}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900">
                            {chapterName}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {chapterSessions.length} Pertemuan Pembelajaran
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sessions inside this Chapter */}
                    <div className="space-y-4 pt-1">
                      {chapterSessions.map((session) => (
                        <div
                          key={session.meetingSession}
                          className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-2xs space-y-3"
                        >
                          {/* Session Header & Lock Control */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                🔹 {session.meetingSession}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({session.items.length} Modul/Tugas)
                              </span>
                            </div>

                            {/* Session Actions: Lock Toggle & Copy Session */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {otherClasses.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCopySessionModal(session.chapterTitle, session.meetingSession, session.items.length)}
                                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                                  title="Salin sesi pertemuan ini beserta seluruh materi & tugasnya ke kelas lain"
                                >
                                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Salin Sesi ke Kelas Lain</span>
                                </button>
                              )}

                              {session.isSessionLocked ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    <span>Terkunci untuk Siswa</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleSessionLock(classId, session.chapterTitle, session.meetingSession, false)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Buka Akses Siswa</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Terbuka (Aktif Hari Ini)</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleSessionLock(classId, session.chapterTitle, session.meetingSession, true)}
                                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                  >
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    <span>Kunci untuk Pertemuan Depan</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Items in Session */}
                          <div className="space-y-2">
                            {session.items.map((item) => {
                              const globalIdx = items.findIndex(i => i.id === item.id);

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                                      {globalIdx + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                          {item.type === 'reading' ? (
                                            <><BookOpen className="w-3 h-3" /> Modul PDF/Teks</>
                                          ) : item.type === 'video' ? (
                                            <><Video className="w-3 h-3" /> Video Anti-Skip</>
                                          ) : (
                                            <><ClipboardList className="w-3 h-3" /> Kuis / Tugas</>
                                          )}
                                        </span>
                                        {item.documentFile && (
                                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                            <Download className="w-3 h-3" /> {item.documentFile.name}
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                                      <span className="text-[10px] text-slate-400">{item.durationLabel || '15 Menit'}</span>
                                    </div>
                                  </div>

                                  {/* Item Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 w-full sm:w-auto justify-end">
                                    {/* Reorder Buttons */}
                                    <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 mr-1 shadow-2xs">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveUp(globalIdx)}
                                        disabled={globalIdx === 0}
                                        className={`p-1 rounded-md transition-colors ${
                                          globalIdx === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                        title="Pindahkan Ke Atas"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveDown(globalIdx)}
                                        disabled={globalIdx === items.length - 1}
                                        className={`p-1 rounded-md transition-colors ${
                                          globalIdx === items.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                        title="Pindahkan Ke Bawah"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Copy Item Button */}
                                    {otherClasses.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCopyItemModal(item)}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                                        title="Salin materi/tugas ini ke kelas lain"
                                      >
                                        <Copy className="w-3 h-3 text-slate-500" />
                                        <span>Salin</span>
                                      </button>
                                    )}

                                    {/* Edit Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(item)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all active:scale-95"
                                      title="Edit Materi / Tugas"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Apakah Anda yakin ingin menghapus "${item.title}"?`)) {
                                          deleteLearningItem(item.id);
                                        }
                                      }}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                      title="Hapus Materi"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-100">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Belum ada materi pembelajaran</p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol di atas untuk membuat modul ajar atau kuis pertama.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEJA NILAI & PEMERIKSAAN */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft">
          <h3 className="font-extrabold text-slate-900 text-lg mb-4">
            Daftar Pengumpulan & Hasil Pengerjaan Siswa
          </h3>

          {classSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 rounded-l-2xl">Siswa</th>
                    <th className="py-3 px-4">Nama Materi / Tugas</th>
                    <th className="py-3 px-4">Tipe Pengiriman</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Nilai</th>
                    <th className="py-3 px-4 rounded-r-2xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classSubmissions.map(sub => {
                    const item = learningItems.find(i => i.id === sub.learningItemId);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <img src={sub.studentAvatar} alt={sub.studentName} className="w-7 h-7 rounded-full object-cover" />
                          <span>{sub.studentName}</span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {item?.title || 'Tugas Siswa'}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {sub.submissionType === 'file_upload' ? (
                            <span className="flex items-center gap-1 font-mono">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              {sub.fileName}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-semibold text-indigo-700">
                              <ClipboardList className="w-3.5 h-3.5" />
                              Jawaban Asesmen Kuis
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.isLate ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {sub.isLate ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {sub.score !== null ? (
                            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                              {sub.score} / {sub.maxScore}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg">
                              Belum Dinilai
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => onOpenGradeSubmissionModal(sub.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{sub.score !== null ? 'Periksa & Edit Nilai' : 'Periksa & Beri Nilai'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400">Belum ada siswa yang mengumpulkan penugasan pada kelas ini.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANGGOTA SISWA (KELOLA SISWA SALAH KELAS) */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Daftar Siswa yang Bergabung ({members.length} Siswa)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Kelola siswa terdaftar. Anda dapat mengeluarkan siswa yang tidak sengaja salah masuk kelas ini.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold self-start sm:self-auto">
              <span>Kode Kelas: {currentClass.code}</span>
            </div>
          </div>

          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 rounded-l-2xl">Siswa</th>
                    <th className="py-3 px-4">Email / NISN</th>
                    <th className="py-3 px-4">Tanggal Bergabung</th>
                    <th className="py-3 px-4">Progres Belajar</th>
                    <th className="py-3 px-4 rounded-r-2xl text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(mem => {
                    const studentProgress = getStudentClassProgress(classId, mem.studentId);

                    return (
                      <tr key={mem.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={mem.studentAvatar}
                              alt={mem.studentName}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                            />
                            <span className="font-bold text-slate-900">{mem.studentName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                          {mem.studentEmail || '-'}
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {new Date(mem.joinedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-700">
                              <span>{studentProgress.percentage}%</span>
                              <span className="text-slate-400 font-normal">{studentProgress.completedCount}/{studentProgress.totalCount} materi</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${studentProgress.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Apakah Anda yakin ingin mengeluarkan siswa "${mem.studentName}" dari kelas ini? (Gunakan ini jika siswa tidak sengaja salah masuk kelas).`)) {
                                leaveClass(classId, mem.studentId);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ml-auto"
                            title="Keluarkan Siswa dari Kelas Ini"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Keluarkan</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-50 rounded-3xl border border-slate-100">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Belum ada siswa yang bergabung</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Bagikan kode <strong>{currentClass.code}</strong> kepada siswa untuk bergabung ke kelas ini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT MATERI & PENUGASAN (TERPADU & CLEAN) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-4xl p-6 md:p-8 shadow-modal border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingItemId ? 'Edit Materi / Penugasan' : 'Tambah Materi ke Alur Pembelajaran'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingItemId ? 'Perbarui data modul, dokumen, video, atau butir pertanyaan kuis' : 'Pilih jenis materi ajar atau penugasan untuk siswa'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* 3 Main Type Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilih Kategori Materi</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewItemType('reading')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      newItemType === 'reading'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Modul Ajar & PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewItemType('video')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      newItemType === 'video'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span>Video YouTube (Anti-Skip)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewItemType('assessment')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      newItemType === 'assessment'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span>Kuis, Tugas & Asesmen</span>
                  </button>
                </div>
              </div>

              {/* Bab & Pertemuan Grouping Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    📁 Bab / Topik Utama
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bab 2: OOP"
                    value={chapterTitle}
                    onChange={e => setChapterTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    list="chapter-options"
                  />
                  <datalist id="chapter-options">
                    {existingChapters.map(ch => (
                      <option key={ch} value={ch} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    🔹 Pertemuan / Sesi Belajar
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pertemuan 1: Class & Object"
                    value={meetingSession}
                    onChange={e => setMeetingSession(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    list="session-options"
                  />
                  <datalist id="session-options">
                    {existingSessions.map(sess => (
                      <option key={sess} value={sess} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-2 pt-1 border-t border-indigo-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Status Akses Siswa untuk Pertemuan Ini:</span>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSessionLocked}
                      onChange={e => setIsSessionLocked(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className={`text-xs font-bold ${isSessionLocked ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isSessionLocked ? '🔒 Kunci (Untuk Pertemuan Berikutnya)' : '🟢 Terbuka Sekarang'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Materi / Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kuis Pemahaman Modul 1 atau Evaluasi Akhir Bab"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Petunjuk atau rangkuman yang harus dipahami siswa..."
                  value={newItemDescription}
                  onChange={e => setNewItemDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* OPTION 1: MODUL BACAAN & UPLOAD PDF */}
              {newItemType === 'reading' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-200/80">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Upload Dokumen / PDF Ajar (Opsional)
                      </label>
                      {uploadedPdfName && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedPdfName('');
                            setUploadedPdfSize('');
                            setUploadedPdfUrl('');
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors"
                        >
                          Hapus File (Jadikan Teks Saja)
                        </button>
                      )}
                    </div>
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-2xl p-4 text-center cursor-pointer">
                      <input
                        type="file"
                        id="modul-pdf-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handlePdfUploadSimulation}
                      />
                      <label htmlFor="modul-pdf-upload" className="cursor-pointer block">
                        <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-1" />
                        <span className="text-xs font-bold text-slate-800 block">
                          {uploadedPdfName ? `📄 ${uploadedPdfName} (${uploadedPdfSize})` : 'Klik untuk Upload File PDF / PPT / Dokumen'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {uploadedPdfName ? 'Klik lagi untuk mengganti file' : 'Kosongkan jika hanya ingin modul materi berupa teks'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Teks Panduan Modul (Opsional)</label>
                    <textarea
                      rows={4}
                      placeholder="Tulis ringkasan atau catatan poin penting di sini..."
                      value={readingContent}
                      onChange={e => setReadingContent(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none font-sans"
                    />
                  </div>
                </div>
              )}

              {/* OPTION 2: VIDEO YOUTUBE ANTI-SKIP */}
              {newItemType === 'video' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-200/80">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Tautan / Link Video YouTube</label>
                      {youtubeVideoId && extractYouTubeId(youtubeVideoId).length === 11 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>ID Valid: {extractYouTubeId(youtubeVideoId)}</span>
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Paste link YouTube di sini, misal: https://www.youtube.com/watch?v=..."
                      value={youtubeVideoId}
                      onChange={e => setYoutubeVideoId(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Bisa paste link lengkap (misal: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">https://www.youtube.com/watch?v=vRkIuENriKc</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">https://youtu.be/...</code>)
                    </p>
                  </div>

                  {/* Live Thumbnail Preview */}
                  {youtubeVideoId && extractYouTubeId(youtubeVideoId).length === 11 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(youtubeVideoId)}/mqdefault.jpg`}
                        alt="Preview Video"
                        className="w-24 h-14 object-cover rounded-xl border border-slate-100 shrink-0 bg-slate-100"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div className="text-xs min-w-0">
                        <span className="font-bold text-slate-900 block truncate">Video YouTube Terdeteksi</span>
                        <span className="text-[10px] text-indigo-600 font-mono block truncate">
                          ID: {extractYouTubeId(youtubeVideoId)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Siap diputar dengan proteksi anti-skip</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>Fitur Anti-Skip & Kunci Kecepatan 1.0x akan otomatis aktif pada video ini.</span>
                  </div>
                </div>
              )}

              {/* OPTION 3: PENUGASAN & ASESMEN FLEKSIBEL (MCQ, ESSAY, UPLOAD) */}
              {newItemType === 'assessment' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-3xl border border-slate-200/80">
                  {/* Format Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilih Format Kuis / Penugasan</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAssessmentFormat('mcq')}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          assessmentFormat === 'mcq'
                            ? 'bg-white border-indigo-600 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        📝 Kuis Pilihan Ganda
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssessmentFormat('essay')}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          assessmentFormat === 'essay'
                            ? 'bg-white border-indigo-600 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ✍️ Soal Esai
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssessmentFormat('upload')}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          assessmentFormat === 'upload'
                            ? 'bg-white border-indigo-600 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        📤 Upload File / Tugas
                      </button>
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Durasi Timer (Menit)</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={durationMinutes}
                        onChange={e => setDurationMinutes(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Tenggat Waktu (Opsional)</label>
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={e => setDeadlineDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Question Builder Template for MCQ & Essay */}
                  {(assessmentFormat === 'mcq' || assessmentFormat === 'essay') && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Daftar Soal & Kunci Jawaban</label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddQuestion('mcq')}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700"
                          >
                            + Soal Pilihan Ganda
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddQuestion('essay')}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700"
                          >
                            + Soal Esai
                          </button>
                        </div>
                      </div>

                      {questions.map((q, qIdx) => (
                        <div key={q.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700">
                              Nomor {qIdx + 1} ({q.type === 'mcq' ? 'Pilihan Ganda' : 'Esai'})
                            </span>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIdx)}
                                className="text-slate-400 hover:text-rose-600 text-xs"
                              >
                                Hapus
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            required
                            placeholder="Tuliskan teks pertanyaan di sini..."
                            value={q.questionText}
                            onChange={e => handleUpdateQuestionText(qIdx, e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                          />

                          {/* Options for MCQ */}
                          {q.type === 'mcq' && q.options && (
                            <div className="space-y-1.5 pl-2 pt-1">
                              <span className="text-[10px] text-slate-400 font-bold block">
                                * Centang radio untuk menandai kunci jawaban yang benar:
                              </span>
                              {q.options.map((opt, optIdx) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${q.id}`}
                                    checked={opt.isCorrect}
                                    onChange={() => handleSetCorrectOption(qIdx, optIdx)}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <input
                                    type="text"
                                    required
                                    placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                                    value={opt.text}
                                    onChange={e => handleUpdateOptionText(qIdx, optIdx, e.target.value)}
                                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Anti-cheat toggle */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Proteksi Ujian (Anti Copy-Paste & Tab Switch)</span>
                        <span className="text-[10px] text-slate-400">Mencegah kecurangan siswa saat mengerjakan.</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAntiCheat}
                      onChange={e => setEnableAntiCheat(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                >
                  {editingItemId ? 'Simpan Perubahan' : 'Simpan & Tambah ke Jalur Belajar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SALIN MATERI / SESI KE KELAS LAIN */}
      {copyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {copyModal.type === 'session' ? 'Salin Sesi Pertemuan' : 'Salin Materi / Tugas'}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {copyModal.type === 'session'
                      ? `${copyModal.session?.meetingSession} (${copyModal.session?.itemCount} Materi & Tugas)`
                      : copyModal.item?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCopyModal({ isOpen: false, type: 'session' })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>💡 Salin ke Kelas Paralel / Kelas Lain</span>
              </p>
              <p className="text-[11px] text-indigo-700/90 leading-relaxed">
                {copyModal.type === 'session'
                  ? 'Seluruh modul bacaan, video, dan kuis dalam sesi pertemuan ini akan diduplikasi langsung ke dalam kelas tujuan tanpa mengubah data kelas asal.'
                  : 'Materi ini akan ditambahkan ke bagian kurikulum pada kelas tujuan yang Anda pilih.'}
              </p>
            </div>

            {/* Target Classes Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Pilih Kelas Tujuan ({selectedTargetClassIds.length} dipilih):
                </label>
                {otherClasses.length > 1 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAllClasses}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {selectedTargetClassIds.length === otherClasses.length ? 'Batal Pilih Semua' : 'Pilih Semua Kelas'}
                  </button>
                )}
              </div>

              {otherClasses.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
                  Tidak ada kelas lain yang tersedia untuk disalin.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {otherClasses.map((cls) => {
                    const isSelected = selectedTargetClassIds.includes(cls.id);
                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleToggleTargetClass(cls.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 pointer-events-none"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{cls.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span>{cls.subject}</span>
                              <span>•</span>
                              <span>Kode: {cls.code}</span>
                              <span>•</span>
                              <span>{cls.totalModules || 0} Materi</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            Terpilih
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCopyModal({ isOpen: false, type: 'session' })}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteCopy}
                disabled={selectedTargetClassIds.length === 0}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                  selectedTargetClassIds.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  Salin Sekarang ({selectedTargetClassIds.length} Kelas)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SUCCESS TOAST */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-100 max-w-sm">{copyToast}</p>
          <button
            onClick={() => setCopyToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
