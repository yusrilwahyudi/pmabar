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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-lg px-2 pt-1.5 pb-2.5">
      <div className="relative w-full flex items-center justify-between">
        
        {/* LEFT 2 TABS (Exact 50% Width) */}
        <div className="grid grid-cols-2 w-1/2 pr-7">
          {/* Tab 1: Belajar */}
          <button
            onClick={() => setActiveTab('learning')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 w-full transition-all ${
              activeTab === 'learning' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{currentUser.role === 'guru' ? 'Kelas' : 'Belajar'}</span>
          </button>

          {/* Tab 2: Katalog */}
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 w-full transition-all ${
              activeTab === 'classes' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Katalog</span>
          </button>
        </div>

        {/* ABSOLUTE CENTER FLOATING ACTION BUTTON (Anchored at exact 50.0% of viewport) */}
        <div className="absolute left-1/2 -top-5 -translate-x-1/2 z-50 pointer-events-auto">
          <button
            onClick={onOpenActionModal}
            className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-400/50 ring-4 ring-white active:scale-90 transition-transform"
            aria-label="Tambah Aksi"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* RIGHT 2 TABS (Exact 50% Width) */}
        <div className="grid grid-cols-2 w-1/2 pl-7">
          {/* Tab 3: Nilai */}
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 w-full transition-all ${
              activeTab === 'grades' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Nilai</span>
          </button>

          {/* Tab 4: Profil */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 w-full transition-all ${
              activeTab === 'profile' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Profil</span>
          </button>
        </div>

      </div>
    </nav>
  );
};

