#!/bin/bash
set -e

# Load shell profile for pnpm/node PATH
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$HOME/.bashrc" ] && \. "$HOME/.bashrc"

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
