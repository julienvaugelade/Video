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

---

# Les garde-fous d'un agent IA — motion graphics (40 s)

Vidéo 1920×1080, 30 i/s, sans voix off ni personnage : uniquement des formes géométriques et du texte.

- Style schematic : fond blanc `#FFFFFF`, traits fins `#2B3346`, accents jaunes `#F9C623` réservés aux portes, typographie Poppins.
- Rendu final : [`rendu/garde-fous-agent-ia.mp4`](rendu/garde-fous-agent-ia.mp4) (muet) et [`rendu/garde-fous-agent-ia-voix.mp4`](rendu/garde-fous-agent-ia-voix.mp4) (avec voix off, texte et calage dans [`rendu/garde-fous-voix-off.md`](rendu/garde-fous-voix-off.md))
- Source : `src/GardeFousAgent.tsx` (composition `GardeFousAgent`, temps exprimés en secondes).

| Temps | Contenu |
|---|---|
| 0–3,7 s | Titre « Les garde-fous d'un agent IA » (IA : intelligence artificielle) |
| 3,8–6,6 s | Le schéma se trace : agent, rail, trois portes, nœud « Action » |
| 6,6–21 s | Demande 1 « Rembourser une commande — 120 € » : budget (120 € / plafond 500 €) ✓, accord d'un responsable ✓, données « Commandes » dans le périmètre ✓ → chaque porte s'ouvre puis se referme, remboursement effectué |
| 21–29,6 s | Demande 2 « Analyser les salaires pour un rapport interne » : budget ✓, validation ✓, la porte 3 commence à s'ouvrir… |
| 29,6–34,8 s | … les salaires sont hors périmètre : la porte claque, l'action rebondit, « Aucune action exécutée » + bandeau « Refus justifié » (motif journalisé, demande transmise à un responsable) |
| 34,8–37,4 s | Conclusion « Un agent fiable sait aussi s'arrêter. » et rappel des trois portes |
| 37,4–40 s | Arrêt sur image |

```bash
npm run render:garde-fous
```
