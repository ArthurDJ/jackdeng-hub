#!/bin/sh
# Rebuild src/fonts/*.woff2 from the geist package: the same fonts cut down to
# the code points in src/fonts/subset.txt (about half the bytes; every page
# loads both). Needs Python's fontTools and brotli:
#
#   pip install fonttools brotli
#   sh scripts/subset-fonts.sh
#
# Run it after bumping `geist`, or after adding a range to subset.txt.
set -eu
cd "$(dirname "$0")/.."
ranges=$(grep -v '^#' src/fonts/subset.txt | grep -v '^$' | paste -sd, -)
src=node_modules/geist/dist/fonts
for pair in "geist-sans/Geist-Variable:Geist-Latin" "geist-mono/GeistMono-Variable:GeistMono-Latin"; do
  from=${pair%%:*}; to=${pair##*:}
  python3 -m fontTools.subset "$src/$from.woff2" --unicodes="$ranges" \
    --layout-features='*' --flavor=woff2 --output-file="src/fonts/$to.woff2"
  echo "src/fonts/$to.woff2: $(wc -c < "src/fonts/$to.woff2") bytes (from $(wc -c < "$src/$from.woff2"))"
done
cp node_modules/geist/LICENSE.txt src/fonts/OFL.txt
