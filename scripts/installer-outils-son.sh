#!/usr/bin/env bash
# Installe les trois outils son pour Claude Code (Mac ou Linux) :
#   1. openverse-sfx : skill de recherche Openverse (fourni dans ce dépôt, outils-son/openverse-sfx)
#   2. real-sfx      : skill de Clipwing (github.com/Clipwing/skills)
#   3. earshot       : paquet Python + serveur MCP + skills earshot et real-sound (github.com/Leonxlnx/earshot)
#
# Usage : ./scripts/installer-outils-son.sh [--leger]
#   --leger : n'installe pas torch ni les modèles d'écoute d'Earshot (~1,1 Go). La banque de sons
#             générés en code (earshot sfx / kit) fonctionne ; describe, match, find, critique non.
#
# Réinstallable sans risque : la configuration de real-sfx (config.json, index, goûts) est conservée.
set -euo pipefail

LEGER=0
[[ "${1:-}" == "--leger" ]] && LEGER=1

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
EARSHOT_DIR="${EARSHOT_DIR:-$HOME/.local/share/earshot}"
SONS_DIR="${OPENVERSE_SFX_DIR:-$HOME/sons-sfx/openverse}"
CLIPWING_REF="edbefcb"   # commit testé de Clipwing/skills
EARSHOT_REF="v0.4.0"     # version testée d'earshot

say() { printf '\n== %s\n' "$*"; }

say "Vérification des prérequis"
for t in git python3 ffmpeg ffprobe; do
  command -v "$t" >/dev/null || { echo "Manquant : $t (installez-le puis relancez)"; exit 1; }
done
python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' \
  || { echo "Python 3.10 ou plus est requis (Earshot)."; exit 1; }
mkdir -p "$SKILLS" "$SONS_DIR"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

say "1/3 Openverse : skill openverse-sfx"
rm -rf "$SKILLS/openverse-sfx"
cp -R "$REPO_DIR/outils-son/openverse-sfx" "$SKILLS/openverse-sfx"

say "2/3 Real SFX : skill real-sfx"
git clone -q https://github.com/Clipwing/skills.git "$TMP/clipwing"
git -C "$TMP/clipwing" checkout -q "$CLIPWING_REF"
if [[ -d "$SKILLS/real-sfx" ]]; then
  mkdir -p "$TMP/keep"
  for f in config.json library_index.json taste.json; do
    [[ -f "$SKILLS/real-sfx/$f" ]] && cp "$SKILLS/real-sfx/$f" "$TMP/keep/"
  done
  rm -rf "$SKILLS/real-sfx"
  cp -R "$TMP/clipwing/skills/real-sfx" "$SKILLS/real-sfx"
  cp "$TMP/keep/"* "$SKILLS/real-sfx/" 2>/dev/null || true
else
  cp -R "$TMP/clipwing/skills/real-sfx" "$SKILLS/real-sfx"
fi
# le dossier des téléchargements Openverse devient une bibliothèque real-sfx
if ! grep -q '"openverse"' "$SKILLS/real-sfx/config.json" 2>/dev/null; then
  (cd "$SKILLS/real-sfx" && python3 scripts/setup.py add-library openverse "$SONS_DIR" --index)
fi
(cd "$SKILLS/real-sfx" && python3 scripts/setup.py check) || true

say "3/3 Earshot : paquet, serveur MCP et skills"
if [[ -d "$EARSHOT_DIR/.git" ]]; then
  git -C "$EARSHOT_DIR" fetch -q --tags origin
else
  git clone -q https://github.com/Leonxlnx/earshot "$EARSHOT_DIR"
fi
git -C "$EARSHOT_DIR" checkout -q "$EARSHOT_REF"
[[ -x "$EARSHOT_DIR/.venv/bin/python" ]] || python3 -m venv "$EARSHOT_DIR/.venv"
PY="$EARSHOT_DIR/.venv/bin/python"
"$PY" -m pip install -q --upgrade pip
if [[ $LEGER -eq 1 ]]; then
  "$PY" -m pip install -q numpy scipy soundfile soxr librosa pyloudnorm scikit-learn pillow matplotlib "mcp>=2" requests
  "$PY" -m pip install -q --no-deps -e "$EARSHOT_DIR"
else
  if [[ "$(uname)" == "Linux" ]]; then
    "$PY" -m pip install -q torch --index-url https://download.pytorch.org/whl/cpu
  else
    "$PY" -m pip install -q torch
  fi
  "$PY" -m pip install -q -e "$EARSHOT_DIR[mcp,llm]"
  "$PY" -m earshot doctor --fetch || echo "Modèles non téléchargés : relancez « $PY -m earshot doctor --fetch »."
fi
rm -rf "$SKILLS/earshot" "$SKILLS/real-sound"
cp -R "$EARSHOT_DIR/skills/earshot" "$SKILLS/earshot"
cp -R "$EARSHOT_DIR/skills/real-sound" "$SKILLS/real-sound"
if command -v claude >/dev/null; then
  if claude mcp list 2>/dev/null | grep -q '^earshot:'; then
    echo "Serveur MCP earshot déjà déclaré."
  else
    claude mcp add earshot --scope user -e EARSHOT_THREADS=3 -- "$PY" -m earshot mcp
  fi
else
  echo "Commande claude introuvable : déclarez le serveur MCP à la main :"
  echo "  claude mcp add earshot --scope user -e EARSHOT_THREADS=3 -- $PY -m earshot mcp"
fi
"$PY" -m earshot sfx render ui_pop/soft -o "$TMP/test.wav" >/dev/null && echo "Earshot : rendu de test OK."

say "Terminé. Redémarrez Claude Code pour charger les skills."
echo "Skills : $SKILLS/{openverse-sfx,real-sfx,earshot,real-sound}"
echo "Bibliothèque Openverse : $SONS_DIR"
