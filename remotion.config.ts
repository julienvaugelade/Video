import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setOverwriteOutput(true);

// Conteneur cloud : Remotion ne peut pas télécharger son Chromium, on utilise celui préinstallé.
const CHROMIUM = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (existsSync(CHROMIUM)) {
  Config.setBrowserExecutable(CHROMIUM);
}
