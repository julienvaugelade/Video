# Kit outils son Senza

Trois outils pour que Claude pose le bon son, à la bonne image, au bon niveau dans nos vidéos :

1. **Openverse** pour trouver de vrais sons sous licence libre ;
2. **Real SFX** pour les placer à l'image près ;
3. **Earshot** pour créer dans le code ceux qui manquent et contrôler le mixage.

## Contenu du kit

| Fichier | À quoi il sert |
|---|---|
| `Fiche_outils_son_Senza.pdf` | La fiche de présentation : rôle de chaque outil, licences, prompts, contrôle avant publication. |
| `Prompts_Claude_outils_son.md` | Les 13 prompts de la fiche, prêts à copier-coller dans Claude Code. |
| `openverse-sfx/` | Le skill Claude Code de recherche Openverse (recherche, téléchargement, crédits de licence). |
| `installer-outils-son.sh` | Le script qui installe les trois outils sur Mac (ou Linux). |
| `LISEZMOI.md` | Ce fichier. |

## Démarrer en trois étapes

1. **Décompressez** le kit dans un dossier facile à retrouver, par exemple `Documents/kit-outils-son-senza`.
2. **Ouvrez Claude Code** (terminal ou application de bureau) et collez le **prompt 1** (Mac) ou le
   **prompt 2** (Windows) du fichier `Prompts_Claude_outils_son.md`, en remplaçant `[chemin du dossier du kit]`.
3. **Redémarrez Claude Code**, puis collez le **prompt 3** pour vérifier que tout fonctionne.

Ensuite, les prompts 5 à 13 couvrent l'usage courant : trouver, placer, créer, vérifier, publier.

## Prérequis

- Claude Code installé et connecté.
- Python 3.10 ou plus, FFmpeg et Git (le prompt d'installation les vérifie et aide à les installer).
- Un accès internet à `api.openverse.org`, `github.com` et `pypi.org`, ainsi qu'à `huggingface.co` pour
  télécharger les modèles d'écoute d'Earshot (environ 1,1 Go, une seule fois).

Sur un poste avec peu de place, `bash installer-outils-son.sh --leger` installe Earshot sans ses modèles
d'écoute : la création de sons fonctionne, l'analyse de mixage non.

## Licences

- Real SFX (Clipwing) et Earshot (Leon Lin) sont des logiciels libres sous licence MIT.
- Les sons trouvés sur Openverse gardent leur propre licence. Par défaut, seuls CC0, domaine public et
  CC BY sont retenus. **CC BY impose de créditer l'auteur** : reprenez le fichier `CREDITS.md` du dossier
  de sons dans la description ou le générique de la vidéo.
- Les sons créés par Earshot ne proviennent d'aucun enregistrement : aucun crédit à prévoir.
