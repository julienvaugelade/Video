import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FONT} from './theme';
import TIMING from './parcoursTiming.json';

// ---------------------------------------------------------------------------
// Palette & helpers
// ---------------------------------------------------------------------------

const P = {
  bg: '#2B3346',
  bgDeep: '#222939',
  blue: '#4E4EEA',
  blueSoft: '#9A9AF6',
  yellow: '#F9C623',
  white: '#FFFFFF',
  muted: '#A7AEC2',
};

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

/** 0 → 1 between a and b (seconds), eased. */
const ramp = (t: number, a: number, b: number, easing = easeOut) =>
  interpolate(t, [a, b], [0, 1], {...CLAMP, easing});

/** Visible window: fades in at `a`, fades out at `b`. */
const windowed = (t: number, a: number, b: number, fade = 0.4) =>
  Math.min(ramp(t, a, a + fade), 1 - ramp(t, b - fade, b));

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Accumulated "active time" of a windowed signal, so motion slows down instead of snapping. */
const activeTime = (t: number, a: number, b: number, fps: number) => {
  let acc = 0;
  for (let s = a; s < Math.min(t, b); s += 1 / fps) acc += windowed(s, a, b, 0.6) / fps;
  return acc;
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const T = TIMING;

const MODULES = [
  'Découverte',
  'Cas métier',
  'Interface',
  'Automatisation',
  'Agent IA',
  'Préparation',
  'Certification',
];
const N = MODULES.length;
const LAST = N - 1;

const ARRIVE = MODULES.map((_, i) => T.firstArrival + i * T.stepPeriod);
const DEPART = MODULES.map((_, i) => (i < LAST ? ARRIVE[i + 1] - T.travel : T.zoomOut[0]));
const CERT_AT = ARRIVE[LAST];
const [RECAP_A, RECAP_B] = T.recap;
const FINAL_BURST = RECAP_B;

// ---------------------------------------------------------------------------
// World layout (overview = scale 1)
// ---------------------------------------------------------------------------

const LINE_Y = 560;
const X0 = 180;
const GAP = 260;
const NODE_X = MODULES.map((_, i) => X0 + i * GAP);
const R = 58;
const ZOOM = 1.9;

const travelerX = (t: number) => {
  if (t < ARRIVE[0])
    return interpolate(t, [T.zoomIn[0] + 0.3, ARRIVE[0]], [X0 - 260, X0], {...CLAMP, easing: easeOut});
  for (let i = 1; i < N; i++) {
    if (t < ARRIVE[i]) {
      return interpolate(t, [DEPART[i - 1], ARRIVE[i]], [NODE_X[i - 1], NODE_X[i]], {
        ...CLAMP,
        easing: easeInOut,
      });
    }
  }
  return NODE_X[LAST];
};

/** Index of the step currently on screen (−1 before the first arrival). */
const stepAt = (t: number) => {
  let s = -1;
  for (let i = 0; i < N; i++) if (t >= ARRIVE[i] - T.travel * 0.5) s = i;
  return s;
};

const recapX = (t: number) =>
  interpolate(t, [RECAP_A, RECAP_B], [NODE_X[0], NODE_X[LAST]], {...CLAMP, easing: easeInOut});
/** Time at which the recap pulse passes node i. */
const RECAP_PASS = NODE_X.map((x) => {
  for (let s = RECAP_A; s <= RECAP_B; s += 1 / 120) if (recapX(s) >= x - 0.5) return s;
  return RECAP_B;
});

const camera = (t: number) => {
  // Follow the traveler, pulling back a little while it moves
  let dip = 0;
  for (let i = 1; i < N; i++) {
    if (t >= DEPART[i - 1] && t < ARRIVE[i]) {
      dip = Math.sin(Math.PI * ((t - DEPART[i - 1]) / T.travel));
    }
  }
  const follow = {x: travelerX(t), y: LINE_Y, z: ZOOM - 0.2 * dip};
  const pushIn = 1 + 0.05 * ramp(t, T.zoomOut[1], T.settleEnd, easeInOut);
  const overview = {x: 990, y: LINE_Y - 20, z: pushIn};
  const k =
    ramp(t, T.zoomIn[0], T.zoomIn[1], easeInOut) - ramp(t, T.zoomOut[0], T.zoomOut[1], easeInOut);
  return {
    x: lerp(overview.x, follow.x, k),
    y: lerp(overview.y, follow.y, k),
    z: lerp(overview.z, follow.z, k),
  };
};

// ---------------------------------------------------------------------------
// Icons (local coords, centered, ~56 px box)
// ---------------------------------------------------------------------------

type IconProps = {t: number; i: number; draw: number; color: string; fps: number};

const strokeProps = (color: string, draw: number) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: 4.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - draw,
});

