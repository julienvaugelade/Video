import React from 'react';
import {P} from './theme';

// Pictogrammes plats (repère 120 × 120). `f` anime les parties mobiles.

type Icone = React.FC<{size?: number; c?: string; c2?: string; f?: number}>;

const Svg: React.FC<{size: number; children: React.ReactNode}> = ({size, children}) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{overflow: 'visible'}}>
    {children}
  </svg>
);

const Roue: React.FC<{x: number; y: number; f: number; c: string}> = ({x, y, f, c}) => (
  <g transform={`translate(${x} ${y}) rotate(${f * 18})`}>
    <circle r={14} fill="none" stroke={c} strokeWidth={8} />
    <line x1={-8} y1={0} x2={8} y2={0} stroke={c} strokeWidth={4} />
    <line x1={0} y1={-8} x2={0} y2={8} stroke={c} strokeWidth={4} />
  </g>
);

export const Scooter: Icone = ({size = 120, c = P.nuit, c2 = P.piment, f = 0}) => (
  <Svg size={size}>
    {[48, 62, 76].map((y, i) => (
      <line
        key={y}
        x1={-26 - ((f * 3 + i * 7) % 14)}
        y1={y}
        x2={-6 - ((f * 3 + i * 7) % 14)}
        y2={y}
        stroke={c}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.6}
      />
    ))}
    <rect x={10} y={28} width={42} height={34} rx={6} fill={c2} />
    <rect x={20} y={40} width={22} height={6} rx={3} fill={P.creme} />
    <path d="M16 82 Q20 64 44 64 H72 Q80 64 84 82 Z" fill={c} />
    <line x1={74} y1={78} x2={94} y2={42} stroke={c} strokeWidth={9} strokeLinecap="round" />
    <line x1={86} y1={40} x2={106} y2={40} stroke={c} strokeWidth={8} strokeLinecap="round" />
    <Roue x={30} y={92} f={f} c={c} />
    <Roue x={98} y={92} f={f} c={c} />
  </Svg>
);

export const Sac: Icone = ({size = 120, c = P.nuit, c2 = P.piment}) => (
  <Svg size={size}>
    <path d="M40 40 V30 Q40 12 60 12 Q80 12 80 30 V40" fill="none" stroke={c} strokeWidth={8} />
    <path d="M18 38 H102 L94 108 H26 Z" fill={c2} />
    <path d="M18 38 H102 L100 52 H20 Z" fill={c} opacity={0.25} />
    <path
      d="M42 76 L55 89 L80 62"
      fill="none"
      stroke={P.creme}
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Horloge: Icone = ({size = 120, c = P.nuit, c2 = P.safran, f = 0}) => (
  <Svg size={size}>
    <circle cx={60} cy={60} r={50} fill={c2} />
    <circle cx={60} cy={60} r={50} fill="none" stroke={c} strokeWidth={8} />
    {Array.from({length: 12}, (_, i) => (
      <circle key={i} cx={60} cy={20} r={3} fill={c} transform={`rotate(${i * 30} 60 60)`} />
    ))}
    <line
      x1={60}
      y1={60}
      x2={60}
      y2={34}
      stroke={c}
      strokeWidth={7}
      strokeLinecap="round"
      transform={`rotate(${f * 1.5} 60 60)`}
    />
    <line
      x1={60}
      y1={60}
      x2={60}
      y2={24}
      stroke={c}
      strokeWidth={5}
      strokeLinecap="round"
      transform={`rotate(${f * 18} 60 60)`}
    />
    <circle cx={60} cy={60} r={6} fill={c} />
  </Svg>
);

export const Repere: Icone = ({size = 120, c = P.piment, c2 = P.creme}) => (
  <Svg size={size}>
    <path d="M60 112 C40 84 22 66 22 46 A38 38 0 0 1 98 46 C98 66 80 84 60 112 Z" fill={c} />
    <circle cx={60} cy={46} r={15} fill={c2} />
  </Svg>
);

export const Telephone: Icone = ({size = 120, c = P.safran}) => (
  <Svg size={size}>
    <path
      d="M38 14 L52 40 L42 50 Q52 72 70 80 L80 70 L106 84 L98 104 Q60 108 34 80 Q10 52 18 22 Z"
      fill={c}
    />
  </Svg>
);

export const Metro: Icone = ({size = 120, c = P.safran, c2 = P.nuit}) => (
  <Svg size={size}>
    <rect x={22} y={10} width={76} height={86} rx={20} fill={c} />
    <rect x={32} y={24} width={56} height={30} rx={6} fill={c2} />
    <circle cx={40} cy={74} r={7} fill={c2} />
    <circle cx={80} cy={74} r={7} fill={c2} />
    <line x1={34} y1={98} x2={22} y2={114} stroke={c} strokeWidth={7} strokeLinecap="round" />
    <line x1={86} y1={98} x2={98} y2={114} stroke={c} strokeWidth={7} strokeLinecap="round" />
  </Svg>
);

export const Globe: Icone = ({size = 120, c = P.safran}) => (
  <Svg size={size}>
    <circle cx={60} cy={60} r={46} fill="none" stroke={c} strokeWidth={8} />
    <ellipse cx={60} cy={60} rx={20} ry={46} fill="none" stroke={c} strokeWidth={6} />
    <line x1={14} y1={60} x2={106} y2={60} stroke={c} strokeWidth={6} />
    <path d="M22 38 H98 M22 82 H98" stroke={c} strokeWidth={5} />
  </Svg>
);

export const Marmite: Icone = ({size = 120, c = P.nuit, c2 = P.safran, f = 0}) => (
  <Svg size={size}>
    {[44, 60, 76].map((x, i) => {
      const y = 30 - ((f * 0.8 + i * 9) % 26);
      return (
        <path
          key={x}
          d={`M${x} ${y + 14} q-7 -7 0 -14 q7 -7 0 -14`}
          fill="none"
          stroke={c}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.25 + 0.6 * (1 - ((f * 0.8 + i * 9) % 26) / 26)}
        />
      );
    })}
    <rect x={50} y={36} width={20} height={8} rx={4} fill={c} />
    <path d="M16 46 H104" stroke={c} strokeWidth={8} strokeLinecap="round" />
    <path d="M22 52 H98 V82 Q98 106 74 106 H46 Q22 106 22 82 Z" fill={c2} />
    <path d="M22 60 H8 M98 60 H112" stroke={c} strokeWidth={8} strokeLinecap="round" />
  </Svg>
);

export const Pousse: Icone = ({size = 120, c = P.feuille, c2 = P.safran}) => (
  <Svg size={size}>
    <path d="M60 110 V52" stroke={c} strokeWidth={8} strokeLinecap="round" />
    <path d="M60 62 Q22 62 16 24 Q54 22 60 62 Z" fill={c} />
    <path d="M60 52 Q66 14 104 12 Q102 50 60 52 Z" fill={c2} />
  </Svg>
);

export const Tampon: Icone = ({size = 120, c = P.piment, c2 = P.creme}) => (
  <Svg size={size}>
    {Array.from({length: 16}, (_, i) => (
      <circle key={i} cx={60} cy={8} r={9} fill={c} transform={`rotate(${i * 22.5} 60 60)`} />
    ))}
    <circle cx={60} cy={60} r={50} fill={c} />
    <circle cx={60} cy={60} r={38} fill="none" stroke={c2} strokeWidth={4} strokeDasharray="6 6" />
    <path
      d="M40 62 L54 76 L82 46"
      fill="none"
      stroke={c2}
      strokeWidth={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
