'use client';

import { useEffect, useRef, useState } from 'react';

type AmbientLoopProps = {
  /** Silent looping clip that starts on the same frame as the still underneath it */
  src: string;
  /** Different crop for screens from 768px up (optional) */
  desktopSrc?: string;
  /** Same fit classes as the still, so the two sit exactly on top of each other */
  className: string;
};

const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Brings a still photo to life: place it inside a `relative` frame, right after the still.
 *
 * The still is what loads first and what counts for page speed. The clip is fetched only
 * after the page has finished loading and the frame is close to the screen, then fades in.
 * It is skipped for visitors who asked for reduced motion or data saving, and pauses while
 * the frame is off screen.
 */
export default function AmbientLoop({ src, desktopSrc, className }: AmbientLoopProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [wasNear, setWasNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);

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
    if (!inView) {
      video.pause();
      return;
    }
    video.muted = true; // browsers only autoplay muted video
    video.play().catch(() => {
      // Autoplay refused (e.g. low power mode): the still stays, which is fine
    });
  }, [videoSrc, inView]);

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
    </>
  );
}
