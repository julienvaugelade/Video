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

## Parcours RS6601 — vidéo d'accroche (60 s)

Vidéo 1920×1080, 30 i/s, sans voix off. Les 7 modules de la formation apparaissent comme des étapes sur une ligne horizontale parcourue de gauche à droite.

- Fond `#2B3346`, étapes et ligne `#4E4EEA`, certification mise en valeur en `#F9C623`, typographie Poppins.
- Sound design discret, sans musique : nappe très douce, souffles sur les déplacements, une note montante par étape, accord final (−22 LUFS). Généré par `scripts/parcours_audio.py` → `public/audio/parcours-rs6601.wav`.
- Rendu final : [`rendu/parcours-rs6601.mp4`](rendu/parcours-rs6601.mp4)

| Temps | Contenu |
|---|---|
| 0–4 s | Titre « Formation RS6601 » (RS : Répertoire spécifique de France Compétences) |
| 4–6,5 s | Vue d'ensemble : ligne pointillée et 7 étapes numérotées vides |
| 6,5–43,5 s | Zoom sur la ligne : un point voyage d'étape en étape (environ 5 s par étape) ; chaque étape se remplit, son icône s'anime, le mot-clé apparaît : Découverte, Cas métier, Interface, Automatisation, Agent IA, Préparation, Certification (en jaune) |
| 43,5–48,5 s | Dézoom sur le parcours complet, une impulsion parcourt les 7 étapes |
| 48,5–58 s | La certification s'agrandit, rayonne en `#F9C623` ; « 7 modules, 1 objectif : votre certification RS6601 » |
| 58–60 s | Image fixe |

Toute la chronologie est dans `src/parcoursTiming.json` (partagée par la vidéo et le script audio) et `src/ParcoursRS6601.tsx`.

## Commandes

```bash
npm install
npm run studio   # prévisualisation interactive
npm run render            # Automatisation vs Agent IA → out/
npm run audio             # régénère la bande son du parcours RS6601
npm run render:parcours   # Parcours RS6601 → out/
```

Chronologie de « Automatisation vs Agent IA » : `src/AutomationVsAgent.tsx` (temps exprimés en secondes).

Si Remotion ne peut pas télécharger son navigateur, ajouter `--browser-executable=<chemin vers Chromium>`.
