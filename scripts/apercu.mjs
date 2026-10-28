// Aperçu rapide : rend quelques images d'une composition (demi-résolution) avec un seul bundle.
// Usage : node scripts/apercu.mjs <Composition> <dossier> <image> [<image>…]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';

const [, , id, out, ...frames] = process.argv;
const root = path.resolve(import.meta.dirname, '..');
const chromium = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = existsSync(chromium) ? chromium : undefined;

mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const frame of frames.map(Number)) {
  const output = path.join(out, `${id}-${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, scale: 0.5, browserExecutable});
  console.log(output);
}
