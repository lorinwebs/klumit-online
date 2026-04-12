'use client';

import { useEffect, useState, useCallback } from 'react';
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

function MarqueeRow({ images, duration, reverse }: { images: GalleryUpload[]; duration: number; reverse?: boolean }) {
  const doubled = [...images, ...images];
  return (
    <div className="overflow-hidden whitespace-nowrap py-1.5">
      <div
        className={`inline-flex gap-3 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((img, i) => (
          <div
            key={i}
            className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-white/10"
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CountdownPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft);
  const [images, setImages] = useState<GalleryUpload[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [fetchGallery]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isOver = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  const row1 = images.slice(0, Math.ceil(images.length / 3));
  const row2 = images.slice(Math.ceil(images.length / 3), Math.ceil((images.length * 2) / 3));
  const row3 = images.slice(Math.ceil((images.length * 2) / 3));

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Sparkles className="text-amber-400 animate-pulse" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col" dir="rtl">
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse linear infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 20px rgba(251,191,36,0.4), 0 0 60px rgba(251,191,36,0.15); }
          50% { text-shadow: 0 0 40px rgba(251,191,36,0.6), 0 0 100px rgba(251,191,36,0.3); }
        }
        .glow-text {
          animation: glow-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Image marquee background */}
      {images.length > 0 && (
        <div className="absolute inset-0 flex flex-col justify-center gap-3 opacity-40">
          {row1.length > 0 && <MarqueeRow images={row1} duration={60} />}
          {row2.length > 0 && <MarqueeRow images={row2} duration={75} reverse />}
          {row3.length > 0 && <MarqueeRow images={row3} duration={55} />}
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png"
            alt="מקיף ח'"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-amber-400/50 shadow-2xl"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight text-center mb-1 glow-text">
          מפגש האיחוד
        </h1>
        <p className="text-amber-400 text-lg sm:text-xl md:text-2xl font-semibold mb-2">
          מקיף ח&#x27; &bull; מחזור 2007
        </p>
        <p className="text-white/50 text-sm sm:text-base mb-10">
          11.06.2026 &bull; 20:00
        </p>

        {/* Countdown */}
        {isOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-amber-400">!הגיע הזמן</h2>
          </div>
        ) : (
          <div className="flex flex-row-reverse flex-wrap justify-center gap-3 sm:gap-5 md:gap-6">
            {[
              { value: timeLeft.days, label: 'ימים' },
              { value: timeLeft.hours, label: 'שעות' },
              { value: timeLeft.minutes, label: 'דקות' },
              { value: timeLeft.seconds, label: 'שניות' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-1 bg-amber-400/20 rounded-2xl blur-lg" />
                  <div className="relative bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 px-5 py-4 sm:px-7 sm:py-5 md:px-8 md:py-6 min-w-[75px] sm:min-w-[100px] md:min-w-[120px]">
                    <span className="text-4xl sm:text-5xl md:text-7xl font-black text-white tabular-nums block text-center">
                      {String(value).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <span className="text-amber-400/80 text-xs sm:text-sm md:text-base mt-2 font-medium tracking-wide">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <a
            href="https://forms.monday.com/forms/f2abc9fccb939b062aeb659cc4454b24?r=euc1"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
          >
            הרשמה למפגש
          </a>
          <a
            href="/mekif-chet-2007-reunion/gallery"
            className="px-7 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-sm border border-white/20 backdrop-blur-sm transition-all hover:scale-105"
          >
            גלריה
          </a>
          <a
            href="https://links.payboxapp.com/ROF2GSCOP0b"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
          >
            תשלום &#x20AA;400
          </a>
        </div>
      </div>
    </div>
  );
}
