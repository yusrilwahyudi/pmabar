import React, { useState, useEffect } from 'react';

interface ExamWatermarkProps {
  studentName: string;
  studentIdNumber?: string;
}

export const ExamWatermark: React.FC<ExamWatermarkProps> = ({
  studentName,
  studentIdNumber = '0078129033'
}) => {
  const [timeStr, setTimeStr] = useState<string>(new Date().toLocaleTimeString('id-ID'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const watermarkText = `${studentName} • ${studentIdNumber} • ${timeStr} • UJIAN RESMI`;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none opacity-[0.06] flex flex-wrap content-around justify-around p-8">
      {Array.from({ length: 16 }).map((_, idx) => (
        <div
          key={idx}
          className="text-slate-900 font-extrabold text-sm md:text-base tracking-widest transform -rotate-12 m-8 whitespace-nowrap"
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
};
