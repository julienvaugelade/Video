import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FPS = 30;
export const DURATION_S = 45;

export const C = {
  bg: '#FBFBF8',
  blue: '#4E4EEA',
  yellow: '#F9C623',
  ink: '#1C1C2E',
  muted: '#7A7A8C',
  line: '#DADAE3',
  card: '#FFFFFF',
};

export const FONT = 'Poppins';

for (const weight of ['400', '500', '600', '700']) {
  loadFont({
    family: FONT,
    url: staticFile(`fonts/poppins-latin-${weight}-normal.woff2`),
    weight,
  });
}
