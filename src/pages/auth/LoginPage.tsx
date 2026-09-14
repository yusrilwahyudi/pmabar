import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { GraduationCap, UserCheck, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginStudent, loginTeacher } = useLMS();

  const [activeRole, setActiveRole] = useState<'siswa' | 'guru'>('siswa');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      if (activeRole === 'siswa') {
        const res = loginStudent(identifier.trim(), password.trim());
        if (!res.success) {
          setErrorMessage(res.message);
        }
      } else {
        const res = loginTeacher(identifier.trim(), password.trim());
        if (!res.success) {
          setErrorMessage(res.message);
        }
      }
      setIsLoading(false);
    }, 350);
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-2 sm:py-4 overflow-hidden">
      <div className="w-full max-w-sm sm:max-w-md space-y-3 sm:space-y-4 my-auto">
        
        {/* Brand Header with SMK Negeri 5 Gowa Logo */}
        <div className="text-center space-y-1">
          <img
            src="/logo.png"
            alt="Logo SMK Negeri 5 Gowa"
            className="w-12 h-12 sm:w-14 sm:h-14 mx-auto object-contain drop-shadow-xs mb-1"
          />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            P Mabar
          </h1>
          <p className="text-[11px] sm:text-xs font-extrabold text-indigo-600 leading-tight">
            Platform Manajemen Belajar Daring
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              SMK Negeri 5 Gowa
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
              by Yusril Wahyudi, S.Pd
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl sm:rounded-4xl p-5 sm:p-6 md:p-7 border border-slate-200/80 shadow-soft">
          {/* Role Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-3.5 sm:mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveRole('siswa');
                setErrorMessage(null);
                setIdentifier('');
                setPassword('');
              }}
              className={`flex-1 h-9 sm:h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === 'siswa'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('guru');
                setErrorMessage(null);
                setIdentifier('');
                setPassword('');
              }}
              className={`flex-1 h-9 sm:h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === 'guru'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Guru / Pengajar</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 block mb-1">
                {activeRole === 'siswa' ? 'Nomor Induk Siswa Nasional (NISN)' : 'Email atau NIP Pengajar'}
              </label>
              <input
                type="text"
                required
                placeholder={activeRole === 'siswa' ? 'Contoh: 0078129001' : 'Contoh: yusril.wahyudi@smkn5gowa.sch.id'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 block mb-1">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                required
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Symmetric Helper Box (Zero Height Shift) */}
            <div className="text-[10px] sm:text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-h-[38px] flex items-center leading-snug">
              {activeRole === 'siswa' ? (
                <span>
                  Informasi Siswa: Kata sandi awal default adalah nomor <strong className="text-indigo-600">NISN</strong> Anda.
                </span>
              ) : (
                <span>
                  Informasi Guru: Masuk dengan <strong className="text-indigo-600">Email dinas</strong> atau <strong className="text-indigo-600">NIP</strong> terdaftar Anda.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all mt-1"
            >
              <span>{isLoading ? 'Memeriksa Data...' : `Masuk Sebagai ${activeRole === 'siswa' ? 'Siswa' : 'Guru'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sistem Ujian Terproteksi & Anti-Cheat Aktif</span>
        </div>
      </div>
    </div>
  );
};
