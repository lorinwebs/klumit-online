'use client';

import { useRef, useState, useEffect } from 'react';
import { Badge, BadgeData } from './Badge';

interface BadgePreviewProps {
  data: Partial<BadgeData>;
  className?: string;
  templateSrc?: string;
  nameTop?: number;
  detailPositions?: { top: number; valueRight: number }[];
  detailFontSize?: number;
  nameScale?: number;
}

const BADGE_W = 1122;
const BADGE_H = 1402;

export function BadgePreview({ data, className = '', templateSrc = '/badge-template.png', nameTop, detailPositions, detailFontSize, nameScale }: BadgePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / BADGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: Math.round(scale * BADGE_H), position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: BADGE_W, height: BADGE_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        <Badge data={data} templateSrc={templateSrc} nameTopOverride={nameTop} detailPositionsOverride={detailPositions} detailFontSize={detailFontSize} nameScale={nameScale} />
      </div>
    </div>
  );
}
