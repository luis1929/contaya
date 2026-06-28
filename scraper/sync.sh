#!/bin/bash
#=============================================================================
# Contaya — Full Sync Script (Oracle Cloud Linux)
# Extracts all data from Facturatech and persists to local database.
#
# Usage:
#   ./sync.sh                          # interactive (reads .env vars)
#   ./sync.sh --user=USER --pass=PASS --biller-id=UUID
#   ./sync.sh --output=/tmp/contaya/sync_result.json
#
# Environment variables (fallback):
#   FACTURATECH_USER, FACTURATECH_PASS
#=============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_DIR="/tmp/contaya"
mkdir -p "$OUTPUT_DIR"

# Default output — rotate every sync
OUTPUT_FILE="$OUTPUT_DIR/sync_${TIMESTAMP}.json"
LATEST_LINK="$OUTPUT_DIR/sync_latest.json"

ARGS=("$@")

# Append --output if not already provided
if ! echo "${ARGS[*]}" | grep -q -- '--output='; then
  ARGS+=("--output=$OUTPUT_FILE")
fi

# Default details=true
if ! echo "${ARGS[*]}" | grep -q -- '--details='; then
  ARGS+=("--details=true")
fi

echo "[sync.sh] Starting Contaya Facturatech sync at $TIMESTAMP"
echo "[sync.sh] Log: $OUTPUT_DIR/sync_${TIMESTAMP}.log"
echo "[sync.sh] Output: $OUTPUT_FILE"

cd "$SCRIPT_DIR"

# Run the scraper — all output goes to log
node index.js "${ARGS[@]}" 2>&1 | tee "$OUTPUT_DIR/sync_${TIMESTAMP}.log"

# Update the latest symlink
ln -sf "$OUTPUT_FILE" "$LATEST_LINK"

echo "[sync.sh] Done — exit code: ${PIPESTATUS[0]}"
