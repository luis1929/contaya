#!/bin/bash
set -e

echo "=== Contaya Deploy ==="
cd /home/ubuntu/contaya

echo "[1/4] Pull cambios..."
git pull origin main

echo "[2/4] Instalar dependencias backend..."
cd backend && npm install --quiet && cd ..

echo "[3/6] Instalar dependencias backend nuevas..."
cd backend && npm install helmet compression express-rate-limit --quiet && cd ..

echo "[4/6] Verificar .env..."
if [ ! -f /home/ubuntu/contaya/.env ]; then
  echo "   ⚠️  Creando .env por defecto..."
  sudo tee /home/ubuntu/contaya/.env > /dev/null << 'ENVEOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=contaya
DB_NAME=contaya
CORS_ORIGIN=https://drivingradio.us
ENVEOF
  sudo chown ubuntu:ubuntu /home/ubuntu/contaya/.env
  chmod 600 /home/ubuntu/contaya/.env
  echo "   /home/ubuntu/contaya/.env creado (completa JWT_SECRET y CREDENTIALS_ENCRYPTION_KEY)"
fi

echo "[5/6] Build frontend..."
cd frontend && npm install --quiet && sudo rm -rf dist && npm run build && cd ..

echo "[6/6] Reiniciando servicios..."
sudo chown -R www-data:www-data frontend/dist
sudo systemctl reload nginx
sudo systemctl restart contaya-api

echo "=== Deploy completado ==="
