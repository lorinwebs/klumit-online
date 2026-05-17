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

// Strip emoji code points + variation selectors + ZWJs. Satori uses regular
// text fonts (Heebo/FrankRuhlLibre) that don't include color emoji glyphs, so
// any emoji renders as a tofu (□). Easier to remove them than to wire up an
// emoji font, given that print badges shouldn't contain emojis anyway.
function stripEmojis(s: string): string {
  if (!s) return s;
  return s
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Approximate width-fit. The detail labels (כיתה:, עיר:, …) are baked into
// the template on the right; values render to their left. If the value at the
// base font size would overflow the available width, shrink so it still fits.
function fitDetailFontSize(text: string, base: number, maxWidth = 470): number {
  if (!text) return base;
  const CHAR_W = 0.55; // rough Heebo per-char width factor
  const estimated = text.length * base * CHAR_W;
  if (estimated <= maxWidth) return base;
  return Math.max(36, Math.floor(maxWidth / (text.length * CHAR_W)));
}

function rev(s: string): string {
  if (!s) return s;
  // Split into digit runs, Hebrew runs, Latin runs, and individual other
  // chars (spaces, parens, punctuation). Keeping spaces/parens as singletons
  // ensures they reposition correctly when we reverse the parts order \u2014 if
  // a space stays glued to a paren it ends up on the wrong side of the word.
  const parts = s.match(/\d+|[\u0590-\u05FF\u0600-\u06FF\uFB1D-\uFDFF\uFE70-\uFEFF]+|[A-Za-z]+|./gs) || [];
  // Swap ( \u2194 ) at the end: satori has no bidi paren mirroring, so without
  // this swap parens appear to open outward (away from the parenthesized
  // word) in the RTL render.
  return parts.reverse().map(p => {
    if (/^\d+$/.test(p)) return p; // digits: keep order
    if (/[\u0590-\u05FF\u0600-\u06FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(p)) return [...p].reverse().join(''); // Hebrew: reverse
    return p; // Latin words / single spaces / parens: keep order
  }).join('')
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
  // Strip emojis first (occupation often contains them), then RTL-fix.
  const detailRawValues = [
    grade ? formatGrade(grade) : '',
    stripEmojis(city),
    stripEmojis(occupation),
    stripEmojis(statusLabel),
  ];
  const detailValues = detailRawValues.map(r);

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

      {/* Detail values - right-anchored to the left of each baked-in label.
          When fitDetailFontSize shrinks the font (long occupation), shift
          `top` down by half the size delta so the shrunk text stays
          vertically centered with the row's label instead of clinging to
          the top of the row. */}
      {detailPositions.map((pos, i) => {
        const value = detailValues[i];
        if (!value) return null;
        const fz = fitDetailFontSize(detailRawValues[i], detailFontSize);
        const verticalCenterOffset = Math.round((detailFontSize - fz) * 0.6);
        return (
          <div key={i} style={{
            position: 'absolute',
            top: pos.top + verticalCenterOffset,
            right: pos.valueRight,
            display: 'flex',
          }}>
            <div style={{
              fontSize: fz,
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
