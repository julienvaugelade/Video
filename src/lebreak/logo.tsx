import React from 'react';
import {interpolate} from 'remotion';
import {BEAT, CLAMP, DISPLAY, P, pop, ramp, TEXTE} from './theme';

// ---------------------------------------------------------------------------
// La case (🛖 du nom du restaurant) : toit de paille conique et mur en terre.
// `f` : images écoulées depuis le début de l'apparition.
// ---------------------------------------------------------------------------

export const Case: React.FC<{f: number; size?: number}> = ({f, size = 240}) => {
  const toit = pop(f - 3, 11);
  const mur = pop(f, 14);
  const porte = ramp(f, 8, 16);
  const paille = ramp(f, 6, 18);
  const brins = [34, 58, 82, 106, 134, 158, 182, 206];

  return (
    <svg width={size} height={(size * 220) / 240} viewBox="0 0 240 220" style={{overflow: 'visible'}}>
      <rect x={18} y={196} width={204 * mur} height={7} rx={3.5} fill={P.safran} opacity={0.5} />
      <g transform={`translate(120 196) scale(1 ${mur}) translate(-120 -196)`}>
        <rect x={46} y={108} width={148} height={88} rx={6} fill={P.terre} />
        {[64, 96, 144, 176].map((x) => (
          <rect
            key={x}
            x={x - 6}
            y={136}
            width={12}
            height={12}
            fill={P.creme}
            opacity={0.55}
            transform={`rotate(45 ${x} 142)`}
          />
        ))}
        <path
          d="M98 196 V156 Q120 130 142 156 V196 Z"
          fill={P.nuit}
          transform={`translate(120 196) scale(${porte}) translate(-120 -196)`}
        />
      </g>
      <g
        transform={`translate(0 ${interpolate(toit, [0, 1], [-150, 0])})`}
        opacity={interpolate(toit, [0, 0.2], [0, 1], CLAMP)}
      >
        <rect x={115} y={0} width={10} height={22} rx={3} fill={P.brun} />
        <path
          d="M120 14 C150 52 188 90 228 116 Q120 136 12 116 C52 90 90 52 120 14 Z"
          fill={P.safran}
        />
        {brins.map((x, i) => (
          <line
            key={x}
            x1={120}
            y1={20}
            x2={120 + (x - 120) * paille}
            y2={20 + (112 - 20) * paille}
            stroke={P.terre}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.45 + (i % 2) * 0.2}
          />
        ))}
        <path
          d="M18 116 L34 130 L50 120 L66 132 L82 122 L98 134 L120 124 L142 134 L158 122 L174 132 L190 120 L206 130 L222 116"
          fill="none"
          stroke={P.or}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Logotype : case + « LE BREAK » + « AFRICAN FOOD ».
// Case à 0, titre à +1 temps, accroche à +2 temps.
// ---------------------------------------------------------------------------

const TITRE = 'LE BREAK';

export const Logo: React.FC<{f: number; scale?: number; titre?: string}> = ({
  f,
  scale = 1,
  titre = P.creme,
}) => {
  const fTitre = f - BEAT;
  const fAccroche = f - 2 * BEAT;
  const accroche = ramp(fAccroche, 0, 14);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `scale(${scale})`,
      }}
    >
      <Case f={f} />
      <div style={{display: 'flex', marginTop: -6, height: 230}}>
        {TITRE.split('').map((lettre, i) => {
          const s = pop(fTitre - i * 2, 10);
          return (
            <span
              key={i}
              style={{
                fontFamily: DISPLAY,
                fontSize: 230,
                lineHeight: 1,
                color: titre,
                width: lettre === ' ' ? 60 : undefined,
                display: 'inline-block',
                opacity: interpolate(s, [0, 0.15], [0, 1], CLAMP),
                transform: `translateY(${interpolate(s, [0, 1], [-120, 0])}px) scale(${interpolate(
                  s,
                  [0, 1],
                  [1.6, 1],
                )})`,
              }}
            >
              {lettre}
            </span>
          );
        })}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 10}}>
        <Filet p={accroche} sens={-1} />
        <span
          style={{
            fontFamily: TEXTE,
            fontWeight: 700,
            fontSize: 46,
            color: P.safran,
            letterSpacing: interpolate(accroche, [0, 1], [46, 14]),
            opacity: accroche,
            whiteSpace: 'nowrap',
          }}
        >
          AFRICAN FOOD
        </span>
        <Filet p={accroche} sens={1} />
      </div>
    </div>
  );
};

/** Trait + losange de part et d'autre de l'accroche. */
const Filet: React.FC<{p: number; sens: 1 | -1}> = ({p, sens}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      flexDirection: sens === 1 ? 'row' : 'row-reverse',
      gap: 10,
      opacity: p,
    }}
  >
    <div style={{width: 14, height: 14, background: P.piment, transform: 'rotate(45deg)'}} />
    <div style={{width: 110 * p, height: 4, background: P.piment}} />
  </div>
);
