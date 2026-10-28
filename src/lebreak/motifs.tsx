import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CLAMP, easeInOut, H, P, W} from './theme';

// ---------------------------------------------------------------------------
// Motif wax : cercles concentriques, losanges et points, en tuile répétée.
// ---------------------------------------------------------------------------

const TUILE = 140;

export const Wax: React.FC<{
  id: string;
  color: string;
  opacity?: number;
  /** Décalage de la tuile en px (pour faire dériver le motif). */
  dx?: number;
  dy?: number;
  scale?: number;
  rotate?: number;
}> = ({id, color, opacity = 0.12, dx = 0, dy = 0, scale = 1, rotate = 0}) => {
  const t = TUILE;
  const m = t / 2;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <defs>
        <pattern
          id={id}
          width={t}
          height={t}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${dx} ${dy}) rotate(${rotate}) scale(${scale})`}
        >
          <circle cx={m} cy={m} r={40} fill="none" stroke={color} strokeWidth={10} />
          <circle cx={m} cy={m} r={16} fill={color} />
          {[0, t].map((x) =>
            [0, t].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={28} fill={color} />),
          )}
          {[
            [m, 0],
            [0, m],
            [t, m],
            [m, t],
          ].map(([x, y]) => (
            <rect
              key={`${x}-${y}`}
              x={x - 9}
              y={y - 9}
              width={18}
              height={18}
              fill={color}
              transform={`rotate(45 ${x} ${y})`}
            />
          ))}
          {[
            [35, 35],
            [105, 35],
            [35, 105],
            [105, 105],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill={color} />
          ))}
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bande kente : rayures et zigzags, défile horizontalement.
// ---------------------------------------------------------------------------

export const Kente: React.FC<{
  id: string;
  y: number;
  height?: number;
  offset?: number;
  width?: number;
  x?: number;
}> = ({id, y, height = 64, offset = 0, width = W, x = 0}) => {
  const h = height;
  const k = h / 64;
  return (
    <svg
      width={width}
      height={h}
      style={{position: 'absolute', left: x, top: y}}
      viewBox={`0 0 ${width} ${h}`}
    >
      <defs>
        <pattern
          id={id}
          width={160 * k}
          height={h}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${offset} 0)`}
        >
          <g transform={`scale(${k})`}>
            <rect width={160} height={64} fill={P.safran} />
            <rect width={160} height={10} fill={P.nuit} />
            <rect y={54} width={160} height={10} fill={P.nuit} />
            <rect y={10} width={60} height={44} fill={P.piment} />
            {[18, 32, 46].map((cx) => (
              <rect
                key={cx}
                x={cx - 5}
                y={27}
                width={10}
                height={10}
                fill={P.or}
                transform={`rotate(45 ${cx} 32)`}
              />
            ))}
            <rect x={60} y={10} width={8} height={44} fill={P.nuit} />
            <rect x={68} y={10} width={8} height={44} fill={P.or} />
            <rect x={76} y={10} width={76} height={44} fill={P.feuille} />
            <polyline
              points="76,44 88,20 100,44 112,20 124,44 136,20 148,44"
              fill="none"
              stroke={P.or}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <rect x={152} y={10} width={8} height={44} fill={P.nuit} />
          </g>
        </pattern>
      </defs>
      <rect width={width} height={h} fill={`url(#${id})`} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Volet de transition : quatre bandes obliques couvrent l'écran à l'image `at`
// (changement de scène), puis repartent vers la droite.
// ---------------------------------------------------------------------------

const VOLET_COULEURS = [P.feuille, P.safran, P.piment, P.nuit];
const ENTREE = 8;
const SORTIE = 9;
const DECALAGE = 1.5;
const LARGEUR = W * 2;

export const Volet: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const n = VOLET_COULEURS.length;
  if (frame < at - ENTREE - n * DECALAGE || frame > at + SORTIE + n * DECALAGE + 1) return null;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {VOLET_COULEURS.map((couleur, i) => {
        // La dernière bande (au-dessus) arrive pile à `at` et repart la première.
        const debutEntree = at - ENTREE - (n - 1 - i) * DECALAGE;
        const debutSortie = at + 1 + (n - 1 - i) * DECALAGE;
        const entree = interpolate(frame, [debutEntree, debutEntree + ENTREE], [-LARGEUR - 500, -W / 2], {
          ...CLAMP,
          easing: easeInOut,
        });
        const sortie = interpolate(frame, [debutSortie, debutSortie + SORTIE], [0, W * 1.5 + 500], {
          ...CLAMP,
          easing: easeInOut,
        });
        return (
          <div
            key={couleur}
            style={{
              position: 'absolute',
              top: -20,
              height: H + 40,
              width: LARGEUR,
              left: entree + sortie,
              background: couleur,
              transform: 'skewX(-12deg)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
