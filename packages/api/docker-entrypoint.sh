#!/bin/sh
set -e
echo "==> Aplicando migraciones (prisma migrate deploy)..."
cd /app/packages/api
node /app/node_modules/.bin/prisma migrate deploy --config prisma.config.ts
cd /app
echo "==> Iniciando API con OpenTelemetry..."
exec node --import ./packages/api/dist/telemetry.js ./packages/api/dist/app.js