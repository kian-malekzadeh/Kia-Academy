# syntax=docker/dockerfile:1
# =============================================================================
# Kia Academy — production multi-stage images
#   • target `api`  : NestJS REST API        (port 3001, /api)
#   • target `web`  : Next.js 15 standalone  (port 3000)
#
# Design notes
#   - Node 22 slim base (matches .nvmrc / engines >=22.13), pnpm via Corepack
#   - Layer caching: manifests first → cached pnpm store → source copy
#   - Native toolchain (bcrypt / Prisma engines) isolated inside build stages
#   - Runtime images run as unprivileged `node` user with pre-owned mount points
# =============================================================================

ARG NODE_VERSION=22

# ---------------------------------------------------------------- base -------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Route pnpm's content-addressable store through /pnpm so BuildKit's
# cache-mount below persists downloads across builds & retries.
ENV npm_config_store_dir=/pnpm/store
RUN corepack enable \
  && corepack prepare pnpm@11.19.0 --activate
WORKDIR /app

# ------------------------------------------------------- dependencies --------
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
# Shared sources are needed during install because the root `postinstall`
# compiles @kia-academy/shared (fresh type declarations for API build below).
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src
COPY apps/api/package.json apps/api/
# Prisma schema ships with the manifest layer: root `postinstall` generates the client.
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ------------------------------------------------------------ builder -------
FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/web apps/web

RUN pnpm --filter @kia-academy/shared build
RUN pnpm --filter @kia-academy/api exec prisma generate
RUN pnpm --filter @kia-academy/api build

ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG API_PROXY_TARGET=http://api:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    API_PROXY_TARGET=$API_PROXY_TARGET \
    DOCKER_BUILD=true
RUN pnpm --filter @kia-academy/web build

# -------------------------------------------------------- api (runtime) ------
FROM base AS api
LABEL org.opencontainers.image.title="Kia Academy API" \
      org.opencontainers.image.description="NestJS API for Kia Academy adaptive learning platform" \
      org.opencontainers.image.source=https://github.com/kian-malekzadeh/Kia-Academy \
      org.opencontainers.image.licenses=MIT

ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
# Pre-create the uploads mount-point so a named volume inherits safe ownership.
RUN chmod +x /usr/local/bin/api-entrypoint.sh \
  && mkdir -p /app/apps/api/uploads \
  && chown -R node:node /app
USER node
WORKDIR /app/apps/api

EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+ (process.env.PORT||3001) +'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["api-entrypoint.sh"]

# -------------------------------------------------------- web (runtime) ------
FROM base AS web
LABEL org.opencontainers.image.title="Kia Academy Web" \
      org.opencontainers.image.description="Next.js frontend for Kia Academy adaptive learning platform" \
      org.opencontainers.image.source=https://github.com/kian-malekzadeh/Kia-Academy \
      org.opencontainers.image.licenses=MIT

ENV NODE_ENV=production
WORKDIR /
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
RUN chown -R node:node /apps
USER node

ENV PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+ (process.env.PORT||3000) +'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
