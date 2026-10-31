# Prompts Claude : outils son Senza

À coller dans Claude Code. Remplacez les passages entre crochets [ ] par vos propres éléments (chemin d'un dossier, d'une vidéo, minutage, description du son).

## Installer les outils (une seule fois par ordinateur)

### Installer

**1. Installation complète (Mac)**

```text
J'ai téléchargé le kit outils son Senza dans le dossier [chemin du dossier du kit]. Lance le script installer-outils-son.sh de ce dossier pour installer Openverse, Real SFX et Earshot. Si Python 3.10 ou plus, FFmpeg ou Git manquent, installe-les d'abord ou explique-moi comment faire. À la fin, vérifie que les skills openverse-sfx, real-sfx, earshot et real-sound sont installés et que le serveur MCP earshot répond, puis résume en français ce qui a été fait.
```

**2. Installation pas à pas (Windows ou sans le script)**

```text
Installe pour Claude Code les trois outils son de la fiche Senza, en m'expliquant chaque étape en français. Vérifie d'abord que Python 3.10 ou plus, FFmpeg et Git sont installés.
1. Copie le dossier openverse-sfx du kit [chemin du dossier du kit] dans mon dossier de skills Claude Code.
2. Clone https://github.com/Clipwing/skills et copie le dossier skills/real-sfx dans mon dossier de skills.
3. Clone https://github.com/Leonxlnx/earshot, crée son environnement Python, installe-le avec l'option mcp, copie ses skills earshot et real-sound dans mon dossier de skills, puis déclare Earshot comme serveur MCP de Claude Code.
```

### Vérifier et brancher nos sons

**3. Vérifier l'installation**

```text
Vérifie que mes outils son fonctionnent : fais une recherche test de sons de clic sur Openverse, lance le contrôle de Real SFX et génère un son test avec Earshot. Dis-moi ce qui fonctionne et ce qui manque.
```

**4. Brancher notre bibliothèque de sons**

```text
Ajoute le dossier [chemin de notre bibliothèque de sons] comme bibliothèque Real SFX et construis son index. Dis-moi ensuite combien de sons ont été trouvés et de quels types.
```

## Utiliser les outils au quotidien

### Trouver

**5. Chercher des sons**

```text
Cherche sur Openverse des sons de [souffle court et aérien] de moins de 2 secondes, en licence CC0 ou CC BY. Télécharge les 5 meilleurs dans notre bibliothèque de sons et montre-moi leurs crédits.
```

**6. Choisir le meilleur**

```text
Classe avec Earshot les sons que tu viens de télécharger selon la description « [un souffle court et aérien] » et dis-moi lequel garder, en citant ses mesures.
```

### Placer

**7. Sonoriser une vidéo**

```text
Fais le sound design de la vidéo [chemin de la vidéo] avec Real SFX. Garde la voix off et la musique, pose chaque son à l'image près, puis donne-moi la nouvelle vidéo, la piste d'effets séparée et le rapport.
```

**8. Corriger un son**

```text
Le son à [0:12] est trop fort et celui à [0:27] ne colle pas à l'image. Corrige-les, relance la critique et montre-moi les nouvelles notes.
```

**9. Valider à l'oreille**

```text
Prépare la page d'écoute comparative pour que je valide les sons depuis mon téléphone, puis tiens compte de mes réponses pour la version suivante.
```

### Créer

**10. Combler un manque**

```text
Real SFX n'a rien trouvé pour [la validation finale à 0:38]. Crée avec Earshot [une note claire et courte], accordée sur la musique, et pose-la à cet instant.
```

**11. Créer notre kit sonore**

```text
Crée avec Earshot un kit de sons au style calme pour nos vidéos de formation (clic, transition, notification, validation) et range-le dans le dossier [Kit sonore Senza].
```

### Vérifier et publier

**12. Contrôler un mixage**

```text
Analyse le son de la vidéo [chemin de la vidéo] avec Earshot : volume général, voix couverte ou non, sons décalés par rapport aux coupes. Liste les corrections par ordre de priorité.
```

**13. Préparer les crédits**

```text
Rassemble les crédits de tous les sons CC BY utilisés dans cette vidéo, au format prêt à coller dans la description YouTube.
```
