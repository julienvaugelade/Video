#!/usr/bin/env bash
# Découpe la prise 2 de la voix off phrase par phrase et place chaque phrase
# à son timecode dans la vidéo. Sortie : public/voix-off-calee.mp3 (45 s).
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=voix/voix-off-clement-prise2.mp3
OUT=public/voix-off-calee.mp3
PRE=0.08   # marge avant le début de la phrase
POST=0.12  # marge après la fin de la phrase

# début_source  fin_source  début_dans_la_vidéo   # phrase
CLIPS=(
  "0.00  3.78  0.30"   # Automatisation ou agent IA : quelle est la différence ?
  "4.41  7.85  4.30"   # À gauche, une automatisation classique : un chemin fixe.
  "8.12 10.93  7.90"   # Un déclencheur, une action… c'est fini.
  "11.41 13.74 10.90"  # Simple… rapide… prévisible.
  "14.41 16.11 13.50"  # À droite, un agent IA.
  "16.65 18.06 15.60"  # Il observe la situation…
  "18.41 19.49 17.40"  # décide quoi faire…
  "19.86 20.29 19.20"  # agit…
  "20.71 21.38 21.00"  # puis vérifie.
  "21.88 23.75 21.90"  # Raté ? Il revient en arrière.
  "23.96 26.40 23.85"  # Il prend une autre décision… et réessaie.
  "27.00 28.00 27.60"  # Cette fois, c'est bon.
  "28.28 32.01 29.40"  # Il s'adapte, se corrige… et garde son objectif en tête.
  "32.63 35.50 33.40"  # L'automatisation, elle, suit toujours le même chemin.
  "35.98 36.93 37.60"  # Un agent décide…
  "37.31 39.24 38.80"  # une automatisation exécute.
)

filter=""
labels=""
i=0
for c in "${CLIPS[@]}"; do
  read -r s e d <<<"$c"
  ss=$(awk -v s="$s" -v p="$PRE" 'BEGIN{v=s-p; if(v<0)v=0; printf "%.3f", v}')
  ee=$(awk -v e="$e" -v p="$POST" 'BEGIN{printf "%.3f", e+p}')
  dd=$(awk -v d="$d" -v s="$s" -v ss="$ss" 'BEGIN{printf "%d", (d-(s-ss))*1000}')
  len=$(awk -v a="$ss" -v b="$ee" 'BEGIN{printf "%.3f", b-a}')
  fo=$(awk -v l="$len" 'BEGIN{printf "%.3f", l-0.04}')
  filter+="[0:a]atrim=${ss}:${ee},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${fo}:d=0.04,adelay=${dd}|${dd}[c$i];"
  labels+="[c$i]"
  i=$((i+1))
done
filter+="${labels}amix=inputs=$i:normalize=0,volume=6dB,apad,atrim=0:45[out]"

ffmpeg -v error -y -i "$SRC" -filter_complex "$filter" -map "[out]" -ar 44100 -ac 2 -b:a 192k "$OUT"
echo "OK → $OUT"
