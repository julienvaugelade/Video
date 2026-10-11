#!/usr/bin/env bash
# Remplace les librairies chargées depuis cdn.jsdelivr.net / unpkg (bloqués
# dans certains conteneurs) par des copies locales issues de node_modules.
# Usage : scripts/hf-vendor.sh <dossier-projet-hyperframes>
set -euo pipefail
proj="${1:?dossier du projet HyperFrames}"
root="$(cd "$(dirname "$0")/.." && pwd)"
vendor="$proj/assets/vendor"
mkdir -p "$vendor"
cp "$root"/node_modules/gsap/dist/*.min.js "$vendor/"
cp "$root"/node_modules/lottie-web/build/player/lottie.min.js "$vendor/"
cp "$root"/node_modules/three/build/three.module.min.js "$vendor/" 2>/dev/null || true

find "$proj" -name '*.html' -not -path '*/node_modules/*' | while read -r f; do
  # Chemin relatif du fichier HTML vers assets/vendor
  rel="$(realpath --relative-to="$(dirname "$f")" "$vendor")"
  sed -i -E \
    -e "s#https://(cdn\.jsdelivr\.net/npm|unpkg\.com)/gsap@[^/]+/dist/([A-Za-z0-9_.-]+\.js)#${rel}/\2#g" \
    -e "s#https://cdnjs\.cloudflare\.com/ajax/libs/gsap/[^/]+/([A-Za-z0-9_.-]+\.js)#${rel}/\1#g" \
    -e "s#https://(cdn\.jsdelivr\.net/npm|unpkg\.com)/lottie-web@[^\"']*/lottie(\.min)?\.js#${rel}/lottie.min.js#g" \
    "$f"
done
echo "Librairies locales copiées dans $vendor ; URLs CDN réécrites."
grep -rnoE "https://(cdn\.jsdelivr\.net|unpkg\.com)[^\"']+" --include='*.html' "$proj" && echo "⚠ URLs CDN restantes ci-dessus" || true
