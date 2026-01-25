'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  disabled?: boolean;
}

export default function Tooltip({ 
  content, 
  children, 
  position = 'top',
  disabled = false 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !wrapperRef.current) return;

    const adjustPosition = () => {
      if (!tooltipRef.current || !wrapperRef.current) return;

      const tooltip = tooltipRef.current;
      const wrapper = wrapperRef.current;
      const rect = wrapper.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 16;

      // Calculate centered position
      const tooltipCenterX = rect.left + (rect.width / 2);
      let tooltipLeft = tooltipCenterX - (tooltipRect.width / 2);
      
      // Adjust if cut off on left (RTL - right side of screen)
      if (tooltipLeft < margin) {
        tooltipLeft = margin;
      }
      // Adjust if cut off on right (RTL - left side of screen)
      else if (tooltipLeft + tooltipRect.width > viewportWidth - margin) {
        tooltipLeft = viewportWidth - tooltipRect.width - margin;
      }

      // Calculate vertical position
      let tooltipTop: number;
      if (position === 'top') {
        tooltipTop = rect.top - tooltipRect.height - 8;
        // If not enough space above, show below
        if (tooltipTop < margin) {
          tooltipTop = rect.bottom + 8;
        }
      } else {
        tooltipTop = rect.bottom + 8;
        // If not enough space below, show above
        if (tooltipTop + tooltipRect.height > viewportHeight - margin) {
          tooltipTop = rect.top - tooltipRect.height - 8;
        }
      }

      setTooltipStyle({
        position: 'fixed',
        left: `${tooltipLeft}px`,
        top: `${tooltipTop}px`,
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: `${Math.min(viewportWidth - margin * 2, 250)}px`,
      });
    };

    // Adjust after render
    const timeoutId = setTimeout(adjustPosition, 10);
    
    // Adjust on scroll/resize
    window.addEventListener('scroll', adjustPosition, true);
    window.addEventListener('resize', adjustPosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', adjustPosition, true);
      window.removeEventListener('resize', adjustPosition);
    };
  }, [isVisible, position]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const arrowPosition = position === 'top' ? 'bottom' : 'top';
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1a1a1a] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1a1a1a] border-l-transparent border-r-transparent border-t-transparent',
  };

  const tooltipContent = (
    <div
      ref={tooltipRef}
      style={tooltipStyle}
      role="tooltip"
    >
      <div className="bg-[#1a1a1a] text-white text-xs font-light px-3 py-2 rounded-sm shadow-lg text-center whitespace-normal break-words relative">
        {content}
        <div
          className={`absolute w-0 h-0 border-4 ${arrowClasses[arrowPosition]}`}
          style={{
            [arrowPosition === 'top' ? 'top' : 'bottom']: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={wrapperRef}
        className="relative inline-block w-full"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(true)}
        onTouchEnd={() => setTimeout(() => setIsVisible(false), 2000)}
      >
        {children}
      </div>
      {isVisible && typeof window !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}
