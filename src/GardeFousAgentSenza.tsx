import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from './theme';

// ---------------------------------------------------------------------------
// Charte Senza : navy, indigo (accent principal), jaune (accent secondaire),
// fonds de cartes indigo clair / crème, pastilles arrondies, ombres douces.
// Même minutage que GardeFousAgent.tsx (la voix off se pose telle quelle).
// ---------------------------------------------------------------------------

const S = {
  bg: '#FFFFFF',
  navy: '#2B3346',
  indigo: '#4E4EEA',
  yellow: '#F9C623',
  indigoPale: '#EEEEFB',
  cream: '#FFFBEC',
  grey: '#F5F5F5',
  line: '#DADAE3',
  muted: '#7A7A8C',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const easeBack = Easing.out(Easing.back(1.6));

const ramp = (t: number, a: number, b: number, easing = easeOut) =>
  interpolate(t, [a, b], [0, 1], {...CLAMP, easing});

const windowed = (t: number, a: number, b: number, fade = 0.3) =>
  Math.min(ramp(t, a, a + fade), 1 - ramp(t, b - fade, b));

const keys = (t: number, times: number[], values: number[], easing = easeInOut) =>
  interpolate(t, times, values, {...CLAMP, easing});

const draw = (p: number, len: number) => ({
  strokeDasharray: len,
  strokeDashoffset: len * (1 - p),
});

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const TRACK_Y = 560;
const AGENT = {x: 230, y: TRACK_Y, r: 88};
const ACTION = {x: 1715, y: TRACK_Y, w: 240, h: 132};
const GATE_X = [640, 1000, 1360];
const GATE_HALF_W = 56;
const GATE_TOP = 400;
const GATE_BOTTOM = 720;
const PANEL_HALF_W = 44;
const PANEL_TRAVEL = 150;
const CARD = {w: 300, h: 164, top: 206};
const REQ = {x: 230, y: 300, w: 340, h: 128};

const GATE_LABELS = ['Limite de budget', 'Validation humaine', 'Périmètre de données'];

const STOP = [GATE_X[0] - 95, GATE_X[1] - 95, GATE_X[2] - 95];
const PACKET_START = AGENT.x + AGENT.r + 30;
const PACKET_END = ACTION.x;

// ---------------------------------------------------------------------------
// Timeline (seconds) — identical to the schematic version
// ---------------------------------------------------------------------------

const TITLE = {in: 0.3, out: 3.7};
const BUILD = 3.8;
const PASS2 = 21.2;
const REFUSE = 29.6;
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
// Primitives
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
}> = ({x, y, size = 22, weight = 500, anchor = 'middle', fill = S.navy, opacity = 1, spacing = 0, children}) => (
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

const Check: React.FC<{x: number; y: number; s?: number; p: number; color?: string}> = ({
  x,
  y,
  s = 1,
  p,
  color = S.navy,
}) => (
  <path
    d={`M ${x - 9 * s} ${y} L ${x - 3 * s} ${y + 7 * s} L ${x + 10 * s} ${y - 8 * s}`}
    fill="none"
    stroke={color}
    strokeWidth={3.2 * Math.max(0.8, s)}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={draw(p, 32 * s)}
  />
);

const Cross: React.FC<{x: number; y: number; s?: number; p: number; color?: string}> = ({
  x,
  y,
  s = 1,
  p,
  color = S.navy,
}) => (
  <g stroke={color} strokeWidth={3.2 * Math.max(0.8, s)} strokeLinecap="round">
    <line x1={x - 8 * s} y1={y - 8 * s} x2={x + 8 * s} y2={y + 8 * s} style={draw(ramp(p, 0, 0.5), 23 * s)} />
    <line x1={x + 8 * s} y1={y - 8 * s} x2={x - 8 * s} y2={y + 8 * s} style={draw(ramp(p, 0.5, 1), 23 * s)} />
  </g>
);

/** Pastille arrondie (comme « Simple · Rapide · Prévisible » dans la référence). */
const Chip: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  fill: string;
  stroke: string;
  color: string;
  dot?: string;
  size?: number;
  children: React.ReactNode;
}> = ({x, y, w, h = 34, fill, stroke, color, dot, size = 16, children}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={1.5} />
    {dot && <circle cx={x + 16} cy={y + h / 2} r={3.5} fill={dot} />}
    <Txt x={dot ? x + 28 : x + w / 2} y={y + h / 2 + size * 0.36} size={size} weight={600} anchor={dot ? 'start' : 'middle'} fill={color}>
      {children}
    </Txt>
  </g>
);

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