const iconActivity = (t: number, i: number) => windowed(t, ARRIVE[i] + 0.9, DEPART[i] + 0.3, 0.5);

const IconLoupe: React.FC<IconProps> = ({t, i, draw, color, fps}) => {
  const u = activeTime(t, ARRIVE[i] + 0.9, DEPART[i] + 0.3, fps);
  const a = iconActivity(t, i);
  const dx = Math.sin(u * 2.4) * 5 * a;
  const dy = Math.sin(u * 4.8) * 3 * a;
  return (
    <g transform={`translate(${dx} ${dy})`}>
      <circle cx={-5} cy={-5} r={15} {...strokeProps(color, draw)} />
      <path d="M 6 6 L 19 19" {...strokeProps(color, ramp(draw, 0.6, 1))} />
      <path d="M -13 -8 A 9 9 0 0 1 -8 -13" {...strokeProps(color, ramp(draw, 0.8, 1))} strokeWidth={3} opacity={0.7} />
    </g>
  );
};

const IconBriefcase: React.FC<IconProps> = ({t, i, draw, color, fps}) => {
  const u = activeTime(t, ARRIVE[i] + 0.9, DEPART[i] + 0.3, fps);
  const a = iconActivity(t, i);
  const bob = -Math.abs(Math.sin(u * 3.2)) * 4 * a;
  const tilt = Math.sin(u * 3.2) * 3 * a;
  return (
    <g transform={`translate(0 ${bob + 3}) rotate(${tilt})`}>
      <rect x={-23} y={-12} width={46} height={32} rx={6} {...strokeProps(color, draw)} />
      <path
        d="M -8 -12 V -17 Q -8 -21 -4 -21 H 4 Q 8 -21 8 -17 V -12"
        {...strokeProps(color, ramp(draw, 0.4, 1))}
      />
      <path d="M -23 1 H 23" {...strokeProps(color, ramp(draw, 0.5, 1))} />
      <rect x={-4.5} y={-3} width={9} height={8} rx={2} fill={color} opacity={ramp(draw, 0.8, 1)} />
    </g>
  );
};

