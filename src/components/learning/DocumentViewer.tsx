import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Lock,
  Clock,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Presentation,
  BookOpen
} from 'lucide-react';

interface DocumentViewerProps {
  itemId?: string;
  title: string;
  documentFile?: {
    name: string;
    size: string;
    url: string;
    fileType?: 'pdf' | 'ppt' | 'doc';
    slides?: string[];
  };
  textContent?: string;
  minReadingSeconds?: number;
  isAlreadyCompleted: boolean;
  onCompleted: () => void;
  nextItem?: { id: string; title: string; type: string } | null;
  onNavigateNext?: (nextItemId: string) => void;
  isLastItem?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  itemId,
  title,
  documentFile,
  textContent,
  minReadingSeconds = 30,
  isAlreadyCompleted,
  onCompleted,
  nextItem,
  onNavigateNext,
  isLastItem = false
}) => {
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const timerStorageKey = `daring_lms_reading_timer_${itemId || title}`;
  const scrollStorageKey = `daring_lms_reading_scrolled_${itemId || title}`;

  // 1. Persistent Timer State from sessionStorage
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (isAlreadyCompleted) return 0;
    try {
      const saved = sessionStorage.getItem(timerStorageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? minReadingSeconds : parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return minReadingSeconds;
  });

  // 2. Persistent Scroll State from sessionStorage
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(() => {
    if (isAlreadyCompleted) return true;
    try {
      return sessionStorage.getItem(scrollStorageKey) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentSlide, setCurrentSlide] = useState(1);
  const [hasViewedAllSlides, setHasViewedAllSlides] = useState(isAlreadyCompleted);

  const isPpt = documentFile?.name?.toLowerCase().endsWith('.ppt') ||
    documentFile?.name?.toLowerCase().endsWith('.pptx') ||
    documentFile?.fileType === 'ppt';

  const hasRealPdfUrl = Boolean(
    documentFile?.url &&
    documentFile.url !== '#' &&
    !documentFile.url.includes('example.com') &&
    (documentFile.url.startsWith('blob:') || documentFile.url.startsWith('data:') || (documentFile.url.startsWith('http') && documentFile.url.endsWith('.pdf')))
  );

  // Demo slide presentation mock if PPT
  const pptSlides = [
    {
      title: 'Slide 1: Pendahuluan & Kompetensi Dasar',
      content: 'Selamat datang di materi ajar resmi SMK Negeri 5 Gowa. Pada bab ini kita akan membahas konsep dasar materi, arsitektur logika, dan penerapannya dalam dunia industri.',
      bgColor: 'bg-indigo-900 text-white'
    },
    {
      title: 'Slide 2: Konsep Inti & Diagram Alur',
      content: 'Struktur materi disusun secara terstruktur mulai dari pemahaman definisi, bagan alur konsep, hingga contoh studi kasus nyata di dunia kerja.',
      bgColor: 'bg-slate-800 text-white'
    },
    {
      title: 'Slide 3: Studi Kasus & Penerapan Praktis',
      content: 'Penerapan modul: Analisis alur logika, validasi sistem, dan implementasi sesuai dengan standar industri kejuruan terkini.',
      bgColor: 'bg-blue-950 text-white'
    },
    {
      title: 'Slide 4: Kesimpulan & Evaluasi',
      content: 'Pastikan seluruh lembar materi dan slide telah dipahami sebelum melanjutkan ke video pembelajaran interaktif dan asesmen kuis di tahap berikutnya.',
      bgColor: 'bg-indigo-950 text-white'
    }
  ];

  const totalSlides = pptSlides.length;

  // Countdown timer effect
  useEffect(() => {
    if (isAlreadyCompleted) {
      try { sessionStorage.setItem(timerStorageKey, '0'); } catch (e) {}
      setSecondsRemaining(0);
      return;
    }

    if (secondsRemaining <= 0) {
      try { sessionStorage.setItem(timerStorageKey, '0'); } catch (e) {}
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        const next = prev <= 1 ? 0 : prev - 1;
        try { sessionStorage.setItem(timerStorageKey, next.toString()); } catch (e) {}
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAlreadyCompleted, secondsRemaining, timerStorageKey]);

  // Scroll to bottom detector
  const handleScroll = () => {
    if (!contentContainerRef.current || hasScrolledToBottom) return;

    const { scrollTop, scrollHeight, clientHeight } = contentContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 40) {
      setHasScrolledToBottom(true);
      try { sessionStorage.setItem(scrollStorageKey, 'true'); } catch (e) {}
    }
  };

  // Slide navigation for PPT
  const handleNextSlide = () => {
    if (currentSlide < totalSlides) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      if (next === totalSlides) {
        setHasViewedAllSlides(true);
      }
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Download Handler
  const handleDownload = () => {
    if (documentFile?.url && documentFile.url !== '#' && !documentFile.url.includes('example.com')) {
      const a = document.createElement('a');
      a.href = documentFile.url;
      a.download = documentFile.name;
      a.click();
    } else {
      const sampleText = `${title}\nDokumen Resmi Pembelajaran SMK Negeri 5 Gowa\nDisusun oleh: Yusril Wahyudi, S.Pd\n\n${textContent || 'Materi ajar modul kompetensi kejuruan.'}`;
      const blob = new Blob([sampleText], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentFile?.name || `${title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Completion condition
  const canMarkAsFinished =
    isAlreadyCompleted ||
    (secondsRemaining === 0 && (isPpt ? hasViewedAllSlides : (hasScrolledToBottom || hasRealPdfUrl)));

  return (
    <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200/80 shadow-soft space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
              {isPpt ? (
                <><Presentation className="w-3.5 h-3.5 text-orange-600" /> <span>Slide Presentasi PPT</span></>
              ) : documentFile ? (
                <><FileText className="w-3.5 h-3.5 text-indigo-600" /> <span>Modul Dokumen PDF</span></>
              ) : (
                <><BookOpen className="w-3.5 h-3.5 text-indigo-600" /> <span>Modul Materi Bacaan</span></>
              )}
            </span>
            {documentFile && (
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded-lg font-bold">
                {documentFile.size}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">{title}</h2>
        </div>

        {/* Download File Button (Only shown if a file was uploaded) */}
        {documentFile && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasRealPdfUrl && (
              <a
                href={documentFile.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                title="Buka Dokumen di Tab Baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Tab Baru</span>
              </a>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Unduh {isPpt ? 'PPT' : 'PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. PPT SLIDE SHOWCASE CARD */}
      {isPpt ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900/5 p-6 md:p-8 space-y-6 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  <Presentation className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      Microsoft PowerPoint (.pptx / .ppt)
                    </span>
                    {documentFile?.size && (
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {documentFile.size}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {documentFile?.name || title}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all self-start sm:self-auto shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File PowerPoint (.pptx)</span>
              </button>
            </div>

            {/* Content Notes if Available */}
            {textContent && (
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  Ringkasan & Catatan Panduan Slide:
                </span>
                <p className="whitespace-pre-line leading-relaxed">{textContent}</p>
              </div>
            )}

            {/* Format Information Box */}
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Informasi Format Slide Presentasi:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                File berformat <strong>.ppt / .pptx</strong> adalah dokumen Microsoft PowerPoint yang dapat diunduh oleh siswa dan dibuka melalui aplikasi PowerPoint / WPS Office di HP maupun Komputer.
              </p>
              <div className="pt-2 border-t border-amber-200/60 mt-2">
                <p className="text-[11px] font-bold text-amber-900">
                  💡 Rekomendasi Tampilan Visual Langsung di Layar:
                </p>
                <p className="text-[11px] text-amber-800">
                  Jika Bapak/Ibu ingin agar setiap lembar slide presentasi <strong>tampil visual langsung di dalam browser</strong> tanpa siswa perlu mengunduh dan membuka aplikasi PowerPoint, simpan file presentasi sebagai format <strong>PDF</strong> (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">File &gt; Save As &gt; PDF</code> di PowerPoint/Google Slides/Canva) lalu unggah file PDF tersebut.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : hasRealPdfUrl ? (
        /* 2. REAL EMBEDDED PDF VIEWER (IFRAME) - When valid PDF blob exists */
        <div className="space-y-4">
          <div className="w-full h-[620px] rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
            <iframe
              src={`${documentFile?.url}#toolbar=1&navpanes=0`}
              title={documentFile?.name || 'Dokumen PDF'}
              className="w-full h-full border-0"
            />
          </div>

          {textContent && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Catatan Panduan Modul:
              </span>
              <p className="whitespace-pre-line leading-relaxed">{textContent}</p>
            </div>
          )}
        </div>
      ) : documentFile ? (
        /* 3. DOCUMENT FILE DOWNLOAD CARD + READING NOTES (When file uploaded without embedded viewer) */
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-r from-indigo-50/80 to-slate-50 rounded-3xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  Lampiran Dokumen Ajar
                </span>
                <h4 className="text-sm font-black text-slate-900">{documentFile.name}</h4>
                <span className="text-[11px] text-slate-500 font-semibold">{documentFile.size}</span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 self-start sm:self-auto shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Lengkap</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="font-semibold flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Lembar Materi Belajar (Scroll ke bawah untuk membaca seluruh panduan)</span>
            </span>
            <span className={`font-bold ${hasScrolledToBottom ? 'text-emerald-600' : 'text-amber-600'}`}>
              {hasScrolledToBottom ? '✓ Selesai Dibaca' : 'Scroll hingga bagian akhir'}
            </span>
          </div>

          <div
            ref={contentContainerRef}
            onScroll={handleScroll}
            className="h-96 overflow-y-auto p-6 bg-slate-50/60 rounded-3xl border border-slate-200 text-slate-700 leading-relaxed text-sm md:text-base space-y-4 shadow-inner"
          >
            <div className="whitespace-pre-line space-y-4 text-slate-800">
              {textContent || (
                `### Panduan Pembelajaran Modul

1. **Kompetensi Dasar & Uraian Materi**
   Pelajari dokumen terlampir di atas untuk memahami topik pembelajaran ini secara mendalam.

2. **Tahapan Belajar:**
   - Unduh dokumen melalui tombol di atas untuk dibaca secara offline di HP/Laptop.
   - Pahami penjelasan konsep dasar dan kerjakan latihan mandiri yang tertera.
   - Selesaikan durasi waktu membaca sebelum melanjutkan ke tahap berikutnya.`
              )}
            </div>

            <div className="pt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200">
              --- Akhir dari Modul Pembelajaran ---
            </div>
          </div>
        </div>
      ) : (
        /* 4. PURE TEXT ARTICLE / READING CANVAS (Guru tidak upload file PDF/dokumen) */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="font-semibold flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Lembar Materi Bacaan (Scroll ke bawah untuk membaca seluruh materi)</span>
            </span>
            <span className={`font-bold ${hasScrolledToBottom ? 'text-emerald-600' : 'text-amber-600'}`}>
              {hasScrolledToBottom ? '✓ Selesai Dibaca' : 'Scroll hingga bagian akhir'}
            </span>
          </div>

          <div
            ref={contentContainerRef}
            onScroll={handleScroll}
            className="h-96 overflow-y-auto p-6 bg-slate-50/60 rounded-3xl border border-slate-200 text-slate-700 leading-relaxed text-sm md:text-base space-y-4 shadow-inner"
          >
            <div className="whitespace-pre-line space-y-4 text-slate-800 font-medium">
              {textContent || (
                `### Rangkuman & Uraian Materi Ajar

1. **Pendahuluan**
   Modul ini disusun untuk memberikan pemahaman menyeluruh mengenai topik pembelajaran secara bertahap.

2. **Petunjuk Belajar Peserta Didik:**
   - Bacalah seluruh isi modul ini dengan cermat.
   - Pahami konsep dasar dan istilah-istilah penting yang digunakan.
   - Apabila terdapat materi yang belum dipahami, catat dan diskusikan bersama Guru Pengajar di kelas.

3. **Langkah Berikutnya:**
   Setelah menyelesaikan modul bacaan ini, lanjutkan ke video tutorial dan kuis asesmen untuk menguji pemahaman Anda.`
              )}
            </div>

            <div className="pt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200">
              --- Akhir dari Lembar Materi Bacaan ---
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPLETION GUARD & DYNAMIC ACTION BAR */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Anti-Bypass Status Indicator */}
        <div className="text-xs">
          {isAlreadyCompleted ? (
            <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {isLastItem
                  ? '🎉 Selamat! Seluruh materi pembelajaran telah tuntas diselesaikan.'
                  : 'Modul ini telah tuntas dipelajari.'}
              </span>
            </div>
          ) : secondsRemaining > 0 ? (
            <div className="flex items-center gap-2 text-amber-800 font-semibold bg-amber-50 px-3.5 py-2 rounded-2xl border border-amber-200 animate-pulse">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Waktu baca wajib: sisa <span className="font-bold text-amber-900">{secondsRemaining} detik</span> lagi</span>
            </div>
          ) : !hasScrolledToBottom && !isPpt && !hasRealPdfUrl ? (
            <div className="flex items-center gap-2 text-indigo-800 font-semibold bg-indigo-50 px-3.5 py-2 rounded-2xl border border-indigo-200">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Silakan scroll ke bagian bawah dokumen untuk menyelesaikan bacaan.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Syarat membaca terpenuhi! Silakan klik tombol untuk membuka tahap selanjutnya.</span>
            </div>
          )}
        </div>

        {/* Action Button: Finish or Go to Next Item */}
        {!isAlreadyCompleted ? (
          <button
            onClick={onCompleted}
            disabled={!canMarkAsFinished}
            className={`px-6 py-3 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-md ${
              canMarkAsFinished
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 animate-bounce'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {canMarkAsFinished ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>Tandai Selesai & Buka Tahap Selanjutnya</span>
          </button>
        ) : (
          nextItem && onNavigateNext && (
            <button
              onClick={() => onNavigateNext(nextItem.id)}
              className="px-6 py-3 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all"
            >
              <span>
                {nextItem.type === 'reading'
                  ? 'Lanjut ke Modul Selanjutnya'
                  : nextItem.type === 'video'
                  ? 'Lanjut ke Video Pembelajaran'
                  : 'Lanjut ke Penugasan / Kuis'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
};
