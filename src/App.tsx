import React, { useState, useEffect } from 'react';
import { useLMS } from './context/LMSContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ClassLearningView } from './pages/student/ClassLearningView';
import { QuizPlayer } from './pages/student/QuizPlayer';
import { StudentGrades } from './pages/student/StudentGrades';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ClassManageTeacher } from './pages/teacher/ClassManageTeacher';
import { GradeBookExport } from './pages/teacher/GradeBookExport';
import { JoinClassModal } from './components/modals/JoinClassModal';
import { CreateClassModal } from './components/modals/CreateClassModal';
import { GradeSubmissionModal } from './pages/teacher/GradeSubmissionModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { StudentManagerModal } from './components/modals/StudentManagerModal';
import { PastelClassCard } from './components/cards/PastelClassCard';
import { ShieldCheck, Key, LogOut } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { currentUser, classes, classMembers, logout } = useLMS();

  // App Navigation State - Always starts on 'learning' (Dashboard) with no class selected
  const [activeTab, setActiveTab] = useState<string>('learning');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeLearningItemId, setActiveLearningItemId] = useState<string | undefined>(undefined);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);

  // Modals
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isStudentManagerModalOpen, setIsStudentManagerModalOpen] = useState(false);

  // Guaranteed reset to Dashboard whenever a user logs in or switches account
  useEffect(() => {
    setSelectedClassId(null);
    setActiveLearningItemId(undefined);
    setActiveQuizId(null);
    setGradingSubmissionId(null);
    setActiveTab('learning');
  }, [currentUser?.id]);

  // If user is not logged in, render the clean Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Handle Class Selection
  const handleSelectClass = (classId: string, itemId?: string) => {
    if (currentUser.role === 'siswa') {
      const isEnrolled = classMembers.some(m => m.classId === classId && m.studentId === currentUser.id);
      if (!isEnrolled) {
        setIsJoinModalOpen(true);
        return;
      }
    }
    setSelectedClassId(classId);
    setActiveLearningItemId(itemId);
  };

  const handleBackToDashboard = () => {
    setSelectedClassId(null);
    setActiveLearningItemId(undefined);
  };

  // If Quiz is Active, render full screen quiz proctored view
  if (activeQuizId) {
    return (
      <QuizPlayer
        itemId={activeQuizId}
        onClose={() => setActiveQuizId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          setSelectedClassId(null);
        }}
        onOpenJoinClassModal={() => setIsJoinModalOpen(true)}
        onOpenCreateClassModal={() => setIsCreateModalOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onOpenStudentManagerModal={() => setIsStudentManagerModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        {/* VIEW 1: CLASS LEARNING OR MANAGEMENT DETAIL */}
        {selectedClassId ? (
          currentUser.role === 'guru' ? (
            <ClassManageTeacher
              classId={selectedClassId}
              onBack={handleBackToDashboard}
              onOpenGradeSubmissionModal={subId => setGradingSubmissionId(subId)}
            />
          ) : (
            <ClassLearningView
              classId={selectedClassId}
              initialItemId={activeLearningItemId}
              onBack={handleBackToDashboard}
              onStartQuiz={itemId => setActiveQuizId(itemId)}
            />
          )
        ) : (
          <>
            {/* VIEW 2: TAB 'LEARNING' (DASHBOARD) */}
            {activeTab === 'learning' && (
              currentUser.role === 'guru' ? (
                <TeacherDashboard
                  onSelectClass={classId => handleSelectClass(classId)}
                  onOpenCreateClassModal={() => setIsCreateModalOpen(true)}
                  onOpenGradeBook={() => setActiveTab('grades')}
                />
              ) : (
                <StudentDashboard
                  onSelectClass={classId => handleSelectClass(classId)}
                  onOpenItem={(classId, itemId) => handleSelectClass(classId, itemId)}
                  onOpenJoinClassModal={() => setIsJoinModalOpen(true)}
                />
              )
            )}

            {/* VIEW 3: TAB 'CLASSES' (CATALOG) */}
            {activeTab === 'classes' && (
              <div className="space-y-6 pb-16">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Katalog Seluruh Ruang Kelas
                    </h1>
                    <p className="text-xs text-slate-500">
                      Jelajahi kelas yang tersedia dan ikuti alur belajar terstruktur.
                    </p>
                  </div>
                  {currentUser.role === 'siswa' ? (
                    <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm"
                    >
                      + Gabung via Kode
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm"
                    >
                      + Buat Kelas
                    </button>
                  )}
                </div>

                {classes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {classes.map(cls => (
                      <PastelClassCard
                        key={cls.id}
                        classItem={cls}
                        onSelectClass={classId => handleSelectClass(classId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-4xl border border-slate-200">
                    <p className="text-sm font-bold text-slate-700 mb-1">Belum ada kelas yang dibuat</p>
                    <p className="text-xs text-slate-400 mb-4">Buat ruang kelas pertama Anda sekarang.</p>
                    {currentUser.role === 'guru' && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold"
                      >
                        + Buat Kelas Pertama
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: TAB 'GRADES' */}
            {activeTab === 'grades' && (
              currentUser.role === 'guru' ? (
                <GradeBookExport onBack={() => setActiveTab('learning')} />
              ) : (
                <StudentGrades />
              )
            )}

            {/* VIEW 5: TAB 'PROFILE' */}
            {activeTab === 'profile' && (
              <div className="max-w-xl mx-auto py-8">
                <div className="bg-white rounded-4xl p-8 border border-slate-200/80 shadow-soft text-center space-y-6">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-24 h-24 rounded-3xl mx-auto object-cover ring-4 ring-indigo-500/20 shadow-md"
                  />
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{currentUser.name}</h2>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      {currentUser.role === 'guru' ? 'Pengajar / Guru' : 'Siswa Aktif'}
                    </span>
                    <p className="text-xs text-slate-500 mt-2">{currentUser.email}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {currentUser.role === 'siswa' ? `NISN: ${currentUser.idNumber}` : `NIP/ID: ${currentUser.idNumber}`}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Status Akun:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Terverifikasi Aktif</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Proteksi Ujian (Anti-Cheat):</span>
                      <span className="font-bold text-indigo-600">Aktif</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="w-full py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Key className="w-4 h-4" />
                      <span>Ganti Kata Sandi</span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          setSelectedClassId(null);
        }}
        onOpenActionModal={() => {
          if (currentUser.role === 'guru') {
            setIsCreateModalOpen(true);
          } else {
            setIsJoinModalOpen(true);
          }
        }}
      />

      {/* Modals */}
      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={classId => handleSelectClass(classId)}
      />

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={classId => handleSelectClass(classId)}
      />

      <GradeSubmissionModal
        submissionId={gradingSubmissionId}
        onClose={() => setGradingSubmissionId(null)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      <StudentManagerModal
        isOpen={isStudentManagerModalOpen}
        onClose={() => setIsStudentManagerModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
