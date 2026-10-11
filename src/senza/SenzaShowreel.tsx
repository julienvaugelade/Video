// Showreel Senza Formations — 25 s, 1920×1080, 30 i/s.
// Charte : monde « Ink » (aplat indigo, texte blanc) / monde « Paper » (greige,
// titres indigo), Poppins display + Mulish texte, un seul accent par scène.
// Chiffres et domaines repris du design system Senza (skill senza-guides-pdf).
import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TransitionSeries, linearTiming, springTiming} from '@remotion/transitions';
import {wipe} from '@remotion/transitions/wipe';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {noise2D} from '@remotion/noise';
import {evolvePath} from '@remotion/paths';
import {Star} from '@remotion/shapes';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {loadFont} from '@remotion/fonts';
import {arc} from 'd3-shape';
import {interpolate as morph} from 'flubber';
import {FONT} from '../theme';

// Mulish embarquée (public/fonts, licence OFL) : le rendu ne dépend pas du réseau.
const MULISH = 'Mulish';
for (const weight of ['400', '600', '800']) {
  loadFont({family: MULISH, url: staticFile(`fonts/mulish-latin-${weight}-normal.woff2`), weight});
}

export const S = {
  indigo: '#4E4EEA',
  violet: '#6E3DEE',
  lavender: '#C5C4FF',
  lavenderSoft: '#CFCFF9',
  paper: '#F4F0EF',
  ink: '#16161D',
  hairline: '#E2DEDC',
  yellow: '#FFC93C',
  white: '#FFFFFF',
};

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1); // « expo out » façon After Effects
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const ramp = (f: number, a: number, b: number, e = ease) =>
  interpolate(f, [a, b], [0, 1], {...CLAMP, easing: e});

// Facteur de ralenti : toutes les animations sont écrites en frames « maquette »
// à 30 i/s ; le rendu les joue K fois plus lentement.
const K = 2;
const useT = () => useCurrentFrame() / K;
/** spring() exprimé en frames maquette (f peut être fractionnaire). */
const springAt = (f: number, fps: number, config: Parameters<typeof spring>[0]['config']) =>
  spring({frame: f * K, fps: fps * K, config});

const useSpring = (delay: number, config = {damping: 15, stiffness: 160, mass: 0.8}) => {
  const frame = useT();
  const {fps} = useVideoConfig();
  return springAt(frame - delay, fps, config);
};

// ---------------------------------------------------------------------------
// Motifs signature
// ---------------------------------------------------------------------------

/** Grille de points qui s'estompe en diagonale depuis un coin. */
const DottedGrid: React.FC<{color: string; corner?: 'tr' | 'bl'; reveal?: number}> = ({
  color,
  corner = 'tr',
  reveal = 1,
}) => {
  const dots = [];
  for (let i = 0; i < 14; i++) {
    for (let j = 0; j < 9; j++) {
      const d = (i + j) / 22;
      const o = Math.max(0, 1 - d * 1.4) * Math.min(1, Math.max(0, reveal * 1.6 - d));
      if (o <= 0.01) continue;
      const x = corner === 'tr' ? 1920 - 60 - i * 34 : 60 + i * 34;
      const y = corner === 'tr' ? 60 + j * 34 : 1080 - 60 - j * 34;
      dots.push(<circle key={`${i}-${j}`} cx={x} cy={y} r={4} fill={color} opacity={o * 0.55} />);
    }
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      {dots}
    </svg>
  );
};

/** Blob organique doux, déformé par du bruit. */
const Blob: React.FC<{x: number; y: number; r: number; color: string; seed: string}> = ({x, y, r, color, seed}) => {
  const frame = useT();
  const n = 48;
  const pts = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + 0.12 * noise2D(seed, Math.cos(a) * 1.2, Math.sin(a) * 1.2 + frame / 60));
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  });
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      <polygon points={pts.join(' ')} fill={color} />
    </svg>
  );
};

