import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {C, FONT} from './theme';

export const N8N_DURATION_S = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

/** 0 → 1 between a and b (seconds), eased. */
const ramp = (t: number, a: number, b: number, easing = easeOut) =>
  interpolate(t, [a, b], [0, 1], {...CLAMP, easing});

/** Visible window: fades in at `a`, fades out at `b`. */
const windowed = (t: number, a: number, b: number, fade = 0.3) =>
  Math.min(ramp(t, a, a + fade), 1 - ramp(t, b - fade, b));

const usePop = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (startS: number) =>
    spring({
      frame: frame - startS * fps,
      fps,
      config: {damping: 14, stiffness: 170, mass: 0.7},
    });
};

const BLUE_SOFT = 'rgba(78,78,234,0.10)';
const BLUE_LINE = '#B8B8F4';
const GREY_LINE = '#C9C9D6';
const ICON_IDLE = '#5A5A6E';

// ---------------------------------------------------------------------------
// Layout (canvas coordinates, 1920×1080)
// ---------------------------------------------------------------------------

const ROW_Y = 500;
const HALF = 70; // node tile = 140 × 140

type NodeId = 'trigger' | 'set' | 'if' | 'slack' | 'sheets';
type Icon = 'bolt' | 'fields' | 'fork' | 'chat' | 'table';

const NODES: Record<
  NodeId,
  {x: number; y: number; title: string; type: string; icon: Icon; trigger?: boolean}
> = {
  trigger: {x: 340, y: ROW_Y, title: 'Formulaire envoyé', type: 'n8n Form Trigger', icon: 'bolt', trigger: true},
  set: {x: 720, y: ROW_Y, title: 'Nettoyer les données', type: 'Edit Fields (Set)', icon: 'fields'},
  if: {x: 1100, y: ROW_Y, title: 'Budget > 1 000 € ?', type: 'If', icon: 'fork'},
  slack: {x: 1580, y: 320, title: 'Prévenir l’équipe', type: 'Slack', icon: 'chat'},
  sheets: {x: 1580, y: 680, title: 'Ajouter au fichier', type: 'Google Sheets', icon: 'table'},
};

const P1 = `M ${340 + HALF} ${ROW_Y} L ${720 - HALF} ${ROW_Y}`;
const P2 = `M ${720 + HALF} ${ROW_Y} L ${1100 - HALF} ${ROW_Y}`;
const IF_OUT_X = 1100 + HALF;
const OUT_IN_X = 1580 - HALF;
const PT = `M ${IF_OUT_X} ${ROW_Y - 26} C ${IF_OUT_X + 170} ${ROW_Y - 26} ${OUT_IN_X - 170} 320 ${OUT_IN_X} 320`;
const PF = `M ${IF_OUT_X} ${ROW_Y + 26} C ${IF_OUT_X + 170} ${ROW_Y + 26} ${OUT_IN_X - 170} 680 ${OUT_IN_X} 680`;
const PATHS = {P1, P2, PT, PF};
type PathId = keyof typeof PATHS;
const LENGTHS = Object.fromEntries(
  Object.entries(PATHS).map(([k, d]) => [k, getLength(d)]),
) as Record<PathId, number>;

// ---------------------------------------------------------------------------
// Timeline (seconds)
// ---------------------------------------------------------------------------

const APPEAR: Record<NodeId, number> = {trigger: 4.2, set: 12.3, if: 21.8, slack: 26.5, sheets: 26.7};

const ACTIVE: Record<NodeId, [number, number][]> = {
  trigger: [[5.0, 12.9], [42.4, 43.0]],
  set: [[14.0, 22.1], [43.1, 43.7]],
  if: [[23.2, 32.9], [37.0, 37.7], [43.8, 44.4]],
  slack: [[33.4, 37.2], [44.5, 45.6]],
  sheets: [[38.2, 41.8]],
};

/** Connector drawing (grey base line). */
const DRAW: Record<PathId, [number, number]> = {
  P1: [12.6, 13.1],
  P2: [21.95, 22.35],
  PT: [26.0, 26.6],
  PF: [26.05, 26.65],
};

