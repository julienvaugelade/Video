import React from 'react';
import {random, spring} from 'remotion';
import {FPS, P} from './theme';

// Les plats vus du dessus, dessinés dans un repère centré (assiette de rayon 300).
// `f` : images écoulées depuis l'arrivée de l'assiette ; les aliments se posent un à un.

type Illu = React.FC<{f: number}>;

const COULEURS = {
  riz: '#FBF4E4',
  grain: '#E4D3AE',
  poulet: '#A9521F',
  pouletClair: '#CE7838',
  grille: '#6E2F10',
  oignon: '#FBE7A1',
  sauceYassa: '#E9A93A',
  mafe: '#93431A',
  mafeClair: '#C06529',
  carotte: '#EE7B22',
  attieke: '#F6F0DE',
  poisson: '#C77A2C',
  poissonSombre: '#8C4A16',
  aloco: '#F2A93B',
  alocoBord: '#C9701E',
  alocoCoeur: '#F8CB72',
  galette: '#D9A441',
  salade: '#3E9B4F',
  saladeClaire: '#68BC62',
  boeuf: '#6E2A12',
  boeufClair: '#94431F',
  bois: '#C8A26B',
  lait: '#F6EEDD',
  mil: '#E0C489',
  beignet: '#D98A2B',
};

/** Fait apparaître un aliment en le posant sur l'assiette (rebond depuis son centre). */
const Pose: React.FC<{f: number; d: number; x: number; y: number; children: React.ReactNode}> = ({
  f,
  d,
  x,
  y,
  children,
}) => {
  const s = spring({frame: f - d, fps: FPS, config: {damping: 11, stiffness: 200, mass: 0.6}});
  if (s <= 0.001) return null;
  return <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>{children}</g>;
};

/** Points aléatoires (déterministes) dans un disque. */
const semis = (seed: string, n: number, cx: number, cy: number, r: number) =>
  Array.from({length: n}, (_, i) => {
    const a = random(`${seed}-a-${i}`) * Math.PI * 2;
    const d = Math.sqrt(random(`${seed}-d-${i}`)) * r;
    return {x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, rot: random(`${seed}-r-${i}`) * 180};
  });

// ---------------------------------------------------------------------------
// Briques communes
// ---------------------------------------------------------------------------

export const Assiette: React.FC<{accent: string; children?: React.ReactNode; bol?: boolean}> = ({
  accent,
  children,
  bol = false,
}) => (
  <g>
    <circle r={300} fill={P.blanc} />
    <circle r={300} fill="none" stroke="#E2D6C0" strokeWidth={4} />
    <circle r={bol ? 240 : 250} fill={bol ? '#EFE3CF' : '#F4EADA'} />
    <circle r={bol ? 240 : 250} fill="none" stroke="#E6D9C2" strokeWidth={3} />
    {Array.from({length: 28}, (_, i) => {
      const a = (i / 28) * 360;
      return i % 2 === 0 ? (
        <path key={i} d="M-9 -286 L0 -270 L9 -286 Z" fill={accent} transform={`rotate(${a})`} />
      ) : (
        <circle key={i} cx={0} cy={-280} r={4.5} fill={accent} transform={`rotate(${a})`} />
      );
    })}
    {children}
  </g>
);

const Riz: React.FC<{cx: number; cy: number; r: number; seed: string}> = ({cx, cy, r, seed}) => (
  <g>
    <circle cx={cx + 6} cy={cy + 10} r={r} fill="#DCCBA8" />
    <circle cx={cx} cy={cy} r={r} fill={COULEURS.riz} />
    <circle cx={cx + r * 0.12} cy={cy + r * 0.12} r={r * 0.86} fill="#F5EBD3" opacity={0.6} />
    {semis(seed, Math.round(r * 0.75), cx, cy, r - 10).map((g, i) => (
      <ellipse
        key={i}
        cx={g.x}
        cy={g.y}
        rx={8}
        ry={3.2}
        fill={i % 4 === 0 ? '#FFFFFF' : COULEURS.grain}
        transform={`rotate(${g.rot} ${g.x} ${g.y})`}
      />
    ))}
  </g>
);

