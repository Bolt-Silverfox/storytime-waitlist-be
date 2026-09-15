# ---------------------------------------------------------------------------
# Production image for the Storytime waitlist API (NestJS + Prisma).
#
# Target host: a single arm64 EC2 box running every Storytime service under
# Docker. The image MUST be built for the host architecture — absent qemu/
# binfmt emulation an amd64 image will not execute on arm64 (exec format
# error):
#
#   docker buildx build --platform linux/arm64 \
#     -t <ecr>/storytime/waitlist-api:<tag> .
#
# The container is memory-capped by the orchestrator at 192 MiB (see the
# NODE_OPTIONS comment in the runtime stage), so this image runs exactly ONE
# long-lived application process: node. No pm2, no cron, no supervisor.
# ecosystem.config.js (the PM2 deployment path this image replaces) is excluded
# from the build context. There IS a tini init shim as PID 1 — that is not a
# second service, and the reason it is unavoidable here is documented at the
# ENTRYPOINT at the bottom of this file.
#
# NOTHING SECRET IS BAKED IN. .dockerignore excludes .env and key/cert material
# at every directory depth; every value in src/config/env.validation.ts arrives
# at runtime as a real environment variable. Note that validation is strict:
# DATABASE_URL, MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD and MAIL_FROM_ADDRESS
# have no defaults and the app throws during bootstrap if any is missing.
#
# MIGRATIONS ARE NOT RUN AT CONTAINER START. The command is
# `node dist/main.js` under tini; nothing in this image invokes `prisma
# migrate`, and the Prisma CLI and the migrations directory are both absent
# from the runtime stage. Starting the container against production RDS applies
# no schema change. See the MIGRATIONS note in the runtime stage.
# ---------------------------------------------------------------------------

ARG NODE_VERSION=24
ARG PNPM_VERSION=10.16.1

# ---------------------------------------------------------------------------
# system — the OS layer shared by BUILD and RUNTIME. Both inherit from it, and
# that sharing is load-bearing in two separate ways.
#
# (1) Debian bookworm-slim (glibc), NOT Alpine (musl). prisma/schema.prisma
#     declares no `binaryTargets`, so it takes Prisma's default of "native":
#     the query engine is resolved at `prisma generate` time for the generating
#     machine's ARCHITECTURE, libc AND OpenSSL major version. A client
#     generated against glibc will not load on musl, and one generated on amd64
#     will not load on arm64. Every stage sharing one base is what makes
#     "native" correct, and is why nothing here hard-codes an engine target:
#     an amd64 build was verified to emit
#     libquery_engine-debian-openssl-3.0.x.so.node. The arm64 name is expected
#     to be libquery_engine-linux-arm64-openssl-3.0.x.so.node but was NOT
#     built or verified here, which is exactly why the build stage asserts
#     whatever "native" actually produced (and rejects the 1.1.x fallback)
#     instead of hard-coding a target name.
#
# (2) libssl3 MUST be installed HERE, not only in the runtime stage. This is
#     the subtlest trap in the whole file and it was hit for real while writing
#     it. node:24-bookworm-slim does not ship libssl3 (node links OpenSSL
#     statically):
#
#       $ docker run --rm node:24-bookworm-slim ldconfig -p | grep libssl.so.3
#       (no output)
#
#     Prisma's "native" detection probes the *build* machine for a usable
#     libssl. With no libssl.so.3 present it falls back to the openssl-1.1.x
#     target and generates libquery_engine-debian-openssl-1.1.x.so.node. It is
#     not silent — it prints `prisma:warn Prisma failed to detect the
#     libssl/openssl version to use ... Defaulting to "openssl-1.1.x"` — but it
#     exits 0, so the build goes green, a naive "is there an engine file?"
#     check passes, and the engine then cannot load at runtime because bookworm
#     has OpenSSL 3 and no libssl.so.1.1 anywhere. Installing
#     libssl3 before `prisma generate` is what makes the detection resolve to
#     openssl-3.0.x. The runtime stage needs the same library to dlopen the
#     engine, so putting it in the shared base fixes both with one apt layer.
#     The build stage asserts an engine exists AND that it is not the 1.1.x
#     fallback, so a regression fails the build instead of production. It does
#     not pin a target name — see (1) above for why it must not.
#
# `libssl3`, not the `openssl` package: the engine needs the shared libraries
# (NEEDED libssl.so.3 / libcrypto.so.3), not the CLI binary.
# ---------------------------------------------------------------------------
# `tini` is installed here for the runtime stage; see the ENTRYPOINT note at the
# bottom of this file for why this image needs an init shim when the sibling
# storytime_be image does not.
FROM node:${NODE_VERSION}-bookworm-slim AS system
RUN apt-get update \
    && apt-get install -y --no-install-recommends libssl3 tini \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# base — system plus the package manager, used by the build-time stages only.
