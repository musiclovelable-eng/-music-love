#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/music-love}"
BACKUP_DIR="${BACKUP_DIR:-/opt/music-love-backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PARTIAL="$BACKUP_DIR/.partial-$TIMESTAMP"
FINAL="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$PARTIAL"

python3 - "$APP_DIR/data/music-love.db" "$PARTIAL/music-love.db" <<'PY'
import sqlite3
import sys

source_path, destination_path = sys.argv[1:3]
source = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
destination = sqlite3.connect(destination_path)
try:
    source.backup(destination)
finally:
    destination.close()
    source.close()
PY

tar -C "$APP_DIR/data" -czf "$PARTIAL/storage.tar.gz" storage
sha256sum "$PARTIAL/music-love.db" "$PARTIAL/storage.tar.gz" > "$PARTIAL/SHA256SUMS"
mv "$PARTIAL" "$FINAL"

# Храним резервные копии за последние 14 дней.
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime +14 -exec rm -rf -- {} +

printf 'Backup created: %s\n' "$FINAL"