/** A data item travelling along a connector. `recap` tokens don't repaint the line. */
const TOKENS: {path: PathId; t0: number; t1: number; recap?: boolean}[] = [
  {path: 'P1', t0: 13.2, t1: 14.0},
  {path: 'P2', t0: 22.4, t1: 23.2},
  {path: 'PT', t0: 32.6, t1: 33.4},
  {path: 'PF', t0: 37.4, t1: 38.2},
  {path: 'P1', t0: 42.7, t1: 43.1, recap: true},
  {path: 'P2', t0: 43.4, t1: 43.8, recap: true},
  {path: 'PT', t0: 44.1, t1: 44.5, recap: true},
];

const STEPS = ['Déclencheur', 'Transformation', 'Condition', 'Sortie'];
const STEP_STARTS = [5.0, 13.2, 22.4, 32.6, 41.8]; // last = recap

const CAPTIONS: {a: number; b: number; n: number | null; title: string; text: React.ReactNode}[] = [
  {a: 5.0, b: 12.7, n: 1, title: 'Déclencheur', text: <>Il lance le scénario : ici, un formulaire de contact vient d’être envoyé.</>},
  {a: 14.0, b: 21.9, n: 2, title: 'Transformation', text: <>Il nettoie et reformate les données pour les blocs suivants.</>},
  {a: 23.2, b: 27.7, n: 3, title: 'Condition', text: <>Il pose une question : le budget dépasse-t-il 1 000 € ?</>},
  {a: 27.7, b: 32.6, n: 3, title: 'Condition', text: <>Selon la réponse, le flux se sépare en deux chemins : <b>vrai</b> ou <b>faux</b>.</>},
  {a: 33.4, b: 37.3, n: 4, title: 'Sortie', text: <><b>Vrai</b> : l’action finale prévient l’équipe commerciale sur Slack.</>},
  {a: 37.3, b: 41.8, n: 4, title: 'Sortie', text: <><b>Faux</b> (autre lead, 400 €) : le contact rejoint un Google Sheet.</>},
  {a: 42.2, b: 46.0, n: null, title: 'En une exécution', text: <>Déclencher → Transformer → Décider → Agir</>},
];

/** Discreet UI sounds, placed as cue points (seconds). */
type Sfx = 'pop' | 'select' | 'swoosh' | 'data' | 'split' | 'success' | 'tick';
export const CUES: {at: number; sfx: Sfx; note: string}[] = [
  {at: 0.35, sfx: 'tick', note: 'Titre'},
  {at: 4.2, sfx: 'pop', note: 'Apparition du déclencheur'},
  {at: 5.0, sfx: 'select', note: 'Déclencheur actif'},
  {at: 5.6, sfx: 'tick', note: 'Données reçues'},
  {at: 12.3, sfx: 'pop', note: 'Apparition de la transformation'},
  {at: 12.6, sfx: 'swoosh', note: 'Connexion 1'},
  {at: 13.2, sfx: 'data', note: 'Données → transformation'},
  {at: 14.0, sfx: 'select', note: 'Transformation active'},
  {at: 15.4, sfx: 'tick', note: 'Champ « nom » nettoyé'},
  {at: 16.0, sfx: 'tick', note: 'Champ « email » nettoyé'},
  {at: 16.6, sfx: 'tick', note: 'Champ « budget » converti'},
  {at: 21.8, sfx: 'pop', note: 'Apparition de la condition'},
  {at: 21.95, sfx: 'swoosh', note: 'Connexion 2'},
  {at: 22.4, sfx: 'data', note: 'Données → condition'},
  {at: 23.2, sfx: 'select', note: 'Condition active'},
  {at: 24.8, sfx: 'tick', note: 'Évaluation 1 500 > 1 000'},
  {at: 25.4, sfx: 'tick', note: 'Résultat : vrai'},
  {at: 26.0, sfx: 'split', note: 'Séparation en deux chemins'},
  {at: 26.6, sfx: 'pop', note: 'Apparition des sorties'},
  {at: 32.6, sfx: 'data', note: 'Données → chemin vrai'},
  {at: 33.4, sfx: 'select', note: 'Sortie Slack active'},
  {at: 34.0, sfx: 'tick', note: 'Message envoyé'},
  {at: 37.0, sfx: 'tick', note: 'Condition : autre lead'},
  {at: 37.4, sfx: 'data', note: 'Données → chemin faux'},
  {at: 38.2, sfx: 'select', note: 'Sortie Google Sheets active'},
  {at: 38.6, sfx: 'tick', note: 'Ligne ajoutée'},
  {at: 42.4, sfx: 'tick', note: 'Récap : déclencheur'},
  {at: 43.1, sfx: 'tick', note: 'Récap : transformation'},
  {at: 43.8, sfx: 'tick', note: 'Récap : condition'},
  {at: 44.5, sfx: 'tick', note: 'Récap : sortie'},
  {at: 45.0, sfx: 'success', note: 'Exécution réussie'},
  {at: 46.6, sfx: 'pop', note: 'Conclusion'},
];

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

