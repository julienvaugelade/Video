---
name: openverse-sfx
description: Chercher et télécharger de vrais effets sonores sous licence libre (CC0, domaine public, CC BY) via l'API publique Openverse (api.openverse.org, sans clé), avec les crédits de licence notés automatiquement. Utiliser dès qu'une vidéo, une animation ou un montage a besoin d'un son (whoosh, clic, impact, ambiance, foley, notification...) et qu'il faut d'abord le trouver, avant de laisser real-sfx le placer et earshot générer ce qui manque.
---

# openverse-sfx : trouver le son

Openverse (projet open source de WordPress) indexe des millions de fichiers audio sous licence libre,
dont Freesound, Wikimedia Commons, Jamendo et ccMixter. L'API se consulte sans installation ni clé.

## Ordre de travail

1. **Openverse** (ce skill) : chercher et télécharger les sons dans une bibliothèque locale.
2. **real-sfx** : repérer les moments de la vidéo et poser les sons à l'image près.
3. **earshot** : générer dans le code ce qu'on n'a pas trouvé (`earshot sfx render`, `earshot kit`).

## Commandes

```bash
S=~/.claude/skills/openverse-sfx/scripts/openverse.py
python3 $S search "whoosh" --length shortest --n 10          # liste : id, durée, licence, source, titre, auteur
python3 $S search "mouse click" --source freesound --json  # JSON complet
python3 $S fetch "soft pop ui" --n 3 --out ~/sons-sfx/openverse   # télécharge les 3 premiers
python3 $S get 5f2c... 9a1b... --out ~/sons-sfx/openverse          # télécharge par identifiant
```

- Requêtes en **anglais** (les fiches sources le sont) : « whoosh », « swoosh », « impact », « riser », « click »,
  « pop », « typing keyboard », « camera shutter », « paper », « crowd ambience »...
- `--length` : `shortest` (< 30 s, le bon réglage pour un effet sonore), `short` (30 s à 2 min, ambiances),
  `medium` (2 à 10 min), `long` (> 10 min).
- Filtre de licence par défaut : **CC0, PDM et CC BY** (usage commercial et modification autorisés).
  CC BY-SA est exclu : en licence 4.0, un son synchronisé à une image fait de la vidéo entière une œuvre
  adaptée, qui devrait alors être partagée sous la même licence (`--allow-sa` seulement si l'utilisateur
  l'accepte). Ne lever tout filtre (`--any-license`) que sur demande explicite : NC interdit l'usage
  commercial, ND interdit de couper ou retoucher le son.
- Chaque téléchargement écrit un `.json` de métadonnées et une ligne dans `CREDITS.md` du dossier.
  **CC BY exige de créditer l'auteur** (générique de fin ou description de la vidéo) : reprendre
  `CREDITS.md` tel quel. CC0 et PDM ne demandent rien.
- Sans jeton, l'API limite le nombre de requêtes et la taille des pages (20 résultats max) : regrouper les
  recherches, ne pas boucler. Jeton facultatif : variable `OPENVERSE_TOKEN`.

## Brancher sur real-sfx

Le dossier de téléchargement devient une bibliothèque real-sfx :

```bash
cd ~/.claude/skills/real-sfx
python3 scripts/setup.py add-library openverse ~/sons-sfx/openverse --index
```

Après chaque nouvelle série de téléchargements : `python3 scripts/build_index.py`.

## Limites

- Openverse donne des résultats par mots-clés et tags : le titre ne garantit pas le son. Faire vérifier par
  earshot (`earshot rank "a short airy whoosh" ~/sons-sfx/openverse/`) ou par une écoute humaine.
- Les fichiers Freesound arrivent souvent en aperçu MP3 de bonne qualité, pas en WAV d'origine.
- Si `api.openverse.org` est injoignable (réseau d'entreprise, conteneur restreint), le script le dit : il faut
  autoriser ce domaine, ainsi que les domaines des fichiers (cdn.freesound.org, upload.wikimedia.org...).
