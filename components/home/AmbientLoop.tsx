'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

type AmbientLoopProps = {
  /** Silent looping clip that starts on the same frame as the still underneath it */
  src: string;
  /** Different crop for screens from 768px up (optional) */
  desktopSrc?: string;
  /** Same fit classes as the still, so the two sit exactly on top of each other */
  className: string;
  /** Where the pause button sits inside the frame */
  buttonClassName?: string;
};

const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Brings a still photo to life: place it inside a `relative` frame, right after the still.
 *
 * The still is what loads first and what counts for page speed. The clip is fetched only
 * after the page has finished loading and the frame is close to the screen, then fades in.
 * It is skipped for visitors who asked for reduced motion or data saving, pauses while the
 * frame is off screen, and has a pause button.
 */
export default function AmbientLoop({
  src,
  desktopSrc,
  className,
  buttonClassName = 'end-1.5 top-1.5',
}: AmbientLoopProps) {
  const { t } = useLanguage();
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [wasNear, setWasNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);
  const [pausedByUser, setPausedByUser] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || connection?.saveData) return;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onBreakpoint = () => setIsDesktop(desktop.matches);
    const allow = () => setAllowed(true);
    onBreakpoint();
    if (document.readyState === 'complete') allow();
    else window.addEventListener('load', allow, { once: true });
    desktop.addEventListener('change', onBreakpoint);
    return () => {
      window.removeEventListener('load', allow);
      desktop.removeEventListener('change', onBreakpoint);
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setWasNear(true);
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const videoSrc = allowed && wasNear ? (isDesktop && desktopSrc ? desktopSrc : src) : null;
  // A clip for the other breakpoint starts hidden again and fades in once it plays
  const playing = videoSrc !== null && playingSrc === videoSrc;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    if (pausedByUser || !inView) {
      video.pause();
      return;
    }
    video.muted = true; // browsers only autoplay muted video
    video.play().catch(() => {
      // Autoplay refused (e.g. low power mode): the still stays, which is fine
    });
  }, [videoSrc, pausedByUser, inView]);

  return (
    <>
      <span ref={sentinelRef} className="pointer-events-none absolute inset-0" aria-hidden />
      {videoSrc && (
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          disablePictureInPicture
          onPlaying={() => setPlayingSrc(videoSrc)}
          className={`${className} transition-opacity duration-1000 ${playing ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {playing && (
        <button
          type="button"
          onClick={() => setPausedByUser((paused) => !paused)}
          aria-label={t(pausedByUser ? 'home.heroPlayMotion' : 'home.heroPauseMotion')}
          // The button is a full-size tap target; only the small ring inside it is drawn
          className={`group focus-light absolute z-10 flex h-11 w-11 items-center justify-center ${buttonClassName}`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-black/25 text-white transition-colors duration-300 group-hover:border-white group-hover:bg-black/45 group-hover:text-white">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              {pausedByUser ? <path d="M2.5 1v10l8-5z" /> : <path d="M2 1h3v10H2zM7 1h3v10H7z" />}
            </svg>
          </span>
        </button>
      )}
    </>
  );
}