const Gate: React.FC<{i: number; build: number; open: number; shake: number}> = ({i, build, open, shake}) => {
  const gx = GATE_X[i];
  const left = gx - GATE_HALF_W;
  const right = gx + GATE_HALF_W;
  const frameLen = (GATE_BOTTOM - GATE_TOP) * 2 + GATE_HALF_W * 2;
  const inner = {x: gx - PANEL_HALF_W, y: GATE_TOP + 8, w: PANEL_HALF_W * 2, h: GATE_BOTTOM - GATE_TOP - 16};
  const halfH = TRACK_Y - inner.y;
  const shift = open * PANEL_TRAVEL;
  const panelsIn = ramp(build, 0.35, 0.8);
  const badge = ramp(build, 0.55, 0.95, easeBack);

  return (
    <g transform={`translate(${shake}, 0)`}>
      <defs>
        <clipPath id={`senza-gate-clip-${i}`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={8} />
        </clipPath>
      </defs>
      <path
        d={`M ${left} ${GATE_BOTTOM} L ${left} ${GATE_TOP + 14} Q ${left} ${GATE_TOP} ${left + 14} ${GATE_TOP} L ${
          right - 14
        } ${GATE_TOP} Q ${right} ${GATE_TOP} ${right} ${GATE_TOP + 14} L ${right} ${GATE_BOTTOM}`}
        fill="none"
        stroke={S.navy}
        strokeWidth={4}
        strokeLinecap="round"
        style={draw(ramp(build, 0, 0.6), frameLen)}
      />
      <g opacity={ramp(build, 0.4, 0.7)} stroke={S.navy} strokeWidth={4} strokeLinecap="round">
        <line x1={left - 16} y1={GATE_BOTTOM} x2={left + 8} y2={GATE_BOTTOM} />
        <line x1={right - 8} y1={GATE_BOTTOM} x2={right + 16} y2={GATE_BOTTOM} />
      </g>
      <g clipPath={`url(#senza-gate-clip-${i})`} opacity={panelsIn}>
        <g transform={`translate(0, ${-shift - (1 - panelsIn) * halfH})`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={halfH - 2} rx={8} fill={S.yellow} />
          {[0.35, 0.65].map((s) => (
            <line key={s} x1={inner.x + 14} x2={inner.x + inner.w - 14} y1={inner.y + halfH * s} y2={inner.y + halfH * s} stroke={S.navy} strokeWidth={2} strokeLinecap="round" opacity={0.18} />
          ))}
        </g>
        <g transform={`translate(0, ${shift + (1 - panelsIn) * halfH})`}>
          <rect x={inner.x} y={TRACK_Y + 2} width={inner.w} height={halfH - 2} rx={8} fill={S.yellow} />
          {[0.35, 0.65].map((s) => (
            <line key={s} x1={inner.x + 14} x2={inner.x + inner.w - 14} y1={TRACK_Y + halfH * s} y2={TRACK_Y + halfH * s} stroke={S.navy} strokeWidth={2} strokeLinecap="round" opacity={0.18} />
          ))}
        </g>
      </g>
      {/* number badge + label */}
      <g transform={`translate(${gx}, ${GATE_BOTTOM + 42}) scale(${badge})`}>
        <circle r={17} fill={S.yellow} />
        <Txt x={0} y={6} size={17} weight={700}>
          {i + 1}
        </Txt>
      </g>
      <g opacity={ramp(build, 0.6, 1)}>
        <Txt x={gx} y={GATE_BOTTOM + 96} size={24} weight={700}>
          {GATE_LABELS[i]}
        </Txt>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Detail cards
// ---------------------------------------------------------------------------

const cardX = (i: number) => GATE_X[i] - CARD.w / 2;

const CardShell: React.FC<{i: number; appear: number; children: React.ReactNode}> = ({i, appear, children}) => {
  const x = cardX(i);
  const y = CARD.top;
  return (
    <g opacity={appear} transform={`translate(0, ${(1 - appear) * 16})`}>
      <rect x={x} y={y} width={CARD.w} height={CARD.h} rx={18} fill={S.bg} stroke={S.line} strokeWidth={1.5} filter="url(#senza-shadow)" />
      <line x1={GATE_X[i]} x2={GATE_X[i]} y1={y + CARD.h + 4} y2={GATE_TOP - 6} stroke={S.line} strokeWidth={2.5} strokeDasharray="5 6" strokeLinecap="round" />
      {children}
    </g>
  );
};

const Status: React.FC<{i: number; t: number; run: GateRun; okText: string; koText: string}> = ({
  i,
  t,
  run,
  okText,
  koText,
}) => {
  const [a, b] = run.check;
  const done = ramp(t, b - 0.2, b + 0.1);
  const pop = ramp(t, b - 0.2, b + 0.25, easeBack);
  const y = CARD.top + CARD.h - 50;
  const x = cardX(i) + 20;
  const dots = '.'.repeat(1 + (Math.floor(Math.max(0, t - a) * 4) % 3));
  const w = 46 + (run.ok ? okText : koText).length * 10.2;
  return (
    <g>
      <g opacity={(1 - done) * ramp(t, a, a + 0.2)}>
        <Txt x={x} y={y + 23} size={16} anchor="start" fill={S.muted}>
          {`Vérification${dots}`}
        </Txt>
      </g>
      <g opacity={done} transform={`translate(${x}, ${y + 17}) scale(${0.85 + 0.15 * pop}) translate(${-x}, ${-(y + 17)})`}>
        {run.ok ? (
          <Chip x={x} y={y} w={w} fill={S.cream} stroke={S.yellow} color={S.navy} dot={S.yellow}>
            {okText}
          </Chip>
        ) : (
          <Chip x={x} y={y} w={w} fill={S.navy} stroke={S.navy} color={S.bg} dot={S.yellow}>
            {koText}
          </Chip>
        )}
      </g>
    </g>
  );
};

const BudgetCard: React.FC<{t: number; run: GateRun; cost: number; appear: number}> = ({t, run, cost, appear}) => {
  const i = 0;
  const x = cardX(i) + 20;
  const w = CARD.w - 40;
  const cap = 500;
  const fill = ramp(t, run.check[0] + 0.1, run.check[1] - 0.2, easeInOut) * (cost / cap);
  const shown = Math.round((fill * cap) / 5) * 5;
  return (
    <CardShell i={i} appear={appear}>
      <Txt x={x} y={CARD.top + 38} size={16} anchor="start" fill={S.muted}>
        Coût estimé
      </Txt>
      <Txt x={x + w} y={CARD.top + 40} size={24} weight={700} anchor="end">
        {`${shown} €`}
      </Txt>
      <rect x={x} y={CARD.top + 56} width={w} height={14} rx={7} fill={S.grey} />
      <rect x={x} y={CARD.top + 56} width={Math.max(0, w * fill)} height={14} rx={7} fill={S.yellow} />
      <Txt x={x + w} y={CARD.top + 92} size={14} anchor="end" fill={S.muted}>
        Plafond : 500 €
      </Txt>
      <Status i={i} t={t} run={run} okText="Sous le plafond" koText="Plafond dépassé" />
    </CardShell>
  );
};

const ApprovalCard: React.FC<{t: number; run: GateRun; task: string; appear: number}> = ({t, run, task, appear}) => {
  const i = 1;
  const x = cardX(i) + 20;
  const tick = ramp(t, run.check[1] - 0.45, run.check[1] - 0.1);
  const filled = ramp(t, run.check[1] - 0.5, run.check[1] - 0.35);
  return (
    <CardShell i={i} appear={appear}>
      <Txt x={x} y={CARD.top + 38} size={16} anchor="start" fill={S.muted}>
        {task}
      </Txt>
      <rect
        x={x}
        y={CARD.top + 54}
        width={32}
        height={32}
        rx={9}
        fill={filled > 0 ? `rgba(78,78,234,${filled})` : S.bg}
        stroke={filled > 0.5 ? S.indigo : S.line}
        strokeWidth={2}
      />
      <Check x={x + 16} y={CARD.top + 70} s={0.8} p={tick} color={S.bg} />
      <Txt x={x + 46} y={CARD.top + 76} size={17} weight={600} anchor="start">
        Accord d’un responsable
      </Txt>
      <Txt x={x + 46} y={CARD.top + 98} size={14} anchor="start" fill={S.muted}>
        validé avant l’action
      </Txt>
      <Status i={i} t={t} run={run} okText="Approuvé" koText="Refusé" />
    </CardShell>
  );
};

const ScopeCard: React.FC<{t: number; run: GateRun; target: 0 | 2; appear: number}> = ({t, run, target, appear}) => {
  const i = 2;
  const x0 = cardX(i);
  const chips = [
    {label: 'Commandes', x: x0 + 24, y: CARD.top + 36, w: 126},
    {label: 'Paiements', x: x0 + 24, y: CARD.top + 72, w: 126},
    {label: 'Salaires', x: x0 + 180, y: CARD.top + 54, w: 100},
  ];
  const hl = ramp(t, run.check[0] + 0.2, run.check[0] + 0.6);
  const verdict = ramp(t, run.check[1] - 0.3, run.check[1]);
  return (
    <CardShell i={i} appear={appear}>
      <rect x={x0 + 12} y={CARD.top + 12} width={150} height={98} rx={12} fill={S.indigoPale} stroke={S.indigo} strokeWidth={1.5} strokeDasharray="6 5" />
      <Txt x={x0 + 87} y={CARD.top + 29} size={11} weight={700} spacing={1.5} fill={S.indigo}>
        AUTORISÉ
      </Txt>
      <Txt x={x0 + 230} y={CARD.top + 38} size={11} weight={700} spacing={1.2} fill={S.muted}>
        HORS PÉRIMÈTRE
      </Txt>
      {chips.map((c, k) => {
        const on = k === target ? hl : 0;
        const bad = k === 2 && target === 2;
        const fill = on > 0 ? (bad ? `rgba(43,51,70,${on})` : `rgba(249,198,35,${on})`) : S.bg;
        const color = on > 0.5 && bad ? S.bg : S.navy;
        return (
          <g key={c.label}>
            <rect x={c.x} y={c.y} width={c.w} height={28} rx={14} fill={fill} stroke={on > 0 ? (bad ? S.navy : S.yellow) : S.line} strokeWidth={1.5} />
            <Txt x={c.x + c.w / 2} y={c.y + 19.5} size={14} weight={600} fill={color}>
              {c.label}
            </Txt>
          </g>
        );
      })}
      {target === 2 && (
        <g opacity={verdict}>
          <circle cx={chips[2].x + chips[2].w - 2} cy={chips[2].y + 2} r={12} fill={S.yellow} />
          <Cross x={chips[2].x + chips[2].w - 2} y={chips[2].y + 2} s={0.42} p={verdict} />
        </g>
      )}
      <Status i={i} t={t} run={run} okText="Données autorisées" koText="Hors périmètre" />
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Request card
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
      <rect x={x} y={y} width={REQ.w} height={REQ.h} rx={18} fill={S.bg} stroke={S.line} strokeWidth={1.5} filter="url(#senza-shadow)" />
      <path d={`M ${x + 18} ${y} L ${x + 10} ${y} Q ${x} ${y} ${x} ${y + 10} L ${x} ${y + REQ.h - 10} Q ${x} ${y + REQ.h} ${x + 10} ${y + REQ.h} L ${x + 18} ${y + REQ.h} Z`} fill={S.indigo} />
      <rect x={x + 6} y={y} width={12} height={REQ.h} fill={S.indigo} />
      <Txt x={x + 36} y={y + 34} size={13} weight={700} spacing={2.5} anchor="start" fill={S.indigo}>
        {`DEMANDE ${n}`}
      </Txt>
      {lines.map((l, k) => (
        <Txt key={l} x={x + 36} y={y + 70 + k * 30} size={19} weight={k === 0 ? 700 : 500} anchor="start">
          {l}
        </Txt>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// HTML text blocks (title / outro), styled like the reference video
// ---------------------------------------------------------------------------

const underline = (color: string, p: number): React.CSSProperties => ({
  backgroundImage: `linear-gradient(${color}, ${color})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '0 100%',
  backgroundSize: `${p * 100}% 8px`,
  paddingBottom: 10,
});

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const GardeFousAgentSenza: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const pass2 = t >= PASS2;
  const runs = pass2 ? PASS2_GATES : PASS1_GATES;

  const sceneIn = ramp(t, BUILD, BUILD + 0.4);
  const sceneOut = 1 - ramp(t, OUTRO, OUTRO + 0.6, easeIn);
  const scene = sceneIn * sceneOut;

  const b = (delay: number) => (t - BUILD - delay) / 1.2;
  const trackDraw = ramp(t, BUILD + 0.3, BUILD + 1.8, easeInOut);
  const trackFrom = AGENT.x + AGENT.r + 6;
  const trackTo = ACTION.x - ACTION.w / 2 - 6;

  const gateOpen = runs.map((r) => keys(t, r.open, r.openV));
  if (pass2) {
    const o = PASS2_GATES[2].open;
    gateOpen[2] = t < o[2] ? keys(t, [o[0], o[1]], [0, 0.22]) : 0.22 * (1 - ramp(t, o[2], o[3], easeIn));
  }
  const shakeT = t - REFUSE;
  const shake = pass2 && shakeT > 0 && shakeT < 0.6 ? Math.sin(shakeT * 55) * 9 * (1 - shakeT / 0.6) : 0;

  const cardAppear = (i: number) => {
    const r = runs[i];
    return pass2 ? windowed(t, r.check[0] - 0.4, OUTRO, 0.35) : windowed(t, r.check[0] - 0.4, PASS2 - 0.15, 0.35);
  };

  const agentBusy = pass2 ? windowed(t, 22.9, 23.7, 0.15) : windowed(t, 8.8, 9.7, 0.15);
  const spin = t * 40 + (pass2 ? ramp(t, 22.9, 23.7) : ramp(t, 8.8, 9.7)) * 360;
  const pulse = pass2 ? ramp(t, 22.4, 22.9, easeInOut) : ramp(t, 8.2, 8.8, easeInOut);
  const pulseOn = pass2 ? windowed(t, 22.4, 23.0, 0.1) : windowed(t, 8.2, 8.9, 0.1);

  const px = packetX(t);
  const pOpacity = packetOpacity(t) * scene;
  const refused = pass2 && t >= REFUSE;
  const bounceY = refused ? -Math.sin(Math.min(1, (t - REFUSE) / 0.55) * Math.PI) * 26 : 0;
  // trail behind the moving packet
  const trailFrom = Math.max(trackFrom, px - 160);

  const success = !pass2 ? ramp(t, 18.75, 19.3) * (1 - ramp(t, PASS2 - 0.4, PASS2)) : 0;
  const noAction = pass2 ? ramp(t, 30.2, 30.7) : 0;

  const banner = windowed(t, 30.5, OUTRO + 0.3, 0.4);

  const cap = (a: number, z: number) => windowed(t, a, z, 0.35);
  const captions = [
    {a: BUILD + 0.4, z: 6.9, text: 'Une demande arrive. Avant d’agir, l’agent franchit trois portes.'},
    {a: 7.0, z: PASS2 - 0.1, text: 'Chaque porte vérifie une règle, puis s’ouvre.'},
    {a: PASS2 + 0.1, z: REFUSE - 0.1, text: 'Nouvelle demande : mêmes portes, mêmes règles.'},
    {a: REFUSE, z: OUTRO, text: 'Une règle n’est pas respectée : la porte se ferme.'},
  ];

  const title = windowed(t, TITLE.in, TITLE.out, 0.5);
  const titleRise = (1 - ramp(t, TITLE.in, TITLE.in + 0.8)) * 24;
  const outro = ramp(t, OUTRO + 0.6, OUTRO + 1.3);

  return (
    <AbsoluteFill style={{background: S.bg, fontFamily: FONT, color: S.navy}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="senza-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx={0} dy={8} stdDeviation={12} floodColor={S.navy} floodOpacity={0.08} />
          </filter>
          <filter id="senza-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx={0} dy={6} stdDeviation={8} floodColor={S.indigo} floodOpacity={0.35} />
          </filter>
          <linearGradient id="senza-trail" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={S.indigo} stopOpacity={0} />
            <stop offset="1" stopColor={S.indigo} stopOpacity={0.9} />
          </linearGradient>
        </defs>

        <g opacity={scene} transform="translate(0, 24)">
          {/* track */}
          <line
            x1={trackFrom}
            x2={trackFrom + (trackTo - trackFrom) * trackDraw}
            y1={TRACK_Y}
            y2={TRACK_Y}
            stroke={S.line}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {pOpacity > 0 && px > trackFrom + 10 && !refused && (
            <line x1={trailFrom} x2={px} y1={TRACK_Y} y2={TRACK_Y} stroke="url(#senza-trail)" strokeWidth={4} strokeLinecap="round" opacity={pOpacity} />
          )}

          {/* agent */}
          <g opacity={ramp(t, BUILD, BUILD + 0.6)}>
            <circle cx={AGENT.x} cy={AGENT.y} r={AGENT.r} fill={S.indigoPale} />
            <circle
              cx={AGENT.x}
              cy={AGENT.y}
              r={AGENT.r}
              fill="none"
              stroke={S.indigo}
              strokeWidth={4}
              style={draw(ramp(t, BUILD, BUILD + 1.0, easeInOut), 2 * Math.PI * AGENT.r)}
            />
            <circle
              cx={AGENT.x}
              cy={AGENT.y}
              r={AGENT.r + 18}
              fill="none"
              stroke={S.indigo}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="2 12"
              opacity={0.3 + 0.7 * agentBusy}
              transform={`rotate(${spin} ${AGENT.x} ${AGENT.y})`}
            />
            <g transform={`rotate(${agentBusy * spin * 0.5} ${AGENT.x} ${AGENT.y})`}>
              <polygon
                points={Array.from({length: 6})
                  .map((_, k) => {
                    const a = ((k * 60 - 90) * Math.PI) / 180;
                    return `${AGENT.x + 46 * Math.cos(a)},${AGENT.y + 46 * Math.sin(a)}`;
                  })
                  .join(' ')}
                fill={S.bg}
                stroke={S.indigo}
                strokeWidth={4}
                strokeLinejoin="round"
              />
              {[0, 1, 2].map((k) => (
                <line
                  key={k}
                  x1={AGENT.x}
                  y1={AGENT.y}
                  x2={AGENT.x + 46 * Math.cos(((k * 120 - 90) * Math.PI) / 180)}
                  y2={AGENT.y + 46 * Math.sin(((k * 120 - 90) * Math.PI) / 180)}
                  stroke={S.indigo}
                  strokeWidth={2}
                  opacity={0.45}
                />
              ))}
            </g>
            <circle cx={AGENT.x} cy={AGENT.y} r={11 + 6 * agentBusy} fill={S.indigo} />
            <rect x={AGENT.x - 70} y={AGENT.y + AGENT.r + 30} width={140} height={44} rx={22} fill={S.indigo} />
            <Txt x={AGENT.x} y={AGENT.y + AGENT.r + 60} size={21} weight={600} fill={S.bg}>
              Agent IA
            </Txt>
            <Txt x={AGENT.x} y={AGENT.y + AGENT.r + 104} size={16} fill={S.muted}>
              {agentBusy > 0.5 ? 'analyse la demande…' : 'propose une action'}
            </Txt>
          </g>

          {/* request → agent connector */}
          <line
            x1={AGENT.x}
            x2={AGENT.x}
            y1={REQ.y + REQ.h / 2 + 6}
            y2={AGENT.y - AGENT.r - 24}
            stroke={S.line}
            strokeWidth={2.5}
            strokeDasharray="5 6"
            strokeLinecap="round"
            opacity={ramp(t, 6.8, 7.4)}
          />
          <circle
            cx={AGENT.x}
            cy={interpolate(pulse, [0, 1], [REQ.y + REQ.h / 2, AGENT.y - AGENT.r - 16])}
            r={7}
            fill={S.indigo}
            opacity={pulseOn}
          />

          <RequestCard t={t} n={1} lines={['Rembourser une commande', 'Montant : 120 €']} inAt={6.6} outAt={PASS2} />
          <RequestCard t={t} n={2} lines={['Analyser les salaires', 'pour un rapport interne']} inAt={PASS2 + 0.1} outAt={OUTRO + 0.6} />

          {GATE_X.map((_, i) => (
            <Gate key={i} i={i} build={b(0.6 + i * 0.35)} open={gateOpen[i]} shake={i === 2 ? shake : 0} />
          ))}

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
              rx={22}
              fill={noAction > 0 ? S.grey : S.bg}
              stroke={S.line}
              strokeWidth={1.5}
              strokeDasharray={noAction > 0 ? '7 6' : undefined}
              filter={noAction > 0 ? undefined : 'url(#senza-shadow)'}
            />
            <rect
              x={ACTION.x - ACTION.w / 2}
              y={ACTION.y - ACTION.h / 2}
              width={ACTION.w}
              height={ACTION.h}
              rx={22}
              fill={S.indigo}
              opacity={success}
              filter="url(#senza-glow)"
            />
            <Txt x={ACTION.x} y={ACTION.y - ACTION.h / 2 - 22} size={13} weight={700} spacing={2.5} fill={S.muted}>
              ACTION
            </Txt>
            <g opacity={(1 - success) * (1 - noAction)}>
              <Txt x={ACTION.x} y={ACTION.y + 7} size={19} fill={S.muted}>
                en attente
              </Txt>
            </g>
            <g opacity={success}>
              <circle cx={ACTION.x} cy={ACTION.y - 20} r={20} fill={S.bg} />
              <Check x={ACTION.x} y={ACTION.y - 20} s={0.85} p={ramp(t, 18.9, 19.4)} color={S.indigo} />
              <Txt x={ACTION.x} y={ACTION.y + 34} size={19} weight={600} fill={S.bg}>
                Remboursement fait
              </Txt>
            </g>
            <g opacity={noAction}>
              <Txt x={ACTION.x} y={ACTION.y - 4} size={20} weight={700}>
                Aucune action
              </Txt>
              <Txt x={ACTION.x} y={ACTION.y + 24} size={16} fill={S.muted}>
                exécutée
              </Txt>
            </g>
          </g>

          {/* packet */}
          <g opacity={pOpacity} transform={`translate(${px}, ${TRACK_Y + bounceY})`}>
            <circle r={19} fill={refused ? S.navy : S.indigo} filter={refused ? undefined : 'url(#senza-glow)'} />
            {refused ? (
              <Cross x={0} y={0} s={0.55} p={ramp(t, REFUSE + 0.1, REFUSE + 0.5)} color={S.yellow} />
            ) : (
              <circle r={6} fill={S.bg} />
            )}
          </g>

          {/* refusal banner */}
          <g opacity={banner} transform={`translate(0, ${(1 - ramp(t, 30.5, 31.1)) * 16})`}>
            <rect x={960 - 540} y={890} width={1080} height={116} rx={20} fill={S.cream} stroke={S.yellow} strokeWidth={1.5} filter="url(#senza-shadow)" />
            <clipPath id="senza-banner-clip">
              <rect x={960 - 540} y={890} width={1080} height={116} rx={20} />
            </clipPath>
            <rect x={960 - 540} y={890} width={14} height={116} fill={S.yellow} clipPath="url(#senza-banner-clip)" />
            <Txt x={960 - 496} y={936} size={26} weight={700} anchor="start">
              Refus justifié : les salaires sont hors du périmètre autorisé.
            </Txt>
            <Txt x={960 - 496} y={976} size={19} anchor="start" fill={S.muted}>
              Le motif est consigné au journal et la demande est transmise à un responsable.
            </Txt>
          </g>
        </g>
      </svg>

      {/* captions (HTML for proper underline) */}
      <AbsoluteFill style={{opacity: scene, pointerEvents: 'none'}}>
        {captions.map((c) => {
          const o = cap(c.a, c.z);
          return (
            <div
              key={c.text}
              style={{
                position: 'absolute',
                top: 96,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 34,
                fontWeight: 600,
                opacity: o,
                transform: `translateY(${(1 - o) * 10}px)`,
              }}
            >
              {c.text}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            top: 160,
            left: 960 - 36,
            width: 72,
            height: 5,
            borderRadius: 3,
            background: S.indigo,
            opacity: ramp(t, BUILD + 0.4, BUILD + 0.9),
          }}
        />
      </AbsoluteFill>

      {/* title */}
      <AbsoluteFill
        style={{
          opacity: title,
          transform: `translateY(${titleRise}px)`,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{fontSize: 84, fontWeight: 700, letterSpacing: -1, display: 'flex', gap: 22, alignItems: 'baseline'}}>
          <span style={underline(S.yellow, ramp(t, 0.8, 1.5))}>Garde-fous</span>
          <span style={{fontSize: 40, fontWeight: 500, color: S.muted}}>d’un</span>
          <span style={underline(S.indigo, ramp(t, 1.1, 1.8))}>agent IA</span>
        </div>
        <div style={{marginTop: 26, fontSize: 28, color: S.muted}}>
          IA : intelligence artificielle. Avant d’agir, l’agent passe des contrôles.
        </div>
      </AbsoluteFill>

      {/* outro */}
      <AbsoluteFill
        style={{
          opacity: outro,
          transform: `translateY(${(1 - outro) * 20}px)`,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{fontSize: 18, fontWeight: 600, letterSpacing: 5, color: S.muted}}>EN RÉSUMÉ</div>
        <div style={{marginTop: 22, fontSize: 68, fontWeight: 700, letterSpacing: -0.5}}>
          Un agent fiable sait aussi{' '}
          <span style={{color: S.indigo, ...underline(S.indigo, ramp(t, OUTRO + 1.1, OUTRO + 1.7))}}>s’arrêter</span>.
        </div>
        <div style={{marginTop: 56, display: 'flex', gap: 22}}>
          {GATE_LABELS.map((label, k) => {
            const a = ramp(t, OUTRO + 1.4 + k * 0.2, OUTRO + 1.9 + k * 0.2, easeBack);
            return (
              <div
                key={label}
                style={{
                  opacity: Math.min(1, a),
                  transform: `scale(${0.8 + 0.2 * a})`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 26px 12px 14px',
                  borderRadius: 40,
                  background: S.cream,
                  border: `1.5px solid ${S.yellow}`,
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: S.yellow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  {k + 1}
                </span>
                {label}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