const Poulet: React.FC<{x: number; y: number; rot: number; s?: number; os?: boolean}> = ({
  x,
  y,
  rot,
  s = 1,
  os = false,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {os && (
      <g>
        <rect x={52} y={-9} width={46} height={18} rx={9} fill="#F3E3C8" />
        <circle cx={100} cy={-10} r={12} fill="#F3E3C8" />
        <circle cx={100} cy={10} r={12} fill="#F3E3C8" />
      </g>
    )}
    <ellipse rx={74} ry={50} fill={COULEURS.poulet} />
    <ellipse cx={-10} cy={-12} rx={50} ry={26} fill={COULEURS.pouletClair} opacity={0.8} />
    {[-30, 0, 30].map((dx) => (
      <line
        key={dx}
        x1={dx - 14}
        y1={-30}
        x2={dx + 14}
        y2={30}
        stroke={COULEURS.grille}
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.75}
      />
    ))}
  </g>
);

const Aloco: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <ellipse rx={34} ry={22} fill={COULEURS.aloco} stroke={COULEURS.alocoBord} strokeWidth={5} />
    <ellipse rx={16} ry={9} fill={COULEURS.alocoCoeur} />
  </g>
);

const Feuille: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-40 0 Q0 -30 40 0 Q0 30 -40 0 Z" fill={COULEURS.salade} />
    <path d="M-34 0 L34 0" stroke={COULEURS.saladeClaire} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Citron: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={38} fill="#F7D84A" stroke="#E2AE14" strokeWidth={6} />
    {Array.from({length: 8}, (_, i) => (
      <line
        key={i}
        x1={0}
        y1={0}
        x2={0}
        y2={-30}
        stroke="#FFF6C8"
        strokeWidth={4}
        transform={`rotate(${i * 45})`}
      />
    ))}
  </g>
);

// ---------------------------------------------------------------------------
// Plats
// ---------------------------------------------------------------------------

const Yassa: Illu = ({f}) => (
  <Assiette accent={P.piment}>
    <Pose f={f} d={0} x={-70} y={-40}>
      <Riz cx={-70} cy={-40} r={150} seed="yassa" />
    </Pose>
    <Pose f={f} d={5} x={90} y={70}>
      <path
        d="M-10 40 C20 -40 170 -10 200 60 C220 130 130 200 50 190 C-20 180 -40 100 -10 40 Z"
        fill={COULEURS.sauceYassa}
      />
    </Pose>
    <Pose f={f} d={9} x={90} y={90}>
      <Poulet x={70} y={70} rot={-25} os />
      <Poulet x={110} y={140} rot={15} s={0.85} />
    </Pose>
    <Pose f={f} d={13} x={100} y={80}>
      {semis('oignon', 16, 100, 80, 110).map((o, i) => (
        <path
          key={i}
          d={`M${o.x - 22} ${o.y} A 22 14 0 0 1 ${o.x + 22} ${o.y}`}
          fill="none"
          stroke={COULEURS.oignon}
          strokeWidth={7}
          strokeLinecap="round"
          transform={`rotate(${o.rot} ${o.x} ${o.y})`}
        />
      ))}
    </Pose>
    <Pose f={f} d={17} x={-150} y={140}>
      <Citron x={-150} y={140} />
    </Pose>
    <Pose f={f} d={20} x={-20} y={-170}>
      <Feuille x={-20} y={-170} rot={20} s={0.6} />
      <Feuille x={10} y={-150} rot={-30} s={0.5} />
    </Pose>
  </Assiette>
);

