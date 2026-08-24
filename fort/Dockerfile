# Build context is the REPO ROOT, so that scripts/ is reachable:
#   docker build -f fort/Dockerfile -t fort .
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY fort/package.json fort/pnpm-lock.yaml fort/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY fort/ ./
RUN pnpm build

COPY scripts/audit-export.mjs /audit.mjs
RUN node /audit.mjs out /fort

FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html/fort
COPY fort/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
