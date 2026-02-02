'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface ImageZoomModalProps {
  images: Array<{
    url: string;
    altText: string | null;
  }>;
  initialIndex: number;
  onClose: () => void;
}

export default function ImageZoomModal({ images, initialIndex, onClose }: ImageZoomModalProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, time: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and position when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        handleNext();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        handlePrevious();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, scale, images.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      });
      
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Handle swipe for image navigation when not zoomed
    if (scale === 1 && images.length > 1 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = Math.abs(touch.clientY - touchStart.y);
      const deltaTime = Date.now() - touchStart.time;
      
      // Swipe threshold: 50px horizontal movement, less than 100px vertical, within 300ms
      const isSwipe = Math.abs(deltaX) > 50 && deltaY < 100 && deltaTime < 300;
      
      if (isSwipe) {
        if (deltaX > 0) {
          // Swipe right -> previous image (RTL)
          handlePrevious();
        } else {
          // Swipe left -> next image (RTL)
          handleNext();
        }
      }
    }
    
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            disabled={scale <= 1}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('products.zoomOut')}
          >
            <ZoomOut size={20} className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            disabled={scale >= 4}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('products.zoomIn')}
          >
            <ZoomIn size={20} className="text-white" />
          </button>
          <span className="text-white text-sm mr-2 min-w-[60px]" dir="ltr">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label={t('products.close')}
        >
          <X size={24} className="text-white" />
        </button>
      </div>

      {/* Image Container */}
      <div
        ref={imageContainerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
        >
          <div className="relative w-[90vw] h-[90vh]">
            <Image
              src={currentImage.url}
              alt={currentImage.altText || 'תמונת מוצר'}
              fill
              className="object-contain select-none pointer-events-none"
              draggable={false}
              priority
              sizes="90vw"
            />
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label={t('products.previousImage')}
          >
            <ChevronRight size={32} className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label={t('products.nextImage')}
          >
            <ChevronLeft size={32} className="text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm" dir="ltr">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}

      {/* Instructions */}
      {scale === 1 && (
        <div className="absolute bottom-4 right-4 text-white/70 text-xs space-y-1 text-right hidden md:block">
          <p>{t('products.zoomInstructions')}</p>
          <p>{t('products.wheelZoom')}</p>
          <p>{t('products.dragMove')}</p>
        </div>
      )}
    </div>
  );
}
