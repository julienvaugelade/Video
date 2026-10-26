import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {C, FONT} from './theme';

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

const rad = (deg: number) => (deg * Math.PI) / 180;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const MID_Y = 600;

// Left: linear automation
const L_NODES = [
  {x: 180, label: 'Déclencheur'},
  {x: 480, label: 'Action'},
  {x: 780, label: 'Fin'},
];
const L_PILL_W = 200;
const L_RUN_START = 7;
const L_RUN_PERIOD = 1.5;
const L_RUN_MOVE = 1.0;
const L_RUN_LAST = 35.0;

// Right: agent loop
const CX = 1440;
const CY = MID_Y;
const R = 230;
const R_NODES = [
  {angle: -90, label: 'Observer', off: 24},
  {angle: 0, label: 'Décider', off: 9},
  {angle: 90, label: 'Agir', off: 24},
  {angle: 180, label: 'Vérifier', off: 9},
];
const R_PILL_W = 180;
const PILL_H = 64;

const ringPoint = (deg: number) => ({
  x: CX + R * Math.cos(rad(deg)),
  y: CY + R * Math.sin(rad(deg)),
});

const arcPath = (i: number) => {
  const from = R_NODES[i];
  const toAngle = from.angle + 90;
  const to = R_NODES[(i + 1) % 4];
  const a0 = from.angle + from.off + 2;
  const a1 = toAngle - to.off - 5;
  const p0 = ringPoint(a0);
  const p1 = ringPoint(a1);
  return {d: `M ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y}`, endAngle: a1, end: p1};
};
const ARCS = [0, 1, 2, 3].map(arcPath);

// Branch: "Vérifier" → back to "Décider" when the check fails
const BRANCH_D = `M ${CX - R + R_PILL_W / 2 + 4} ${CY - 12} Q ${CX} ${CY - 110} ${
  CX + R - R_PILL_W / 2 - 10
} ${CY - 14}`;
const BRANCH_LEN = getLength(BRANCH_D);

// ---------------------------------------------------------------------------
// Agent timeline
// ---------------------------------------------------------------------------

type Seg =
  | {t0: number; t1: number; k: 'dwell'; n: number}
  | {t0: number; t1: number; k: 'arc'; n: number}
  | {t0: number; t1: number; k: 'branch'};

const FAIL_AT = 21.5;
const SUCCESS_AT = 27.6;

const AGENT: Seg[] = (() => {
  const s: Seg[] = [
    {t0: 15.6, t1: 16.4, k: 'dwell', n: 0},
    {t0: 16.4, t1: 17.4, k: 'arc', n: 0},
    {t0: 17.4, t1: 18.2, k: 'dwell', n: 1},
    {t0: 18.2, t1: 19.2, k: 'arc', n: 1},
    {t0: 19.2, t1: 20.0, k: 'dwell', n: 2},
    {t0: 20.0, t1: 21.0, k: 'arc', n: 2},
    {t0: 21.0, t1: 22.6, k: 'dwell', n: 3}, // fails
    {t0: 22.6, t1: 23.6, k: 'branch'},
    {t0: 23.6, t1: 24.4, k: 'dwell', n: 1},
    {t0: 24.4, t1: 25.4, k: 'arc', n: 1},
    {t0: 25.4, t1: 26.2, k: 'dwell', n: 2},
    {t0: 26.2, t1: 27.2, k: 'arc', n: 2},
    {t0: 27.2, t1: 28.2, k: 'dwell', n: 3}, // succeeds
    {t0: 28.2, t1: 29.2, k: 'arc', n: 3},
  ];
  // Then it keeps looping, smoothly
  let t = 29.2;
  let n = 0;
  while (t < 38.5) {
    s.push({t0: t, t1: t + 0.5, k: 'dwell', n});
    s.push({t0: t + 0.5, t1: t + 1.3, k: 'arc', n});
    t += 1.3;
    n = (n + 1) % 4;
  }
  return s;
})();

