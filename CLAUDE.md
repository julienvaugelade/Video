# Studio motion design — consignes pour Claude

Projet de motion graphics « à la volée ». Tout est installé par `scripts/setup-motion.sh`
(lancé automatiquement au démarrage de session via `.claude/settings.json`).

## Quel outil pour quoi

| Besoin | Outil | Où |
|---|---|---|
| Vidéo motion design en React, timeline précise, rendu MP4 | **Remotion 4** | `src/`, `npx remotion …` |
| Transitions entre scènes (slide, wipe, fade, flip, clock-wipe) | `@remotion/transitions` | `TransitionSeries` |
| Formes vectorielles, tracés animés, morphing | `@remotion/shapes`, `@remotion/paths`, `flubber` | |
| Mouvements organiques, dérives, particules | `@remotion/noise`, `simplex-noise` | |
| Flou de mouvement réaliste | `@remotion/motion-blur` (`CameraMotionBlur`, `Trail`) | |
| 3D (objets, caméras, lumières) | `@remotion/three` + `@react-three/fiber` + `drei` | rendu WebGL via ANGLE |
| Courbes d'easing type After Effects | `bezier-easing`, `Easing.bezier` de Remotion | |
| Timelines GSAP (easings `back`, `expo`, SplitText…) | `gsap`, timeline `paused` + `tl.seek(frame / fps)` | voir `src/toolkit/ToolkitDemo.tsx` |
| Animations Lottie / After Effects exportées | `@remotion/lottie`, `lottie-web` ; Python `lottie` (conversion SVG→Lottie, rendu) | |
| Polices | `@remotion/google-fonts`, `@remotion/fonts` (fichiers locaux dans `public/fonts`) | |
| Sous-titres animés, audio-réactif | `@remotion/captions`, `@remotion/media-utils` | |
| Couleurs, dégradés, échelles, data viz animée | `culori`, `d3-scale`, `d3-shape`, `d3-interpolate` | |
| Vidéo HTML + GSAP (alternative à Remotion) | **HyperFrames** (`npx hyperframes`) | skills `hyperframes*` |
| Animations mathématiques / pédagogiques | **Manim** (`manim -qh scene.py Scene`) | `/opt/motion-venv` |
| 3D lourde, rendu Cycles, scripts `bpy` | **Blender 4** (`blender -b --python script.py`) | désactiver le denoiser : `scene.cycles.use_denoising = False` |
| Post-traitement, encodage, GIF, assemblage | `ffmpeg`, `gifsicle`, ImageMagick `convert`, `rsvg-convert`, `potrace` | |

Skills d'agent installés dans `.claude/skills/` : `remotion-best-practices`, `remotion-*`,
`hyperframes*`, `motion-graphics`, `gsap-*`, `embedded-captions`, `product-launch-video`, etc.
Les charger avant d'écrire une composition.

## Méthode de travail

1. Poser la chronologie en secondes (constantes), palette et typo dans `src/theme.ts`.
2. Une composition par vidéo, enregistrée dans `src/Root.tsx`.
3. Vérifier visuellement **avant** le rendu complet : `npx remotion still <Id> out/f.png --frame=N`
   sur plusieurs frames clés, puis lire les PNG. Planche contact : extraire des frames avec ffmpeg
   et les assembler avec `convert +append/-append`.
4. Rendu final : `npx remotion render <Id> out/<nom>.mp4` ; copier dans `rendu/` si livrable.
5. Toute animation doit être déterministe et dépendre de `useCurrentFrame()` uniquement
   (pas de `Math.random()` sans graine, pas de CSS transitions / `requestAnimationFrame`).

## Contraintes du conteneur cloud

- Remotion et HyperFrames ne peuvent pas télécharger Chrome : ils utilisent le headless shell
  Playwright de `/opt/pw-browsers` (configuré dans `remotion.config.ts` et `HYPERFRAMES_BROWSER_PATH`).
- `cdn.jsdelivr.net`, `unpkg.com`, `cdnjs` sont bloqués : après `hyperframes init`, lancer
  `scripts/hf-vendor.sh <projet>` pour remplacer GSAP/Lottie CDN par des copies locales.
- Google Fonts est accessible ; Hugging Face ne l'est pas (pas de modèles Whisper/TTS locaux).
