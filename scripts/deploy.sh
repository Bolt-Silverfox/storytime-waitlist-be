#!/bin/bash
set -e

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🗄 Running Prisma migrations..."
pnpm db:migrate

echo "Running Prisma generate..."
pnpm db:generate

echo "🚀 Restarting PM2 service..."
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

pm2 save

echo "✅ Backend deployment completed successfully!"
