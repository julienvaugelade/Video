import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from './theme';

// ---------------------------------------------------------------------------
// Palette (schematic: thin ink strokes, yellow accents on the gates only)
// ---------------------------------------------------------------------------

const K = {
  bg: '#FFFFFF',
  ink: '#2B3346',
  yellow: '#F9C623',
  soft: 'rgba(43,51,70,0.45)',
  faint: 'rgba(43,51,70,0.12)',
  paleYellow: '#FEF4D3',
};
const SW = 2; // stroke width

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

/** 0 → 1 between a and b (seconds), eased. */
const ramp = (t: number, a: number, b: number, easing = easeOut) =>
  interpolate(t, [a, b], [0, 1], {...CLAMP, easing});

/** Visible window: fades in at `a`, fades out at `b`. */
const windowed = (t: number, a: number, b: number, fade = 0.3) =>
  Math.min(ramp(t, a, a + fade), 1 - ramp(t, b - fade, b));

/** Piecewise keyframes, eased per segment. */
const keys = (t: number, times: number[], values: number[], easing = easeInOut) =>
  interpolate(t, times, values, {...CLAMP, easing});

/** Stroke "drawing" for a path of known length. */
const draw = (p: number, len: number) => ({
  strokeDasharray: len,
  strokeDashoffset: len * (1 - p),
});

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const TRACK_Y = 560;
const AGENT = {x: 230, y: TRACK_Y, r: 92};
const ACTION = {x: 1715, y: TRACK_Y, w: 230, h: 130};
const GATE_X = [640, 1000, 1360];
const GATE_HALF_W = 58; // half width of the frame
const GATE_TOP = 400;
const GATE_BOTTOM = 720;
const PANEL_HALF_W = 48;
const PANEL_TRAVEL = 150;
const CARD = {w: 300, h: 160, top: 210};
const REQ = {x: 230, y: 300, w: 340, h: 128};

const GATE_LABELS = ['Limite de budget', 'Validation humaine', 'Périmètre de données'];

// Packet stops just before each gate, then inside the action node
const STOP = [GATE_X[0] - 95, GATE_X[1] - 95, GATE_X[2] - 95];
const PACKET_START = AGENT.x + AGENT.r + 26;
const PACKET_END = ACTION.x;

// ---------------------------------------------------------------------------
// Timeline (seconds)
// ---------------------------------------------------------------------------

const TITLE = {in: 0.3, out: 3.7};
const BUILD = 3.8;
const PASS2 = 21.2; // switch of request
const REFUSE = 29.6; // gate 3 slams shut
const OUTRO = 34.8;

type GateRun = {check: [number, number]; open: number[]; openV: number[]; ok: boolean};

const PASS1_GATES: GateRun[] = [
  {check: [10.4, 11.8], open: [11.8, 12.3, 12.9, 13.3], openV: [0, 1, 1, 0], ok: true},
  {check: [13.1, 14.6], open: [14.6, 15.1, 15.7, 16.1], openV: [0, 1, 1, 0], ok: true},
  {check: [15.9, 17.4], open: [17.4, 17.9, 18.5, 18.9], openV: [0, 1, 1, 0], ok: true},
];
const PASS2_GATES: GateRun[] = [
  {check: [24.3, 25.2], open: [25.2, 25.6, 26.1, 26.5], openV: [0, 1, 1, 0], ok: true},
  {check: [26.4, 27.3], open: [27.3, 27.7, 28.2, 28.6], openV: [0, 1, 1, 0], ok: true},
  // starts opening while checking… then slams shut
  {check: [28.4, 29.4], open: [28.5, 29.0, 29.45, REFUSE], openV: [0, 0.22, 0.22, 0], ok: false},
];

const packetX = (t: number) =>
  t < PASS2
    ? keys(
        t,
        [9.6, 10.4, 12.3, 13.0, 15.1, 15.8, 17.9, 18.8],
        [PACKET_START, STOP[0], STOP[0], STOP[1], STOP[1], STOP[2], STOP[2], PACKET_END],
      )
    : keys(
        t,
        [23.6, 24.3, 25.6, 26.3, 27.7, 28.4, REFUSE, REFUSE + 0.55],
        [PACKET_START, STOP[0], STOP[0], STOP[1], STOP[1], STOP[2], STOP[2], STOP[2] - 70],
      );

