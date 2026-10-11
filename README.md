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

`npm run render:demo` rend `ToolkitDemo` (6,5 s), qui vérifie chaque brique.

## Showreel Senza Formations (55 s)

`SenzaShowreel` — rendu : [`rendu/senza-showreel.mp4`](rendu/senza-showreel.mp4).
Les animations sont écrites en frames « maquette » puis jouées deux fois plus lentement
(constante `K` dans `src/senza/SenzaShowreel.tsx`).

| Temps | Scène | Outils mis en avant |
|---|---|---|
| 0–4 s | Logo Senza d'emblée, grille de points et blob qui apparaissent | `@remotion/noise` |
| 3–12,5 s | « Former pour transformer. » | typo cinétique lettre à lettre, marker, mot fantôme animé au bruit |
| 11,6–22,6 s | Carrousel 3D des domaines (IA, No-code, Data…) | CSS 3D, tracé animé `@remotion/paths` |
| 20,8–30,8 s | « Votre projet, vos objectifs. » : interrupteurs Individuel ⇄ En groupe, À distance ⇄ En présentiel, formations certifiantes (CPF, OPCO, France Travail) | interpolation de couleurs, tracé de coche |
| 29,9–40,6 s | 6 000+ apprenants, 200+ formateurs, 50 lieux, Qualiopi, 4,8/5 | compteurs, anneau `d3-shape`, `@remotion/shapes` |
| 39,5–47,9 s | Financement : CPF, France Travail, OPCO, 3x sans frais | `@remotion/motion-blur`, morphing `flubber` |
| 46,7–55 s | Logo + « Et vous, vous vous formez à quoi ? » + URL | transitions `wipe`, `slide`, `clockWipe`, `fade` |

Chiffres repris du design system Senza (skill `senza-guides-pdf`).