const agentAt = (t: number) => {
  const seg = AGENT.find((s) => t >= s.t0 && t < s.t1);
  const active = [0, 0, 0, 0];
  if (!seg) return null;
  if (seg.k === 'dwell') {
    active[seg.n] = 1;
    const c = R_NODES[seg.n];
    return {...ringPoint(c.angle), active, branch: false};
  }
  const p = interpolate(t, [seg.t0, seg.t1], [0, 1], {...CLAMP, easing: easeInOut});
  if (seg.k === 'arc') {
    active[seg.n] = interpolate(p, [0, 0.3], [1, 0], CLAMP);
    active[(seg.n + 1) % 4] = interpolate(p, [0.75, 1], [0, 1], CLAMP);
    return {...ringPoint(R_NODES[seg.n].angle + 90 * p), active, branch: false};
  }
  active[3] = interpolate(p, [0, 0.25], [1, 0], CLAMP);
  active[1] = interpolate(p, [0.8, 1], [0, 1], CLAMP);
  return {...getPointAtLength(BRANCH_D, p * BRANCH_LEN), active, branch: true};
};

// ---------------------------------------------------------------------------
// UI pieces
// ---------------------------------------------------------------------------

const Pill: React.FC<{
  x: number;
  y: number;
  w: number;
  label: string;
  appear: number;
  active: number;
  accent: string;
  activeText: string;
}> = ({x, y, w, label, appear, active, accent, activeText}) => {
  const bg = interpolateColors(active, [0, 1], [C.card, accent]);
  const border = interpolateColors(active, [0, 1], [C.line, accent]);
  const color = interpolateColors(active, [0, 1], [C.ink, activeText]);
  const scale = (0.6 + 0.4 * appear) * (1 + 0.07 * active);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: PILL_H,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: Math.min(1, appear * 1.4),
        background: bg,
        border: `2.5px solid ${border}`,
        borderRadius: PILL_H / 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 600,
        color,
        boxShadow: `0 ${6 + 10 * active}px ${18 + 20 * active}px rgba(28,28,46,${
          0.06 + 0.1 * active
        })`,
      }}
    >
      {label}
    </div>
  );
};

