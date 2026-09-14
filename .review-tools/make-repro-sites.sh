#!/usr/bin/env bash
# Rebuilds the two throwaway Hugo sites the review fixes were measured against.
# Usage: .review-tools/make-repro-sites.sh [outdir]   (default: /tmp/hextra-repro)
#
# The theme is consumed from the PARENT of this repo, so the repo directory name
# must match the `theme:` key in the two configs (currently `hextra`).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(dirname "$here")"
themes="$(dirname "$repo")"
out="${1:-/tmp/hextra-repro}"

mk() { # mk <name> <config> <lang-title> <body>
  mkdir -p "$out/$1/content/docs"
  cp "$here/$2" "$out/$1/hugo.yaml"
  printf -- '---\ntitle: %s\n---\n%s\n' "$3" "$4" > "$out/$1/content/docs/page.md"
  printf -- '---\ntitle: %s\n---\n' "$3" > "$out/$1/content/_index.md"
  hugo --quiet --source="$out/$1" --themesDir="$themes" --destination="$out/$1/public"
  echo "built $out/$1/public  (page at /docs/page/)"
}

# Russian: reflow and width measurements. Its config also carries three custom
# links - one external with a long description, one internal, one with no icon.
mk ru repro-ru-hugo.yaml "Страница" "Текст страницы."
# Turkish: no i18n/tr.yaml exists, so this is the untranslated-locale case.
mk tr repro-tr-hugo.yaml "Sayfa" "Metin."
