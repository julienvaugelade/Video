import {Config} from '@remotion/cli/config';
import {existsSync, readdirSync} from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setOverwriteOutput(true);
// Effets WebGL (Three.js, shaders) : rendu GPU logiciel.
Config.setChromiumOpenGlRenderer('angle');

// Dans les conteneurs cloud, Remotion ne peut pas télécharger son Chrome :
// on réutilise le headless shell préinstallé (ou REMOTION_BROWSER_EXECUTABLE).
const pw = '/opt/pw-browsers';
const shell = existsSync(pw)
	? readdirSync(pw).find((d) => d.startsWith('chromium_headless_shell-'))
	: undefined;
const browser =
	process.env.REMOTION_BROWSER_EXECUTABLE ??
	(shell ? `${pw}/${shell}/chrome-linux/headless_shell` : undefined);
if (browser && existsSync(browser)) {
	Config.setBrowserExecutable(browser);
}
