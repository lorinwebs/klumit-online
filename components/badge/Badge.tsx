 import React from 'react';
import { formatGrade, buildDisplayName, getMaritalLabel, type Gender, type MaritalStatus } from '../../lib/badge/schema';

export interface BadgeData {
  first_name:     string;
  last_name:      string;
  gender:         string;
  marital_status: string;
  other_status?:  string;
  married_name?:  string;
  grade:          string;
  city:           string;
  occupation:     string;
  num_children?:  number;
}

interface DetailPosition { top: number; valueRight: number; }

interface BadgeProps {
  data:    Partial<BadgeData>;
  logoSrc?: string;
  templateSrc: string;
  nameTopOverride?: number;
  detailPositionsOverride?: DetailPosition[];
  detailFontSize?: number;
  nameScale?: number;
  satoriRtlFix?: boolean;
}

const PURPLE = '#2D1B69';
const W = 1122;
const H = 1402;

function nameFontSize(name: string): number {
  const len = name.length;
  const maxWidth = 700;
  const calculated = Math.floor(maxWidth / (len * 0.42));
  return Math.max(44, Math.min(110, calculated));
}

function rev(s: string): string {
  if (!s) return s;
  // Split into runs of digits and non-digits, reverse non-digit runs, keep digit order
  const parts = s.match(/\d+|[^\d]+/g) || [];
  return parts.reverse().map(p => /^\d+$/.test(p) ? p : [...p].reverse().join('')).join('')
    .replace(/\)/g, '\u27E8').replace(/\(/g, ')').replace(/\u27E8/g, '(');
}

export function Badge({ data, templateSrc, nameTopOverride, detailPositionsOverride, detailFontSize = 52, nameScale = 1, satoriRtlFix }: BadgeProps) {
  const {
    first_name     = '',
    last_name      = '',
    gender         = '',
    marital_status = '',
    other_status   = '',
    married_name   = '',
    grade          = '',
    city           = '',
    occupation     = '',
    num_children   = 0,
  } = data;

  const rawName = (first_name || last_name)
    ? buildDisplayName({ first_name, last_name, marital_status, married_name })
    : '';
  const displayName = satoriRtlFix ? rev(rawName) : rawName;

  const fontSize = Math.round(nameFontSize(displayName) * nameScale);

  // Default gender to male for label display if not yet selected
  const genderForLabel = (gender || 'male') as Gender;
  const statusLabel = marital_status
    ? getMaritalLabel(marital_status as MaritalStatus, genderForLabel, other_status, num_children)
    : '';

  // Positions calibrated to 1122x1402 template
  const nameTop = nameTopOverride ?? 730;

  const detailPositions = detailPositionsOverride ?? [
    { top: 900,  valueRight: 490 },  // כיתה:
    { top: 985, valueRight: 490 },  // עיר:
    { top: 1075, valueRight: 490 },  // עיסוק:
    { top: 1160, valueRight: 490 },  // סטטוס:
  ];

  const r = satoriRtlFix ? rev : (s: string) => s;
  const detailValues = [
    grade ? r(formatGrade(grade)) : '',
    r(city),
    r(occupation),
    r(statusLabel),
  ];

  return (
    <div style={{
      width: W,
      height: H,
      position: 'relative',
      display: 'flex',
      fontFamily: 'Heebo, sans-serif',
    }}>
      {/* Template background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={templateSrc}
        alt="תבנית תג"
        style={{ width: W, height: H, position: 'absolute', top: 0, left: 0 }}
      />

      {/* Name overlay - centered */}
      {displayName && (
        <div style={{
          position: 'absolute',
          top: nameTop,
          left: 170,
          right: 170,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize,
            fontWeight: 700,
            color: PURPLE,
            fontFamily: '"Frank Ruhl Libre", Heebo, serif',
            textAlign: 'center',
            lineHeight: 1.3,
          }}>
            {displayName}
          </div>
        </div>
      )}

      {/* Detail values - positioned to the left of each baked-in label */}
      {detailPositions.map((pos, i) => {
        const value = detailValues[i];
        if (!value) return null;
        return (
          <div key={i} style={{
            position: 'absolute',
            top: pos.top,
            right: pos.valueRight,
            display: 'flex',
          }}>
            <div style={{
              fontSize: detailFontSize,
              fontWeight:2500,
              color: PURPLE,
              fontFamily: 'Heebo, sans-serif',
            }}>
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const BadgeCard = Badge;
