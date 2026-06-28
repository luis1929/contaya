#!/bin/bash
set -e

echo "=== Contaya Deploy ==="
cd /home/ubuntu/contaya

echo "[1/4] Pull cambios..."
git pull origin main

echo "[2/4] Instalar dependencias backend..."
cd backend && npm install --quiet && cd ..

echo "[3/4] Verificar .env en backend/..."
if [ ! -f backend/.env ]; then
  echo "   ⚠️  No existe backend/.env. Crealo manualmente con:"
  echo "      echo 'CREDENTIALS_ENCRYPTION_KEY=tu_clave' > backend/.env && chmod 600 backend/.env"
else
  sudo chmod 600 backend/.env
  echo "   .env encontrado y asegurado (chmod 600)"
fi

echo "[4/4] Build frontend..."
cd frontend && npm install --quiet && sudo rm -rf dist && npm run build && cd ..

echo "[5/5] Reiniciando servicios..."
sudo chown -R www-data:www-data frontend/dist
sudo systemctl reload nginx
sudo systemctl restart contaya-api

echo "=== Deploy completado ==="