const Mafe: Illu = ({f}) => (
  <Assiette accent={P.terre}>
    <Pose f={f} d={0} x={-90} y={-60}>
      <Riz cx={-90} cy={-60} r={140} seed="mafe" />
    </Pose>
    <Pose f={f} d={5} x={70} y={70}>
      <path
        d="M-60 30 C-40 -80 140 -90 200 -10 C250 70 180 200 60 210 C-40 215 -80 120 -60 30 Z"
        fill={COULEURS.mafe}
      />
      <ellipse cx={90} cy={20} rx={60} ry={20} fill={COULEURS.mafeClair} opacity={0.55} />
      <ellipse cx={20} cy={150} rx={40} ry={12} fill={COULEURS.mafeClair} opacity={0.45} />
    </Pose>
    <Pose f={f} d={9} x={80} y={80}>
      <Poulet x={40} y={60} rot={30} s={0.75} />
      <Poulet x={140} y={110} rot={-20} s={0.7} />
      <Poulet x={60} y={160} rot={70} s={0.6} />
    </Pose>
    <Pose f={f} d={13} x={60} y={60}>
      {[
        [150, 20],
        [-10, 110],
        [120, 190],
        [190, 60],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={20} fill={COULEURS.carotte} />
          <circle cx={x} cy={y} r={10} fill="#F7A35B" />
        </g>
      ))}
    </Pose>
    <Pose f={f} d={17} x={-60} y={150}>
      {semis('arachide', 9, -60, 150, 40).map((a, i) => (
        <ellipse
          key={i}
          cx={a.x}
          cy={a.y}
          rx={10}
          ry={7}
          fill="#D9A066"
          transform={`rotate(${a.rot} ${a.x} ${a.y})`}
        />
      ))}
    </Pose>
  </Assiette>
);

const Poisson: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M150 0 L215 -50 L200 0 L215 50 Z" fill={COULEURS.poissonSombre} />
    <path d="M-160 0 C-120 -78 80 -86 160 0 C80 86 -120 78 -160 0 Z" fill={COULEURS.poisson} />
    <path d="M-40 -58 L20 -92 L40 -60 Z" fill={COULEURS.poissonSombre} />
    {[-60, -10, 40, 90].map((dx) => (
      <path
        key={dx}
        d={`M${dx} -44 Q${dx + 18} 0 ${dx} 44`}
        fill="none"
        stroke={COULEURS.poissonSombre}
        strokeWidth={7}
        strokeLinecap="round"
      />
    ))}
    <circle cx={-118} cy={-8} r={13} fill={P.blanc} />
    <circle cx={-118} cy={-8} r={6} fill={P.nuit} />
  </g>
);

const Attieke: Illu = ({f}) => (
  <Assiette accent={P.feuille}>
    <Pose f={f} d={0} x={-60} y={-110}>
      <circle cx={-54} cy={-100} r={130} fill="#DCCBA8" />
      <circle cx={-60} cy={-110} r={130} fill={COULEURS.attieke} />
      {semis('attieke', 160, -60, -110, 120).map((g, i) => (
        <circle key={i} cx={g.x} cy={g.y} r={3} fill={i % 3 === 0 ? '#FFFFFF' : '#E0D3B0'} />
      ))}
    </Pose>
    <Pose f={f} d={6} x={10} y={80}>
      <Poisson x={10} y={80} rot={-12} />
    </Pose>
    <Pose f={f} d={12} x={150} y={-110}>
      {[
        [110, -150, 30],
        [170, -110, -20],
        [130, -60, 60],
        [195, -170, 10],
      ].map(([x, y, r]) => (
        <Aloco key={`${x}-${y}`} x={x} y={y} rot={r} />
      ))}
    </Pose>
    <Pose f={f} d={16} x={-170} y={60}>
      {[
        [-190, 40],
        [-150, 100],
        [-200, 110],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={20} fill={P.piment} />
          <circle cx={x} cy={y} r={11} fill="#F07A55" />
        </g>
      ))}
      <path d="M-160 20 A 22 14 0 0 1 -116 20" fill="none" stroke={P.blanc} strokeWidth={7} strokeLinecap="round" />
    </Pose>
    <Pose f={f} d={20} x={120} y={190}>
      <path d="M80 190 Q120 160 170 180" fill="none" stroke="#2E8B3E" strokeWidth={16} strokeLinecap="round" />
    </Pose>
  </Assiette>
);

