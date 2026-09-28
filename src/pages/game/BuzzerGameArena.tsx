import React, { useState, useEffect } from 'react';
import { BuzzerGameSession } from '../../types/game';
import { buzzerService } from '../../services/buzzerService';
import { BuzzerHostView } from '../../components/game/BuzzerHostView';
import { BuzzerStudentView } from '../../components/game/BuzzerStudentView';
import { Loader2 } from 'lucide-react';

interface BuzzerGameArenaProps {
  classId: string;
  className?: string;
  currentUser: {
    id: string;
    name: string;
    role: 'guru' | 'siswa' | 'admin';
    idNumber?: string;
  };
  onExit: () => void;
}

export const BuzzerGameArena: React.FC<BuzzerGameArenaProps> = ({
  classId,
  className = 'Kelas Interaktif',
  currentUser,
  onExit
}) => {
  const [session, setSession] = useState<BuzzerGameSession | null>(null);
  // Allow teachers to preview student view for testing
  const [previewAsStudent, setPreviewAsStudent] = useState<boolean>(false);

  useEffect(() => {
    const isTeacher = currentUser.role === 'guru' || currentUser.role === 'admin';
    const isHost = isTeacher && !previewAsStudent;

    // 1. Initial Load
    const initialSession = buzzerService.loadSession(classId, className);
    setSession(initialSession);

    // 2. Subscribe to Realtime Updates
    const unsubscribe = buzzerService.subscribe(classId, (updatedSession) => {
      setSession({ ...updatedSession });
    }, isHost);

    // 3. Request state on window focus or visibility change (e.g. phone wake)
    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        buzzerService.requestState(classId);
      }
    };

    window.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);
    window.addEventListener('online', handleWake);

    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
      window.removeEventListener('online', handleWake);
    };
  }, [classId, className, currentUser.role, previewAsStudent]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
        <p className="text-slate-400 font-medium">Memuat Arena Cerdas Cermat...</p>
      </div>
    );
  }

  const isTeacher = currentUser.role === 'guru' || currentUser.role === 'admin';
  const showHostView = isTeacher && !previewAsStudent;

  if (showHostView) {
    return (
      <div className="relative">
        <BuzzerHostView
          session={session}
          onExit={onExit}
        />
        {/* Quick Testing Switch for Teacher */}
        <div className="fixed bottom-3 right-3 z-50">
          <button
            onClick={() => setPreviewAsStudent(true)}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 shadow-xl backdrop-blur-md transition flex items-center gap-1.5"
          >
            <span>📱</span> Uji Mode Siswa (Bel)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <BuzzerStudentView
        session={session}
        studentId={currentUser.id}
        studentName={currentUser.name || 'Perwakilan Siswa'}
        studentNisn={currentUser.idNumber}
        onExit={() => {
          if (isTeacher && previewAsStudent) {
            setPreviewAsStudent(false);
          } else {
            onExit();
          }
        }}
      />
      {isTeacher && previewAsStudent && (
        <div className="fixed top-3 right-3 z-50">
          <button
            onClick={() => setPreviewAsStudent(false)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full shadow-xl transition font-semibold"
          >
            Kembali ke Host Mode 🖥️
          </button>
        </div>
      )}
    </div>
  );
};