const IconInterface: React.FC<IconProps> = ({t, i, draw, color, fps}) => {
  const a = iconActivity(t, i);
  const u = Math.max(0, t - ARRIVE[i] - 0.9);
  const cyc = (u % 1.8) / 1.8;
  const move = ramp(cyc, 0, 0.45, easeInOut);
  const cx = lerp(16, 3, move);
  const cy = lerp(16, 1, move);
  const click = windowed(cyc, 0.5, 0.95, 0.15);
  const ripple = ramp(cyc, 0.5, 0.95);
  return (
    <g transform="translate(-2 -2)">
      <rect x={-25} y={-19} width={50} height={38} rx={6} {...strokeProps(color, draw)} />
      <path d="M -25 -9 H 25" {...strokeProps(color, ramp(draw, 0.4, 1))} />
      {[-18, -12, -6].map((x) => (
        <circle key={x} cx={x} cy={-14} r={1.8} fill={color} opacity={ramp(draw, 0.6, 1)} />
      ))}
      <path d="M -16 0 H 4" {...strokeProps(color, ramp(draw, 0.6, 1))} strokeWidth={3.5} />
      <path d="M -16 8 H -4" {...strokeProps(color, ramp(draw, 0.7, 1))} strokeWidth={3.5} />
      <circle
        cx={3}
        cy={1}
        r={4 + 10 * ripple}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={click * a * (1 - ripple)}
      />
      <g
        transform={`translate(${lerp(16, cx, a)} ${lerp(16, cy, a)}) scale(${1 - 0.12 * click * a})`}
        opacity={ramp(draw, 0.7, 1)}
      >
        <path
          d="M 0 0 L 0 16 L 4.5 12 L 8 19 L 11 17.5 L 7.5 11 L 13 11 Z"
          fill={color}
          stroke={P.blue}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};

const gearPath = (rOut: number, rIn: number, teeth: number) => {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let k = 0; k < teeth; k++) {
    const a = k * step;
    const angles = [a - step * 0.22, a - step * 0.12, a + step * 0.12, a + step * 0.22];
    const radii = [rIn, rOut, rOut, rIn];
    angles.forEach((an, j) => {
      pts.push(`${(radii[j] * Math.cos(an)).toFixed(2)} ${(radii[j] * Math.sin(an)).toFixed(2)}`);
    });
  }
  return `M ${pts.join(' L ')} Z`;
};
const GEAR_A = gearPath(16, 11.5, 8);
const GEAR_B = gearPath(11.5, 8, 6);

const IconGears: React.FC<IconProps> = ({t, i, draw, color, fps}) => {
  const u = activeTime(t, ARRIVE[i] + 0.9, DEPART[i] + 0.3, fps);
  const angle = u * 140 + draw * 45;
  return (
    <g>
      <g transform={`translate(-8 -6) rotate(${angle})`}>
        <path d={GEAR_A} {...strokeProps(color, draw)} strokeWidth={4} />
        <circle r={4.5} {...strokeProps(color, ramp(draw, 0.5, 1))} strokeWidth={3.5} />
      </g>
      <g transform={`translate(14 12) rotate(${-angle * (8 / 6) + 15})`}>
        <path d={GEAR_B} {...strokeProps(color, ramp(draw, 0.3, 1))} strokeWidth={4} />
        <circle r={3} fill={color} opacity={ramp(draw, 0.7, 1)} />
      </g>
    </g>
  );
};

const IconAgent: React.FC<IconProps> = ({t, i, draw, color}) => {
  const a = iconActivity(t, i);
  const u = Math.max(0, t - ARRIVE[i] - 0.9);
  const blinkPhase = u % 2.2;
  const blink = blinkPhase > 1.9 && blinkPhase < 2.1 ? 0.15 : 1;
  const look = Math.sin(u * 1.6) * 2.5 * a;
  const pulse = (u % 1.1) / 1.1;
  const twinkle = 0.6 + 0.4 * Math.sin(u * 5);
  return (
    <g transform="translate(-2 4)">
      <rect x={-20} y={-14} width={40} height={30} rx={9} {...strokeProps(color, draw)} />
      <path d="M 0 -14 V -21" {...strokeProps(color, ramp(draw, 0.4, 1))} />
      <circle cx={0} cy={-25} r={3.8} fill={color} opacity={ramp(draw, 0.6, 1)} />
      <circle
        cx={0}
        cy={-25}
        r={4 + 8 * pulse}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={a * (1 - pulse) * 0.9}
      />
      <path d="M -24 -3 V 6 M 24 -3 V 6" {...strokeProps(color, ramp(draw, 0.5, 1))} />
      {[-8, 8].map((x) => (
        <ellipse
          key={x}
          cx={x + look}
          cy={0}
          rx={3.6}
          ry={3.6 * (a > 0.05 ? blink : 1)}
          fill={color}
          opacity={ramp(draw, 0.6, 1)}
        />
      ))}
      <path d="M -6 9 H 6" {...strokeProps(color, ramp(draw, 0.7, 1))} strokeWidth={3.5} />
      {/* sparkle */}
      <g
        transform={`translate(22 -22) scale(${ramp(draw, 0.8, 1) * (a > 0 ? lerp(1, twinkle, a) : 1)})`}
      >
        <path d="M 0 -7 Q 1 -1 7 0 Q 1 1 0 7 Q -1 1 -7 0 Q -1 -1 0 -7 Z" fill={P.yellow} />
      </g>
    </g>
  );
};

