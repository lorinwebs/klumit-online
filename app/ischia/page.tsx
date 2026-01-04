'use client';

import { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2026-07-08T14:55:00');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const difference = TARGET_DATE.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] border border-white/20 shadow-2xl">
          <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tabular-nums block text-center">
            {String(value).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="text-white/80 text-xs sm:text-sm mt-1 sm:mt-2 font-medium tracking-wider uppercase">
        {label}
      </span>
    </div>
  );
}

export default function IschiaCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-600 flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-cyan-700 to-teal-500 animate-gradient" />
      
      {/* Animated waves */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg className="absolute bottom-0 w-[200%] animate-wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(255,255,255,0.1)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        <svg className="absolute bottom-0 w-[200%] animate-wave-slow" style={{ animationDelay: '-2s' }} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(255,255,255,0.05)" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,144C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 left-6 text-3xl sm:text-5xl animate-float opacity-20">🏝️</div>
      <div className="absolute top-16 right-10 text-2xl sm:text-4xl animate-float-delayed opacity-20">✈️</div>
      <div className="absolute bottom-24 left-10 text-2xl sm:text-4xl animate-float opacity-15">🌊</div>
      <div className="absolute top-1/4 right-6 text-2xl sm:text-4xl animate-float-slow opacity-20">☀️</div>

      {/* Content */}
      <div className="relative z-10 h-screen flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">
            משפחת חייט
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/90">
            <span className="text-2xl sm:text-4xl">🇮🇹</span>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold">
              טסים לאיסקיה!
            </h2>
            <span className="text-2xl sm:text-4xl">🌋</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex flex-row-reverse flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <CountdownUnit value={timeLeft.days} label="ימים" />
          <CountdownUnit value={timeLeft.hours} label="שעות" />
          <CountdownUnit value={timeLeft.minutes} label="דקות" />
          <CountdownUnit value={timeLeft.seconds} label="שניות" />
        </div>

        {/* Flight info card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-4 md:p-5 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-right">
              <p className="text-white/60 text-[10px] sm:text-xs">יציאה</p>
              <p className="text-white text-base sm:text-lg font-bold">תל אביב</p>
              <p className="text-white/80 text-xs sm:text-sm">TLV</p>
            </div>
            <div className="flex-1 flex items-center justify-center px-2">
              <div className="h-[2px] flex-1 bg-white/30" />
              <span className="text-xl sm:text-2xl mx-2">✈️</span>
              <div className="h-[2px] flex-1 bg-white/30" />
            </div>
            <div className="text-left">
              <p className="text-white/60 text-[10px] sm:text-xs">נחיתה</p>
              <p className="text-white text-base sm:text-lg font-bold">נאפולי</p>
              <p className="text-white/80 text-xs sm:text-sm">NAP</p>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-3 grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-white/60 text-[10px] sm:text-xs">טיסה</p>
              <p className="text-white font-semibold text-xs sm:text-sm">LY5111</p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] sm:text-xs">תאריך</p>
              <p className="text-white font-semibold text-xs sm:text-sm">08.07.26</p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] sm:text-xs">המראה</p>
              <p className="text-white font-semibold text-xs sm:text-sm">14:55</p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] sm:text-xs">נחיתה</p>
              <p className="text-white font-semibold text-xs sm:text-sm">17:10</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 text-center">
            <p className="text-white/80 text-xs sm:text-sm">
              🌴 שבוע של שמש, ים ואיטליה 🍝
            </p>
            <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">
              08.07 - 15.07.2026
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave 20s linear infinite;
        }
        .animate-wave-slow {
          animation: wave 30s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: -2s;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