const Vegan: Illu = ({f}) => (
  <Assiette accent={P.feuille}>
    <Pose f={f} d={0} x={-80} y={-70}>
      <Riz cx={-80} cy={-70} r={135} seed="vegan" />
    </Pose>
    <Pose f={f} d={6} x={110} y={90}>
      <circle cx={110} cy={90} r={88} fill={COULEURS.galette} />
      <circle cx={110} cy={90} r={88} fill="none" stroke="#B98327" strokeWidth={6} />
      {[-40, -10, 20, 50].map((d) => (
        <g key={d} stroke="#B98327" strokeWidth={4} opacity={0.6}>
          <line x1={110 + d} y1={20} x2={110 + d + 30} y2={160} />
        </g>
      ))}
    </Pose>
    <Pose f={f} d={11} x={120} y={-110}>
      {[
        [80, -150, 20],
        [140, -120, -30],
        [100, -80, 50],
        [170, -60, 0],
        [190, -150, 70],
      ].map(([x, y, r]) => (
        <Aloco key={`${x}-${y}`} x={x} y={y} rot={r} />
      ))}
    </Pose>
    <Pose f={f} d={16} x={-110} y={130}>
      <Feuille x={-130} y={110} rot={-20} />
      <Feuille x={-80} y={150} rot={30} s={0.9} />
      <Feuille x={-150} y={170} rot={70} s={0.8} />
      <circle cx={-100} cy={120} r={14} fill={P.piment} />
      <circle cx={-60} cy={110} r={12} fill={P.piment} />
    </Pose>
  </Assiette>
);

const Brochette: React.FC<{y: number; seed: string}> = ({y, seed}) => (
  <g transform={`translate(0 ${y})`}>
    <line x1={-250} y1={0} x2={250} y2={0} stroke={COULEURS.bois} strokeWidth={10} strokeLinecap="round" />
    {[-170, -90, -10, 70, 150].map((x, i) => (
      <g key={x} transform={`translate(${x} 0) rotate(${(random(`${seed}${i}`) - 0.5) * 24})`}>
        <rect x={-34} y={-34} width={68} height={68} rx={16} fill={COULEURS.boeuf} />
        <rect x={-26} y={-28} width={40} height={24} rx={10} fill={COULEURS.boeufClair} opacity={0.8} />
        <line x1={-20} y1={14} x2={20} y2={-10} stroke="#2A0F05" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      </g>
    ))}
    {[-130, -50, 30, 110].map((x, i) => (
      <rect
        key={x}
        x={x - 10}
        y={-26}
        width={20}
        height={52}
        rx={6}
        fill={i % 2 === 0 ? P.piment : '#F3E6CC'}
      />
    ))}
  </g>
);

const Brochettes: Illu = ({f}) => (
  <Assiette accent={P.piment}>
    <g transform="rotate(-24)">
      <Pose f={f} d={0} x={0} y={-90}>
        <Brochette y={-90} seed="b1" />
      </Pose>
      <Pose f={f} d={6} x={0} y={30}>
        <Brochette y={30} seed="b2" />
      </Pose>
    </g>
    <Pose f={f} d={12} x={110} y={150}>
      <circle cx={110} cy={150} r={56} fill={P.blanc} stroke="#E2D6C0" strokeWidth={4} />
      <circle cx={110} cy={150} r={42} fill={P.piment} />
      <circle cx={98} cy={140} r={12} fill="#F07A55" />
    </Pose>
    <Pose f={f} d={16} x={-120} y={170}>
      <Aloco x={-150} y={150} rot={20} />
      <Aloco x={-90} y={185} rot={-30} />
      <Feuille x={-60} y={130} rot={10} s={0.7} />
    </Pose>
  </Assiette>
);

