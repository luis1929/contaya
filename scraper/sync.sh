#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_DIR="/tmp/contaya"
mkdir -p "$LOG_DIR"

echo "[sync.sh] Iniciando sync unificado - $TIMESTAMP"

cd "$SCRIPT_DIR"

# Load env vars
if [ -f .env ]; then
  set -a; source .env; set +a
fi

# FacturaTech credentials per biller (document_number)
export FACTURATECH_USER_72005672="${FACTURATECH_USER_72005672:-72005672}"
export FACTURATECH_PASS_72005672="${FACTURATECH_PASS_72005672:-Ortega2026\$}"
export FACTURATECH_USER_901496530="${FACTURATECH_USER_901496530:-901496530}"
export FACTURATECH_PASS_901496530="${FACTURATECH_PASS_901496530:-Mendieta2026\$}"
export FACTURATECH_USER_900948052="${FACTURATECH_USER_900948052:-900948052}"
export FACTURATECH_PASS_900948052="${FACTURATECH_PASS_900948052:-Esquivel2026\$}"

node index.js 2>&1 | tee "$LOG_DIR/sync_${TIMESTAMP}.log"

echo "[sync.sh] Finalizado - exit code: ${PIPESTATUS[0]}"
