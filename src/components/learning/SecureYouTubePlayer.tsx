import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Lock, Play, ShieldAlert, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';

interface SecureYouTubePlayerProps {
  videoId: string;
  title: string;
  onCompleted: () => void;
  isAlreadyCompleted?: boolean;
  nextItem?: { id: string; title: string; type: string } | null;
  onNavigateNext?: (nextItemId: string) => void;
  isLastItem?: boolean;
}

// Deklarasi Global YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const SecureYouTubePlayer: React.FC<SecureYouTubePlayerProps> = ({
  videoId,
  title,
  onCompleted,
  isAlreadyCompleted = false,
  nextItem,
  onNavigateNext,
  isLastItem = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Load YouTube Iframe API Script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiLoaded(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiLoaded(true);
    };
  }, []);

  // Initialize Player once API is ready
  useEffect(() => {
    if (!isApiLoaded || !containerRef.current) return;

    // Unique player container id
    const playerId = `yt-player-${videoId}`;
    const targetElement = document.getElementById(playerId);
    if (!targetElement) return;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // ignore
      }
    }

    playerRef.current = new window.YT.Player(playerId, {
      videoId: videoId,
      playerVars: {
        controls: 1, // User can pause/play, but we guard seek events
        disablekb: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        fs: 1
      },
      events: {
        onReady: (event: any) => {
          setDuration(event.target.getDuration() || 0);
          event.target.setPlaybackRate(1.0);
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.PLAYING = 1, ENDED = 0
          if (event.data === 1) {
            setIsPlaying(true);
            event.target.setPlaybackRate(1.0);
          } else {
            setIsPlaying(false);
          }

          if (event.data === 0) {
            // Video selesai ditonton
            handleFinished();
          }
        },
        onPlaybackRateChange: (event: any) => {
          // Kunci playback rate ke 1x
          if (event.data !== 1.0 && !isCompleted) {
            event.target.setPlaybackRate(1.0);
            showWarning('Kecepatan pemutaran dikunci pada 1.0x untuk materi pembelajaran wajib.');
          }
        }
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [isApiLoaded, videoId]);

  // Anti-skip time watcher loop
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const curr = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || duration;
        setCurrentTime(curr);
        if (dur > 0 && duration === 0) setDuration(dur);

        // Jika video belum tuntas, cegah melompat ke depan
        if (!isCompleted) {
          // Jika siswa melompat lebih dari 2.5 detik dari batas maksimal yang sudah ditonton
          if (curr > maxWatchedTime + 2.5) {
            playerRef.current.seekTo(maxWatchedTime, true);
            showWarning('⚠️ Fitur lewati (skip) dinonaktifkan. Silakan tonton video ajar secara berurutan.');
          } else if (curr > maxWatchedTime) {
            setMaxWatchedTime(curr);
          }

          // Jika sudah menonton 95% durasi
          if (dur > 0 && curr / dur >= 0.95) {
            handleFinished();
          }
        }
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxWatchedTime, isCompleted, duration]);

  const handleFinished = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      onCompleted();
    }
  };

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => {
      setWarningMessage(null);
    }, 4000);
  };

  const watchPercentage = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
  const maxPercentage = duration > 0 ? Math.min(100, Math.round((maxWatchedTime / duration) * 100)) : 0;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base line-clamp-1">{title}</h3>
            <span className="text-xs text-slate-500">Video Pembelajaran Interaktif (Anti-Skip Mode)</span>
          </div>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tuntas Ditonton</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Wajib Ditonton Penuh</span>
          </div>
        )}
      </div>

      {/* Warning Toast */}
      {warningMessage && (
        <div className="mx-4 mt-4 p-3.5 bg-amber-500/10 border border-amber-400/40 text-amber-900 rounded-2xl text-xs flex items-center gap-2.5 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="font-medium">{warningMessage}</span>
        </div>
      )}

      {/* Video Container Aspect Ratio 16:9 */}
      <div className="p-4 md:p-6">
        <div className="relative w-full rounded-2xl overflow-hidden shadow-inner bg-slate-900 aspect-video">
          <div id={`yt-player-${videoId}`} className="w-full h-full" ref={containerRef} />
        </div>

        {/* Custom Progress & Control Bar */}
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto flex-1">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1.5">
              <span>Progres Ditonton: {formatTime(currentTime)} / {formatTime(duration)}</span>
              <span className="font-bold text-indigo-600">{watchPercentage}%</span>
            </div>

            {/* Visual Watch Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
              {/* Max allowed buffer reached */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-indigo-200 transition-all duration-300"
                style={{ width: `${maxPercentage}%` }}
              />
              {/* Current position */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-indigo-600 transition-all duration-200"
                style={{ width: `${watchPercentage}%` }}
              />
            </div>
          </div>

          {/* Status Message & Action Button */}
          <div className="w-full md:w-auto flex items-center justify-end gap-3">
            {isCompleted ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isLastItem
                      ? '🎉 Seluruh materi telah tuntas dipelajari.'
                      : 'Video selesai! Tahap berikutnya terbuka.'}
                  </span>
                </div>
                {nextItem && onNavigateNext && (
                  <button
                    onClick={() => onNavigateNext(nextItem.id)}
                    className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <span>
                      {nextItem.type === 'reading'
                        ? 'Lanjut ke Modul'
                        : nextItem.type === 'video'
                        ? 'Lanjut ke Video'
                        : 'Lanjut ke Penugasan / Kuis'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>Tonton hingga akhir untuk membuka materi selanjutnya</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
