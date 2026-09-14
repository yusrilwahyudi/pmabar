import { useState, useEffect, useCallback } from 'react';
import { CheatLog } from '../types/lms';

interface UseExamProctorProps {
  enabled: boolean;
  studentName: string;
  onMaxStrikesReached?: () => void;
  maxAllowedStrikes?: number;
}

export const useExamProctor = ({
  enabled = true,
  studentName,
  onMaxStrikesReached,
  maxAllowedStrikes = 3
}: UseExamProctorProps) => {
  const [cheatStrikes, setCheatStrikes] = useState<number>(0);
  const [cheatLogs, setCheatLogs] = useState<CheatLog[]>([]);
  const [currentViolation, setCurrentViolation] = useState<{
    reason: string;
    description: string;
  } | null>(null);

  const recordViolation = useCallback(
    (reason: CheatLog['reason'], description: string) => {
      if (!enabled) return;

      const newLog: CheatLog = {
        timestamp: new Date().toISOString(),
        reason,
        description
      };

      setCheatLogs(prev => [...prev, newLog]);
      setCheatStrikes(prev => {
        const nextStrikes = prev + 1;
        setCurrentViolation({ reason, description });

        if (nextStrikes >= maxAllowedStrikes && onMaxStrikesReached) {
          onMaxStrikesReached();
        }
        return nextStrikes;
      });
    },
    [enabled, maxAllowedStrikes, onMaxStrikesReached]
  );

  const clearCurrentViolation = () => {
    setCurrentViolation(null);
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Prevent Copy, Cut, Paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('COPY_PASTE_ATTEMPT', 'Mencoba menyalin (copy) teks dari lembar ujian.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('COPY_PASTE_ATTEMPT', 'Mencoba menempelkan (paste) teks ke lembar ujian.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('COPY_PASTE_ATTEMPT', 'Mencoba memotong (cut) teks.');
    };

    // 2. Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('CONTEXT_MENU', 'Mencoba klik kanan pada lembar ujian.');
    };

    // 3. Detect Keyboard Shortcuts (Ctrl+C, Ctrl+V, PrintScreen, Ctrl+P, F12, Ctrl+Shift+I)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen Key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        recordViolation('PRINT_SCREEN_ATTEMPT', 'Mencoba mengambil tangkapan layar (PrintScreen).');
        return;
      }

      // Ctrl or Meta (Command on Mac)
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c' || key === 'v' || key === 'x' || key === 'a' || key === 'p' || key === 'u' || key === 's') {
          e.preventDefault();
          recordViolation('COPY_PASTE_ATTEMPT', `Mencoba shortcut terlarang: Ctrl+${key.toUpperCase()}`);
        }
        if (e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
          e.preventDefault();
          recordViolation('DEVTOOLS_ATTEMPT', 'Mencoba membuka Developer Tools browser.');
        }
      }

      // F12 key
      if (e.key === 'F12') {
        e.preventDefault();
        recordViolation('DEVTOOLS_ATTEMPT', 'Mencoba membuka Inspect Element (F12).');
      }
    };

    // 4. Detect Tab Switching / Window Blur
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('TAB_SWITCH', 'Meninggalkan tab ujian / beralih ke tab browser lain.');
      }
    };

    const handleWindowBlur = () => {
      recordViolation('TAB_SWITCH', 'Fokus layar ujian hilang (membuka aplikasi lain di luar browser).');
    };

    // Register all event listeners
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, recordViolation]);

  return {
    cheatStrikes,
    cheatLogs,
    currentViolation,
    clearCurrentViolation,
    isFlagged: cheatStrikes >= maxAllowedStrikes
  };
};
