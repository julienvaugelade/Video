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

# Le cas Emma Rousseau — motion graphics (60 s)

Vidéo 1920×1080, 30 i/s, sans voix off. Présente le cas fil rouge de la formation : la même situation traverse l'interface Softr, la base Airtable puis l'agent IA.

- Style plat sur fond clair `#F7F7F4`, palette `#2B3346` (encre), `#4E4EEA` (bleu), `#F9C623` (jaune), typographie Poppins.
- Rendu final : [`rendu/cas-emma-rousseau.mp4`](rendu/cas-emma-rousseau.mp4)

| Temps | Contenu |
|---|---|
| 0–6 s | Titre « Le cas Emma Rousseau », qui se range ensuite dans le bandeau ; suivi des 3 étapes en haut à droite |
| 6,5–19 s | ① L'espace client Softr se construit bloc par bloc (en-tête, texte, formulaire, liste), puis passe « En ligne » |
| 19–36 s | ② L'interface glisse à gauche, la table Airtable « Rendez-vous » apparaît : 4 réservations saisies dans le formulaire volent vers la table et s'affichent en parallèle dans la liste Softr |
| 36–53 s | ③ Un agent IA reçoit une demande de Claire Martin, parcourt la table, trouve sa ligne et répond en citant sa source |
| 53–60 s | Les 3 écrans s'alignent sur un fil rouge parcouru par Emma : « Un seul cas traverse toute la formation » (dernier plan fixe ≥ 2 s) |

```bash
npm run render:emma   # rendu MP4 dans out/
```

Chronologie et données du cas (clients, prestations, dates, message de l'agent) : `src/CasEmmaRousseau.tsx`.