#
# pnpm, not npm: the repository's only lockfile is pnpm-lock.yaml
# (lockfileVersion 9.0) and every CI workflow plus scripts/deploy.sh installs
# with pnpm. There is no package-lock.json, so `npm ci` cannot run here at all.
# ---------------------------------------------------------------------------
FROM system AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# INSTALL STRATEGY — read this before changing either of the next two stages.
#
# WHY --ignore-scripts: pnpm 10 blocks dependency build scripts unless the
# package is named in `onlyBuiltDependencies`. This repo has no
# pnpm-workspace.yaml and no pnpm.onlyBuiltDependencies in package.json, so
# @prisma/engines' postinstall — the thing that fetches the ~17 MB
# libquery_engine-*.so.node, which is NOT in the npm tarball — is blocked
# whether or not the flag is passed. Making it explicit matches the
# --ignore-scripts used by .github/workflows/{dev,prod}.yml and
# scripts/deploy.sh, and removes any doubt about what did or did not run.
# (All three workflows use pnpm/action-setup@v4, but dev.yml and prod.yml pass
# `version: 9` while security.yml passes `version: 10` — none of them is the
# 10.16.1 pinned here. It is the flag that matches CI, not the pnpm version.)
# `prisma generate` fetches the engine itself, which is precisely what CI
# already relies on.
#
# An --ignore-scripts install with NO subsequent generate produces an image
# that builds green and dies at runtime with "Query engine library for current
# platform could not be found". There are therefore two assertions: the build
# stage checks what `prisma generate` actually produced (and rejects the
# openssl-1.1.x fallback), and the runtime stage re-checks after the COPY so a
# bad copy cannot reintroduce the failure. prod-deps has none and can have
# none — it never runs generate, so no engine exists there.
#
# WHY node-linker=hoisted: pnpm's default layout puts real packages under
# node_modules/.pnpm/<name>@<version>_<peer-hash>/node_modules/... and exposes
# them as symlinks. `prisma generate` writes the client and its engine INSIDE
# @prisma/client's own real directory, so the output path embeds a peer-deps
# hash that differs between the full tree (where the `prisma` CLI peer is
# present) and a --prod tree (where it is not) — there is no stable path to
# copy between stages. `hoisted` produces a flat, npm-shaped node_modules where
# the generated client is always at node_modules/.prisma/client, which is both
# copyable and assertable. It must be set identically in BOTH stages.
#
# WHY TWO STAGES rather than one stage plus `pnpm prune --prod`: the `prisma`
# CLI is a devDependency here, so a --prod tree has no CLI to generate with,
# and generate-then-prune was measured at ~10 minutes for the prune alone on
# amd64 (it would be far worse under arm64 emulation). Two independent stages
# let BuildKit run the two installs concurrently (with BuildKit enabled, which
# `docker buildx build` implies), so wall time is the slower of the two rather
# than their sum.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# prod-deps — the node_modules that actually ships. Production dependencies
# only: no @nestjs/cli, typescript, jest, eslint or the prisma CLI.
# ---------------------------------------------------------------------------
#
# THE PRISMA CLI ARRIVES EVEN IN A --prod TREE, and is deleted explicitly
# below. pnpm materialises resolved optional PEER dependencies as
# optionalDependencies, and pnpm-lock.yaml records against the
# '@prisma/client@6.19.0(prisma@...)' entry:
#
#     optionalDependencies:
#       prisma: 6.19.0(typescript@5.9.3)
#       typescript: 5.9.3
#
# @prisma/client is a production dependency, so `--prod` keeps both: measured
# on disk at 51 MB for `prisma`, 34 MB for `effect` (a dependency of
# @prisma/config, which only the CLI uses; its registry unpackedSize is 26 MB —
# the difference is block overhead across ~2700 tiny files) and 23 MB for
# `typescript`. That is ~110 MB of build tooling never executed at runtime,
# plus a `prisma migrate` capability this image must not have.
#
# `pnpm install --no-optional` is NOT the fix: combined with --frozen-lockfile
# it fails this lockfile outright with
#   ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY  Broken lockfile: no entry for
#   'supports-color@8.1.1'
# and dropping --frozen-lockfile to work around that would trade reproducible
# installs for an image-size saving, which is a bad trade. An explicit,
# enumerated delete is used instead.
#
# The list is enumerated, not pattern-matched, because it is easy to over-
# delete here: `prettier` also looks like dev tooling and is 9.7 MB, but it is
# a genuine runtime dependency of @react-email/render, which src/email/
# email.service.ts:28 calls on every welcome email. It stays.
#
# This list is a size and capability reduction, not a claim that no Prisma
# tooling remains: @prisma/engines, @prisma/engines-version, @prisma/fetch-engine
# and @prisma/get-platform survive, flat at node_modules/@prisma/* (this stage
# uses the hoisted linker, so nothing nests inside @prisma/client's tree).
# Measured total 2,379,817 bytes. They are inert without the CLI and are
# deliberately left alone rather than risk breaking client resolution for
# 2.4 MB.
#
# Note that removing `typescript` does not remove `ts-node`: that arrives
# transitively via @hng-sdk/orm -> typeorm and stays. It is never imported by
# src/ and resolves `typescript` lazily, so it is inert — but do not assume
# from this list that no TypeScript tooling remains in the tree.
#
# @prisma/client itself does not require `prisma` or `typescript` at runtime.
# The evidence is the boot test, which performs real reads and writes against
# Postgres from the finished image with these packages absent.
FROM base AS prod-deps
ENV NPM_CONFIG_NODE_LINKER=hoisted
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts \
    && rm -rf node_modules/prisma \
              node_modules/typescript \
              node_modules/effect \
              node_modules/@prisma/config \
              node_modules/.bin/prisma \
              node_modules/.bin/tsc \
              node_modules/.bin/tsserver

