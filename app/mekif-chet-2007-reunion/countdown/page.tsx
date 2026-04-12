'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sparkles } from 'lucide-react';

const EVENT_DATE = new Date('2026-06-11T20:00:00+03:00');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface GalleryUpload {
  url: string;
  file_type: string;
  uploader_name: string;
}

function calcTimeLeft(): TimeLeft {
  const diff = EVENT_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// Seeded random for stable SSR/hydration
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const PHOTO_POSITIONS = Array.from({ length: 14 }, (_, i) => ({
  left: `${5 + seededRandom(i * 7 + 1) * 85}%`,
  top: `${5 + seededRandom(i * 7 + 2) * 85}%`,
  rotation: seededRandom(i * 7 + 3) * 24 - 12,
  scale: 0.7 + seededRandom(i * 7 + 4) * 0.5,
  delay: seededRandom(i * 7 + 5) * 8,
  duration: 8 + seededRandom(i * 7 + 6) * 6,
  driftX: seededRandom(i * 7 + 7) * 40 - 20,
}));

function FloatingPhotos({ images }: { images: GalleryUpload[] }) {
  if (images.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PHOTO_POSITIONS.map((pos, i) => {
        const img = images[i % images.length];
        return (
          <div
            key={i}
            className="floating-photo absolute"
            style={{
              left: pos.left,
              top: pos.top,
              animationDelay: `${pos.delay}s`,
              animationDuration: `${pos.duration}s`,
              '--drift-x': `${pos.driftX}px`,
            } as React.CSSProperties}
          >
            <div
              className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-xl overflow-hidden shadow-2xl"
              style={{ transform: `rotate(${pos.rotation}deg) scale(${pos.scale})` }}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/30" />
              <div className="absolute inset-0 rounded-xl border border-white/[0.08] shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="particle absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 6 + 6}s`,
          }}
        />
      ))}
    </div>
  );
}

function CountdownUnit({ value, label, index }: { value: number; label: string; index: number }) {
  const prevValue = useRef(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 500);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className="flex flex-col items-center countdown-unit"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative group">
        {/* Outer glow ring */}
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-amber-600/30 blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-600/40 blur-md" />

        {/* Card */}
        <div className={`relative overflow-hidden rounded-2xl min-w-[80px] sm:min-w-[110px] md:min-w-[130px] ${flipping ? 'animate-flip-tick' : ''}`}>
          <div className="bg-gradient-to-b from-white/[0.12] to-white/[0.06] backdrop-blur-xl px-5 py-4 sm:px-7 sm:py-5 md:px-8 md:py-6 border border-white/[0.15] rounded-2xl relative">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl" />
            {/* Center divider line */}
            <div className="absolute left-2 right-2 top-1/2 h-px bg-white/[0.07]" />
            {/* Side notches */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-black/60 rounded-r-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-black/60 rounded-l-full" />

            <span className="text-5xl sm:text-6xl md:text-8xl font-black text-white tabular-nums block text-center relative z-10 drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
              {String(value).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <span className="text-amber-400/90 text-xs sm:text-sm md:text-base mt-3 font-semibold tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pt-2 self-start mt-4 sm:mt-5 md:mt-6">
      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]" style={{ animationDelay: '0.5s' }} />
    </div>
  );
}

export default function CountdownPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft);
  const [images, setImages] = useState<GalleryUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch('/api/reunion-gallery');
      if (!res.ok) return;
      const data = await res.json();
      const imgs = (data.recentUploads || []).filter((u: GalleryUpload) => u.file_type === 'image');
      setImages(imgs);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'COUNTDOWN - מקיף ח\' 2007';
    fetchGallery();
    setTimeout(() => setMounted(true), 100);
  }, [fetchGallery]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isOver = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0a1e, #1a0e2e, #0d0815)' }}>
        <div className="relative">
          <div className="absolute inset-0 animate-spin-slow">
            <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-amber-400 border-r-amber-400/50" />
          </div>
          <Sparkles className="text-amber-400 animate-pulse" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" dir="rtl" style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0e2e 25%, #1e1233 40%, #1a1028 60%, #150d1f 80%, #0d0815 100%)' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap');

        @keyframes floating-photo {
          0% { opacity: 0; transform: translateY(10px) translateX(0); }
          15% { opacity: 0.5; }
          50% { opacity: 0.35; transform: translateY(-10px) translateX(var(--drift-x, 0px)); }
          85% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(10px) translateX(0); }
        }
        .floating-photo {
          animation: floating-photo ease-in-out infinite;
          opacity: 0;
        }

        @keyframes float-up {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-20vh) scale(1); opacity: 0; }
        }
        .particle {
          background: radial-gradient(circle, rgba(251,191,36,0.8), rgba(251,191,36,0));
          animation: float-up linear infinite;
        }

        @keyframes glow-pulse {
          0%, 100% {
            text-shadow:
              0 0 30px rgba(251,191,36,0.5),
              0 0 80px rgba(251,191,36,0.2),
              0 0 120px rgba(251,191,36,0.1);
          }
          50% {
            text-shadow:
              0 0 50px rgba(251,191,36,0.7),
              0 0 120px rgba(251,191,36,0.35),
              0 0 200px rgba(251,191,36,0.15);
          }
        }
        .glow-text {
          animation: glow-pulse 3s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }

        @keyframes flip-tick {
          0% { transform: scaleY(1); }
          50% { transform: scaleY(0.85); }
          100% { transform: scaleY(1); }
        }
        .animate-flip-tick {
          animation: flip-tick 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }

        .countdown-unit {
          animation: fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(251,191,36,0.8) 0%,
            rgba(255,255,255,1) 25%,
            rgba(251,191,36,0.8) 50%,
            rgba(255,255,255,1) 75%,
            rgba(251,191,36,0.8) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        @keyframes border-glow {
          0%, 100% { border-color: rgba(251,191,36,0.3); box-shadow: 0 0 20px rgba(251,191,36,0.1); }
          50% { border-color: rgba(251,191,36,0.6); box-shadow: 0 0 40px rgba(251,191,36,0.2); }
        }
        .animate-border-glow {
          animation: border-glow 3s ease-in-out infinite;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-600/[0.12] rounded-full blur-[120px]" style={{ animation: 'gradient-shift 8s ease-in-out infinite' }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-amber-500/[0.08] rounded-full blur-[100px]" style={{ animation: 'gradient-shift 10s ease-in-out infinite reverse' }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-fuchsia-700/[0.06] rounded-full blur-[130px]" style={{ animation: 'gradient-shift 12s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-400/[0.04] rounded-full blur-[150px]" />
      </div>

      {/* Floating particles */}
      <FloatingParticles />

      {/* Floating photos background */}
      <FloatingPhotos images={images} />

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at center, rgba(15,10,30,0.85) 0%, rgba(15,10,30,0.4) 50%, transparent 100%),
          linear-gradient(to bottom, rgba(15,10,30,0.7) 0%, transparent 20%, transparent 80%, rgba(13,8,21,0.8) 100%)
        `
      }} />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(251,191,36,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(251,191,36,0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      {/* Content */}
      <div className={`relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* Logo */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-26 h-26 sm:w-30 sm:h-30 rounded-full bg-white p-1 shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-border-glow" style={{ borderWidth: '2px', borderColor: 'rgba(251,191,36,0.5)', borderStyle: 'solid' }}>
              <img
                src="https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png"
                alt="מקיף ח'"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Decorative line */}
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }} />

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tight text-center mb-2 glow-text animate-fade-in-up" style={{ animationDelay: '0.3s', fontFamily: 'Heebo, sans-serif' }}>
          מפגש מחזור - מקיף ח&#x27;
        </h1>

        <p className="shimmer-text text-3xl sm:text-4xl md:text-6xl font-black mb-2 animate-fade-in-up" style={{ animationDelay: '0.4s', fontFamily: 'Heebo, sans-serif' }}>
          20 שנה!!!
        </p>

        <div className="flex items-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-white/30" />
          <p className="text-white/40 text-sm sm:text-base tracking-[0.2em] uppercase font-medium">
            11.06.2026 &bull; 20:00
          </p>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-white/30" />
        </div>

        {/* Countdown */}
        {isOver ? (
          <div className="text-center animate-fade-in-up">
            <div className="text-7xl sm:text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-4xl sm:text-5xl font-black shimmer-text" style={{ fontFamily: 'Heebo, sans-serif' }}>!הגיע הזמן</h2>
          </div>
        ) : (
          <div className="flex flex-row-reverse flex-wrap justify-center items-start gap-3 sm:gap-4 md:gap-5">
            <CountdownUnit value={timeLeft.days} label="ימים" index={0} />
            <Separator />
            <CountdownUnit value={timeLeft.hours} label="שעות" index={1} />
            <Separator />
            <CountdownUnit value={timeLeft.minutes} label="דקות" index={2} />
            <Separator />
            <CountdownUnit value={timeLeft.seconds} label="שניות" index={3} />
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-14 flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <a
            href="https://forms.monday.com/forms/f2abc9fccb939b062aeb659cc4454b24?r=euc1"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.3)]"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" style={{ backgroundSize: '200% auto', animation: 'gradient-shift 3s linear infinite' }} />
            <span className="relative text-black">הרשמה למפגש</span>
          </a>

          <a
            href="/mekif-chet-2007-reunion/gallery"
            className="px-8 py-3.5 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold rounded-full text-sm border border-white/[0.15] hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            גלריה
          </a>

          <a
            href="https://links.payboxapp.com/ROF2GSCOP0b"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" style={{ backgroundSize: '200% auto', animation: 'gradient-shift 3s linear infinite' }} />
            <span className="relative text-white">תשלום &#x20AA;400</span>
          </a>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="relative z-10 flex justify-center pb-6">
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
      </div>
    </div>
  );
}