const activeLevel = (t: number, id: NodeId) =>
  Math.max(0, ...ACTIVE[id].map(([a, b]) => windowed(t, a, b, 0.25)));

/** Expanding ring right after each activation. */
const pulseLevel = (t: number, id: NodeId) => {
  const w = ACTIVE[id].find(([a]) => t >= a && t < a + 0.8);
  return w ? ramp(t, w[0], w[0] + 0.8, Easing.out(Easing.quad)) : -1;
};

const doneLevel = (t: number, id: NodeId) => ramp(t, ACTIVE[id][0][1] - 0.25, ACTIVE[id][0][1]);

// ---------------------------------------------------------------------------
// Icons (flat, 64 × 64)
// ---------------------------------------------------------------------------

const NodeIcon: React.FC<{icon: Icon; color: string}> = ({icon, color}) => {
  const stroke = {fill: 'none', stroke: color, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round'} as const;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64">
      {icon === 'bolt' && <path d="M36 6 L14 36 H30 L26 58 L50 26 H34 Z" fill={color} />}
      {icon === 'fields' && (
        <g>
          <line x1={10} y1={16} x2={54} y2={16} {...stroke} />
          <line x1={10} y1={32} x2={54} y2={32} {...stroke} />
          <line x1={10} y1={48} x2={54} y2={48} {...stroke} />
          <circle cx={40} cy={16} r={6} fill={color} />
          <circle cx={22} cy={32} r={6} fill={color} />
          <circle cx={46} cy={48} r={6} fill={color} />
        </g>
      )}
      {icon === 'fork' && (
        <g>
          <path d="M8 32 H24 C34 32 34 14 46 14 H54" {...stroke} />
          <path d="M24 32 C34 32 34 50 46 50 H54" {...stroke} />
          <path d="M46 7 L55 14 L46 21" {...stroke} />
          <path d="M46 43 L55 50 L46 57" {...stroke} />
        </g>
      )}
      {icon === 'chat' && (
        <g>
          <path d="M10 12 H54 V44 H28 L16 54 V44 H10 Z" fill={color} />
          {[22, 32, 42].map((cx) => (
            <circle key={cx} cx={cx} cy={28} r={3.5} fill={color === '#FFFFFF' ? C.blue : '#FFFFFF'} />
          ))}
        </g>
      )}
      {icon === 'table' && (
        <g>
          <rect x={10} y={10} width={44} height={44} rx={6} {...stroke} />
          <line x1={10} y1={25} x2={54} y2={25} {...stroke} />
          <line x1={10} y1={40} x2={54} y2={40} {...stroke} />
          <line x1={28} y1={10} x2={28} y2={54} {...stroke} />
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// UI pieces
// ---------------------------------------------------------------------------

const Node: React.FC<{id: NodeId; t: number; appear: number}> = ({id, t, appear}) => {
  const n = NODES[id];
  const active = activeLevel(t, id);
  const done = doneLevel(t, id);
  const pulse = pulseLevel(t, id);
  const idleBorder = interpolateColors(done, [0, 1], [C.line, BLUE_LINE]);
  const idleIcon = interpolateColors(done, [0, 1], [ICON_IDLE, C.blue]);
  const radius = n.trigger ? `${HALF}px 22px 22px ${HALF}px` : '22px';
  return (
    <div
      style={{
        position: 'absolute',
        left: n.x,
        top: n.y,
        opacity: Math.min(1, appear * 1.5),
        transform: `translate(-50%, -50%) scale(${(0.5 + 0.5 * appear) * (1 + 0.06 * active)})`,
      }}
    >
      {/* Activation ring */}
      {pulse >= 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            border: `4px solid ${C.blue}`,
            opacity: 0.55 * (1 - pulse),
            transform: `scale(${1 + 0.35 * pulse})`,
          }}
        />
      )}
      {/* Steady halo while active */}
      <div
        style={{
          position: 'absolute',
          inset: -14,
          borderRadius: n.trigger ? `${HALF + 14}px 34px 34px ${HALF + 14}px` : '34px',
          background: BLUE_SOFT,
          opacity: active,
        }}
      />
      <div
        style={{
          position: 'relative',
          width: HALF * 2,
          height: HALF * 2,
          borderRadius: radius,
          background: interpolateColors(active, [0, 1], [C.card, C.blue]),
          border: `3px solid ${interpolateColors(active, [0, 1], [idleBorder, C.blue])}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <NodeIcon icon={n.icon} color={interpolateColors(active, [0, 1], [idleIcon, '#FFFFFF'])} />
      </div>
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: HALF * 2 + 16,
          transform: 'translateX(-50%)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{fontSize: 24, fontWeight: 600, color: interpolateColors(active, [0, 1], [C.ink, C.blue])}}>
          {n.title}
        </div>
        <div style={{fontSize: 18, fontWeight: 500, color: C.muted, marginTop: 2}}>{n.type}</div>
      </div>
    </div>
  );
};

/** Small n8n-style connection handle. */
const Handle: React.FC<{x: number; y: number; opacity: number; lit: number}> = ({x, y, opacity, lit}) => (
  <circle
    cx={x}
    cy={y}
    r={8}
    fill={C.card}
    stroke={interpolateColors(lit, [0, 1], [GREY_LINE, C.blue])}
    strokeWidth={3}
    opacity={opacity}
  />
);

const Arrowhead: React.FC<{x: number; y: number; color: string; opacity: number}> = ({x, y, color, opacity}) => (
  <path d="M 2 0 L -12 -8 L -8 0 L -12 8 Z" fill={color} opacity={opacity} transform={`translate(${x} ${y})`} />
);

/** Data card floating near a node. `anchorY` is the card's bottom (or top when `below`). */
const Card: React.FC<{
  x: number;
  anchorY: number;
  below?: boolean;
  p: number;
  width: number;
  /** Horizontal offset of the pointer from the card centre. */
  pointerDx?: number;
  header: string;
  children: React.ReactNode;
}> = ({x, anchorY, below, p, width, pointerDx = 0, header, children}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: anchorY,
      width,
      transform: `translate(-50%, ${below ? 0 : -100}%) translateY(${(1 - p) * (below ? -14 : 14)}px) scale(${
        0.92 + 0.08 * p
      })`,
      opacity: p,
      background: C.card,
      border: `2px solid ${C.line}`,
      borderRadius: 16,
      padding: '16px 22px 18px',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${pointerDx}px)`,
        [below ? 'top' : 'bottom']: -11,
        width: 18,
        height: 18,
        background: C.card,
        borderRight: `2px solid ${C.line}`,
        borderBottom: `2px solid ${C.line}`,
        transform: `translateX(-50%) rotate(${below ? 225 : 45}deg)`,
      }}
    />
    <div
      style={{
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: C.muted,
        marginBottom: 10,
      }}
    >
      {header}
    </div>
    {children}
  </div>
);

const Field: React.FC<{k: string; raw: string; clean?: string; flip?: number}> = ({k, raw, clean, flip = 0}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12, height: 40, fontSize: 21}}>
    <span style={{width: 78, color: C.muted, fontWeight: 500}}>{k}</span>
    <span
      style={{
        position: 'relative',
        flex: 1,
        height: 34,
        borderRadius: 8,
        background: interpolateColors(flip, [0, 1], ['#F2F2F6', BLUE_SOFT]),
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 12,
          top: 2,
          color: C.ink,
          opacity: 1 - flip,
          transform: `translateY(${-14 * flip}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {raw}
      </span>
      {clean && (
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: 2,
            color: C.blue,
            fontWeight: 600,
            opacity: flip,
            transform: `translateY(${14 * (1 - flip)}px)`,
            whiteSpace: 'nowrap',
          }}
        >
          {clean}
        </span>
      )}
    </span>
  </div>
);

const Pill: React.FC<{p: number; filled?: boolean; children: React.ReactNode; style?: React.CSSProperties}> = ({
  p,
  filled,
  children,
  style,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 14px',
      borderRadius: 999,
      fontSize: 19,
      fontWeight: 600,
      background: filled ? C.blue : C.card,
      color: filled ? '#FFFFFF' : C.ink,
      border: `2px solid ${filled ? C.blue : C.line}`,
      opacity: Math.min(1, p * 1.5),
      transform: `scale(${0.7 + 0.3 * p})`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const N8nScenario: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pop = usePop();

  // ----- Camera (canvas layer only) -----
  const camKeys = [3.5, 5.0, 12.6, 14.0, 21.8, 23.2, 32.6, 33.4, 41.8, 42.6];
  const camX = interpolate(t, camKeys, [960, 800, 800, 880, 880, 1000, 1000, 1060, 1060, 960], {
    ...CLAMP,
    easing: easeInOut,
  });
  const camY = interpolate(t, [32.6, 33.4, 41.8, 42.6], [540, 500, 500, 540], {...CLAMP, easing: easeInOut});
  const camS = interpolate(t, [3.5, 5.0, 41.8, 42.6], [1, 1.06, 1.06, 1], {...CLAMP, easing: easeInOut});

  // ----- Global fades -----
  const introOut = ramp(t, 3.0, 3.6);
  const canvasIn = ramp(t, 3.2, 4.0);
  const stageOut = ramp(t, 46.2, 46.9);
  const endFade = ramp(t, 49.3, 50, easeInOut);

  // ----- Connectors -----
  const draw = (id: PathId) => ramp(t, DRAW[id][0], DRAW[id][1], easeInOut);
  const lit = (id: PathId) =>
    Math.max(
      0,
      ...TOKENS.filter((k) => k.path === id && !k.recap).map((k) =>
        interpolate(t, [k.t0, k.t1], [0, 1], {...CLAMP, easing: easeInOut}),
      ),
    );
  const token = TOKENS.find((k) => t >= k.t0 && t < k.t1 + 0.12);
  let tokenPt: {x: number; y: number} | null = null;
  if (token) {
    const p = interpolate(t, [token.t0, token.t1], [0, 1], {...CLAMP, easing: easeInOut});
    tokenPt = getPointAtLength(PATHS[token.path], p * LENGTHS[token.path]);
  }
  const tokenFade = token ? 1 - ramp(t, token.t1, token.t1 + 0.12) : 0;

  // ----- Step indicator -----
  const stepIdx = STEP_STARTS.findIndex((s, i) => t >= s && (i === STEP_STARTS.length - 1 || t < STEP_STARTS[i + 1]));

  // ----- Cards -----
  const trigCard = windowed(t, 5.6, 12.9, 0.35);
  const setCard = windowed(t, 14.5, 22.1, 0.35);
  const ifCard = windowed(t, 23.8, 32.9, 0.35);
  const slackCard = windowed(t, 34.0, 37.3, 0.3);
  const sheetsCard = windowed(t, 38.6, 41.8, 0.3);
  const flip = (a: number) => ramp(t, a, a + 0.45, easeInOut);

  const appear = (id: NodeId) => pop(APPEAR[id]);
  const handleOp = (id: NodeId) => Math.min(1, appear(id) * 1.5);

  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, color: C.ink}}>
      {/* ================= SOUND CUES ================= */}
      {CUES.map(({at, sfx}, i) => (
        <Sequence key={i} from={Math.round(at * fps)} durationInFrames={Math.round(1.2 * fps)} layout="none">
          <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={0.85} />
        </Sequence>
      ))}

      {/* ================= INTRO ================= */}
      {t < 3.8 && (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1 - introOut,
            transform: `translateY(${-40 * introOut}px)`,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: C.blue,
              opacity: ramp(t, 0.2, 0.7),
              marginBottom: 24,
            }}
          >
            Bloc par bloc
          </div>
          <div style={{display: 'flex', gap: 28, fontSize: 96, fontWeight: 700, letterSpacing: -1}}>
            {['Anatomie', 'd’un', 'scénario', 'n8n'].map((w, i) => {
              const p = pop(0.35 + i * 0.15);
              return (
                <span
                  key={w}
                  style={{
                    position: 'relative',
                    opacity: Math.min(1, p * 1.5),
                    transform: `translateY(${(1 - p) * 40}px)`,
                    color: w === 'n8n' ? C.blue : C.ink,
                  }}
                >
                  {w}
                  {w === 'n8n' && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: -10,
                        height: 10,
                        borderRadius: 5,
                        background: C.blue,
                        transformOrigin: 'left',
                        transform: `scaleX(${ramp(t, 1.3, 1.9, easeInOut)})`,
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 34,
              fontSize: 32,
              color: C.muted,
              opacity: ramp(t, 1.5, 2.1),
              transform: `translateY(${(1 - ramp(t, 1.5, 2.1)) * 16}px)`,
            }}
          >
            Exemple : traiter automatiquement un nouveau lead
          </div>
        </AbsoluteFill>
      )}

      {/* ================= STAGE ================= */}
      <AbsoluteFill style={{opacity: canvasIn * (1 - stageOut), transform: `scale(${1 - 0.04 * stageOut})`}}>
        {/* Dotted canvas, like the n8n editor */}
        <AbsoluteFill
          style={{
            backgroundImage: 'radial-gradient(circle, #DCDCE4 1.6px, transparent 1.8px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* ---------- Canvas layer (camera) ---------- */}
        <AbsoluteFill
          style={{
            transformOrigin: '0 0',
            transform: `translate(960px, 540px) scale(${camS}) translate(${-camX}px, ${-camY}px)`,
          }}
        >
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            {(Object.keys(PATHS) as PathId[]).map((id) => {
              const d = PATHS[id];
              const dp = draw(id);
              const lp = lit(id);
              const endY = id === 'PT' ? 320 : id === 'PF' ? 680 : ROW_Y;
              return (
                <g key={id} opacity={dp > 0 ? 1 : 0}>
                  <path
                    d={d}
                    fill="none"
                    stroke={GREY_LINE}
                    strokeWidth={4}
                    strokeLinecap="round"
                    {...evolvePath(dp, d)}
                  />
                  {lp > 0 && (
                    <path
                      d={d}
                      fill="none"
                      stroke={C.blue}
                      strokeWidth={4}
                      strokeLinecap="round"
                      {...evolvePath(lp, d)}
                    />
                  )}
                  <Arrowhead
                    x={(id === 'P1' ? 720 - HALF : id === 'P2' ? 1100 - HALF : OUT_IN_X) - 2}
                    y={endY}
                    color={lp > 0.98 ? C.blue : GREY_LINE}
                    opacity={dp > 0.95 ? 1 : 0}
                  />
                </g>
              );
            })}

            {/* Handles */}
            <Handle x={340 + HALF} y={ROW_Y} opacity={handleOp('trigger')} lit={doneLevel(t, 'trigger')} />
            <Handle x={720 + HALF} y={ROW_Y} opacity={handleOp('set')} lit={doneLevel(t, 'set')} />
            <Handle x={IF_OUT_X} y={ROW_Y - 26} opacity={handleOp('if')} lit={lit('PT')} />
            <Handle x={IF_OUT_X} y={ROW_Y + 26} opacity={handleOp('if')} lit={lit('PF')} />

            {/* Travelling data item */}
            {tokenPt && (
              <g opacity={tokenFade}>
                <circle cx={tokenPt.x} cy={tokenPt.y} r={24} fill={C.blue} opacity={0.18} />
                <circle cx={tokenPt.x} cy={tokenPt.y} r={12} fill={C.blue} />
              </g>
            )}
          </svg>

          {/* Branch labels */}
          {[
            {label: 'vrai', y: 398, p: pop(26.4), on: lit('PT')},
            {label: 'faux', y: 602, p: pop(26.5), on: lit('PF')},
          ].map(({label, y, p, on}) => (
            <div
              key={label}
              style={{position: 'absolute', left: 1340, top: y, transform: 'translate(-50%, -50%)'}}
            >
              <Pill p={p} filled={on > 0.5}>
                {label}
              </Pill>
            </div>
          ))}

          {/* Nodes */}
          {(Object.keys(NODES) as NodeId[]).map((id) =>
            t >= APPEAR[id] - 0.05 ? <Node key={id} id={id} t={t} appear={appear(id)} /> : null,
          )}

          {/* ----- Data cards ----- */}
          {trigCard > 0 && (
            <Card x={340} anchorY={ROW_Y - HALF - 34} p={trigCard} width={380} header="Données reçues">
              <Field k="nom" raw="jean DUPONT " />
              <Field k="email" raw="JEAN@Mail.COM" />
              <Field k="budget" raw="« 1 500 € »" />
            </Card>
          )}
          {setCard > 0 && (
            <Card x={720} anchorY={ROW_Y - HALF - 34} p={setCard} width={380} header="Données transformées">
              <Field k="nom" raw="jean DUPONT " clean="Jean Dupont" flip={flip(15.4)} />
              <Field k="email" raw="JEAN@Mail.COM" clean="jean@mail.com" flip={flip(16.0)} />
              <Field k="budget" raw="« 1 500 € »" clean="1500  (nombre)" flip={flip(16.6)} />
            </Card>
          )}
          {ifCard > 0 && (
            <Card x={1100} anchorY={ROW_Y - HALF - 34} p={ifCard} width={360} header="Test">
              <div style={{fontSize: 24, fontWeight: 600, height: 40, display: 'flex', alignItems: 'center'}}>
                budget &gt; 1 000 ?
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 14, height: 44, fontSize: 22}}>
                <span
                  style={{
                    opacity: ramp(t, 24.8, 25.2),
                    color: C.muted,
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  1 500 &gt; 1 000
                </span>
                <span style={{opacity: ramp(t, 25.4, 25.7), color: C.muted}}>→</span>
                <Pill p={pop(25.4)} filled>
                  vrai
                </Pill>
              </div>
            </Card>
          )}
          {slackCard > 0 && (
            <Card x={1620} anchorY={226} pointerDx={-40} p={slackCard} width={580} header="Message · #ventes">
              <div style={{fontSize: 21, lineHeight: 1.35, whiteSpace: 'nowrap'}}>
                Nouveau lead chaud : <b>Jean Dupont</b>, budget <b style={{color: C.blue}}>1 500 €</b>
              </div>
            </Card>
          )}
          {sheetsCard > 0 && (
            <Card x={1640} anchorY={586} pointerDx={-60} p={sheetsCard} width={540} header="Ligne ajoutée · Leads à relancer">
              <div style={{fontSize: 21, lineHeight: 1.35, whiteSpace: 'nowrap'}}>
                <b>Léa Martin</b> · lea@mail.com · <b style={{color: C.blue}}>400 €</b>
              </div>
            </Card>
          )}
        </AbsoluteFill>

        {/* ---------- Screen-space UI ---------- */}

        {/* Step indicator */}
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 70,
            transform: `translate(-50%, -50%) translateY(${(1 - ramp(t, 3.8, 4.4)) * -20}px)`,
            opacity: ramp(t, 3.8, 4.4),
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {STEPS.map((s, i) => {
            const current = stepIdx === i ? 1 : 0;
            const done = stepIdx > i ? 1 : 0;
            const recap = stepIdx === 4;
            return (
              <React.Fragment key={s}>
                {i > 0 && (
                  <div style={{width: 36, height: 3, borderRadius: 2, background: done || current || recap ? BLUE_LINE : C.line}} />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 18px 8px 8px',
                    borderRadius: 999,
                    background: current ? C.blue : C.card,
                    border: `2px solid ${current ? C.blue : done || recap ? BLUE_LINE : C.line}`,
                    color: current ? '#FFFFFF' : done || recap ? C.blue : C.muted,
                    fontSize: 20,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      background: current ? '#FFFFFF' : done || recap ? BLUE_SOFT : '#F2F2F6',
                      color: current || done || recap ? C.blue : C.muted,
                    }}
                  >
                    {done || recap ? '✓' : i + 1}
                  </span>
                  {s}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Captions */}
        {CAPTIONS.map(({a, b, n, title, text}) => {
          const p = windowed(t, a, b, 0.3);
          if (p <= 0) return null;
          return (
            <div
              key={a}
              style={{
                position: 'absolute',
                left: 960,
                top: 965,
                transform: `translate(-50%, -50%) translateY(${(1 - p) * 16}px)`,
                opacity: p,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '16px 30px 16px 16px',
                borderRadius: 999,
                background: C.card,
                border: `2px solid ${C.line}`,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  minWidth: 52,
                  height: 52,
                  borderRadius: 26,
                  padding: n === null ? '0 18px' : 0,
                  background: C.blue,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: n === null ? 20 : 26,
                  fontWeight: 700,
                }}
              >
                {n ?? title}
              </span>
              {n !== null && <span style={{fontSize: 28, fontWeight: 700, color: C.blue}}>{title}</span>}
              {n !== null && <span style={{width: 2, height: 30, background: C.line}} />}
              <span style={{fontSize: 28, fontWeight: n === null ? 600 : 400, color: C.ink}}>{text}</span>
            </div>
          );
        })}

        {/* Execution badge */}
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 190,
            transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * pop(45.0)})`,
            opacity: Math.min(1, pop(45.0) * 1.5),
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 28px',
            borderRadius: 14,
            background: C.blue,
            color: '#FFFFFF',
            fontSize: 26,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          ✓ Exécution réussie
        </div>
      </AbsoluteFill>

      {/* ================= OUTRO ================= */}
      {t >= 46.4 && <Outro t={t} pop={pop} />}

      {/* Final fade */}
      <AbsoluteFill style={{background: C.bg, opacity: endFade}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Outro
// ---------------------------------------------------------------------------

const Outro: React.FC<{t: number; pop: (s: number) => number}> = ({t, pop}) => {
  const words: {w: string; at: number; blue?: boolean}[] = [
    {w: 'Chaque', at: 46.6},
    {w: 'bloc', at: 46.72},
    {w: 'a', at: 46.84},
    {w: 'un', at: 46.96},
    {w: 'seul', at: 47.08, blue: true},
    {w: 'rôle.', at: 47.2, blue: true},
  ];
  const underline = ramp(t, 47.5, 48.1, easeInOut);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', gap: 26, fontSize: 92, fontWeight: 700, letterSpacing: -1}}>
        {words.map(({w, at, blue}, i) => {
          const p = pop(at);
          return (
            <span
              key={w}
              style={{
                position: 'relative',
                color: blue ? C.blue : C.ink,
                opacity: Math.min(1, p * 1.5),
                transform: `translateY(${(1 - p) * 36}px)`,
              }}
            >
              {w}
              {i === words.length - 1 && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -6,
                    height: 10,
                    borderRadius: 5,
                    background: C.blue,
                    transformOrigin: 'left',
                    transform: `scaleX(${underline})`,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 52, alignItems: 'center'}}>
        {STEPS.map((s, i) => {
          const p = pop(47.9 + i * 0.15);
          return (
            <React.Fragment key={s}>
              {i > 0 && <span style={{color: C.muted, fontSize: 26, opacity: Math.min(1, p * 1.5)}}>→</span>}
              <span
                style={{
                  padding: '10px 24px',
                  borderRadius: 999,
                  border: `2px solid ${C.blue}`,
                  background: BLUE_SOFT,
                  fontSize: 26,
                  fontWeight: 600,
                  color: C.ink,
                  opacity: Math.min(1, p * 1.5),
                  transform: `translateY(${(1 - p) * 16}px)`,
                }}
              >
                {s}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