# ---------------------------------------------------------------------------
# build — full dependency tree: generates the Prisma client (needs the CLI) and
# compiles TypeScript (nest build type-checks against the generated client).
# ---------------------------------------------------------------------------
FROM base AS build
ENV NPM_CONFIG_NODE_LINKER=hoisted

# Manifests first so a source-only edit does not bust the install layer.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# nest build emits dist/main.js flat (`rootDir: ./src` lives in tsconfig.json;
# tsconfig.build.json only adds `exclude`). The react-email templates are .tsx
# and are compiled into dist, so there is no runtime template asset to copy
# separately — the `**/*.hbs` assets rule in nest-cli.json matches nothing in
# this repo.
#
# The .tsbuildinfo is deleted because it is incremental-compiler state, not a
# build artefact: shipping it puts machine-specific timestamps and file lists
# into the image layer for no runtime benefit. The .d.ts and .js.map files are
# intentionally KEPT — measured at 32,358 bytes across 52 files (the whole dist
# tree is 134 KB), and the maps make Sentry stack traces readable if
# `--enable-source-maps` is ever added to NODE_OPTIONS.
RUN pnpm exec prisma generate \
    && pnpm run build \
    && test -f dist/main.js \
    && rm -f dist/tsconfig.build.tsbuildinfo \
    && ls node_modules/.prisma/client/libquery_engine-*.so.node \
    && test -z "$(ls node_modules/.prisma/client/libquery_engine-*openssl-1.1.x* 2>/dev/null)"

