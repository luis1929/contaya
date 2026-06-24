#!/bin/bash
set -e

echo "=== Contaya Deploy ==="
cd /home/ubuntu/contaya

echo "[1/4] Pull cambios..."
git pull origin main

echo "[2/4] Instalar dependencias backend..."
cd backend && npm install --quiet && cd ..

echo "[3/4] Build frontend..."
cd frontend && npm install --quiet && sudo rm -rf dist && npm run build && cd ..

echo "[4/4] Reiniciando servicios..."
sudo chown -R www-data:www-data frontend/dist
sudo systemctl reload nginx
sudo systemctl restart contaya-api

echo "=== Deploy completado ==="