const Chip: React.FC<{
  label: string;
  appear: number;
  tone: 'yellow' | 'blue';
}> = ({label, appear, tone}) => (
  <div
    style={{
      opacity: Math.min(1, appear * 1.5),
      transform: `translateY(${(1 - appear) * 18}px) scale(${0.85 + 0.15 * appear})`,
      padding: '10px 24px',
      borderRadius: 999,
      fontSize: 24,
      fontWeight: 600,
      color: C.ink,
      background: tone === 'yellow' ? 'rgba(249,198,35,0.18)' : 'rgba(78,78,234,0.1)',
      border: `2px solid ${tone === 'yellow' ? C.yellow : C.blue}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        background: tone === 'yellow' ? C.yellow : C.blue,
      }}
    />
    {label}
  </div>
);

const Arrowhead: React.FC<{x: number; y: number; angle: number; color: string; opacity: number}> = ({
  x,
  y,
  angle,
  color,
  opacity,
}) => (
  <path
    d="M 6 0 L -10 -8 L -6 0 L -10 8 Z"
    fill={color}
    opacity={opacity}
    transform={`translate(${x} ${y}) rotate(${angle})`}
  />
);

const Caption: React.FC<{text: React.ReactNode; opacity: number; x: number; y: number}> = ({
  text,
  opacity,
  x,
  y,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) translateY(${(1 - opacity) * 12}px)`,
      opacity,
      fontSize: 28,
      fontWeight: 500,
      color: C.ink,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const AutomationVsAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pop = usePop();

  // ----- Intro -----
  const introOut = ramp(t, 3.0, 3.6);
  const titleWords = [
    {w: 'Automatisation', at: 0.3, color: C.ink, weight: 700, bar: C.yellow},
    {w: 'vs', at: 0.55, color: C.muted, weight: 500, bar: null},
    {w: 'Agent IA', at: 0.8, color: C.ink, weight: 700, bar: C.blue},
  ];

  // ----- Main stage -----
  const outro = ramp(t, 36.3, 37.0);
  const stageOpacity = 1 - outro;
  const stageScale = 1 - 0.04 * outro;
  const divider = ramp(t, 3.4, 4.3) * (1 - ramp(t, 36.4, 37.0));

  // Left run state
  const lMaxRuns = Math.floor((L_RUN_LAST - L_RUN_START) / L_RUN_PERIOD) + 1;
  const lRuns =
    t < L_RUN_START + L_RUN_MOVE
      ? 0
      : Math.min(Math.floor((t - L_RUN_START - L_RUN_MOVE) / L_RUN_PERIOD) + 1, lMaxRuns);
  let lx: number | null = null;
  let lLocal = -1;
  if (t >= L_RUN_START) {
    const idx = Math.floor((t - L_RUN_START) / L_RUN_PERIOD);
    if (idx < lMaxRuns) {
      lLocal = t - L_RUN_START - idx * L_RUN_PERIOD;
      if (lLocal < L_RUN_MOVE) {
        lx = interpolate(lLocal, [0, L_RUN_MOVE], [L_NODES[0].x, L_NODES[2].x], {
          ...CLAMP,
          easing: easeInOut,
        });
      }
    }
  }
  const lActive = L_NODES.map((n, i) => {
    if (lLocal < 0) return 0;
    if (lx !== null) return Math.max(0, 1 - Math.abs(lx - n.x) / 110);
    if (i === 2) return 1 - ramp(lLocal, L_RUN_MOVE + 0.25, L_RUN_PERIOD);
    return 0;
  });
  const lCheck = lLocal >= L_RUN_MOVE ? pop(t - lLocal + L_RUN_MOVE) : 0;
  const lCheckOut = lLocal >= 0 ? 1 - ramp(lLocal, L_RUN_PERIOD - 0.2, L_RUN_PERIOD) : 0;

  // Right agent state
  const agent = agentAt(t);
  const rActive = agent ? agent.active : [0, 0, 0, 0];
  const failing = t >= FAIL_AT && t < 22.9;
  const failBadge = pop(FAIL_AT) * (1 - ramp(t, 23.0, 23.4));
  const okBadge = pop(SUCCESS_AT) * (1 - ramp(t, 29.0, 29.4));
  const branchDraw = ramp(t, 22.0, 22.6, easeInOut);
  const branchFade = 1 - 0.55 * ramp(t, 28.6, 29.6);
  const branchLabel = pop(22.2) * (1 - 0.45 * ramp(t, 28.6, 29.6));

  const rightCaptions: {a: number; b: number; text: React.ReactNode}[] = [
    {a: 15.6, b: 17.4, text: <><b>Observer</b> : analyser la situation</>},
    {a: 17.4, b: 19.2, text: <><b>Décider</b> : choisir la meilleure action</>},
    {a: 19.2, b: 21.0, text: <><b>Agir</b> : passer à l’action</>},
    {a: 21.0, b: 22.6, text: <><b>Vérifier</b> : le résultat est-il bon ?</>},
    {a: 22.6, b: 24.4, text: <>Échec → il revient en arrière et ajuste</>},
    {a: 24.4, b: 27.2, text: <>Nouvelle décision, nouvelle action</>},
    {a: 27.2, b: 29.3, text: <><b>Vérifier</b> : cette fois, c’est bon</>},
  ];

  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, color: C.ink}}>
      <Audio src={staticFile('voix-off-calee.mp3')} />
      {/* ================= INTRO ================= */}
      {t < 3.8 && (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1 - introOut,
            transform: `translateY(${-50 * introOut}px)`,
          }}
        >
          <div style={{display: 'flex', gap: 34, alignItems: 'baseline'}}>
            {titleWords.map(({w, at, color, weight, bar}) => {
              const p = pop(at);
              return (
                <div
                  key={w}
                  style={{
                    position: 'relative',
                    fontSize: w === 'vs' ? 64 : 96,
                    fontWeight: weight,
                    color,
                    opacity: Math.min(1, p * 1.5),
                    transform: `translateY(${(1 - p) * 40}px)`,
                    letterSpacing: -1,
                  }}
                >
                  {w}
                  {bar && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: -16,
                        height: 10,
                        borderRadius: 5,
                        background: bar,
                        transformOrigin: 'left',
                        transform: `scaleX(${ramp(t, 1.2, 1.9, easeInOut)})`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 32,
              fontWeight: 400,
              color: C.muted,
              opacity: ramp(t, 1.5, 2.1),
              transform: `translateY(${(1 - ramp(t, 1.5, 2.1)) * 16}px)`,
            }}
          >
            Deux façons de confier une tâche à une machine
          </div>
        </AbsoluteFill>
      )}

      {/* ================= STAGE ================= */}
      <AbsoluteFill style={{opacity: stageOpacity, transform: `scale(${stageScale})`}}>
        {/* Divider */}
        <div
          style={{
            position: 'absolute',
            left: 959,
            top: 130,
            width: 2,
            height: 860,
            background: C.line,
            transform: `scaleY(${divider})`,
          }}
        />

        {/* Headers */}
        {[
          {x: 480, label: 'Automatisation classique', sub: 'Un chemin fixe', at: 3.9, tone: 'yellow'},
          {x: 1440, label: 'Agent IA', sub: 'Une boucle de raisonnement', at: 4.3, tone: 'blue'},
        ].map(({x, label, sub, at, tone}) => {
          const p = pop(at);
          const s = ramp(t, at + 0.4, at + 0.9);
          return (
            <React.Fragment key={label}>
              <div
                style={{
                  position: 'absolute',
                  left: x,
                  top: 180,
                  transform: `translate(-50%, -50%) translateY(${(1 - p) * 24}px)`,
                  opacity: Math.min(1, p * 1.5),
                  padding: '12px 30px',
                  borderRadius: 999,
                  background: tone === 'yellow' ? C.yellow : C.blue,
                  color: tone === 'yellow' ? C.ink : '#FFFFFF',
                  fontSize: 32,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: x,
                  top: 252,
                  transform: `translate(-50%, -50%) translateY(${(1 - s) * 12}px)`,
                  opacity: s,
                  fontSize: 26,
                  color: C.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                {sub}
              </div>
            </React.Fragment>
          );
        })}

        {/* ---------- Vector layer: paths & tokens ---------- */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <mask id="branchMask">
              <path
                d={BRANCH_D}
                fill="none"
                stroke="#fff"
                strokeWidth={14}
                {...evolvePath(branchDraw, BRANCH_D)}
              />
            </mask>
          </defs>

          {/* Left arrows */}
          {[0, 1].map((i) => {
            const x0 = L_NODES[i].x + L_PILL_W / 2 + 10;
            const x1 = L_NODES[i + 1].x - L_PILL_W / 2 - 14;
            const p = ramp(t, 5.3 + i * 0.4, 5.8 + i * 0.4, easeInOut);
            return (
              <g key={i} opacity={p > 0 ? 1 : 0}>
                <line
                  x1={x0}
                  y1={MID_Y}
                  x2={x0 + (x1 - x0) * p}
                  y2={MID_Y}
                  stroke={C.ink}
                  strokeOpacity={0.35}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <Arrowhead
                  x={x1 + 4}
                  y={MID_Y}
                  angle={0}
                  color={C.ink}
                  opacity={p > 0.95 ? 0.45 : 0}
                />
              </g>
            );
          })}

          {/* Left token */}
          {lx !== null && (
            <g>
              <circle cx={lx} cy={MID_Y} r={22} fill={C.yellow} opacity={0.25} />
              <circle cx={lx} cy={MID_Y} r={11} fill={C.yellow} />
            </g>
          )}

          {/* Right loop arcs */}
          {ARCS.map((arc, i) => {
            const p = ramp(t, 13.8 + i * 0.35, 14.35 + i * 0.35, easeInOut);
            return (
              <g key={i} opacity={p > 0 ? 1 : 0}>
                <path
                  d={arc.d}
                  fill="none"
                  stroke={C.blue}
                  strokeOpacity={0.55}
                  strokeWidth={3}
                  strokeLinecap="round"
                  {...evolvePath(p, arc.d)}
                />
                <Arrowhead
                  x={arc.end.x}
                  y={arc.end.y}
                  angle={arc.endAngle + 90}
                  color={C.blue}
                  opacity={p > 0.95 ? 0.75 : 0}
                />
              </g>
            );
          })}

          {/* Branch (retry) */}
          <g opacity={branchFade}>
            <path
              d={BRANCH_D}
              fill="none"
              stroke={C.yellow}
              strokeWidth={4}
              strokeDasharray="12 10"
              strokeLinecap="round"
              mask="url(#branchMask)"
            />
            <Arrowhead
              x={CX + R - R_PILL_W / 2 - 8}
              y={CY - 15}
              angle={33}
              color={C.yellow}
              opacity={branchDraw > 0.97 ? 1 : 0}
            />
          </g>

          {/* Right token */}
          {agent && (
            <g>
              <circle
                cx={agent.x}
                cy={agent.y}
                r={22}
                fill={agent.branch ? C.yellow : C.blue}
                opacity={0.22}
              />
              <circle cx={agent.x} cy={agent.y} r={11} fill={agent.branch ? C.yellow : C.blue} />
            </g>
          )}
        </svg>

        {/* ---------- Left nodes ---------- */}
        {L_NODES.map((n, i) => (
          <Pill
            key={n.label}
            x={n.x}
            y={MID_Y}
            w={L_PILL_W}
            label={n.label}
            appear={pop(5.0 + i * 0.4)}
            active={lActive[i]}
            accent={C.yellow}
            activeText={C.ink}
          />
        ))}

        {/* Run counter */}
        <div
          style={{
            position: 'absolute',
            left: 480,
            top: 460,
            transform: 'translate(-50%, -50%)',
            opacity: ramp(t, 6.8, 7.3),
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{fontSize: 22, color: C.muted, fontWeight: 500}}>Exécutions</span>
          <span style={{fontSize: 44, fontWeight: 700, minWidth: 60, fontVariantNumeric: 'tabular-nums'}}>
            {lRuns}
          </span>
        </div>

        {/* Check above "Fin" */}
        <div
          style={{
            position: 'absolute',
            left: L_NODES[2].x,
            top: MID_Y - 74,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: C.yellow,
            color: C.ink,
            fontSize: 22,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translate(-50%, -50%) scale(${lCheck}) translateY(${(1 - lCheck) * 10}px)`,
            opacity: lCheck * lCheckOut,
          }}
        >
          ✓
        </div>

        {/* Left qualities */}
        <div
          style={{
            position: 'absolute',
            left: 480,
            top: 740,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 18,
          }}
        >
          <Chip label="Simple" appear={pop(10.9)} tone="yellow" />
          <Chip label="Rapide" appear={pop(11.7)} tone="yellow" />
          <Chip label="Prévisible" appear={pop(12.65)} tone="yellow" />
        </div>
        <Caption
          x={480}
          y={940}
          opacity={ramp(t, 33.4, 34.0)}
          text={
            <>
              Même entrée, <b>même chemin</b>. À chaque fois.
            </>
          }
        />

        {/* ---------- Right nodes ---------- */}
        {R_NODES.map((n, i) => {
          const pt = ringPoint(n.angle);
          const accent = i === 3 && failing ? C.yellow : C.blue;
          return (
            <Pill
              key={n.label}
              x={pt.x}
              y={pt.y}
              w={R_PILL_W}
              label={n.label}
              appear={pop(13.6 + i * 0.35)}
              active={rActive[i]}
              accent={accent}
              activeText={accent === C.yellow ? C.ink : '#FFFFFF'}
            />
          );
        })}

        {/* Branch label */}
        <div
          style={{
            position: 'absolute',
            left: CX,
            top: CY - 118,
            transform: `translate(-50%, -50%) scale(${0.8 + 0.2 * branchLabel})`,
            opacity: Math.min(1, branchLabel * 1.4) * (t < 22.2 ? 0 : 1),
            fontSize: 21,
            fontWeight: 600,
            color: C.ink,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{color: '#D9A300', fontSize: 24}}>↺</span> Retour en arrière
        </div>

        {/* Verification badges */}
        {[
          {p: failBadge, bg: C.yellow, color: C.ink, text: '✕  Vérification échouée'},
          {p: okBadge, bg: C.blue, color: '#FFFFFF', text: '✓  Résultat validé'},
        ].map(({p, bg, color, text}) => (
          <div
            key={text}
            style={{
              position: 'absolute',
              left: CX,
              top: CY + 92,
              transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * p})`,
              opacity: Math.min(1, p * 1.5),
              padding: '12px 26px',
              borderRadius: 14,
              background: bg,
              color,
              fontSize: 25,
              fontWeight: 600,
              whiteSpace: 'pre',
              boxShadow: '0 10px 30px rgba(28,28,46,0.12)',
            }}
          >
            {text}
          </div>
        ))}

        {/* Right step captions */}
        {rightCaptions.map(({a, b, text}) => (
          <Caption key={a} x={CX} y={940} opacity={windowed(t, a, b, 0.25)} text={text} />
        ))}

        {/* Right qualities */}
        <div
          style={{
            position: 'absolute',
            left: CX,
            top: 940,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 18,
          }}
        >
          <Chip label="S’adapte" appear={pop(29.6)} tone="blue" />
          <Chip label="Se corrige" appear={pop(30.5)} tone="blue" />
          <Chip label="Vise un objectif" appear={pop(31.6)} tone="blue" />
        </div>
      </AbsoluteFill>

      {/* ================= OUTRO ================= */}
      {t >= 37 && <Outro t={t} pop={pop} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Outro
// ---------------------------------------------------------------------------

const Word: React.FC<{p: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  p,
  children,
  style,
}) => (
  <span
    style={{
      display: 'inline-block',
      position: 'relative',
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 36}px)`,
      ...style,
    }}
  >
    {children}
  </span>
);

const Outro: React.FC<{t: number; pop: (s: number) => number}> = ({t, pop}) => {
  const underline = ramp(t, 38.4, 39.0, easeInOut);
  const marker = ramp(t, 40.0, 40.6, easeInOut);
  const gap = {marginRight: 26};
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: C.muted,
          marginBottom: 34,
          opacity: ramp(t, 37.2, 37.8),
        }}
      >
        En résumé
      </div>
      <div style={{fontSize: 96, fontWeight: 700, lineHeight: 1.3, textAlign: 'center', letterSpacing: -1}}>
        <div>
          <Word p={pop(37.6)} style={gap}>
            Un
          </Word>
          <Word p={pop(37.75)} style={gap}>
            agent
          </Word>
          <Word p={pop(37.9)} style={{color: C.blue}}>
            décide
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 6,
                height: 10,
                borderRadius: 5,
                background: C.blue,
                transformOrigin: 'left',
                transform: `scaleX(${underline})`,
              }}
            />
          </Word>
          <Word p={pop(37.9)}>,</Word>
        </div>
        <div>
          <Word p={pop(38.8)} style={gap}>
            une
          </Word>
          <Word p={pop(38.95)} style={gap}>
            automatisation
          </Word>
          <Word p={pop(39.1)}>
            <span
              style={{
                position: 'absolute',
                left: -12,
                right: -12,
                top: '22%',
                bottom: '10%',
                borderRadius: 12,
                background: C.yellow,
                transformOrigin: 'left',
                transform: `scaleX(${marker})`,
                zIndex: -1,
              }}
            />
            exécute
          </Word>
          <Word p={pop(39.1)}>.</Word>
        </div>
      </div>
    </AbsoluteFill>
  );
};
