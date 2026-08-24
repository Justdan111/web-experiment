#!/usr/bin/env bash
# Curls every page and every asset it references. Exits non-zero on any non-200.
set -uo pipefail

BASE="${1:-http://localhost:8080}"
fail=0

check() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$1")
  if [ "$code" != "200" ]; then
    echo "FAIL $code $1"
    fail=1
  fi
}

urls_file="$(mktemp)"
trap 'rm -f "$urls_file"' EXIT

for page in / /notes/verso/ /verso/ /fort/; do
  echo "--- $page"
  check "$page"

  # Collect this page's asset URLs into a file, then loop over the file in
  # the main shell (not a piped `while read`) so that `fail` set inside the
  # loop is still visible after the loop ends.
  curl -s "$BASE$page" \
    | grep -oE '(src|href)="/[^"#]*"' \
    | sed 's/.*="//;s/"$//' \
    | sort -u > "$urls_file"

  while read -r url; do
    check "$url"
  done < "$urls_file"
done

[ "$fail" -eq 0 ] && echo "smoke ok"
exit "$fail"