# ---------------------------------------------------------------------------
# runtime — `system`, so it carries libssl3 (required to dlopen the Prisma
# engine; see the note on the system stage) but NOT pnpm, which has no business
# in a production image. Note the precise claim: corepack, npm, npx and yarn
# ship in every node:* image and are still here; the `base` stage only ENABLES
# corepack. What this stage avoids is inheriting `base`, so /pnpm never exists.
# ---------------------------------------------------------------------------
FROM system AS runtime

# NODE_OPTIONS — a correctness setting, not a tuning knob, and NOT redundant
# with the container memory cap.
#
# Measured with `v8.getHeapStatistics().heap_size_limit` inside `docker run -m`:
#
#     -m 160m -> 259 MiB      -m 384m -> 259 MiB
#     -m 192m -> 259 MiB      -m 512m -> 259 MiB
#     -m 256m -> 259 MiB
#
# V8 reads the cgroup limit but only scales its default old-space heap down to
# a ~259 MiB floor, which does not track the cap below roughly 512 MiB.
# Confirmed identical on Node 24. At a 192 MiB cap V8 therefore believes it may
# grow to more than the entire container: it keeps allocating instead of
# collecting under pressure, and the kernel OOM killer SIGKILLs the process.
# That surfaces as a bare container restart with no application-level error.
#
# 144 MiB is pinned for the 192 MiB cap (~75%). The remaining ~48 MiB covers
# everything that is NOT V8 old space: new/code space, the native heap,
# Buffers/ArrayBuffers (which live outside the old-space budget) and — the
# reason this service is tighter than the others — Prisma's query engine, which
# is an in-process native library with its own RSS on top of the JS heap.
#
# IF THE CAP CHANGES, CHANGE THIS. Note that raising it much past ~259 MiB is
# *loosening* V8 relative to its own default rather than tightening it. The
# orchestrator's NODE_OPTIONS replaces this value, it does not append to it.
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=144

WORKDIR /app

# Production-only dependency tree, then the generated Prisma client dropped on
# top of it. Both stages used node-linker=hoisted, so .prisma/client is a real
# flat directory in both and this overlay is a plain merge — see the INSTALL
# STRATEGY block above.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./package.json

# MIGRATIONS ARE NOT RUN AT CONTAINER START AND CANNOT BE RUN FROM THIS IMAGE.
# The CMD is plain `node dist/main.js`; nothing invokes the Prisma CLI. Two
# things would have to be added back for a migration to be possible here:
#
#   * the `prisma` CLI — deleted by the enumerated `rm -rf` in the prod-deps
#     stage above (NOT by --no-optional, which this build cannot use). Verify
#     with `docker run --rm --entrypoint sh <image> -c
#     'ls node_modules/.bin/prisma'`, which must fail.
#   * prisma/migrations — never copied into this stage.
#
# Be precise about the schema, because a naive `find` will turn one up: a
# schema.prisma DOES exist in the runtime image, at
# node_modules/.prisma/client/schema.prisma. That is the copy `prisma generate`
# embeds inside the generated client, it arrives with the .prisma COPY above,
# and it is normal and required. It is not a migration capability — without the
# CLI and without prisma/migrations nothing can act on it. Starting this
# container against production RDS therefore applies no schema change.
#
# Apply migrations deliberately, once, from the deploy job or a one-off task
# that has the full dependency tree — never from N restarting containers racing
# a single database, and never as a start-up step that turns a failed migration
# into a crash-loop.
#
# prisma.config.ts is not in the build context at all — it is correctly placed
# at the repository root for local/CI use (process.cwd() is the only place
# Prisma looks), but its datasource block calls env('DATABASE_URL'), and no
# secret should be required to BUILD an image. See .dockerignore.

