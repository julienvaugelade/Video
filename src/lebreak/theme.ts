import {loadFont} from '@remotion/fonts';
import {Easing, interpolate, spring, staticFile} from 'remotion';
import timing from './timing.json';

// Palette provisoire : chaude et contrastée (épices, wax, bois), à remplacer
// par les couleurs exactes de lebreaktoulouse.com si besoin.
export const P = {
  nuit: '#1B110C',
  brun: '#3A2216',
  creme: '#F7EBD8',
  sable: '#EAD8BA',
  safran: '#F4A81D',
  or: '#FFD34E',
  piment: '#D9431E',
  terre: '#A8461F',
  feuille: '#1E7B4F',
  blanc: '#FFFDF8',
};

export const DISPLAY = 'Anton';
export const TEXTE = 'Poppins';

loadFont({family: DISPLAY, url: staticFile('fonts/anton-latin-400-normal.woff2'), weight: '400'});
for (const weight of ['400', '500', '600', '700']) {
  loadFont({
    family: TEXTE,
    url: staticFile(`fonts/poppins-latin-${weight}-normal.woff2`),
    weight,
  });
}

export const FPS = timing.fps;
/** Images par temps (120 BPM à 30 i/s → 15). Tout le montage est calé sur ce tempo. */
export const BEAT = (FPS * 60) / timing.bpm;
/** Temps → images. */
export const b = (beats: number) => Math.round(beats * BEAT);

export const W = 1920;
export const H = 1080;

export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.6));

/** 0 → 1 entre les images a et b. */
export const ramp = (f: number, a: number, z: number, easing = easeOut) =>
  interpolate(f, [a, z], [0, 1], {...CLAMP, easing});

/** Rebond 0 → 1 à partir de l'image 0. */
export const pop = (f: number, damping = 12) =>
  spring({frame: f, fps: FPS, config: {damping, stiffness: 180, mass: 0.8}});