const IconChecklist: React.FC<IconProps> = ({t, i, draw, color}) => {
  const rows = [-7, 3, 13];
  return (
    <g transform="translate(0 2)">
      <rect x={-19} y={-21} width={38} height={44} rx={6} {...strokeProps(color, draw)} />
      <rect x={-8} y={-26} width={16} height={9} rx={3} {...strokeProps(color, ramp(draw, 0.3, 1))} fill={P.blue} />
      {rows.map((y, k) => {
        const tick = ramp(t, ARRIVE[i] + 1.0 + k * 0.45, ARRIVE[i] + 1.35 + k * 0.45);
        return (
          <g key={y}>
            <path
              d={`M -12 ${y} l 3 3 l 5 -6`}
              {...strokeProps(k === 2 ? P.yellow : color, tick)}
              strokeWidth={3.5}
            />
            <path d={`M 0 ${y} H 11`} {...strokeProps(color, ramp(draw, 0.5 + k * 0.1, 0.8 + k * 0.1))} strokeWidth={3.5} />
          </g>
        );
      })}
    </g>
  );
};

const starPath = (rOut: number, rIn: number) => {
  const pts: string[] = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? rOut : rIn;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    pts.push(`${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
};
const STAR = starPath(8, 3.6);

const IconMedal: React.FC<IconProps> = ({t, i, draw, color, fps}) => {
  const u = Math.max(0, t - ARRIVE[i] - 0.6);
  const swing = Math.sin(u * 4) * 9 * Math.exp(-u * 1.1);
  const starPop = spring({frame: (t - ARRIVE[i] - 0.9) * fps, fps, config: {damping: 9, stiffness: 160}});
  return (
    <g transform={`translate(0 -2) rotate(${swing} 0 -28)`}>
      <path d="M -9 4 L -15 26 L -8 22 L -4 28 L 1 12" {...strokeProps(color, ramp(draw, 0.3, 1))} strokeWidth={4} />
      <path d="M 9 4 L 15 26 L 8 22 L 4 28 L -1 12" {...strokeProps(color, ramp(draw, 0.3, 1))} strokeWidth={4} />
      <circle cx={0} cy={-6} r={16} {...strokeProps(color, draw)} />
      <path d={STAR} transform={`translate(0 -6) scale(${Math.max(0, starPop)})`} fill={color} />
    </g>
  );
};

const ICONS = [IconLoupe, IconBriefcase, IconInterface, IconGears, IconAgent, IconChecklist, IconMedal];

// ---------------------------------------------------------------------------
// Node (circle + icon + label)
// ---------------------------------------------------------------------------

const Node: React.FC<{t: number; i: number; fps: number}> = ({t, i, fps}) => {
  const x = NODE_X[i];
  const isCert = i === LAST;
  const ghost = spring({
    frame: (t - (T.ghostNodeStart + i * T.ghostNodeStagger)) * fps,
    fps,
    config: {damping: 13, stiffness: 180, mass: 0.6},
  });
  const pop = spring({frame: (t - ARRIVE[i]) * fps, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  const arrived = t >= ARRIVE[i];
  const draw = ramp(t, ARRIVE[i] + 0.15, ARRIVE[i] + 0.95, easeInOut);

  // Recap bump when the final pulse passes by
  const rp = RECAP_PASS[i];
  const bump = t >= rp - 0.1 ? Math.sin(Math.PI * ramp(t, rp - 0.1, rp + 0.35, easeInOut)) : 0;

  // Certification: final emphasis
  const certGrow = isCert ? 0.32 * spring({frame: (t - FINAL_BURST) * fps, fps, config: {damping: 12, stiffness: 120}}) : 0;
  const scale = 1 + 0.12 * bump + certGrow;

  const fill = isCert ? interpolateColors(ramp(t, CERT_AT, CERT_AT + 0.35), [0, 1], [P.blue, P.yellow]) : P.blue;
  const iconColor = isCert ? P.bg : P.white;
  const Icon = ICONS[i];

  // Active ring (while the camera stands on the node)
  const active = windowed(t, ARRIVE[i], DEPART[i] + 0.2, 0.3);
  const ping = ramp(t, ARRIVE[i], ARRIVE[i] + 1.1);
  const ringColor = isCert ? P.yellow : P.blue;

  // Label
  const below = i % 2 === 0;
  const lblA = ramp(t, ARRIVE[i] + 0.45, ARRIVE[i] + 0.95);
  const lblB = ramp(t, ARRIVE[i] + 0.6, ARRIVE[i] + 1.15);
  const extra = (scale - 1) * R + (isCert ? 40 * ramp(t, FINAL_BURST - 0.15, FINAL_BURST + 0.35) : 0);
  const modY = below ? LINE_Y + R + 40 + extra : LINE_Y - R - 70;
  const keyY = below ? LINE_Y + R + 80 + extra : LINE_Y - R - 30;
  const dir = below ? 1 : -1;
  const kwColor = isCert ? P.yellow : P.white;
  const kwBright = 0.82 + 0.18 * Math.max(bump, active, isCert ? 1 : 0);

  return (
    <g>
      {/* ghost circle with number */}
      <g transform={`translate(${x} ${LINE_Y}) scale(${ghost})`} opacity={1 - ramp(t, ARRIVE[i], ARRIVE[i] + 0.3)}>
        <circle r={R - 4} fill={P.bg} stroke={P.white} strokeOpacity={0.3} strokeWidth={3} strokeDasharray="6 8" />
        <text
          y={10}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={600}
          fontSize={28}
          fill={isCert ? P.yellow : P.white}
          opacity={isCert ? 0.8 : 0.5}
        >
          {i + 1}
        </text>
      </g>

      {/* ping ring at arrival */}
      {arrived && ping < 1 && (
        <circle
          cx={x}
          cy={LINE_Y}
          r={R + 8 + 60 * ping}
          fill="none"
          stroke={ringColor}
          strokeWidth={4 * (1 - ping) + 1}
          opacity={1 - ping}
        />
      )}

      {/* certification glow */}
      {isCert && arrived && (
        <circle
          cx={x}
          cy={LINE_Y}
          r={(R + 30) * scale}
          fill="url(#certGlow)"
          opacity={ramp(t, CERT_AT, CERT_AT + 0.6)}
        />
      )}

      {/* filled node */}
      {arrived && (
        <g transform={`translate(${x} ${LINE_Y}) scale(${pop * scale})`}>
          <circle r={R + 10} fill="none" stroke={ringColor} strokeOpacity={0.35 * active} strokeWidth={3} />
          <circle r={R} fill={fill} />
          <circle r={R} fill="none" stroke={P.white} strokeOpacity={0.15} strokeWidth={2} />
          <g transform="scale(1.05)">
            <Icon t={t} i={i} draw={draw} color={iconColor} fps={fps} />
          </g>
        </g>
      )}

      {/* label */}
      {arrived && (
        <g textAnchor="middle" fontFamily={FONT}>
          <text
            x={x}
            y={modY + dir * 14 * (1 - lblA)}
            fontSize={15}
            fontWeight={600}
            letterSpacing={3}
            fill={isCert ? P.yellow : P.blueSoft}
            opacity={lblA}
          >
            {`MODULE ${String(i + 1).padStart(2, '0')}`}
          </text>
          <text
            x={x}
            y={keyY + dir * 18 * (1 - lblB)}
            fontSize={isCert ? 33 : 30}
            fontWeight={isCert ? 700 : 600}
            fill={kwColor}
            opacity={lblB * kwBright}
          >
            {MODULES[i]}
          </text>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Certification burst (rays + sparks)
// ---------------------------------------------------------------------------

const CertBurst: React.FC<{t: number; at: number; power: number}> = ({t, at, power}) => {
  const k = ramp(t, at, at + 0.9);
  if (t < at || k >= 1) return null;
  return (
    <g transform={`translate(${NODE_X[LAST]} ${LINE_Y})`}>
      {Array.from({length: 12}, (_, j) => {
        const a = (j * 30 * Math.PI) / 180;
        const r0 = (R + 14 + 40 * k) * power;
        const r1 = r0 + 26 * (1 - k) * power;
        return (
          <line
            key={j}
            x1={r0 * Math.cos(a)}
            y1={r0 * Math.sin(a)}
            x2={r1 * Math.cos(a)}
            y2={r1 * Math.sin(a)}
            stroke={P.yellow}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={1 - k}
          />
        );
      })}
    </g>
  );
};

const CertRays: React.FC<{t: number}> = ({t}) => {
  const show = ramp(t, FINAL_BURST + 0.1, FINAL_BURST + 1.0);
  if (show <= 0) return null;
  // Slow rotation that eases to a stop at settleEnd
  const rot = 40 * ramp(t, FINAL_BURST, T.settleEnd, Easing.out(Easing.quad));
  const r0 = R * 1.32 + 22;
  return (
    <g transform={`translate(${NODE_X[LAST]} ${LINE_Y}) rotate(${rot})`} opacity={show}>
      {Array.from({length: 16}, (_, j) => {
        const a = (j * 22.5 * Math.PI) / 180;
        const len = j % 2 === 0 ? 30 : 16;
        return (
          <line
            key={j}
            x1={r0 * Math.cos(a)}
            y1={r0 * Math.sin(a)}
            x2={(r0 + len * show) * Math.cos(a)}
            y2={(r0 + len * show) * Math.sin(a)}
            stroke={P.yellow}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={j % 2 === 0 ? 0.9 : 0.5}
          />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const ParcoursRS6601: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const cam = camera(t);
  const worldTransform = `translate(960 540) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`;

  const pop = (at: number, damping = 13) =>
    spring({frame: (t - at) * fps, fps, config: {damping, stiffness: 170, mass: 0.7}});

  // Intro
  const introOut = ramp(t, T.introOut[0], T.introOut[1], easeInOut);
  const heading = windowed(t, 4.35, T.zoomIn[0] + 0.3, 0.4);

  // Line & traveler
  const ghostLine = ramp(t, T.ghostLine[0], T.ghostLine[1], easeInOut);
  const tx = travelerX(t);
  const progressX = Math.max(X0, Math.min(tx, NODE_X[LAST]));
  const travelerOn = ramp(t, T.zoomIn[0] + 0.3, T.zoomIn[0] + 0.6) * (1 - ramp(t, CERT_AT - 0.05, CERT_AT + 0.1));
  const lastSeg = ramp(t, CERT_AT - 0.4, CERT_AT + 0.5);
  const travelerColor = interpolateColors(ramp(t, DEPART[LAST - 1], CERT_AT), [0, 1], [P.white, P.yellow]);

  // Recap pulse
  const recapOn = windowed(t, RECAP_A - 0.1, RECAP_B + 0.15, 0.2);
  const rx = recapX(t);

  // HUD
  const step = stepAt(t);
  const hud = windowed(t, T.zoomIn[1] - 0.4, T.zoomOut[0] + 0.4, 0.5);

  // Big background numeral
  const numerals = MODULES.map((_, i) => {
    const inK = ramp(t, ARRIVE[i] - 0.5, ARRIVE[i] + 0.4);
    const outK = i < LAST ? ramp(t, DEPART[i], DEPART[i] + 0.6, Easing.in(Easing.cubic)) : ramp(t, T.zoomOut[0], T.zoomOut[0] + 0.6);
    return {inK, outK};
  });

  // Final message
  const m1 = pop(T.message[0]);
  const m2 = pop(T.message[1]);

  // Background parallax
  const gridOffX = -((cam.x * cam.z * 0.35) % 64);

  return (
    <AbsoluteFill style={{background: P.bg, fontFamily: FONT, color: P.white, overflow: 'hidden'}}>
      <Html5Audio src={staticFile('audio/parcours-rs6601.wav')} />

      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern
            id="dots"
            width={64}
            height={64}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${gridOffX} 0)`}
          >
            <circle cx={32} cy={32} r={1.6} fill={P.white} opacity={0.07} />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
            <stop offset="55%" stopColor={P.bgDeep} stopOpacity={0} />
            <stop offset="100%" stopColor={P.bgDeep} stopOpacity={0.9} />
          </radialGradient>
          <radialGradient id="certGlow">
            <stop offset="45%" stopColor={P.yellow} stopOpacity={0.35} />
            <stop offset="100%" stopColor={P.yellow} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="travelerGlow">
            <stop offset="0%" stopColor={P.blueSoft} stopOpacity={0.8} />
            <stop offset="100%" stopColor={P.blue} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="lastSeg" x1={NODE_X[LAST - 1]} x2={NODE_X[LAST]} y1={0} y2={0} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={P.blue} />
            <stop offset="100%" stopColor={P.yellow} />
          </linearGradient>
        </defs>

        <rect width={1920} height={1080} fill="url(#dots)" />

        {/* Big step numeral (screen space) */}
        {numerals.map(({inK, outK}, i) =>
          inK > 0 && outK < 1 ? (
            <text
              key={i}
              x={1870 + 120 * (1 - inK) - 160 * outK}
              y={1020}
              textAnchor="end"
              fontFamily={FONT}
              fontWeight={700}
              fontSize={380}
              fill={i === LAST ? P.yellow : P.blue}
              opacity={(i === LAST ? 0.16 : 0.2) * inK * (1 - outK) * hud}
            >
              {String(i + 1).padStart(2, '0')}
            </text>
          ) : null,
        )}

        <rect width={1920} height={1080} fill="url(#vignette)" />

        {/* ===== WORLD ===== */}
        <g transform={worldTransform}>
          {/* ghost dotted line */}
          <line
            x1={X0}
            y1={LINE_Y}
            x2={lerp(X0, NODE_X[LAST], ghostLine)}
            y2={LINE_Y}
            stroke={P.white}
            strokeOpacity={0.25}
            strokeWidth={4}
            strokeDasharray="2 14"
            strokeLinecap="round"
          />
          {/* progress line */}
          {t >= ARRIVE[0] && (
            <line
              x1={X0}
              y1={LINE_Y}
              x2={Math.min(progressX, NODE_X[LAST - 1])}
              y2={LINE_Y}
              stroke={P.blue}
              strokeWidth={7}
              strokeLinecap="round"
            />
          )}
          {progressX > NODE_X[LAST - 1] && (
            <>
              <line x1={NODE_X[LAST - 1]} y1={LINE_Y} x2={progressX} y2={LINE_Y} stroke={P.blue} strokeWidth={7} strokeLinecap="round" />
              <line
                x1={NODE_X[LAST - 1]}
                y1={LINE_Y}
                x2={progressX}
                y2={LINE_Y}
                stroke="url(#lastSeg)"
                strokeWidth={7}
                strokeLinecap="round"
                opacity={lastSeg}
              />
            </>
          )}

          {/* traveler */}
          {travelerOn > 0 && (
            <g transform={`translate(${tx} ${LINE_Y})`} opacity={travelerOn}>
              <circle r={30} fill="url(#travelerGlow)" />
              <circle r={11} fill={travelerColor} />
            </g>
          )}

          {/* recap pulse */}
          {recapOn > 0 && (
            <g transform={`translate(${rx} ${LINE_Y})`} opacity={recapOn}>
              <circle r={34} fill="url(#travelerGlow)" />
              <circle r={9} fill={P.white} />
            </g>
          )}

          <CertRays t={t} />
          {MODULES.map((_, i) => (
            <Node key={i} t={t} i={i} fps={fps} />
          ))}
          <CertBurst t={t} at={CERT_AT} power={1} />
          <CertBurst t={t} at={FINAL_BURST} power={1.35} />
        </g>
      </svg>

      {/* ================= INTRO ================= */}
      {t < T.introOut[1] && (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1 - introOut,
            transform: `translateY(${-60 * introOut}px)`,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 10,
              color: P.blueSoft,
              opacity: ramp(t, 0.2, 0.7),
              transform: `translateY(${(1 - ramp(t, 0.2, 0.7)) * 14}px)`,
            }}
          >
            FORMATION
          </div>
          <div
            style={{
              position: 'relative',
              fontSize: 168,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.1,
              opacity: Math.min(1, pop(0.4) * 1.5),
              transform: `scale(${0.85 + 0.15 * pop(0.4)})`,
            }}
          >
            RS6601
            <div
              style={{
                position: 'absolute',
                left: 6,
                right: 6,
                bottom: -4,
                height: 12,
                borderRadius: 6,
                background: P.yellow,
                transformOrigin: 'left',
                transform: `scaleX(${ramp(t, 0.9, 1.6, easeInOut)})`,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 44,
              fontSize: 36,
              fontWeight: 500,
              opacity: ramp(t, 1.4, 2.0),
              transform: `translateY(${(1 - ramp(t, 1.4, 2.0)) * 16}px)`,
            }}
          >
            7 modules <span style={{color: P.blueSoft}}>·</span> 1 parcours{' '}
            <span style={{color: P.blueSoft}}>·</span> <span style={{color: P.yellow}}>1 certification</span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 70,
              fontSize: 20,
              fontWeight: 400,
              color: P.muted,
              opacity: ramp(t, 2.0, 2.6),
            }}
          >
            RS : Répertoire spécifique de France Compétences
          </div>
        </AbsoluteFill>
      )}

      {/* Overview heading */}
      {heading > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 230,
            width: '100%',
            textAlign: 'center',
            fontSize: 44,
            fontWeight: 600,
            opacity: heading,
            transform: `translateY(${(1 - ramp(t, 4.35, 4.85)) * 20}px)`,
          }}
        >
          Votre parcours en <span style={{color: P.yellow}}>7 étapes</span>
        </div>
      )}

      {/* ================= HUD ================= */}
      {hud > 0 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 56,
              left: 72,
              fontSize: 22,
              fontWeight: 500,
              color: P.muted,
              opacity: hud,
              letterSpacing: 1,
            }}
          >
            <span style={{color: P.white, fontWeight: 700}}>RS6601</span> · Parcours de formation
          </div>
          <div
            style={{
              position: 'absolute',
              top: 50,
              right: 72,
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              opacity: hud,
            }}
          >
            <div style={{display: 'flex', gap: 10}}>
              {MODULES.map((_, i) => {
                const on = i <= step;
                const cur = i === step;
                const col = i === LAST ? P.yellow : P.blue;
                return (
                  <div
                    key={i}
                    style={{
                      width: cur ? 30 : 12,
                      height: 12,
                      borderRadius: 6,
                      background: on ? col : 'rgba(255,255,255,0.18)',
                    }}
                  />
                );
              })}
            </div>
            <div style={{fontSize: 22, fontWeight: 600, minWidth: 150, textAlign: 'right'}}>
              Étape{' '}
              <span style={{color: step === LAST ? P.yellow : P.white}}>
                {String(Math.max(step, 0) + 1).padStart(2, '0')}
              </span>
              <span style={{color: P.muted}}> / 07</span>
            </div>
          </div>
        </>
      )}

      {/* ================= FINAL MESSAGE ================= */}
      {t >= T.message[0] && (
        <div style={{position: 'absolute', top: 850, width: '100%', textAlign: 'center'}}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 600,
              opacity: Math.min(1, m1 * 1.5),
              transform: `translateY(${(1 - m1) * 24}px)`,
            }}
          >
            7 modules, 1 objectif :
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 58,
              fontWeight: 700,
              color: P.yellow,
              opacity: Math.min(1, m2 * 1.5),
              transform: `translateY(${(1 - m2) * 24}px)`,
            }}
          >
            votre certification RS6601
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
