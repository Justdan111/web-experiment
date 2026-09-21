#!/usr/bin/env bash
# Builds the web-sized clips and posters that ship, from the 4K screen
# recordings in .media-source/videos (which are gitignored).
#
# Needs ffmpeg and cwebp:  brew install ffmpeg webp
#
# The source files are ~3840x2160 and ~23MB each. A card renders at 619px at
# most, so 1280 wide is still 2x on a retina screen, and the clips are muted
# everywhere they are used — hence -an. Rerun after adding a recording.
#
#   ./scripts/optimise-media.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/.media-source/videos"
out="$root/hub/public/videos"
posters="$root/hub/public/posters"

# Recording filename -> experiment slug. Most match; two do not.
# A case, not an associative array: macOS ships bash 3.2, which has none.
slug_for() {
  case "$1" in
    carproj) echo cars ;;
    trav) echo travel ;;
    *) echo "$1" ;;
  esac
}

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$out" "$posters"

for f in "$src"/*.mp4; do
  stem="$(basename "$f" .mp4)"
  slug="$(slug_for "$stem")"

  echo "-- $stem -> $slug"
  ffmpeg -y -loglevel error -i "$f" \
    -vf "scale=1280:-2" \
    -c:v libx264 -crf 28 -preset slow -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -an \
    "$out/$slug.mp4"

  # A poster means the card shows the clip's own first frame while the video is
  # still loading, rather than a placeholder that then swaps. Via cwebp because
  # this ffmpeg has no webp encoder built in.
  ffmpeg -y -loglevel error -ss 0.5 -i "$f" -frames:v 1 \
    -vf "scale=1280:-2" -f image2 -c:v png "$tmp/frame.png"
  cwebp -quiet -q 78 "$tmp/frame.png" -o "$posters/$slug.webp"
done

echo
echo "clips:   $(du -sh "$out" | cut -f1)"
echo "posters: $(du -sh "$posters" | cut -f1)"