# Fail the build, not production, if the query engine did not survive the COPY.
RUN ls node_modules/.prisma/client/libquery_engine-*.so.node

# Never run as root. The node images already provide uid/gid 1000 `node`.
USER node

# src/config/env.validation.ts:7 defaults PORT to 3000 and src/main.ts:89 does
# `app.listen(port)` with no host argument, so Nest/Express binds 0.0.0.0:3000
# — reachable from outside the container namespace.
EXPOSE 3000

# TCP liveness only, because THIS APPLICATION HAS NO HEALTH ENDPOINT. The only
# routes are POST /api/v1/waitlist/subscribe, GET /api/v1/waitlist/emails,
# GET /api/v1/waitlist/emails/paginated and POST /api/v1/contact
# (src/main.ts:87 sets the global prefix `api/v1`), plus Swagger at /docs.
# A HEALTHCHECK on /health would be a 404 and would mark the container
# unhealthy forever; the /emails routes would query Postgres and let a database
# blip kill the container. A connect() to the listening socket proves the
# process is up and accepting connections without either hazard.
#
# Honest limits of this probe: a TCP connect() is satisfied from the kernel's
# accept backlog, so it can succeed while the event loop is wedged. It is
# liveness, not readiness. It does implicitly cover boot-time database
# reachability, because PrismaService.onModuleInit (src/database/
# prisma.service.ts:7) awaits $connect() and Nest only reaches app.listen()
# after that resolves — so a container that cannot reach Postgres at startup
# never opens the socket and never becomes healthy.
#
# --max-old-space-size=16 on the probe bounds a worst case; it does not shrink
# the common one, and the distinction matters because --max-old-space-size is a
# ceiling, not a reservation. NODE_OPTIONS above applies to EVERY node process
# in the container, including this probe every 30s; the flag lowers that
# process's V8 heap CEILING but measured steady-state probe RSS is ~45 MiB with
# or without it. That 45 MiB is a real recurring transient against the 192 MiB
# cap on top of the app's ~75 MiB, which is why the probe is a bare socket
# connect and nothing heavier. An explicit command-line flag takes precedence
# over NODE_OPTIONS.
#
# If an HTTP probe is required (ALB/ECS target group), a real GET
# /api/v1/health has to be added to the application first — see the PR body.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "--max-old-space-size=16", "-e", "const s=require('net').connect({host:'127.0.0.1',port:Number(process.env.PORT)||3000});s.on('connect',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))"]

# INIT SHIM — this image needs one and the sibling storytime_be image does not.
#
# Node does not install a default SIGTERM handler, and a process running as
# PID 1 gets no kernel default action for signals it has no handler for. This
# application installs none: there is no `process.on('SIGTERM')` and no
# `app.enableShutdownHooks()` anywhere in src/ (storytime_be does call the
# latter, which is why it can run node as PID 1 safely). Measured without tini:
#
#   $ docker stop -t 10 <container>
#   exit code 137, after 13-18s depending on host load
#
# i.e. SIGTERM was ignored, the daemon waited out the full timeout and then
# SIGKILLed. The duration is load-dependent noise; the exit code is the signal
# (137 = 128+9 = SIGKILL; with tini it is 143 = 128+15 = SIGTERM, in ~2s). Every deploy would hard-kill in-flight requests, drop Prisma's
# connection pool without $disconnect, and lose unflushed Sentry events.
#
# tini runs as PID 1 and forwards SIGTERM to node, which is then a normal child
# process and takes the default terminate action — so `docker stop` is prompt
# instead of a 10s hang plus SIGKILL. Note what this does NOT buy: node still
# exits immediately rather than draining in-flight requests. Actual graceful
# shutdown needs `app.enableShutdownHooks()` in src/main.ts, which is an
# application change and is out of scope for this PR — it is called out in the
# PR body as a follow-up.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
