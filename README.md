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

## Outils son pour Claude Code

Trois outils pour poser le bon son, à la bonne image, au bon niveau. Ordre rapide : chercher sur Openverse, laisser Real SFX placer les effets, utiliser Earshot pour ce qui manque.

| Outil | Rôle | Source |
|---|---|---|
| Openverse | Trouver de vrais sons sous licence libre (CC0, domaine public, CC BY), crédits notés dans `CREDITS.md` | API publique `api.openverse.org`, skill [`kit-outils-son-senza/openverse-sfx`](kit-outils-son-senza/openverse-sfx/SKILL.md) |
| Real SFX | Repérer chaque moment de la vidéo et y poser un vrai son, à l'image près | [Clipwing/skills](https://github.com/Clipwing/skills) (`skills/real-sfx`) |
| Earshot | Générer dans le code les sons introuvables (banque de 252 sons, kits), écouter et mesurer un mixage | [Leonxlnx/earshot](https://github.com/Leonxlnx/earshot) (paquet Python, serveur MCP, skills `earshot` et `real-sound`) |

Le dossier [`kit-outils-son-senza/`](kit-outils-son-senza/LISEZMOI.md) est le kit autonome à transmettre à l'équipe (aussi en archive `kit-outils-son-senza.zip`) : fiche PDF Senza, 13 prompts Claude à copier-coller, skill `openverse-sfx`, script d'installation, LISEZMOI. Il ne fait référence à aucun dépôt.

```bash
bash kit-outils-son-senza/installer-outils-son.sh          # Mac ou Linux ; --leger pour sauter torch et les modèles d'écoute (~1,1 Go)
python3 docs/fiche-outils-son/generer_fiche.py             # régénère la fiche PDF et le fichier de prompts (skill senza-guides-pdf)
cd kit-outils-son-senza/.. && zip -qr -X kit-outils-son-senza.zip kit-outils-son-senza -x "*/__pycache__/*"
```
