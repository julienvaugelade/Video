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

# Anatomie d'un scénario n8n — motion graphics (50 s)

Vidéo 1920×1080, 30 i/s, flat design, fond `#FBFBF8`, surbrillance `#4E4EEA` sur le bloc actif. Pas de musique ni de voix : uniquement des sons d'interface discrets (crête ≈ −18 dBFS) placés en cue points.

- Rendu final : [`rendu/n8n-scenario-bloc-par-bloc.mp4`](rendu/n8n-scenario-bloc-par-bloc.mp4)
- Composition : `src/N8nScenario.tsx` (id Remotion `N8nScenario`)
- Sons : générés par `scripts/generate_sfx.py` → `public/sfx/*.wav` (synthèse, aucun fichier tiers)

## Déroulé

| Temps | Contenu |
|---|---|
| 0–3,6 s | Titre « Anatomie d'un scénario n8n » |
| 4–13 s | **1. Déclencheur** (n8n Form Trigger) : le formulaire arrive, données brutes affichées |
| 12–22 s | **2. Transformation** (Edit Fields) : nom, e-mail et budget nettoyés champ par champ |
| 22–33 s | **3. Condition** (If) : budget > 1 000 € ? → vrai, puis séparation en deux chemins |
| 33–42 s | **4. Sortie** : chemin vrai → Slack ; autre lead (400 €), chemin faux → Google Sheets |
| 42–46 s | Récap : exécution complète, « Exécution réussie » |
| 46–50 s | « Chaque bloc a un seul rôle. » |

## Cue points sonores

| Temps | Son | Événement |
|---|---|---|
| 0.35 s | `tick` | Titre |
| 4.20 s | `pop` | Apparition du déclencheur |
| 5.00 s | `select` | Déclencheur actif |
| 5.60 s | `tick` | Données reçues |
| 12.30 s | `pop` | Apparition de la transformation |
| 12.60 s | `swoosh` | Connexion 1 |
| 13.20 s | `data` | Données → transformation |
| 14.00 s | `select` | Transformation active |
| 15.40 s | `tick` | Champ « nom » nettoyé |
| 16.00 s | `tick` | Champ « email » nettoyé |
| 16.60 s | `tick` | Champ « budget » converti |
| 21.80 s | `pop` | Apparition de la condition |
| 21.95 s | `swoosh` | Connexion 2 |
| 22.40 s | `data` | Données → condition |
| 23.20 s | `select` | Condition active |
| 24.80 s | `tick` | Évaluation 1 500 > 1 000 |
| 25.40 s | `tick` | Résultat : vrai |
| 26.00 s | `split` | Séparation en deux chemins |
| 26.60 s | `pop` | Apparition des sorties |
| 32.60 s | `data` | Données → chemin vrai |
| 33.40 s | `select` | Sortie Slack active |
| 34.00 s | `tick` | Message envoyé |
| 37.00 s | `tick` | Condition : autre lead |
| 37.40 s | `data` | Données → chemin faux |
| 38.20 s | `select` | Sortie Google Sheets active |
| 38.60 s | `tick` | Ligne ajoutée |
| 42.40 s | `tick` | Récap : déclencheur |
| 43.10 s | `tick` | Récap : transformation |
| 43.80 s | `tick` | Récap : condition |
| 44.50 s | `tick` | Récap : sortie |
| 45.00 s | `success` | Exécution réussie |
| 46.60 s | `pop` | Conclusion |

## Commandes

```bash
npm run sfx         # régénère les sons d'interface
npm run render:n8n  # rendu MP4 dans out/
```