const packetOpacity = (t: number) =>
  t < PASS2
    ? Math.min(ramp(t, 9.5, 9.8), 1 - ramp(t, 18.6, 18.85))
    : Math.min(ramp(t, 23.5, 23.8), 1 - ramp(t, 33.6, 34.2));

// ---------------------------------------------------------------------------
// Small drawing primitives
// ---------------------------------------------------------------------------

const Txt: React.FC<{
  x: number;
  y: number;
  size?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
  opacity?: number;
  spacing?: number;
  children: React.ReactNode;
}> = ({x, y, size = 22, weight = 500, anchor = 'middle', fill = K.ink, opacity = 1, spacing = 0, children}) => (
  <text
    x={x}
    y={y}
    fontFamily={FONT}
    fontSize={size}
    fontWeight={weight}
    textAnchor={anchor}
    fill={fill}
    opacity={opacity}
    letterSpacing={spacing}
  >
    {children}
  </text>
);

/** Check mark centred on (x, y), drawn progressively. */
const Check: React.FC<{x: number; y: number; s?: number; p: number; color?: string}> = ({
  x,
  y,
  s = 1,
  p,
  color = K.ink,
}) => (
  <path
    d={`M ${x - 9 * s} ${y} L ${x - 3 * s} ${y + 7 * s} L ${x + 10 * s} ${y - 8 * s}`}
    fill="none"
    stroke={color}
    strokeWidth={SW + 1}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={draw(p, 32 * s)}
  />
);

const Cross: React.FC<{x: number; y: number; s?: number; p: number}> = ({x, y, s = 1, p}) => (
  <g stroke={K.ink} strokeWidth={SW + 1} strokeLinecap="round">
    <line x1={x - 8 * s} y1={y - 8 * s} x2={x + 8 * s} y2={y + 8 * s} style={draw(ramp(p, 0, 0.5), 23 * s)} />
    <line x1={x + 8 * s} y1={y - 8 * s} x2={x - 8 * s} y2={y + 8 * s} style={draw(ramp(p, 0.5, 1), 23 * s)} />
  </g>
);

// ---------------------------------------------------------------------------
// Gate (frame + two sliding yellow panels)
// ---------------------------------------------------------------------------

