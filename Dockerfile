# syntax=docker/dockerfile:1.7
#
# storytime-waitlist-be — production image for the `waitlist-api` service.
#
# RECONSTRUCTED, NOT RECOVERED. The image running in production was built from a
# Dockerfile that was never committed, so this file is a rebuild from the repo's
# own build config plus the measured shape of the running container. It is now
# the source of truth; the live image is not. Expect the first build from this
# file to differ from what is running, and verify before promoting it.
#
# MUST BUILD linux/arm64. The host is a t4g.small (Graviton); the AMI
# architecture is derived from instance_type in the devops stack, so an amd64
# image will not run. The shared pipeline passes --platform linux/arm64.
#
# MEMORY: the container cap is 192 MiB (devops terraform.prod.tfvars). Measured
# at 74-78 MiB steady and 156 MiB peak, the peak being during a HEALTHCHECK
# probe, which forks a SECOND node worth ~45 MiB every 30s. If this ever needs
# more headroom, raise the probe --interval before raising the cap.
#
# V8 HEAP FLOOR: V8 reports a heap_size_limit of ~259 MiB at every cgroup cap at
# or below 512 MiB, so at 192 MiB it believes it may grow past its own cap and
# is OOM-killed before it ever GCs under pressure. --max-old-space-size is
# therefore mandatory, not a tuning nicety. 144 is 75% of 192.

ARG NODE_VERSION=24
ARG PNPM_VERSION=9.15.9
ARG ALPINE_VERSION=3.23

# ---------------------------------------------------------------- deps (full)
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps
ARG PNPM_VERSION
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
COPY package.json pnpm-lock.yaml ./
# NOT --ignore-scripts: prisma's postinstall is what downloads the query engine.
# The engine is not in the npm tarball, so skipping scripts produces a client
# that throws at first query rather than failing the build.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm config set store-dir /pnpm-store \
 && pnpm install --frozen-lockfile

# ------------------------------------------------------------------- builder
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder
ARG PNPM_VERSION
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prisma.config.ts calls env('DATABASE_URL') at MODULE LOAD, and that throws
# eagerly when the variable is absent — so `prisma generate` fails without one
# even though generating touches no database. This placeholder exists only to
# get past that check and never reaches the runtime stage.
#
# Prisma 6.19 also only discovers prisma.config.ts in process.cwd(), which is
# why generate runs from /app and not from a subdirectory.
ENV DATABASE_URL="postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=public"
RUN pnpm run db:generate
RUN pnpm run build

# ---------------------------------------------------------------- runner
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=144

# THE WHOLE node_modules COMES FROM THE BUILDER, dev dependencies included.
# That is deliberate, and the two tidier alternatives were both tried and
# rejected:
#
#   1. Prune to prod deps in a separate stage and copy the generated client over
#      it. Under pnpm the generated output does not live at
#      node_modules/.prisma -- it is written inside the @prisma/client package's
#      real location, i.e.
#      node_modules/.pnpm/@prisma+client@<ver>_prisma@<ver>_typescript@<ver>__typescript@<ver>/node_modules/.prisma
#      whose directory name embeds resolved dependency versions. Hardcoding that
#      path means the image breaks silently on any dependency bump. The first
#      version of this file copied /app/node_modules/.prisma and failed the build
#      outright with "not found", which is the good outcome; a path that exists
#      but is stale would not fail at all.
#
#   2. `pnpm prune --prod` in the builder. That removes the `prisma` CLI, which
#      is a devDependency and is exactly what runs `prisma migrate deploy` by
#      hand on the box -- the shared deploy pipeline does not run migrations, so
#      losing the CLI would mean no way to migrate the live database.
#
# The cost is image size on disk, not container memory, so it does not compete
# with the 192 MiB cap. If the image ever needs slimming, the correct move is
# `pnpm deploy --prod` into a clean directory, which rewrites the layout
# properly, not a hand-copied path.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# prisma/ is carried for `prisma migrate deploy` run by hand on the box. The
# shared deploy pipeline does NOT run migrations.
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# The `node` user ships with the base image; no ownership change is needed
# because nothing is written to the image at runtime. There is no logs/
# directory here — unlike storytime_be, this service does not write log files.
USER node

# 3000 inside the container. The host maps 4600 -> 3000; main.ts calls
# app.listen(port) with no host argument, so it binds 0.0.0.0 inside the
# container and the mapping works.
EXPOSE 3000

# Each probe forks a second node — see the memory note at the top before
# shortening the interval.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/',timeout:4000},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main"]
