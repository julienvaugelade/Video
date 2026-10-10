// Composition de test : vérifie que chaque brique de la boîte à outils
// motion design se charge et se rend (transitions, formes, bruit, flou de
// mouvement, morphing, GSAP piloté par la frame, 3D Three.js).
import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TransitionSeries, linearTiming, springTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {fade} from '@remotion/transitions/fade';
import {Star, Circle, Triangle} from '@remotion/shapes';
import {noise2D} from '@remotion/noise';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ThreeCanvas} from '@remotion/three';
import {interpolate as flubber} from 'flubber';
import gsap from 'gsap';
import {C, FONT} from '../theme';

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', bottom: 80, width: '100%', textAlign: 'center',
    fontFamily: FONT, fontWeight: 600, fontSize: 48, color: C.ink}}>{children}</div>
);

const ShapesNoise: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center'}}>
      {Array.from({length: 24}, (_, i) => {
        const x = noise2D('x', i, frame / 90) * 700;
        const y = noise2D('y', i, frame / 90) * 350;
        const Shape = [Circle, Triangle, Star][i % 3] as React.FC<any>;
        const props = i % 3 === 0 ? {radius: 22} : i % 3 === 1 ? {length: 44, direction: 'up'} : {points: 5, innerRadius: 12, outerRadius: 28};
        return (
          <div key={i} style={{position: 'absolute', transform: `translate(${x}px, ${y}px) scale(${pop})`}}>
            <Shape {...props} fill={i % 2 ? C.blue : C.yellow} />
          </div>
        );
      })}
      <Label>@remotion/shapes + @remotion/noise</Label>
    </AbsoluteFill>
  );
};

const STAR = 'M100,10 L123,75 L190,75 L135,115 L157,180 L100,140 L43,180 L65,115 L10,75 L77,75 Z';
const BLOB = 'M100,20 C150,20 180,60 180,100 C180,150 140,180 100,180 C50,180 20,140 20,100 C20,55 55,20 100,20 Z';

const MorphBlur: React.FC = () => {
  const frame = useCurrentFrame();
  const morph = useMemo(() => flubber(STAR, BLOB, {maxSegmentLength: 4}), []);
  const t = interpolate(frame, [10, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const x = interpolate(frame, [0, 60], [-500, 500], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <CameraMotionBlur shutterAngle={180} samples={6}>
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <svg width={400} height={400} viewBox="0 0 200 200" style={{transform: `translateX(${x}px)`}}>
            <path d={morph(t)} fill={C.yellow} />
          </svg>
        </AbsoluteFill>
      </CameraMotionBlur>
      <div style={{position: 'absolute', bottom: 80, width: '100%', textAlign: 'center',
        fontFamily: FONT, fontWeight: 600, fontSize: 48, color: C.bg}}>flubber + @remotion/motion-blur</div>
    </AbsoluteFill>
  );
};

// GSAP : la timeline est mise en pause et positionnée sur la frame courante.
const GsapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const state = useMemo(() => {
    const s = {x: -400, rot: 0, scale: 0.2};
    const tl = gsap.timeline({paused: true})
      .to(s, {x: 0, scale: 1, duration: 0.8, ease: 'back.out(2)'})
      .to(s, {rot: 360, duration: 1, ease: 'expo.inOut'});
    return {s, tl};
  }, []);
  state.tl.seek(frame / fps, false);
  const {x, rot, scale} = state.s;
  return (
    <AbsoluteFill style={{backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 220, height: 220, borderRadius: 40, background: C.yellow,
        transform: `translateX(${x}px) rotate(${rot}deg) scale(${scale})`}} />
      <div style={{position: 'absolute', bottom: 80, width: '100%', textAlign: 'center',
        fontFamily: FONT, fontWeight: 600, fontSize: 48, color: C.bg}}>GSAP piloté par la frame</div>
    </AbsoluteFill>
  );
};

const Three: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 5], fov: 50}}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <mesh rotation={[frame / 40, frame / 25, 0]}>
          <torusKnotGeometry args={[1, 0.32, 200, 32]} />
          <meshStandardMaterial color={C.blue} roughness={0.3} metalness={0.4} />
        </mesh>
      </ThreeCanvas>
      <Label>@remotion/three (Three.js / R3F)</Label>
    </AbsoluteFill>
  );
};

export const TOOLKIT_DEMO_FRAMES = 4 * 60 - 3 * 15;

export const ToolkitDemo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}><ShapesNoise /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={springTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={60}><MorphBlur /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({direction: 'from-left'})} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={60}><GsapScene /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={60}><Three /></TransitionSeries.Sequence>
  </TransitionSeries>
);