const Tiakri: Illu = ({f}) => (
  <Assiette accent={P.safran} bol>
    <Pose f={f} d={0} x={0} y={0}>
      <circle r={232} fill={COULEURS.lait} />
      {semis('mil', 220, 0, 0, 220).map((g, i) => (
        <circle key={i} cx={g.x} cy={g.y} r={4} fill={i % 4 === 0 ? '#F2DFAE' : COULEURS.mil} />
      ))}
    </Pose>
    <Pose f={f} d={8} x={0} y={0}>
      <path
        d="M-120 -20 C-80 -110 60 -120 110 -40 C150 30 60 120 -20 90 C-80 70 -60 0 0 0"
        fill="none"
        stroke={P.blanc}
        strokeWidth={14}
        strokeLinecap="round"
        opacity={0.85}
      />
    </Pose>
    <Pose f={f} d={14} x={60} y={-30}>
      <Feuille x={60} y={-30} rot={-35} s={0.55} />
      <Feuille x={90} y={-10} rot={20} s={0.45} />
    </Pose>
  </Assiette>
);

const Beignets: Illu = ({f}) => (
  <Assiette accent={P.terre}>
    <defs>
      <radialGradient id="beignet" cx="38%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#F6C566" />
        <stop offset="60%" stopColor={COULEURS.beignet} />
        <stop offset="100%" stopColor="#A85A17" />
      </radialGradient>
    </defs>
    {[
      [0, 0],
      [-130, -60],
      [120, -80],
      [-100, 110],
      [110, 100],
      [10, -160],
      [0, 165],
    ].map(([x, y], i) => (
      <Pose key={`${x}-${y}`} f={f} d={i * 3} x={x} y={y}>
        <circle cx={x} cy={y} r={70} fill="url(#beignet)" />
        {semis(`sucre${i}`, 14, x - 10, y - 12, 44).map((s, j) => (
          <circle key={j} cx={s.x} cy={s.y} r={3.5} fill={P.blanc} opacity={0.9} />
        ))}
      </Pose>
    ))}
  </Assiette>
);

// ---------------------------------------------------------------------------
// Carte (contenu repris de lebreaktoulouse.com et lebreaktoulouse.fr)
// ---------------------------------------------------------------------------

export type Plat = {
  nom: string;
  desc: string;
  prix: string;
  fond: string;
  texte: string;
  accent: string;
  Illustration: Illu;
};

export const PLATS: Record<string, Plat> = {
  yassa: {
    nom: 'Yassa poulet',
    desc: 'Poulet braisé, sauce aux oignons, citron et moutarde, riz parfumé',
    prix: '13,90 €',
    fond: P.safran,
    texte: P.nuit,
    accent: P.piment,
    Illustration: Yassa,
  },
  mafe: {
    nom: 'Mafé poulet',
    desc: "Poulet mijoté dans une sauce tomate à la pâte d'arachide, riz",
    prix: '13,90 €',
    fond: P.terre,
    texte: P.creme,
    accent: P.or,
    Illustration: Mafe,
  },
  attieke: {
    nom: 'Attiéké poisson',
    desc: 'Daurade royale frite et attiéké, la semoule de manioc',
    prix: '21,30 €',
    fond: P.feuille,
    texte: P.creme,
    accent: P.or,
    Illustration: Attieke,
  },
  brochettes: {
    nom: 'Brochettes de bœuf',
    desc: 'Cuites au feu de bois, en supplément',
    prix: '6,50 €',
    fond: P.piment,
    texte: P.creme,
    accent: P.or,
    Illustration: Brochettes,
  },
  vegan: {
    nom: 'Vegan Break',
    desc: 'Riz, banane plantain et galette de pommes de terre',
    prix: '13,50 €',
    fond: P.creme,
    texte: P.nuit,
    accent: P.feuille,
    Illustration: Vegan,
  },
};

export const DESSERTS = [
  {nom: 'Tiakri', desc: 'Dessert lacté au mil', Illustration: Tiakri},
  {nom: 'Beignets Mikatés', desc: 'Beignets sucrés africains', Illustration: Beignets},
];
export const PRIX_DESSERT = '4,50 €';
