import React from 'react';
import { BookOpen, Layers, Award, Plus, UserCheck } from 'lucide-react';
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-lg px-2 pt-2 pb-3">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto relative">
        {/* Tab 1: Belajar */}
        <button
          onClick={() => setActiveTab('learning')}
          className={`flex flex-col items-center justify-center gap-1 py-1 w-full transition-all ${
            activeTab === 'learning' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{currentUser.role === 'guru' ? 'Kelas' : 'Belajar'}</span>
        </button>

        {/* Tab 2: Katalog */}
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex flex-col items-center justify-center gap-1 py-1 w-full transition-all ${
            activeTab === 'classes' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Katalog</span>
        </button>

        {/* Tab 3: CENTER ACTION BUTTON (Mathematically Dead Center) */}
        <div className="flex items-center justify-center w-full">
          <button
            onClick={onOpenActionModal}
            className="flex items-center justify-center -mt-6 w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-400/50 ring-4 ring-white active:scale-90 transition-transform"
            aria-label="Tambah Aksi"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Nilai */}
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex flex-col items-center justify-center gap-1 py-1 w-full transition-all ${
            activeTab === 'grades' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Nilai</span>
        </button>

        {/* Tab 5: Profil */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-1 py-1 w-full transition-all ${
            activeTab === 'profile' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Profil</span>
        </button>
      </div>
    </nav>
  );
};

