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

---

# Le Break African Food — vidéos de présentation (30 s et 45 s)

Deux vidéos motion graphics 1920×1080, 30 i/s, pour le restaurant [Le Break African Food](https://lebreaktoulouse.com/) (spécialités africaines halal, Toulouse). Sound design synthétisé, sans voix.

- Rendus : [`rendu/le-break-30s.mp4`](rendu/le-break-30s.mp4) et [`rendu/le-break-45s.mp4`](rendu/le-break-45s.mp4)
- Compositions Remotion : `LeBreak30s` et `LeBreak45s` (`src/lebreak/`)

## Contenu et style

- Le contenu vient des pages indexées de lebreaktoulouse.com (plats, prix, livraison, Click & Collect, adresse, téléphone) et de lebreaktoulouse.fr (fait maison, produits frais, pays d'origine des recettes, métro Fontaine-Lestang). Le site n'était pas joignable depuis l'environnement de rendu.
- Le style est donc **provisoire** : palette chaude (safran, piment, terre, feuille, fond nuit et crème), motifs wax et kente, case 🛖 reprise du nom du restaurant. Typographies Anton (titres) et Poppins (textes), embarquées dans `public/fonts` (licence OFL). Pour reprendre les couleurs exactes du site, il suffit de modifier la palette `P` dans `src/lebreak/theme.ts`.
- Les plats sont illustrés en SVG (vus du dessus), sans photo.

## Déroulé

Tout est calé sur un tempo de 120 BPM (1 temps = 0,5 s). Le découpage est dans `src/lebreak/timing.json`, partagé par l'image et le son.

| 30 s | 45 s | Scène |
|---|---|---|
| 0–4 s | 0–4 s | Logo : la case se pose, « LE BREAK », « AFRICAN FOOD », « TOULOUSE » |
| 4–8 s | — | « Spécialités africaines » + 100 % halal / fait maison / produits frais |
| — | 4–11 s | Carte d'Afrique : Sénégal, Guinée, Côte d'Ivoire, Congo → « … cuisinées à Toulouse » |
| — | 11–15 s | Chez Le Break : fait maison, produits frais, 100 % halal |
| 8–22 s | 15–30 s | Le menu, un plat par écran avec son prix : yassa poulet, mafé poulet, attiéké poisson, (brochettes de bœuf), Vegan Break |
| — | 30–34 s | Desserts exotiques : tiakri, beignets mikatés (4,50 €) |
| 22–25 s | 34–38 s | Commandez en ligne : livraison, Click & Collect, ouvert 7 jours sur 7 |
| 25–30 s | 38–45 s | Logo + adresse, métro, téléphone, site + « Spécialités africaines halal » |

## Commandes

```bash
npm run lebreak:son      # régénère les deux pistes son (numpy + ffmpeg) → public/lebreak/
npm run lebreak:carte    # régénère la carte d'Afrique → src/lebreak/afrique.json
npm run render:lebreak30
npm run render:lebreak45
node scripts/apercu.mjs LeBreak45s out/apercu 150 600 1300   # images fixes de contrôle
```
