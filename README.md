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

## Simulateur de boucle d'agent

Outil pédagogique interactif (un seul fichier, sans installation) : ouvrir [`simulateur/index.html`](simulateur/index.html) dans un navigateur.

L'apprenant configure une demande (« répondre à un client mécontent », situation, humeur, menace, outils, nombre de tours), puis avance pas à pas :
- **Agent** : boucle observer → décider → agir, avec ce que l'agent « voit » et « décide » à chaque tour ;
- **Automatisation** : chemin fixe en 3 étapes, sans décision, pour comparer ;
- **Garde-fous** injectables en cours de route : plafond de remboursement, validation humaine avant envoi, arrêt d'urgence (plus le budget de tours).
