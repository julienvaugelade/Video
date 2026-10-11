#!/usr/bin/env bash
# Installe (de façon idempotente) la boîte à outils motion design :
#   - dépendances npm du projet (Remotion + extensions, Three.js, GSAP, HyperFrames…)
#   - outils système : Blender, rsvg-convert, potrace, webp, gifsicle, polices
#   - environnement Python /opt/motion-venv : Manim, lottie, cairosvg
# Lancé automatiquement au démarrage des sessions cloud (hook SessionStart).
set -uo pipefail
cd "$(dirname "$0")/.."
log() { echo "[setup-motion] $*" >&2; }

# 1. npm
if [ ! -d node_modules/@remotion/transitions ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  log "npm ci…"; npm ci --no-audit --no-fund --loglevel=error >&2 || log "npm ci a échoué"
fi

# 2. Paquets système (root uniquement, ex. conteneur cloud)
APT_PKGS="librsvg2-bin potrace webp gifsicle optipng fonts-noto-color-emoji fonts-inter \
libcairo2-dev libpango1.0-dev pkg-config python3-venv python3-dev blender"
if [ "$(id -u)" = 0 ] && command -v apt-get >/dev/null; then
  missing=$(for p in $APT_PKGS; do dpkg -s "$p" >/dev/null 2>&1 || echo "$p"; done)
  if [ -n "$missing" ]; then
    log "apt install $(echo $missing)…"
    (apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $missing) >/dev/null 2>&1 \
      || log "apt-get a échoué (réseau ?)"
  fi
fi

# 3. Python : Manim & co
VENV=/opt/motion-venv
if [ ! -x "$VENV/bin/manim" ] && [ -w /opt ]; then
  log "venv Python (manim, lottie)…"
  python3 -m venv "$VENV" && "$VENV/bin/pip" install -q manim 'lottie[all]' cairosvg pillow numpy >&2 \
    || log "pip a échoué"
fi

# 4. Variables d'environnement pour la session
CHROME=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1)
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    [ -n "$CHROME" ] && echo "export HYPERFRAMES_BROWSER_PATH=$CHROME" && echo "export REMOTION_BROWSER_EXECUTABLE=$CHROME"
    echo "export HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_NO_UPDATE_CHECK=1"
    echo "export PATH=\"$PWD/node_modules/.bin:$VENV/bin:\$PATH\""
  } >> "$CLAUDE_ENV_FILE"
fi
log "prêt."
