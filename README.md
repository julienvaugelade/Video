# Automatisation vs Agent IA — motion graphics (45 s)

Vidéo 1920×1080, 30 i/s, sans voix off, réalisée avec [Remotion](https://www.remotion.dev/).

- Fond `#FBFBF8`, accents `#4E4EEA` (agent) et `#F9C623` (automatisation), typographie Poppins (embarquée dans `public/fonts`, licence OFL).
- Rendu final : [`rendu/automatisation-vs-agent.mp4`](rendu/automatisation-vs-agent.mp4)

## Déroulé

| Temps | Contenu |
|---|---|
| 0–3,6 s | Titre « Automatisation vs Agent IA » |
| 3,5–7 s | Écran séparé : en-têtes, chemin linéaire à gauche |
| 7–36 s | Gauche : Déclencheur → Action → Fin tourne en boucle rapide (compteur d'exécutions, « Simple / Rapide / Prévisible ») |
| 12–28 s | Droite : boucle Observer → Décider → Agir → Vérifier ; la 1ʳᵉ vérification échoue, branche « Retour en arrière » vers Décider, puis validation |
| 28–36 s | La boucle continue ; « S'adapte / Se corrige / Vise un objectif » |
| 37–45 s | « Un agent décide, une automatisation exécute. » |

## Commandes

```bash
npm install
npm run studio   # prévisualisation interactive
npm run render   # rendu MP4 dans out/
```

Toute la chronologie est dans `src/AutomationVsAgent.tsx` (temps exprimés en secondes).

## Boîte à outils motion design

Le dépôt sert aussi de studio de motion design piloté par Claude. Installation : `npm run setup`
(automatique au démarrage des sessions Claude Code cloud). Détail des outils et de la méthode
dans [`CLAUDE.md`](CLAUDE.md).

- **Remotion** + `transitions`, `shapes`, `paths`, `noise`, `motion-blur`, `three`, `lottie`,
  `google-fonts`, `captions`, `media-utils`, `light-leaks`…
- **Three.js / React Three Fiber / drei**, **GSAP**, **flubber** (morphing), **culori**, **d3**
- **HyperFrames** (vidéo HTML + GSAP) — `scripts/hf-vendor.sh` pour fonctionner hors CDN
- **Manim**, **Blender 4**, **ffmpeg**, `rsvg-convert`, `potrace`, `gifsicle`
- Skills Claude : Remotion, HyperFrames, GSAP (`.claude/skills/`)

`npm run render:demo` rend `ToolkitDemo` (8 s), qui vérifie chaque brique.
