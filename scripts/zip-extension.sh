#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$ROOT_DIR/extension"
DIST_DIR="$ROOT_DIR/dist"
ZIP_PATH="$DIST_DIR/tab-lighter.zip"

if [[ ! -f "$EXT_DIR/manifest.json" ]]; then
  echo "ERROR: Missing extension/manifest.json"
  exit 1
fi

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"

(
  cd "$EXT_DIR"
  zip -r "$ZIP_PATH" .
)

echo "Packaged extension to $ZIP_PATH"
