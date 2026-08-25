#!/usr/bin/env bash
# Curls every page and every asset it references. Exits non-zero on any non-200.
#
# The page list is self-maintaining, not hardcoded: starting from /, any
# link matching ^(/[a-z0-9]+)+/$ — a route, distinguished from a static
# asset by having no file extension and a trailing slash — is queued as a
# page in its own right and crawled for its own assets too. That covers
# both a top-level experiment (/verso/) and a nested route (/notes/verso/)
# the moment the hub links to it, with no edit to this script required when
# a new experiment is added.
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

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

queue_file="$work/queue"
visited_file="$work/visited"
urls_file="$work/urls"

echo "/" > "$queue_file"
: > "$visited_file"

while [ -s "$queue_file" ]; do
  page=$(head -n1 "$queue_file")
  tail -n +2 "$queue_file" > "$work/queue.next" && mv "$work/queue.next" "$queue_file"

  grep -qxF "$page" "$visited_file" && continue
  echo "$page" >> "$visited_file"

  echo "--- $page"
  check "$page"

  # Collect this page's asset/link URLs into a file, then loop over the file
  # in the main shell (not a piped `while read`) so that `fail` set inside
  # the loop is still visible after the loop ends.
  curl -s "$BASE$page" \
    | grep -oE '(src|href)="/[^"#]*"' \
    | sed 's/.*="//;s/"$//' \
    | sort -u > "$urls_file"

  while read -r url; do
    check "$url"

    if [[ "$url" =~ ^(/[a-z0-9]+)+/$ ]] \
      && ! grep -qxF "$url" "$visited_file" \
      && ! grep -qxF "$url" "$queue_file"; then
      echo "$url" >> "$queue_file"
    fi
  done < "$urls_file"
done

[ "$fail" -eq 0 ] && echo "smoke ok"
exit "$fail"
