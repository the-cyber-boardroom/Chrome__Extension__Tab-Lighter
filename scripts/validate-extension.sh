#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT_DIR/extension/manifest.json"

if [[ ! -f "$MANIFEST" ]]; then
  echo "ERROR: Missing extension manifest at extension/manifest.json"
  exit 1
fi

python3 -m json.tool "$MANIFEST" >/dev/null

required_files=(
  "extension/background.js"
  "extension/popup.html"
  "extension/popup.css"
  "extension/popup.js"
  "extension/options.html"
  "extension/options.css"
  "extension/options.js"
  "extension/icons/icon16.png"
  "extension/icons/icon32.png"
  "extension/icons/icon48.png"
  "extension/icons/icon128.png"
)

for path in "${required_files[@]}"; do
  if [[ ! -f "$ROOT_DIR/$path" ]]; then
    echo "ERROR: Missing required file: $path"
    exit 1
  fi
done

echo "Validation successful: extension manifest and required files are present."
