'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const TARGET_DATE = new Date('2026-08-08T18:40:00');

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
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 min-w-[65px] sm:min-w-[90px] md:min-w-[110px] border border-white/20">
        <span className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tabular-nums block text-center drop-shadow-lg">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-white text-sm sm:text-base mt-2 font-medium drop-shadow-lg">
        {label}
      </span>
    </div>
  );
}

export default function AustriaCountdown() {
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
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden" dir="rtl">
      {/* Background Image */}
      <Image
        src="/austria.jpeg"
        alt="Austria"
        fill
        className="object-cover"
        priority
        quality={90}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">
            משפחת חייט ווינברג
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-white bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full inline-block">
            🇦🇹 טסים לאוסטריה! 🏔️
          </h2>
        </div>

        {/* Countdown */}
        <div className="flex flex-row-reverse flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-10">
          <CountdownUnit value={timeLeft.days} label="ימים" />
          <CountdownUnit value={timeLeft.hours} label="שעות" />
          <CountdownUnit value={timeLeft.minutes} label="דקות" />
          <CountdownUnit value={timeLeft.seconds} label="שניות" />
        </div>

        {/* Flight info */}
        <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 max-w-md w-full border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-right">
              <p className="text-white/70 text-xs sm:text-sm">יציאה</p>
              <p className="text-white text-lg sm:text-xl font-semibold">תל אביב</p>
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="h-px flex-1 bg-white/30" />
              <span className="text-2xl mx-3">✈️</span>
              <div className="h-px flex-1 bg-white/30" />
            </div>
            <div className="text-left">
              <p className="text-white/70 text-xs sm:text-sm">נחיתה</p>
              <p className="text-white text-lg sm:text-xl font-semibold">וינה</p>
            </div>
          </div>
          
          <div className="flex justify-between text-center border-t border-white/20 pt-4">
            <div>
              <p className="text-white/70 text-xs">חברה</p>
              <p className="text-white font-medium text-sm">Austrian</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">תאריך</p>
              <p className="text-white font-medium">08.08.2026</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">המראה</p>
              <p className="text-white font-medium">18:40</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">נחיתה</p>
              <p className="text-white font-medium">21:25</p>
            </div>
          </div>

          <div className="text-center mt-4 pt-4 border-t border-white/20">
            <p className="text-white/90 text-sm sm:text-base">
              🏔️ הרים, טבע ואוסטריה 🎿
            </p>
            <p className="text-white/60 text-xs mt-1">08.08 - 15.08.2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
