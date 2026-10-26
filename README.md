# Automatisation vs Agent IA — motion graphics (45 s)

Vidéo 1920×1080, 30 i/s, avec voix off (ElevenLabs, voix « Clément - Calm and Neutral »), réalisée avec [Remotion](https://www.remotion.dev/).

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

## Voix off

- Texte et calage : [`voix-off.md`](voix-off.md)
- Prises brutes : `voix/voix-off-clement-prise1.mp3`, `voix/voix-off-clement-prise2.mp3`
- `scripts/caler-voix.sh` découpe la prise 2 phrase par phrase et place chaque phrase à son timecode → `public/voix-off-calee.mp3`, jouée par la composition.

## Commandes

```bash
npm install
npm run studio   # prévisualisation interactive
./scripts/caler-voix.sh   # régénère la piste voix calée (ffmpeg)
npm run render   # rendu MP4 dans out/
```

Toute la chronologie est dans `src/AutomationVsAgent.tsx` (temps exprimés en secondes).
