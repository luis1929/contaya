#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_DIR="/tmp/contaya"
mkdir -p "$LOG_DIR"

echo "[sync.sh] Iniciando sync unificado - $TIMESTAMP"
echo "[sync.sh] Log: $LOG_DIR/sync_${TIMESTAMP}.log"

cd "$SCRIPT_DIR"
node index.js 2>&1 | tee "$LOG_DIR/sync_${TIMESTAMP}.log"

echo "[sync.sh] Finalizado - exit code: ${PIPESTATUS[0]}"
