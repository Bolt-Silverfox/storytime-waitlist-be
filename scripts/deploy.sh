#!/bin/bash
set -e

# Run pnpm non-interactively. This script runs over a non-interactive SSH
# session, so when pnpm needs to purge an out-of-date node_modules it would
# otherwise abort waiting for TTY confirmation
# (ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY). CI=true tells pnpm to proceed.
export CI=true

# Load nvm for node
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Add pnpm standalone installation path
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "📦 Installing dependencies..."
# pnpm 10 blocks dependency build scripts by default and the server's pnpm
# treats the ignored builds as fatal (ERR_PNPM_IGNORED_BUILDS, exit 1). Install
# with --ignore-scripts to skip that gate entirely (same as the CI build job);
# the Prisma query engine is then placed by `pnpm db:generate` below, and the
# only unbuilt packages (unrs-resolver = lint tooling, @scarf/scarf = telemetry)
# are not needed at runtime.
pnpm install --frozen-lockfile --ignore-scripts

echo "🗄 Running Prisma migrations..."
pnpm db:migrate

echo "Running Prisma generate..."
pnpm db:generate

echo "🚀 Restarting PM2 service..."
if [ "$NODE_ENV" = "production" ]; then
  npx pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
else
  npx pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
fi

npx pm2 save

echo "✅ Backend deployment completed successfully!"