const Kicker: React.FC<{children: React.ReactNode; color: string; delay?: number}> = ({children, color, delay = 0}) => {
  const p = useSpring(delay);
  return (
    <div
      style={{
        fontFamily: MULISH,
        fontWeight: 800,
        fontSize: 26,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. Logo affiché d'emblée, léger zoom et motifs qui apparaissent
// ---------------------------------------------------------------------------

const SceneLogo: React.FC = () => {
  const frame = useT();
  const grid = ramp(frame, 0, 50);
  const zoom = interpolate(frame, [0, 60], [1, 1.04], CLAMP);
  return (
    <AbsoluteFill style={{backgroundColor: S.paper}}>
      <DottedGrid color={S.indigo} reveal={grid} />
      <Blob x={180} y={980} r={170 * grid} color={S.lavenderSoft} seed="b1" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Img src={staticFile('senza/logo-senza.png')} style={{width: 1100, transform: `scale(${zoom})`}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Typo cinétique : « Former pour transformer »
// ---------------------------------------------------------------------------

const Letters: React.FC<{text: string; delay: number; size: number; color: string; stagger?: number}> = ({
  text,
  delay,
  size,
  color,
  stagger = 2,
}) => {
  const frame = useT();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', fontFamily: FONT, fontWeight: 700, fontSize: size, color, lineHeight: 1, letterSpacing: '-0.02em'}}>
      {text.split('').map((ch, i) => {
        const s = springAt(frame - delay - i * stagger, fps, {damping: 13, stiffness: 200, mass: 0.6});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${(1 - s) * 120}px) rotate(${(1 - s) * 12}deg)`,
              opacity: Math.min(1, s * 2),
              textShadow: `4px 4px 0 ${S.ink}`,
              whiteSpace: 'pre',
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

const SceneManifesto: React.FC = () => {
  const frame = useT();
  const marker = ramp(frame, 46, 66, easeInOut);
  const ghostX = -frame * 3 + noise2D('g', 0, frame / 80) * 40;
  return (
    <AbsoluteFill style={{backgroundColor: S.indigo, overflow: 'hidden'}}>
      {/* Mot répété fantôme */}
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          style={{
            position: 'absolute',
            top: 70 + row * 330,
            left: ghostX * (row % 2 ? -1 : 1) - 400,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 300,
            color: 'rgba(255,255,255,0.06)',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.03em',
          }}
        >
          TRANSFORMER TRANSFORMER TRANSFORMER
        </div>
      ))}
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 190}}>
        <Kicker color={S.lavender} delay={2}>Depuis 2019</Kicker>
        <div style={{height: 26}} />
        <Letters text="FORMER POUR" delay={6} size={130} color={S.white} />
        <div style={{position: 'relative', marginTop: 10, alignSelf: 'flex-start'}}>
          <div
            style={{
              position: 'absolute',
              left: -12,
              right: -12,
              bottom: 8,
              height: 64,
              background: S.yellow,
              transformOrigin: 'left',
              transform: `scaleX(${marker}) skewX(-8deg)`,
            }}
          />
          <div style={{position: 'relative'}}>
            <Letters text="TRANSFORMER." delay={22} size={170} color={S.white} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3. Domaines : carrousel 3D de cartes
// ---------------------------------------------------------------------------

const DOMAINS = ['IA', 'No-code', 'Data', 'Automatisation', 'Webmarketing', 'Réseaux sociaux', 'Vidéo', "Création d'entreprise"];

const SceneDomains: React.FC = () => {
  const frame = useT();
  const {fps} = useVideoConfig();
  const intro = springAt(frame, fps, {damping: 18, stiffness: 90});
  const n = DOMAINS.length;
  // Le carrousel avance par crans : chaque domaine passe au premier plan.
  const steps = frame / 16;
  const stepped = Math.floor(steps) + easeInOut(Math.min(1, (steps % 1) * 1.8));
  const rot = -stepped * (360 / n) - (1 - intro) * 120;
  const R = 640;
  const underline = ramp(frame, 8, 40);
  return (
    <AbsoluteFill style={{backgroundColor: S.paper}}>
      <DottedGrid color={S.indigo} corner="bl" />
      <div style={{position: 'absolute', top: 110, width: '100%', textAlign: 'center'}}>
        <Kicker color={S.indigo}>Organisme de formation</Kicker>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 84, color: S.ink, marginTop: 14, letterSpacing: '-0.02em'}}>
          Le digital, de A à Z
        </div>
        <svg width={520} height={30} style={{marginTop: 4}}>
          <path
            d="M10 20 Q 130 4 260 16 T 510 12"
            stroke={S.indigo}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            {...evolvePath(underline, 'M10 20 Q 130 4 260 16 T 510 12')}
          />
        </svg>
      </div>
      <AbsoluteFill style={{perspective: 2200, justifyContent: 'center', alignItems: 'center', top: 110}}>
        <div style={{position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(-8deg) rotateY(${rot}deg)`}}>
          {DOMAINS.map((d, i) => {
            const a = (i * 360) / n;
            const facing = Math.cos(((a + rot) * Math.PI) / 180); // 1 = face caméra
            const front = Math.max(0, (facing - 0.85) / 0.15);
            return (
              <div
                key={d}
                style={{
                  position: 'absolute',
                  left: -230,
                  top: -130,
                  width: 460,
                  height: 260,
                  borderRadius: 22,
                  background: front > 0.5 ? S.indigo : S.white,
                  border: `2px solid ${front > 0.5 ? S.indigo : S.hairline}`,
                  boxShadow: '0 18px 40px rgba(22,22,29,0.10)',
                  transform: `rotateY(${a}deg) translateZ(${R}px)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '0 40px',
                  opacity: 0.35 + 0.65 * Math.max(0, facing),
                  backfaceVisibility: 'hidden',
                }}
              >
                <div style={{fontFamily: MULISH, fontWeight: 800, fontSize: 22, letterSpacing: '0.2em', color: front > 0.5 ? S.lavender : S.indigo}}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: d.length > 12 ? 44 : 58, lineHeight: 1.1, color: front > 0.5 ? S.white : S.ink, marginTop: 10}}>
                  {d}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 4. Chiffres-preuves : compteurs + anneau de note
// ---------------------------------------------------------------------------

const Counter: React.FC<{to: number; delay: number; suffix?: string; decimals?: number}> = ({to, delay, suffix = '', decimals = 0}) => {
  const frame = useT();
  const v = interpolate(frame, [delay, delay + 40], [0, to], {...CLAMP, easing: ease});
  const txt = decimals ? v.toFixed(decimals).replace('.', ',') : Math.round(v).toLocaleString('fr-FR').replace(/ | /g, ' ');
  return (
    <span style={{fontVariantNumeric: 'tabular-nums'}}>
      {txt}
      {suffix}
    </span>
  );
};

const StatTile: React.FC<{delay: number; children: React.ReactNode; label: string}> = ({delay, children, label}) => {
  const p = useSpring(delay, {damping: 14, stiffness: 140, mass: 0.8});
  return (
    <div
      style={{
        width: 470,
        height: 300,
        background: S.white,
        border: `2px solid ${S.hairline}`,
        borderRadius: 22,
        padding: '42px 46px',
        transform: `translateY(${(1 - p) * 80}px) scale(${0.9 + p * 0.1})`,
        opacity: p,
        boxShadow: '0 14px 34px rgba(22,22,29,0.06)',
      }}
    >
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 108, color: S.indigo, lineHeight: 1, letterSpacing: '-0.03em'}}>{children}</div>
      <div style={{fontFamily: MULISH, fontWeight: 600, fontSize: 32, color: S.ink, marginTop: 26}}>{label}</div>
    </div>
  );
};

const RatingRing: React.FC<{delay: number}> = ({delay}) => {
  const frame = useT();
  const p = useSpring(delay);
  const fill = interpolate(frame, [delay, delay + 45], [0, 4.8 / 5], {...CLAMP, easing: ease});
  const a = arc<unknown>().innerRadius(150).outerRadius(180).cornerRadius(15);
  const bg = a({startAngle: 0, endAngle: Math.PI * 2} as never) as string;
  const fg = a({startAngle: 0, endAngle: Math.PI * 2 * fill} as never) as string;
  return (
    <div style={{width: 470, height: 620, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: p, transform: `scale(${0.85 + 0.15 * p})`}}>
      <svg width={400} height={400} viewBox="-200 -200 400 400">
        <path d={bg} fill={S.lavenderSoft} />
        <path d={fg} fill={S.indigo} />
        <text x={0} y={22} textAnchor="middle" style={{fontFamily: FONT, fontWeight: 700, fontSize: 104, fill: S.ink}}>
          {(fill * 5).toFixed(1).replace('.', ',')}
        </text>
        <text x={0} y={72} textAnchor="middle" style={{fontFamily: MULISH, fontWeight: 600, fontSize: 30, fill: S.ink, opacity: 0.6}}>
          sur 5
        </text>
      </svg>
      <div style={{display: 'flex', gap: 14, marginTop: 24}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const s = springAt(frame - delay - 10 - i * 5, 30, {damping: 9, stiffness: 220});
          return (
            <div key={i} style={{transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`}}>
              <Star points={5} innerRadius={14} outerRadius={30} fill={i < 4 ? S.yellow : S.lavender} cornerRadius={3} />
            </div>
          );
        })}
      </div>
      <div style={{fontFamily: MULISH, fontWeight: 600, fontSize: 32, color: S.ink, marginTop: 26}}>260 avis Google</div>
    </div>
  );
};

const SceneStats: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: S.paper}}>
    <DottedGrid color={S.indigo} />
    <div style={{position: 'absolute', top: 100, left: 170}}>
      <Kicker color={S.indigo}>Des résultats concrets</Kicker>
    </div>
    <div style={{position: 'absolute', top: 210, left: 170, display: 'grid', gridTemplateColumns: '470px 470px', gap: 40}}>
      <StatTile delay={4} label="apprenants formés">
        <Counter to={6000} delay={4} suffix="+" />
      </StatTile>
      <StatTile delay={12} label="formateurs experts">
        <Counter to={200} delay={12} suffix="+" />
      </StatTile>
      <StatTile delay={20} label="lieux en France">
        <Counter to={50} delay={20} />
      </StatTile>
      <StatTile delay={28} label="certifié Qualiopi">
        <span style={{fontSize: 92}}>✓</span>
      </StatTile>
    </div>
    <div style={{position: 'absolute', top: 230, right: 190}}>
      <RatingRing delay={22} />
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// 5. Financement : pastilles lancées avec flou de mouvement + morphing
// ---------------------------------------------------------------------------

const FUNDING = ['CPF', 'France Travail', 'OPCO', '3x sans frais'];
const CIRCLE = 'M60,10 A50,50 0 1,1 59.9,10 Z';
const CHECK = 'M18,62 L46,90 L104,30 L112,38 L46,106 L10,70 Z';

const SceneFunding: React.FC = () => {
  const frame = useT();
  const {fps} = useVideoConfig();
  const morpher = useMemo(() => morph(CIRCLE, CHECK, {maxSegmentLength: 3}), []);
  const m = ramp(frame, 62, 84, easeInOut);
  const badge = springAt(frame - 54, fps, {damping: 10, stiffness: 180});
  return (
    <AbsoluteFill style={{backgroundColor: S.indigo}}>
      <DottedGrid color={S.white} />
      <div style={{position: 'absolute', left: 190, top: 330}}>
        <Kicker color={S.lavender}>Plusieurs solutions</Kicker>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 96, color: S.white, letterSpacing: '-0.02em', marginTop: 16, textShadow: `4px 4px 0 ${S.ink}`}}>
          Financez votre formation
        </div>
      </div>
      <CameraMotionBlur shutterAngle={200} samples={8}>
          <div style={{display: 'flex', gap: 28, position: 'absolute', left: 190, top: 620}}>
            {FUNDING.map((f, i) => {
              const s = springAt(frame - 14 - i * 7, fps, {damping: 16, stiffness: 150});
              return (
                <div
                  key={f}
                  style={{
                    fontFamily: FONT,
                    fontWeight: 600,
                    fontSize: 46,
                    color: S.indigo,
                    background: S.white,
                    borderRadius: 999,
                    padding: '22px 46px',
                    transform: `translateX(${(1 - s) * 1400}px)`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>
      </CameraMotionBlur>
      <div
        style={{
          position: 'absolute',
          right: 170,
          top: 150,
          width: 230,
          height: 230,
          borderRadius: '50%',
          background: S.yellow,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${badge}) rotate(${(1 - badge) * 40}deg)`,
          boxShadow: `6px 6px 0 ${S.ink}`,
        }}
      >
        <svg width={130} height={130} viewBox="0 0 120 120">
          <path d={morpher(m)} fill={S.ink} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 6. Outro
// ---------------------------------------------------------------------------

const SceneOutro: React.FC = () => {
  const frame = useT();
  const logo = useSpring(4, {damping: 14, stiffness: 120, mass: 0.9});
  const cta = useSpring(22);
  const url = useSpring(32);
  const grid = ramp(frame, 0, 40);
  return (
    <AbsoluteFill style={{backgroundColor: S.paper, alignItems: 'center', justifyContent: 'center'}}>
      <DottedGrid color={S.indigo} reveal={grid} />
      <DottedGrid color={S.indigo} corner="bl" reveal={grid} />
      <Img src={staticFile('senza/logo-senza.png')} style={{width: 860, transform: `scale(${0.8 + 0.2 * logo})`, opacity: logo}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 64, color: S.ink, marginTop: 30, opacity: cta, transform: `translateY(${(1 - cta) * 30}px)`, letterSpacing: '-0.01em'}}>
        Et vous, vous vous formez à quoi ?
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 40,
          color: S.white,
          background: S.indigo,
          borderRadius: 999,
          padding: '20px 54px',
          opacity: url,
          transform: `scale(${0.8 + 0.2 * url})`,
          boxShadow: `5px 5px 0 ${S.ink}`,
        }}
      >
        senza-formations.com
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Montage
// ---------------------------------------------------------------------------

// Durées en frames maquette, multipliées par K au montage.
const T0 = {logo: 60, manifesto: 130, domains: 165, stats: 160, funding: 125, outro: 127};
const TR0 = [15, 14, 14, 16, 18];
const T = Object.fromEntries(Object.entries(T0).map(([k, v]) => [k, v * K])) as typeof T0;
const TR = TR0.map((v) => v * K);
export const SENZA_FRAMES = Object.values(T).reduce((a, b) => a + b, 0) - TR.reduce((a, b) => a + b, 0);

export const SenzaShowreel: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: S.paper}}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={T.logo}>
        <SceneLogo />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({direction: 'from-left'})} timing={linearTiming({durationInFrames: TR[0], easing: easeInOut})} />
      <TransitionSeries.Sequence durationInFrames={T.manifesto}>
        <SceneManifesto />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={springTiming({durationInFrames: TR[1], config: {damping: 200}})} />
      <TransitionSeries.Sequence durationInFrames={T.domains}>
        <SceneDomains />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={springTiming({durationInFrames: TR[2], config: {damping: 200}})} />
      <TransitionSeries.Sequence durationInFrames={T.stats}>
        <SceneStats />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={clockWipe({width: 1920, height: 1080})} timing={linearTiming({durationInFrames: TR[3], easing: easeInOut})} />
      <TransitionSeries.Sequence durationInFrames={T.funding}>
        <SceneFunding />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: TR[4]})} />
      <TransitionSeries.Sequence durationInFrames={T.outro}>
        <SceneOutro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