const Gate: React.FC<{i: number; build: number; open: number; shake: number}> = ({i, build, open, shake}) => {
  const gx = GATE_X[i];
  const left = gx - GATE_HALF_W;
  const right = gx + GATE_HALF_W;
  const frameLen = (GATE_BOTTOM - GATE_TOP) * 2 + GATE_HALF_W * 2;
  const inner = {x: gx - PANEL_HALF_W, y: GATE_TOP + 6, w: PANEL_HALF_W * 2, h: GATE_BOTTOM - GATE_TOP - 12};
  const halfH = TRACK_Y - inner.y;
  const shift = open * PANEL_TRAVEL;
  const panelsIn = ramp(build, 0.35, 0.8);
  const slats = [0.25, 0.5, 0.75];

  return (
    <g transform={`translate(${shake}, 0)`}>
      <defs>
        <clipPath id={`gate-clip-${i}`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} />
        </clipPath>
      </defs>
      {/* frame */}
      <path
        d={`M ${left} ${GATE_BOTTOM} L ${left} ${GATE_TOP} L ${right} ${GATE_TOP} L ${right} ${GATE_BOTTOM}`}
        fill="none"
        stroke={K.ink}
        strokeWidth={SW}
        style={draw(ramp(build, 0, 0.6), frameLen)}
      />
      {/* feet */}
      <g opacity={ramp(build, 0.4, 0.7)} stroke={K.ink} strokeWidth={SW}>
        <line x1={left - 18} y1={GATE_BOTTOM} x2={left + 10} y2={GATE_BOTTOM} />
        <line x1={right - 10} y1={GATE_BOTTOM} x2={right + 18} y2={GATE_BOTTOM} />
        <line x1={left} y1={GATE_TOP + 22} x2={right} y2={GATE_TOP + 22} strokeWidth={1} opacity={0.4} />
      </g>
      {/* panels */}
      <g clipPath={`url(#gate-clip-${i})`} opacity={panelsIn}>
        <g transform={`translate(0, ${-shift - (1 - panelsIn) * halfH})`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={halfH - 1} fill={K.yellow} stroke={K.ink} strokeWidth={SW} />
          {slats.map((s) => (
            <line
              key={s}
              x1={inner.x + 10}
              x2={inner.x + inner.w - 10}
              y1={inner.y + halfH * s}
              y2={inner.y + halfH * s}
              stroke={K.ink}
              strokeWidth={1.2}
              opacity={0.55}
            />
          ))}
        </g>
        <g transform={`translate(0, ${shift + (1 - panelsIn) * halfH})`}>
          <rect x={inner.x} y={TRACK_Y + 1} width={inner.w} height={halfH - 1} fill={K.yellow} stroke={K.ink} strokeWidth={SW} />
          {slats.map((s) => (
            <line
              key={s}
              x1={inner.x + 10}
              x2={inner.x + inner.w - 10}
              y1={TRACK_Y + halfH * s}
              y2={TRACK_Y + halfH * s}
              stroke={K.ink}
              strokeWidth={1.2}
              opacity={0.55}
            />
          ))}
        </g>
      </g>
      {/* label */}
      <g opacity={ramp(build, 0.55, 0.95)}>
        <Txt x={gx} y={GATE_BOTTOM + 48} size={15} weight={600} spacing={3} opacity={0.55}>
          {`PORTE ${i + 1}`}
        </Txt>
        <Txt x={gx} y={GATE_BOTTOM + 80} size={24} weight={600}>
          {GATE_LABELS[i]}
        </Txt>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Detail cards above each gate (what the gate checks)
// ---------------------------------------------------------------------------

const cardX = (i: number) => GATE_X[i] - CARD.w / 2;

const CardShell: React.FC<{i: number; appear: number; children: React.ReactNode}> = ({i, appear, children}) => {
  const x = cardX(i);
  const y = CARD.top;
  return (
    <g opacity={appear} transform={`translate(0, ${(1 - appear) * 14})`}>
      <rect x={x} y={y} width={CARD.w} height={CARD.h} rx={10} fill={K.bg} stroke={K.ink} strokeWidth={SW} />
      <line
        x1={GATE_X[i]}
        x2={GATE_X[i]}
        y1={y + CARD.h}
        y2={GATE_TOP}
        stroke={K.ink}
        strokeWidth={1.5}
        strokeDasharray="4 5"
      />
      {children}
    </g>
  );
};

/** Status line at the bottom of a card: "Vérification…" then the verdict. */
const Status: React.FC<{i: number; t: number; run: GateRun; okText: string; koText: string}> = ({
  i,
  t,
  run,
  okText,
  koText,
}) => {
  const [a, b] = run.check;
  const done = ramp(t, b - 0.2, b + 0.1);
  const y = CARD.top + CARD.h - 22;
  const x = cardX(i) + 22;
  const dots = '.'.repeat(1 + (Math.floor(Math.max(0, t - a) * 4) % 3));
  return (
    <g>
      <g opacity={(1 - done) * ramp(t, a, a + 0.2)}>
        <Txt x={x} y={y + 6} size={17} anchor="start" opacity={0.6}>
          {`Vérification${dots}`}
        </Txt>
      </g>
      <g opacity={done}>
        {run.ok ? (
          <Check x={x + 10} y={y} s={0.9} p={ramp(t, b - 0.1, b + 0.3)} />
        ) : (
          <Cross x={x + 10} y={y} s={0.8} p={ramp(t, b - 0.1, b + 0.3)} />
        )}
        <Txt x={x + 32} y={y + 6} size={17} weight={600} anchor="start">
          {run.ok ? okText : koText}
        </Txt>
      </g>
    </g>
  );
};

const BudgetCard: React.FC<{t: number; run: GateRun; cost: number; appear: number}> = ({t, run, cost, appear}) => {
  const i = 0;
  const x = cardX(i) + 22;
  const w = CARD.w - 44;
  const cap = 500;
  const fill = ramp(t, run.check[0] + 0.1, run.check[1] - 0.2, easeInOut) * (cost / cap);
  const shown = Math.round((fill * cap) / 5) * 5;
  return (
    <CardShell i={i} appear={appear}>
      <Txt x={x} y={CARD.top + 38} size={17} anchor="start" opacity={0.6}>
        Coût estimé
      </Txt>
      <Txt x={x + w} y={CARD.top + 38} size={22} weight={600} anchor="end">
        {`${shown} €`}
      </Txt>
      <rect x={x} y={CARD.top + 60} width={w} height={16} rx={8} fill="none" stroke={K.ink} strokeWidth={1.5} />
      <rect
        x={x + 3}
        y={CARD.top + 63}
        width={Math.max(0, (w - 6) * fill)}
        height={10}
        rx={5}
        fill={K.yellow}
      />
      <line x1={x + w} x2={x + w} y1={CARD.top + 54} y2={CARD.top + 82} stroke={K.ink} strokeWidth={SW} />
      <Txt x={x + w} y={CARD.top + 102} size={15} anchor="end" opacity={0.6}>
        Plafond : 500 €
      </Txt>
      <Status i={i} t={t} run={run} okText="Sous le plafond" koText="Plafond dépassé" />
    </CardShell>
  );
};

const ApprovalCard: React.FC<{t: number; run: GateRun; task: string; appear: number}> = ({t, run, task, appear}) => {
  const i = 1;
  const x = cardX(i) + 22;
  const tick = ramp(t, run.check[1] - 0.45, run.check[1] - 0.1);
  return (
    <CardShell i={i} appear={appear}>
      <Txt x={x} y={CARD.top + 38} size={17} anchor="start" opacity={0.6}>
        {task}
      </Txt>
      <rect x={x} y={CARD.top + 56} width={30} height={30} rx={5} fill={tick > 0 ? K.paleYellow : K.bg} stroke={K.ink} strokeWidth={SW} />
      <Check x={x + 15} y={CARD.top + 71} s={0.85} p={tick} />
      <Txt x={x + 44} y={CARD.top + 77} size={17} weight={600} anchor="start">
        Accord d’un responsable
      </Txt>
      <Txt x={x + 44} y={CARD.top + 100} size={14} anchor="start" opacity={0.6}>
        valide avant l’action
      </Txt>
      <Status i={i} t={t} run={run} okText="Approuvé" koText="Refusé" />
    </CardShell>
  );
};

const ScopeCard: React.FC<{t: number; run: GateRun; target: 0 | 2; appear: number}> = ({t, run, target, appear}) => {
  const i = 2;
  const x0 = cardX(i);
  const chips = [
    {label: 'Commandes', x: x0 + 22, y: CARD.top + 44, w: 128},
    {label: 'Paiements', x: x0 + 22, y: CARD.top + 80, w: 128},
    {label: 'Salaires', x: x0 + 176, y: CARD.top + 62, w: 104},
  ];
  const hl = ramp(t, run.check[0] + 0.2, run.check[0] + 0.6);
  const verdict = ramp(t, run.check[1] - 0.3, run.check[1]);
  return (
    <CardShell i={i} appear={appear}>
      <rect
        x={x0 + 12}
        y={CARD.top + 14}
        width={148}
        height={106}
        rx={8}
        fill="none"
        stroke={K.ink}
        strokeWidth={1.5}
        strokeDasharray="6 5"
      />
      <Txt x={x0 + 86} y={CARD.top + 32} size={13} weight={600} spacing={1.5} opacity={0.6}>
        AUTORISÉ
      </Txt>
      <Txt x={x0 + 228} y={CARD.top + 30} size={11} weight={600} spacing={1.2} opacity={0.6}>
        HORS
      </Txt>
      <Txt x={x0 + 228} y={CARD.top + 45} size={11} weight={600} spacing={1.2} opacity={0.6}>
        PÉRIMÈTRE
      </Txt>
      {chips.map((c, k) => {
        const on = k === target ? hl : 0;
        return (
          <g key={c.label}>
            <rect
              x={c.x}
              y={c.y}
              width={c.w}
              height={28}
              rx={14}
              fill={on > 0 ? `rgba(249,198,35,${on})` : K.bg}
              stroke={K.ink}
              strokeWidth={on > 0 ? SW : 1.2}
              opacity={k === 2 ? 0.9 : 1}
            />
            <Txt x={c.x + c.w / 2} y={c.y + 20} size={15} weight={on > 0 ? 600 : 500}>
              {c.label}
            </Txt>
          </g>
        );
      })}
      {target === 2 && (
        <g opacity={verdict}>
          <circle cx={chips[2].x + chips[2].w - 2} cy={chips[2].y + 2} r={12} fill={K.bg} stroke={K.ink} strokeWidth={SW} />
          <Cross x={chips[2].x + chips[2].w - 2} y={chips[2].y + 2} s={0.45} p={verdict} />
        </g>
      )}
      <Status i={i} t={t} run={run} okText="Données autorisées" koText="Hors périmètre" />
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Request card (top-left) feeding the agent
// ---------------------------------------------------------------------------

const RequestCard: React.FC<{t: number; n: number; lines: string[]; inAt: number; outAt: number}> = ({
  t,
  n,
  lines,
  inAt,
  outAt,
}) => {
  const a = windowed(t, inAt, outAt, 0.45);
  const slide = (1 - ramp(t, inAt, inAt + 0.6)) * -120 + ramp(t, outAt - 0.45, outAt, easeIn) * -60;
  const x = REQ.x - REQ.w / 2;
  const y = REQ.y - REQ.h / 2;
  return (
    <g opacity={a} transform={`translate(${slide}, 0)`}>
      <rect x={x} y={y} width={REQ.w} height={REQ.h} rx={10} fill={K.bg} stroke={K.ink} strokeWidth={SW} />
      <rect x={x} y={y} width={8} height={REQ.h} rx={3} fill={K.ink} />
      <Txt x={x + 28} y={y + 34} size={14} weight={600} spacing={3} anchor="start" opacity={0.55}>
        {`DEMANDE ${n}`}
      </Txt>
      {lines.map((l, k) => (
        <Txt key={l} x={x + 28} y={y + 70 + k * 30} size={19} weight={k === 0 ? 600 : 500} anchor="start">
          {l}
        </Txt>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const GardeFousAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const pass2 = t >= PASS2;
  const runs = pass2 ? PASS2_GATES : PASS1_GATES;

  // Global scene visibility
  const sceneIn = ramp(t, BUILD, BUILD + 0.4);
  const sceneOut = 1 - ramp(t, OUTRO, OUTRO + 0.6, easeIn);
  const scene = sceneIn * sceneOut;

  // Build-up of the schematic
  const b = (delay: number) => (t - BUILD - delay) / 1.2;
  const trackDraw = ramp(t, BUILD + 0.3, BUILD + 1.8, easeInOut);
  const trackLen = ACTION.x - ACTION.w / 2 - (AGENT.x + AGENT.r);

  // Gates
  const gateOpen = runs.map((r) => keys(t, r.open, r.openV));
  // Pass 2, gate 3: starts opening while checking, then slams shut
  if (pass2) {
    const o = PASS2_GATES[2].open;
    gateOpen[2] = t < o[2] ? keys(t, [o[0], o[1]], [0, 0.22]) : 0.22 * (1 - ramp(t, o[2], o[3], easeIn));
  }
  const shakeT = t - REFUSE;
  const shake = pass2 && shakeT > 0 && shakeT < 0.6 ? Math.sin(shakeT * 55) * 9 * (1 - shakeT / 0.6) : 0;

  // Detail cards: visible from the gate's first check until the pass ends
  const cardAppear = (i: number) => {
    const r = runs[i];
    return pass2
      ? windowed(t, r.check[0] - 0.4, OUTRO, 0.35)
      : windowed(t, r.check[0] - 0.4, PASS2 - 0.15, 0.35);
  };

  // Agent
  const agentBusy = pass2 ? windowed(t, 22.9, 23.7, 0.15) : windowed(t, 8.8, 9.7, 0.15);
  const spin = t * 40 + (pass2 ? ramp(t, 22.9, 23.7) : ramp(t, 8.8, 9.7)) * 360;
  const pulse = pass2 ? ramp(t, 22.4, 22.9, easeInOut) : ramp(t, 8.2, 8.8, easeInOut);
  const pulseOn = pass2 ? windowed(t, 22.4, 23.0, 0.1) : windowed(t, 8.2, 8.9, 0.1);

  // Packet
  const px = packetX(t);
  const pOpacity = packetOpacity(t) * scene;
  const refused = pass2 && t >= REFUSE;
  const bounceY = refused ? -Math.sin(Math.min(1, (t - REFUSE) / 0.55) * Math.PI) * 26 : 0;

  // Action node
  const success = !pass2 ? ramp(t, 18.75, 19.3) * (1 - ramp(t, PASS2 - 0.4, PASS2)) : 0;
  const noAction = pass2 ? ramp(t, 30.2, 30.7) : 0;

  // Refusal banner
  const banner = windowed(t, 30.5, OUTRO + 0.3, 0.4);

  // Caption
  const cap = (a: number, z: number) => windowed(t, a, z, 0.35);
  const captions = [
    {a: BUILD + 0.4, z: 6.9, text: 'Une demande arrive. Avant d’agir, l’agent franchit trois portes.'},
    {a: 7.0, z: PASS2 - 0.1, text: 'Chaque porte vérifie une règle, puis s’ouvre.'},
    {a: PASS2 + 0.1, z: REFUSE - 0.1, text: 'Nouvelle demande : mêmes portes, mêmes règles.'},
    {a: REFUSE, z: OUTRO, text: 'Une règle n’est pas respectée : la porte se ferme.'},
  ];

  // Title & outro
  const title = windowed(t, TITLE.in, TITLE.out, 0.5);
  const titleRise = (1 - ramp(t, TITLE.in, TITLE.in + 0.8)) * 24;
  const outro = ramp(t, OUTRO + 0.6, OUTRO + 1.3);

  return (
    <AbsoluteFill style={{background: K.bg, fontFamily: FONT}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={1.3} fill={K.ink} opacity={0.14} />
          </pattern>
        </defs>
        <rect width={1920} height={1080} fill="url(#grid)" opacity={ramp(t, 0, 0.8)} />

        {/* ---------------- Title ---------------- */}
        <g opacity={title} transform={`translate(0, ${titleRise})`}>
          <rect x={960 - 64} y={372} width={128} height={6} rx={3} fill={K.yellow} />
          <Txt x={960} y={480} size={76} weight={700}>
            Les garde-fous d’un agent IA
          </Txt>
          <Txt x={960} y={548} size={30} weight={400} opacity={0.75}>
            IA : intelligence artificielle. Avant d’agir, l’agent passe des contrôles.
          </Txt>
          {[0, 1, 2].map((k) => (
            <g key={k} opacity={ramp(t, 1.0 + k * 0.2, 1.4 + k * 0.2)}>
              <rect x={960 - 78 + k * 56} y={610} width={44} height={56} fill="none" stroke={K.ink} strokeWidth={SW} />
              <rect x={960 - 72 + k * 56} y={616} width={32} height={22} fill={K.yellow} stroke={K.ink} strokeWidth={1.5} />
              <rect x={960 - 72 + k * 56} y={638} width={32} height={22} fill={K.yellow} stroke={K.ink} strokeWidth={1.5} />
            </g>
          ))}
        </g>

        {/* ---------------- Schematic scene ---------------- */}
        <g opacity={scene} transform="translate(0, 24)">
          {/* captions */}
          {captions.map((c) => (
            <g key={c.text} opacity={cap(c.a, c.z)}>
              <Txt x={960} y={120} size={34} weight={600}>
                {c.text}
              </Txt>
            </g>
          ))}
          <rect x={960 - 40} y={148} width={80} height={4} rx={2} fill={K.yellow} opacity={ramp(t, BUILD + 0.4, BUILD + 0.9)} />

          {/* track */}
          <line
            x1={AGENT.x + AGENT.r}
            x2={ACTION.x - ACTION.w / 2}
            y1={TRACK_Y}
            y2={TRACK_Y}
            stroke={K.ink}
            strokeWidth={SW}
            style={draw(trackDraw, trackLen)}
          />
          {/* little tick marks along the track */}
          {Array.from({length: 26}).map((_, k) => {
            const x = AGENT.x + AGENT.r + 30 + k * 48;
            if (GATE_X.some((g) => Math.abs(g - x) < GATE_HALF_W + 6)) return null;
            if (x > ACTION.x - ACTION.w / 2 - 10) return null;
            return (
              <line
                key={k}
                x1={x}
                x2={x}
                y1={TRACK_Y + 8}
                y2={TRACK_Y + 16}
                stroke={K.ink}
                strokeWidth={1.2}
                opacity={0.35 * ramp(t, BUILD + 0.5 + k * 0.04, BUILD + 0.9 + k * 0.04)}
              />
            );
          })}

          {/* agent */}
          <g opacity={ramp(t, BUILD, BUILD + 0.6)}>
            <circle
              cx={AGENT.x}
              cy={AGENT.y}
              r={AGENT.r}
              fill={K.bg}
              stroke={K.ink}
              strokeWidth={SW}
              style={draw(ramp(t, BUILD, BUILD + 1.0, easeInOut), 2 * Math.PI * AGENT.r)}
            />
            <circle
              cx={AGENT.x}
              cy={AGENT.y}
              r={AGENT.r + 16}
              fill="none"
              stroke={K.ink}
              strokeWidth={1.2}
              strokeDasharray="3 9"
              opacity={0.35 + 0.65 * agentBusy}
              transform={`rotate(${spin} ${AGENT.x} ${AGENT.y})`}
            />
            <polygon
              points={Array.from({length: 6})
                .map((_, k) => {
                  const a = ((k * 60 - 90) * Math.PI) / 180;
                  return `${AGENT.x + 50 * Math.cos(a)},${AGENT.y + 50 * Math.sin(a)}`;
                })
                .join(' ')}
              fill="none"
              stroke={K.ink}
              strokeWidth={SW}
              transform={`rotate(${agentBusy * spin * 0.5} ${AGENT.x} ${AGENT.y})`}
            />
            <circle cx={AGENT.x} cy={AGENT.y} r={10 + 6 * agentBusy} fill={K.ink} />
            {[0, 1, 2].map((k) => (
              <line
                key={k}
                x1={AGENT.x}
                y1={AGENT.y}
                x2={AGENT.x + 50 * Math.cos(((k * 120 - 90) * Math.PI) / 180)}
                y2={AGENT.y + 50 * Math.sin(((k * 120 - 90) * Math.PI) / 180)}
                stroke={K.ink}
                strokeWidth={1.2}
                opacity={0.5}
                transform={`rotate(${agentBusy * spin * 0.5} ${AGENT.x} ${AGENT.y})`}
              />
            ))}
            <Txt x={AGENT.x} y={AGENT.y + AGENT.r + 64} size={26} weight={700}>
              Agent IA
            </Txt>
            <Txt x={AGENT.x} y={AGENT.y + AGENT.r + 96} size={17} opacity={0.6}>
              {agentBusy > 0.5 ? 'analyse la demande…' : 'propose une action'}
            </Txt>
          </g>

          {/* request → agent connector */}
          <line
            x1={AGENT.x}
            x2={AGENT.x}
            y1={REQ.y + REQ.h / 2}
            y2={AGENT.y - AGENT.r - 16}
            stroke={K.ink}
            strokeWidth={1.5}
            strokeDasharray="4 5"
            opacity={ramp(t, 6.8, 7.4) * 0.8}
          />
          <circle
            cx={AGENT.x}
            cy={interpolate(pulse, [0, 1], [REQ.y + REQ.h / 2, AGENT.y - AGENT.r - 10])}
            r={6}
            fill={K.ink}
            opacity={pulseOn}
          />

          <RequestCard t={t} n={1} lines={['Rembourser une commande', 'Montant : 120 €']} inAt={6.6} outAt={PASS2} />
          <RequestCard
            t={t}
            n={2}
            lines={['Analyser les salaires', 'pour un rapport interne']}
            inAt={PASS2 + 0.1}
            outAt={OUTRO + 0.6}
          />

          {/* gates */}
          {GATE_X.map((_, i) => (
            <Gate key={i} i={i} build={b(0.6 + i * 0.35)} open={gateOpen[i]} shake={i === 2 ? shake : 0} />
          ))}

          {/* detail cards */}
          {!pass2 ? (
            <>
              <BudgetCard t={t} run={runs[0]} cost={120} appear={cardAppear(0)} />
              <ApprovalCard t={t} run={runs[1]} task="Remboursement client" appear={cardAppear(1)} />
              <ScopeCard t={t} run={runs[2]} target={0} appear={cardAppear(2)} />
            </>
          ) : (
            <>
              <BudgetCard t={t} run={runs[0]} cost={15} appear={cardAppear(0)} />
              <ApprovalCard t={t} run={runs[1]} task="Rapport interne" appear={cardAppear(1)} />
              <ScopeCard t={t} run={runs[2]} target={2} appear={cardAppear(2)} />
            </>
          )}

          {/* action node */}
          <g opacity={ramp(t, BUILD + 1.4, BUILD + 2.0)}>
            <rect
              x={ACTION.x - ACTION.w / 2}
              y={ACTION.y - ACTION.h / 2}
              width={ACTION.w}
              height={ACTION.h}
              rx={12}
              fill={K.bg}
              stroke={K.ink}
              strokeWidth={SW}
              strokeDasharray={noAction > 0 ? '7 6' : undefined}
            />
            <Txt x={ACTION.x} y={ACTION.y - ACTION.h / 2 - 22} size={15} weight={600} spacing={3} opacity={0.55}>
              ACTION
            </Txt>
            <g opacity={(1 - success) * (1 - noAction)}>
              <Txt x={ACTION.x} y={ACTION.y + 8} size={20} opacity={0.6}>
                en attente
              </Txt>
            </g>
            <g opacity={success}>
              <circle cx={ACTION.x} cy={ACTION.y - 18} r={20} fill={K.paleYellow} stroke={K.ink} strokeWidth={SW} />
              <Check x={ACTION.x} y={ACTION.y - 18} s={0.9} p={ramp(t, 18.9, 19.4)} />
              <Txt x={ACTION.x} y={ACTION.y + 32} size={20} weight={600}>
                Remboursement fait
              </Txt>
            </g>
            <g opacity={noAction}>
              <Txt x={ACTION.x} y={ACTION.y - 4} size={20} weight={600}>
                Aucune action
              </Txt>
              <Txt x={ACTION.x} y={ACTION.y + 26} size={16} opacity={0.6}>
                exécutée
              </Txt>
            </g>
          </g>

          {/* packet */}
          <g opacity={pOpacity} transform={`translate(${px}, ${TRACK_Y + bounceY})`}>
            <rect x={-17} y={-17} width={34} height={34} fill={K.bg} stroke={K.ink} strokeWidth={SW} transform="rotate(45)" />
            {refused ? (
              <Cross x={0} y={0} s={0.55} p={ramp(t, REFUSE + 0.1, REFUSE + 0.5)} />
            ) : (
              <circle cx={0} cy={0} r={6} fill={K.ink} />
            )}
          </g>

          {/* refusal banner */}
          <g opacity={banner} transform={`translate(0, ${(1 - ramp(t, 30.5, 31.1)) * 16})`}>
            <rect x={960 - 520} y={900} width={1040} height={112} rx={12} fill={K.bg} stroke={K.ink} strokeWidth={SW} />
            <rect x={960 - 520} y={900} width={12} height={112} rx={4} fill={K.yellow} />
            <Txt x={960 - 484} y={944} size={26} weight={700} anchor="start">
              Refus justifié : les salaires sont hors du périmètre autorisé.
            </Txt>
            <Txt x={960 - 484} y={984} size={20} anchor="start" opacity={0.7}>
              Le motif est consigné au journal et la demande est transmise à un responsable.
            </Txt>
          </g>
        </g>

        {/* ---------------- Outro ---------------- */}
        <g opacity={outro} transform={`translate(0, ${(1 - outro) * 20})`}>
          <Txt x={960} y={400} size={60} weight={700}>
            Un agent fiable sait aussi s’arrêter.
          </Txt>
          <rect x={960 - 64} y={438} width={128} height={6} rx={3} fill={K.yellow} />
          {GATE_LABELS.map((label, k) => {
            const cx = 960 + (k - 1) * 400;
            const a = ramp(t, OUTRO + 1.1 + k * 0.25, OUTRO + 1.6 + k * 0.25);
            return (
              <g key={label} opacity={a} transform={`translate(0, ${(1 - a) * 16})`}>
                <rect x={cx - 34} y={540} width={68} height={92} fill="none" stroke={K.ink} strokeWidth={SW} />
                <rect x={cx - 27} y={547} width={54} height={36} fill={K.yellow} stroke={K.ink} strokeWidth={1.5} />
                <rect x={cx - 27} y={589} width={54} height={36} fill={K.yellow} stroke={K.ink} strokeWidth={1.5} />
                <Txt x={cx} y={688} size={26} weight={600}>
                  {label}
                </Txt>
                <Txt x={cx} y={722} size={18} opacity={0.6}>
                  {['Coût sous un plafond', 'Une personne valide', 'Seulement les données prévues'][k]}
                </Txt>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
