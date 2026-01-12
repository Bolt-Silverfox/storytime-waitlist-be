#!/bin/bash
set -e

# Load nvm for node
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Add pnpm standalone installation path
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🗄 Running Prisma migrations..."
pnpm db:migrate

echo "Running Prisma generate..."
pnpm db:generate

echo "🚀 Restarting PM2 service..."
npx pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

npx pm2 save

echo "✅ Backend deployment completed successfully!"
