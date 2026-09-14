import React from 'react';
import { BookOpen, Layers, Award, PlusCircle, UserCheck } from 'lucide-react';
import { useLMS } from '../../context/LMSContext';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenActionModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenActionModal
}) => {
  const { currentUser } = useLMS();

  if (!currentUser) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        <button
          onClick={() => setActiveTab('learning')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'learning' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">{currentUser.role === 'guru' ? 'Kelas Saya' : 'Belajar'}</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'classes' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Katalog</span>
        </button>

        <button
          onClick={onOpenActionModal}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-300 active:scale-90 transition-transform"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'grades' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px]">Nilai</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px]">Profil</span>
        </button>
      </div>
    </nav>
  );
};
